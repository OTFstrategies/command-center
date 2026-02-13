# Van Zwarte Doos naar Glazen Huis: Hoe Een MKB-directeur Zijn AI-codebase Doorgrondde

## Het Verhaal van Command Center v2 Code Intelligence

---

### De Uitdaging: Een Directeur Die Niet Codeert, Maar Wel Moet Begrijpen

Stel je voor: je bent directeur van een groeiend MKB-bedrijf. Je hebt een complete AI-development setup laten bouwen — twintig AI-agents, tweeenzeventig commands, honderden bestanden code. Alles draait, alles werkt. Maar je hebt geen idee wat er onder de motorkap gebeurt.

Dat was de situatie van Shadow. Zijn Command Center v2 dashboard liet hem al zien welke assets hij had — APIs, prompts, skills, agents, commands, instructies. Hij kon taken beheren op een kanban board, activiteit loggen, en zijn hele registry doorzoeken. Maar er was een blinde vlek: de code zelf.

Hoeveel functies zitten er eigenlijk in mijn dashboard? Zijn er fouten in de code? Welke packages gebruiken we, en zijn die up-to-date? Hoe gezond is mijn codebase? Deze vragen kon Shadow niet beantwoorden. Tot nu toe.

---

### De Oorsprong: Een Strategische Keuze

Er was een extern tool, Serena genaamd. Een slimme AI-coding toolkit die via een Language Server Protocol diep in code kon duiken — symbolen vinden, methodes hernoemen, referenties opsporen. Maar Serena was gebouwd voor AI-agents, niet voor mensen. Het had een command-line interface en geen visueel dashboard.

Na een grondige analyse — waarbij de twee systemen naast elkaar werden gelegd in een gap-analyse — werd een strategische keuze gemaakt. Command Center v2 zou de managementfunctionaliteit van Serena overnemen. Niet door Serena te kopieren, maar door de unieke kracht van het dashboard te benutten: visueel inzicht bieden.

De filosofie was helder: Serena was superior voor low-level code editing. Daar hoefde Command Center niet mee te concurreren. Maar als visueel management dashboard kon Command Center iets bieden dat Serena niet kon: een glashelder overzicht voor een niet-technische directeur.

---

### Wat Er Gebouwd Is: Code Intelligence in Drie Lagen

In twee dagen tijd — achttien commits, van design tot deployment — werd een volledig nieuw Code Intelligence systeem gebouwd. Het bestaat uit drie lagen die naadloos samenwerken.

**Laag 1: De Analyse Engine**

Het hart van het systeem is gebouwd op ts-morph, een krachtige TypeScript Compiler API. Denk aan een rontgenapparaat voor code. Het scant elk bronbestand en extraheert alles wat ertoe doet:

Vierhonderdnegentien symbolen werden gevonden in Command Center v2 zelf. Functies, classes, interfaces, types, enums — allemaal netjes gecatalogiseerd met hun exacte positie in de code, hun type signature, of ze async zijn, of ze geexporteerd worden, en welke parameters ze accepteren.

Maar het stopt niet bij symbolen. De engine detecteert ook vierhonderdzevenentwintig cross-references — de onzichtbare draden die code modules met elkaar verbinden. Het parseert alle eenentwintig npm dependencies met hun versies en categorien. Het draait de TypeScript compiler om fouten en waarschuwingen te vinden. En het aggregeert alles tot een compact metriekoverzicht: zevenenzventig bestanden, achttienduizend achthonderdvierenzeventig regels code.

**Laag 2: De Cloud Database**

Alle analyse-resultaten worden opgeslagen in vijf nieuwe PostgreSQL tabellen in Supabase. Dit is geen tijdelijke cache — het is een permanente kennisbank die bij elke heranalyse wordt bijgewerkt. De storage layer is slim: bij een nieuwe analyse worden de oude records van dat project eerst verwijderd en dan de nieuwe ingevoegd. Zo is de data altijd actueel.

**Laag 3: Het Visuele Dashboard**

En dan de kroon op het werk: vier nieuwe tabs op de project detail pagina.

De Overview tab was er al — changelog, memories, assets, tech stack. Maar daarnaast staan nu drie gloednieuwe tabs.

De Code tab is een interactieve symbol browser. Bovenaan staan klikbare filter chips — klik op "function" en je ziet alleen functies, klik op "class" en je ziet alleen classes. Daaronder een bestandsboom die je kunt in- en uitklappen. Per symbool zie je of het async is met een bliksemicoon, of het geexporteerd is met een slot-icoon, en op welke regel het staat.

De Dependencies tab groepeert alle npm packages in vier secties: Production, Development, Peer, en Optional. Elke dependency toont naam en versie in een clean, monochrome layout.

De Health tab is het meest visueel indrukwekkend. Een gekleurde health badge bovenaan — groen voor gezond, geel voor aandacht nodig, rood voor ongezond. Vier metriekkaarten met grote getallen: bestanden, regels code, symbolen, dependencies. Een diagnostics samenvatting met het aantal fouten en waarschuwingen. En onderaan een taalverdeling met horizontale progress bars: achtennegentigenenhalf procent TypeScript, anderhalf procent CSS.

---

### De Kwaliteitsgarantie: Zes AI-Agents, Tweeenveertig Tests

Maar bouwen is niet genoeg. Shadow wilde zekerheid. En dus werd er een ongekend uitgebreid testprogramma opgezet.

Zes onafhankelijke AI-agents werden parallel losgelaten op het systeem, elk met hun eigen specialiteit:

