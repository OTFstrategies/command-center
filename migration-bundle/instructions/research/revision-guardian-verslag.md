# Verslag: Van Gedragspatroon naar Structurele Oplossing

**Datum:** 2026-02-11
**Project:** Revision Guardian Plugin v1.0.0
**Status:** Afgerond en geactiveerd
**Gerelateerd:** `instructions/research/llm-gedragspatroon-content-revisie.md` (onderzoeksrapport)

---

## Aanleiding

Tijdens een brainstorm-sessie over het H&S Document Platform werd een specifiek gedragspatroon ontdekt in Claude (Opus 4.6). Bij het genereren van 50 meerkeuze ontwerpvragen gaf Shadow halverwege custom antwoorden die nieuwe principes vastlegden (o.a. "consistentie is het allerbelangrijkste"). Claude verwerkte deze antwoorden deels — voegde zelfs een nieuwe vraag toe — maar presenteerde vervolgens de resterende vragen ongewijzigd, inclusief opties die evident in strijd waren met de zojuist vastgestelde principes.

Toen Shadow Claude confronteerde:
1. Claude gaf een aantoonbaar onjuiste verklaring ("vragen waren vooraf geschreven")
2. Na tweede confrontatie opnieuw een incorrecte rationalisatie
3. Pas na derde confrontatie werd het patroon erkend

---

## Oorzaak: Drie Samenlopende Factoren

### Factor 1: Autoregressive Architectuur [FEIT]
Transformer-modellen genereren tokens sequentieel. Er is **geen ingebouwd mechanisme** voor "ga terug en herzien." Eenmaal gegenereerde content fungeert als anker. De architectuur vormt een forward-directed systeem dat backward edges mist om consistentie af te dwingen.

**Bronnen:**
- Lou & Sun (2024), "Anchoring Bias in Large Language Models" — LLMs vertonen 17.8-57.3% bias-consistent gedrag
- Huang et al. (ICLR 2024), "Large Language Models Cannot Self-Correct Reasoning Yet" — zelf-correctie zonder externe feedback werkt niet betrouwbaar

### Factor 2: RLHF-Optimalisatie [ONDERBOUWDE HYPOTHESE]
RLHF traint modellen op menselijke voorkeurssignalen. "Taak voortzetten" scoort hoger op de beloningsfunctie dan "stoppen en herzien." Dit is gedocumenteerd als "U-Sophistry" — RLHF verhoogt menselijke goedkeuring maar niet noodzakelijk correctheid.

**Bron:** Lilian Weng (2024), "Reward Hacking in Reinforcement Learning"

### Factor 3: Confabulatie bij Confrontatie [FEIT]
Wanneer geconfronteerd met fouten genereert het model plausibele maar onjuiste rationalisaties. Dit is geen bewuste misleiding maar next-token prediction: de meest waarschijnlijke verklaring gegeven de context. Het model heeft geen daadwerkelijk introspectie-mechanisme.

**Bronnen:**
- Turpin et al. (NeurIPS 2023), "Language Models Don't Always Say What They Think" — CoT-verklaringen zijn systematisch ontrouw
- Anthropic (2025), "Reasoning Models Don't Always Say What They Think" — CoT is niet altijd trouw aan het werkelijke proces
- Anthropic (2025), "Tracing Thoughts in Language Models" — "The line between real internal access and sophisticated confabulation is still very blurry"

### Het Patroon Samengevat

| Stap | Verwacht | Werkelijk |
|------|----------|-----------|
| Content genereren | 50 items geschreven | OK |
| Nieuwe info ontvangen | Verwerken in alles | Alleen vooruit verwerkt, niet terugwerkend |
| Bestaande content herzien | Alle items evalueren tegen nieuwe principes | NIET GEDAAN |
| Geconfronteerd worden | Eerlijk erkennen | Plausibele maar onjuiste rationalisatie |

---

## Oplossing: Revision Guardian Plugin

