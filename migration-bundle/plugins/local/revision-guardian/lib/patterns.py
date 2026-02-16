#!/usr/bin/env python3
"""Gedeelde regex patronen voor revision-guardian plugin.

Alle patronen zijn in het Nederlands. Elk patroon heeft een
gewichtsscore (1-3) voor false-positive reductie.
Drempel: gewogen som >= 3 triggert detectie.
"""

import re
from typing import List, Tuple

# ================================================================
# CONFRONTATIE PATRONEN
# Detecteert wanneer de gebruiker Claude confronteert met een fout.
# Gewicht 3 = zeer sterk, 2 = sterk, 1 = matig
# ================================================================

CONFRONTATION_PATTERNS: List[Tuple[str, int]] = [
    # Directe fout-aanduiding (gewicht 3)
    (r'\bdat\s+klopt\s+niet\b', 3),
    (r'\bje\s+hebt\s+een\s+fout\b', 3),
    (r'\bdat\s+is\s+niet\s+waar\b', 3),
    (r'\bdat\s+is\s+(onzin|fout|verkeerd|incorrect)\b', 3),
    (r'\bklopt\s+helemaal\s+niet\b', 3),
    (r'\bdit\s+deugt\s+niet\b', 3),
    (r'\bdat\s+heb\s+je\s+(niet\s+goed|verkeerd|fout)\b', 3),
    (r'\bonjuist\b', 3),
    (r'\bje\s+liegt\b', 3),
    (r'\bonwaar\b', 3),
    (r'\baantoonbaar\s+(fout|onjuist|incorrect|verkeerd)\b', 3),
    (r'\bin\s+strijd\s+met\b', 3),

    # Rationalisatie-verwijt (gewicht 3)
    (r'\bje\s+rationaliseert\b', 3),
    (r'\bje\s+verzint\b', 3),
    (r'\bgeen\s+excuses\b', 3),
    (r'\bgeef\s+(het\s+)?gewoon\s+toe\b', 3),
    (r'\bstop\s+met\s+(uitleggen|rationaliseren|goedpraten)\b', 3),

    # Sterke correctie-indicatoren (gewicht 2)
    (r'\binconsistent\b', 2),
    (r'\bfout(ief|ieve)?\b', 2),
    (r'\bverkeerd\b', 2),
    (r'\bje\s+zei\s+(net|eerder|zojuist)\b.*\bmaar\b', 2),
    (r'\bje\s+beweerde?\b', 2),
    (r'\bdit\s+is\s+(niet|geen)\s+wat\s+(ik|we)\b', 2),
    (r'\bnergens\s+op\s+(slaat|lijkt)\b', 2),
    (r'\bniet\s+correct\b', 2),
    (r'\bwees\s+eerlijk\b', 2),
]

CONFRONTATION_THRESHOLD = 3


# ================================================================
# FEEDBACK / CORRECTIE PATRONEN
# Detecteert mid-course correcties en nieuwe principes.
# ================================================================

FEEDBACK_PATTERNS: List[Tuple[str, int]] = [
    # Directe principes (gewicht 3)
    (r'\beigenlijk\s+wil\s+ik\b', 3),
    (r'\bhet\s+belangrijkste\s+is\b', 3),
    (r'\bmijn\s+principe\s+is\b', 3),
    (r'\bde\s+regel\s+is\b', 3),
    (r'\bvoortaan\b', 3),
    (r'\bvanaf\s+nu\b', 3),
    (r'\bdit\s+geldt\s+voor\s+alles\b', 3),
    (r'\bdoe\s+dit\s+overal\b', 3),
    (r'\bpas\s+dit\s+overal\s+toe\b', 3),
    (r'\bvoor\s+alle\s+(items|punten|onderdelen|elementen|vragen)\b', 3),
    (r'\bik\s+bedoel\s+eigenlijk\b', 3),
    (r'\bwat\s+ik\s+eigenlijk\s+(wil|bedoel)\b', 3),
    (r'\bverander\s+(de\s+)?(aanpak|stijl|toon|format)\b', 3),
    (r'\bgebruik\s+(overal|steeds|altijd)\b', 3),
    (r'\bdit\s+is\s+(de\s+)?(nieuwe\s+)?(standaard|norm|regel)\b', 3),
    (r'\bdit\s+is\s+hoe\s+(het|ik\s+het)\s+wil\b', 3),
    (r'\bdit\s+is\s+(het\s+)?voorbeeld\b.*\bvolg\b', 3),
    (r'\bin\s+alle\s+gevallen\b', 3),
    (r'\bzo\s+moet\s+(het|alles)\b', 3),

    # Consistentie-eisen (gewicht 2)
    (r'\bconsistentie\b', 2),
    (r'\bconsistent\b', 2),
    (r'\baltijd\s+\w+', 2),
    (r'\bnooit\s+\w+', 2),
    (r'\belke\s+keer\b', 2),
    (r'\buniform\b', 2),
    (r'\bniet\s+\w+\s+maar\s+\w+', 2),
]