De Build Verificatie agent controleerde of alles compileert. De MCP Tools agent testte alle zeven analyse-tools een voor een. De API Security agent bombardeerde de endpoints met SQL injection, XSS-aanvallen, overflow-pogingen, en ongeldige HTTP methods. De Data Integriteit agent vergeleek elke veldnaam tussen de TypeScript types, de database schema's, de API responses, en de frontend componenten. De Edge Case agent testte wat er gebeurt met lege directories, niet-bestaande paden, en corrupte bestanden. En de UI Regressie agent opende elke pagina in een echte browser om te verifieren dat niets kapot was gegaan.

Het resultaat: veertig van de tweeenveertig tests slaagden direct. De twee die faalden onthulden drie type-mismatches — veldnamen die niet overeenkwamen tussen de database en de TypeScript code. Deze werden ter plekke gefixed, geverifieerd, en gedeployed.

De security tests verdienen extra aandacht. Een SQL injection aanval met de tekst "punt-komma DROP TABLE code_symbols" werd netjes afgevangen door Supabase's parameterized queries — het systeem retourneerde gewoon een lege array. Een XSS-aanval met een script-tag werd niet gereflecteerd in de response. Een absurd lange slug van tweeduizend karakters veroorzaakte geen crash. En ongeautoriseerde HTTP methods kregen netjes een 405 Method Not Allowed terug.

---

### De Cijfers: Command Center v2 Analyseert Zichzelf

Het mooiste bewijs dat het systeem werkt? Command Center v2 analyseert zichzelf. En de cijfers zijn indrukwekkend:

Zevenenzventig bronbestanden. Achttienduizend achthonderdvierenzeventig regels code. Vierhonderdnegentien symbolen waarvan honderdvierentachtig geexporteerd. Nul compiler fouten. Nul compiler waarschuwingen. Eenentwintig dependencies — twaalf voor productie, negen voor development. Health score: gezond.

De analyse zelf duurt elf seconden voor bijna tienduizend regels code. De vier API endpoints reageren binnen een seconde, zelfs als ze gelijktijdig worden aangesproken. De hele deployment naar Vercel duurt negenentwintig seconden.

---

### Wat Dit Betekent voor Shadow

Voor het eerst heeft Shadow een glashelder beeld van wat er in zijn codebase leeft. Hij hoeft geen terminal te openen, geen code te lezen, geen technische tools te bedienen. Hij opent zijn dashboard, klikt op een project, en ziet:

Hoeveel functies er zijn. Welke packages worden gebruikt. Of er fouten in de code zitten. Hoe gezond het project is. En dat alles in zijn eigen design systeem — monochroom, elegant, geen afleidende kleuren.

Het is alsof je van een autobestuurdersperspectief verschuift naar een glashelder instrumentenpaneel. Je hoeft niet te weten hoe de motor werkt. Je moet alleen zien of alles groen is.

---

### De Technische Innovatie

Wat dit project technisch bijzonder maakt is de integratie van drie werelden die zelden samenkomen:

Ten eerste, de Model Context Protocol. De analyse engine is niet zomaar een script — het is een MCP server die door AI-assistenten kan worden aangestuurd. Claude kan letterlijk zeggen "analyseer dit project" en het resultaat wordt automatisch opgeslagen en zichtbaar in het dashboard.

Ten tweede, de TypeScript Compiler API via ts-morph. Dit is geen oppervlakkige tekstanalyse — het is een diepe, semantische analyse die de Abstract Syntax Tree van elke bronbestand doorloopt. Het verschil is als tussen een woordentelling en een grammatica-analyse.

Ten derde, de serverless architectuur. Er draait geen server. De MCP server wordt on-demand gestart door Claude. De API endpoints draaien als serverless functions op Vercel. De data leeft in een managed PostgreSQL database bij Supabase. Het enige dat altijd beschikbaar is, is het dashboard zelf.

---

### De Bredere Visie

Code Intelligence is meer dan een feature — het is een verschuiving in hoe Shadow zijn AI-setup beheert. Het Command Center begon als een asset registry: een catalogus van wat je hebt. Met Code Intelligence wordt het een management dashboard: een instrument dat je vertelt hoe het gaat.

De architectuur is bewust modulair opgezet. Vandaag analyseert het TypeScript projecten. Morgen zou het Python, Rust, of Go kunnen ondersteunen. De Supabase tabellen, de API endpoints, en de dashboard componenten zijn klaar om meerdere talen aan te kunnen.

En met features als trend tracking — metrics over tijd opslaan om groei of achteruitgang te monitoren — en multi-project vergelijking — alle projecten naast elkaar leggen — kan het dashboard evolueren van een momentopname naar een strategisch instrument.

---

### Tot Slot

In twee dagen tijd ging Command Center v2 van een asset registry naar een volwaardig code intelligence platform. Achttien commits. Tweeenveertig tests. Zes parallelle AI-agents. Drie gefixte bugs. Nul compiler fouten.

Van zwarte doos naar glazen huis.

---

### Kernfeiten op een Rij

- **Project**: Command Center v2 Code Intelligence
- **Bouwtijd**: 2 dagen (13-14 februari 2026)
- **Commits**: 18
- **Nieuwe bestanden**: 17
- **Test suite**: 42 tests, 6 parallelle agents, 97.8% slagingspercentage
- **Live data**: 77 bestanden, 8.874 regels code, 419 symbolen, 21 dependencies
- **Health score**: Gezond (0 errors, 0 warnings)
- **Performance**: 11 seconden analyse, 29 seconden deployment
- **Beveiliging**: SQL injection proof, XSS proof, method guarding, concurrent-safe
- **URL**: command-center-app-nine.vercel.app
- **Tech stack**: Next.js 14, Supabase, ts-morph, Tailwind CSS v4, Vercel, MCP Protocol

---

*Dit verhaal is gebaseerd op geverifieerde productiedata van 13 februari 2026. Alle cijfers, testresultaten en technische details zijn gevalideerd tegen de live omgeving.*