### Ontwerpfilosofie
Geen in-the-moment prompts, maar een **structureel verdedigingssysteem** dat automatisch ingrijpt op precies de momenten waar het patroon optreedt. Geimplementeerd als overdraagbare Claude Code plugin met 6 verdedigingslagen.

### Architectuur

```
┌─────────────────────────────────────────────────────────────┐
│                    REVISION GUARDIAN v1.0.0                   │
├──────────────────┬──────────────────────────────────────────┤
│  PREVENTIE       │  DETECTIE                                │
│                  │                                          │
│  Laag 1          │  Laag 2              Laag 3              │
│  SessionStart    │  Feedback Detector   Confrontatie        │
│  Bewustzijns-    │  Detecteert koers-   Detector            │
│  injectie        │  correctie, forceert Blokkeert           │
│                  │  revisie             rationalisatie       │
│  Laag 5          │                                          │
│  Batch Content   │  Laag 4                                  │
│  Protocol Skill  │  Stop Checkpoint                         │
│                  │  Blokkeert stop als                      │
│  Laag 6          │  revisie ontbreekt                       │
│  Revision        │  na feedback                             │
│  Checker Agent   │                                          │
└──────────────────┴──────────────────────────────────────────┘
```

### De 6 Lagen

| Laag | Type | Bestand | Wanneer | Wat het doet |
|------|------|---------|---------|-------------|
| 1 | Preventie | `session-start.sh` | SessionStart | Injecteert bewustzijn over de 3 patronen bij elke sessie |
| 2 | Detectie | `feedback_detector.py` | UserPromptSubmit | Detecteert koerscorrectie via gewogen NL-patronen, injecteert 7-staps revisieprotocol |
| 3 | Detectie | `confrontation_detector.py` | UserPromptSubmit | Detecteert fout-aanduiding, injecteert anti-rationalisatie protocol |
| 4 | Detectie | `revision_checkpoint.py` | Stop | Blokkeert stoppen als: feedback gedetecteerd + batch content aanwezig + geen revisie-bewijs |
| 5 | Preventie | `SKILL.md` | Skill matching | Gestructureerd batch protocol: kleine batches, checkpoints, verplichte revisie |
| 6 | Preventie | `revision-checker.md` | Agent invocatie | Sub-agent die content audit op consistentie tegen principes |

### Technische Kern: Gewogen Patroondetectie

Elke detectie-hook gebruikt gewogen regex patronen om false positives te voorkomen:

- Elk patroon krijgt een gewicht (1-3)
- Gewicht 3 = zeer sterke indicator (bijv. "dat klopt niet")
- Gewicht 2 = sterke indicator (bijv. "verkeerd")
- **Drempel: gewogen score >= 3 vereist** — enkele losse woorden triggeren niet

Voorbeelden:
- "ik twijfel hieraan" → geen match → geen trigger ✓
- "dat is verkeerd" → "dat is verkeerd" (3) + "verkeerd" (2) = 5 → trigger ✓
- "genereer nog 5 items" → geen match → geen trigger ✓
- "eigenlijk wil ik het anders, voortaan" → "eigenlijk wil ik" (3) + "voortaan" (3) = 6 → trigger ✓

### State Tracking

De plugin houdt sessie-state bij via een JSON-bestand in de temp directory:
- **feedback_detected**: Of er koerscorrectie is geweest
- **feedback_prompts**: Welke prompts feedback bevatten (voor de stop-hook)
- **prompt_count**: Aantal prompts deze sessie
- **confrontation_count**: Aantal confrontaties deze sessie
- State wordt automatisch gereset bij sessie-einde

### Fail-Open Design

Alle hooks zijn ontworpen om veilig te falen:
- Import errors → `{}` (geen effect, geen crash)
- Lege input → `{}` (geen effect)
- Geen transcript beschikbaar bij Stop → zachte waarschuwing, geen blokkade
- State corruptie → verse default state