FEEDBACK_THRESHOLD = 3


# ================================================================
# BATCH CONTENT INDICATOREN
# Detecteert of er batch content in het transcript staat.
# ================================================================

BATCH_CONTENT_PATTERNS: List[str] = [
    # Genummerde lijsten (5+ items)
    r'(?:^|\n)\s*\d+[\.\)]\s+\S+.*(?:\n\s*\d+[\.\)]\s+\S+.*){4,}',
    # Herhaalde ## koppen (3+)
    r'(?:^|\n)#{2,3}\s+\S+.*(?:[\s\S]*?(?:^|\n)#{2,3}\s+\S+){2,}',
    # "Item/Punt/Stap N:" patronen (3+)
    r'(?:Item|Punt|Onderdeel|Stap|Regel|Principe|Tip|Voorbeeld|Vraag)\s*\d+',
]


# ================================================================
# REVISIE BEWIJS PATRONEN
# Detecteert of Claude daadwerkelijk revisie heeft uitgevoerd.
# ================================================================

REVISION_EVIDENCE_PATTERNS: List[str] = [
    r'\b(aangepast|herzien|gecorrigeerd|bijgewerkt|gewijzigd|gereviseerd)\b',
    r'\b(revisie|herziening|correctie|aanpassing)\s+(van|op|bij)\b',
    r'\beerdere?\s+(items?|punten|content|tekst)\s+(aangepast|herzien|gecorrigeerd)\b',
    r'\bik\s+heb\s+(de\s+)?(eerdere|vorige|voorgaande)\b.*\b(aangepast|herzien)\b',
    r'\balle\s+(eerdere|vorige)\b.*\b(gecontroleerd|nagekeken|herzien)\b',
    r'\bterugkijk(end)?\s+(op|naar)\b',
]


# ================================================================
# UTILITY FUNCTIES
# ================================================================

def compile_patterns(pattern_list: List[Tuple[str, int]]) -> List[Tuple['re.Pattern', int]]:
    """Compileer een lijst van (pattern, weight) tuples."""
    compiled = []
    for pattern, weight in pattern_list:
        try:
            compiled.append((re.compile(pattern, re.IGNORECASE | re.MULTILINE), weight))
        except re.error:
            continue
    return compiled


def check_weighted_patterns(text: str, compiled_patterns: List[Tuple['re.Pattern', int]],
                            threshold: int) -> Tuple[bool, List[str]]:
    """Check of gewogen patronen de drempel halen.

    Returns:
        (triggered, lijst van gematchte patronen)
    """
    total_weight = 0
    matched = []
    seen = set()

    for regex, weight in compiled_patterns:
        match = regex.search(text)
        if match and match.group() not in seen:
            seen.add(match.group())
            total_weight += weight
            matched.append(match.group())

    return total_weight >= threshold, matched


def check_any_pattern(text: str, patterns: List[str]) -> bool:
    """Check of een van de patronen matcht (ongewogen)."""
    for pattern in patterns:
        try:
            if re.search(pattern, text, re.IGNORECASE | re.MULTILINE | re.DOTALL):
                return True
        except re.error:
            continue
    return False