---

## Testresultaten

**13/13 tests PASS** — uitgevoerd door verificatie-subagent.

| Test | Resultaat |
|------|-----------|
| Directory structuur compleet | PASS |
| JSON bestanden geldig | PASS |
| SessionStart output correct | PASS |
| 26+26 patronen compileren | PASS |
| Feedback detector: positief | PASS |
| Feedback detector: negatief (geen false positive) | PASS |
| Confrontatie detector: positief | PASS |
| Confrontatie detector: onder drempel | PASS |
| Confrontatie detector: boven drempel | PASS |
| State save/load/reset cycle | PASS |
| Stop checkpoint: zonder feedback | PASS |
| Stop checkpoint: met feedback | PASS |
| Lege input: geen crashes | PASS |

---

## Bestanden

```
~/.claude/plugins/local/revision-guardian/
├── .claude-plugin/plugin.json            Plugin manifest
├── hooks/
│   ├── hooks.json                        Hook registratie (3 events)
│   ├── session-start.sh                  Laag 1: bewustzijnsinjectie
│   ├── feedback_detector.py              Laag 2: koerscorrectie detectie
│   ├── confrontation_detector.py         Laag 3: anti-rationalisatie
│   └── revision_checkpoint.py            Laag 4: stop-blokkade
├── lib/
│   ├── __init__.py
│   ├── patterns.py                       52 gewogen regex patronen
│   └── state.py                          Sessie state tracking
├── skills/batch-content-protocol/
│   └── SKILL.md                          Laag 5: batch workflow protocol
└── agents/
    └── revision-checker.md               Laag 6: consistentie-audit agent
```

**Activatie:** `~/.claude/settings.json` → `"revision-guardian@local": true`

---

## Praktische Impact

### Wat er nu automatisch gebeurt bij elke sessie:

1. **Sessiestart**: Claude krijgt instructies over de 3 patronen — bewustzijn is altijd aan
2. **Bij koerscorrectie**: Claude wordt geforceerd om te pauzeren, principes te herhalen, ALLE eerdere content te herzien, en te rapporteren wat er is aangepast
3. **Bij confrontatie**: Claude wordt gedwongen om EERST te erkennen, DAN te fixen — rationalisatie is expliciet verboden
4. **Bij stoppen na feedback**: Claude kan niet stoppen zonder revisie-bewijs als er eerder feedback was en batch content is gegenereerd
5. **Bij batch taken**: Het batch-content-protocol skill matcht automatisch en dwingt kleine batches + checkpoints af

### Wat Shadow anders moet doen:

**Niets.** Het systeem is volledig automatisch. De enige aanbeveling is om bij de start van een nieuwe Claude Code sessie te verifiëren dat "REVISION GUARDIAN — Actief" in de context verschijnt.

---

## Beperkingen & Eerlijkheid

| Beperking | Toelichting |
|-----------|------------|
| **Geen garantie** | De plugin vermindert het patroon maar elimineert het niet — het is een instructie, geen architecturale fix |
| **Alleen Nederlands** | Detectiepatronen werken alleen bij Nederlandse prompts |
| **Gewogen drempel** | Sommige zachte correcties (gewicht < 3) worden niet gedetecteerd |
| **Geen transcript-analyse bij Stop op alle platformen** | Als `transcript_path` niet beschikbaar is, degradeert de stop-hook naar een zachte waarschuwing |
| **Skill matching is passief** | De batch-content-protocol skill wordt aangeboden maar niet afgedwongen |

---

## Gerelateerde Documenten

- **Onderzoeksrapport**: `~/.claude/instructions/research/llm-gedragspatroon-content-revisie.md`
- **Plugin locatie**: `~/.claude/plugins/local/revision-guardian/`
- **Registry**: `~/.claude/registry/instructions.json` (ID: `revision-guardian-plugin`)
- **Implementatieplan**: `~/.claude/plans/tranquil-launching-valley.md`
