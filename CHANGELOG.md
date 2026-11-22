# Wijzigingen

Versienummer staat in `package.json` en wordt bij het bouwen overal ingevuld:
in de app (versionName/versionCode), op de landingspagina en in de naam van de
service-worker-cache.

## 1.10.0 — 22 november 2026

- Hamburgermenu linksboven, met dezelfde knop-animatie als onze andere apps:
  drie streepjes waarvan het middelste iets naar rechts staat, die bij het
  openen tot een kruisje draaien en bij het sluiten terugveren.
- Daarmee is de balk bovenin opgeruimd: de losse knoppen voor instellingen,
  doelen, ranglijst, niveau en spelersteller zitten nu in dat ene menu. Wat
  overblijft is je score, tijd en zetten, met rechts je eigen avatar (die
  opent meteen je gegevens).
- Onder de balk staat nu alleen nog informatie: niveau en trede, het
  spelnummer en je plek in de ranglijst.
- De knoppen die je tijdens een potje nodig hebt — Nieuw, Ranglijst, Hint,
  Auto en Terug — blijven gewoon onderin staan.
- Ons logo staat onderin het menu en brengt je naar graittstudio.com.

## 1.9.0 — 22 november 2026

- Nieuw knopje 🌍 bovenin: hoeveel mensen dit spel spelen — nu, vandaag, deze
  week en in totaal. Het telt apparaten, geen namen: er gaat alleen een
  willekeurig nummer mee, geen naam, foto of tijden. Je hoeft er niet voor in
  een club te zitten.
- Je gegevens veiligstellen: in Mijn menu kun je een kopie maken van je naam,
  foto, tijden, treden en doelen, en die later weer terugzetten. Handig als je
  van telefoon wisselt. Bijwerken van het spel raakte je gegevens al niet aan.
- De tik-keuze is opnieuw nagemeten, nu op wat het spel zelf telt: hoeveel
  zetten je daarna nog nodig hebt. Op 179 keuzemomenten kost de huidige keuze
  gemiddeld 294 zetten, tegen 357 bij de versie van vorige week. Vooruitkijken
  is geprobeerd maar bleek op die maat slechter (338) en is er weer uit.
- Hersteld: in de app deed "uitdaging delen" soms niets als het kopiëren naar
  het klembord mislukte. Nu verschijnt de tekst in een vakje dat je kunt
  kopiëren.

## 1.8.0 — 22 november 2026

- Samen spelen doet het weer. De database waar de clubranglijst op draaide was
  in september opgeruimd; die draait nu mee op het Supabase-project dat toch al
  door de andere apps wordt gedeeld, dus er komen geen kosten bij.
- Een club maken, een code invoeren, de gezamenlijke ranglijst en "wie speelt er
  nu" werken weer. Oude clubcodes van voor september zijn verlopen: maak eenmalig
  een nieuwe club en deel die code.

## 1.7.0 — 21 november 2026

- Een tik zet de kaart nu echt op de beste plek. De vorige poging werkte met
  bedachte vuistregels en bleek bij nameten juist slechter dan de versie
  daarvoor: van de 36 beoordeelde keuzemomenten koos hij er maar 9 goed. Nu
  wordt elke mogelijke zet doorgerekend op een kopie van het bord en wint de
  stand die daarna het gunstigst is — dat is ongeveer twee keer zo vaak raak.
- De grootste fout zat in het afstraffen van "begraven": een nette reeks van
  vijf kaarten ergens op leggen telde vijf keer zo zwaar als één kaart,
  terwijl zo'n reeks in één beweging weer weg kan. Daardoor schoof het spel
  reeksen naar lege kolommen in plaats van op de passende kaart.
- Hoe dat is nagemeten staat in docs/tikkeuze.md, met het gereedschap in
  scripts/meten erbij.

## 1.6.0 — 15 november 2026

- Tik je een kaart aan, dan kiest het spel nu echt de beste plek. Eerst ging
  hij altijd naar de meest linkse kolom die paste; nu kijkt hij of de kaart
  aansluit op een nette reeks, of de kolom kort is, en of hij er geen kaart
  mee begraaft die net kon worden afgelegd.
- Een kaart belandt niet meer vanzelf in een vrije cel. Kan hij nergens heen,
  dan schudt hij even en vraagt het spel of je hem wilt parkeren: tik nog een
  keer en hij gaat in de cel. Slepen kan natuurlijk gewoon.
- Een lege kolom wordt niet meer volgegooid met één kaart als het elders ook
  past — zeker je laatste lege kolom niet.

## 1.5.0 — 6 september 2026

- Nieuw niveau **Dummies**, onder Beginner: de allermakkelijkste spellen, alle
  tijd, en de lamp legt niet alleen uit wat je kunt doen maar zet die ene kaart
  meteen op de goede plek. De rest doe je zelf.
- Samen spelen is duidelijker: één iemand maakt de club, de rest vult die code
  in. Zat je al in een club en krijg je een uitnodiging? Dan vraagt het spel of
  je wilt overstappen, in plaats van de link te negeren.
- Je kunt nu ook overstappen naar een andere club zonder eerst te vertrekken.
- Het spel meldt het als iemand uit je club jouw tijd op hetzelfde spel heeft
  verbeterd.
- De dagpuzzel houdt bij hoeveel dagen op rij je hem haalt, met een doel bij
  drie dagen.
- De telefoon trilt kort bij winst en bij een zet die niet kan (uit te zetten).

## 1.4.2 — 5 september 2026

- Een foto toevoegen gaat nu in een groot scherm: schuif de foto op zijn plek,
  knijp met twee vingers om in of uit te zoomen, of gebruik de schuifbalk. Wat
  je in de cirkel ziet is precies wat er komt te staan.

## 1.4.1 — 5 september 2026

- Het gedownloade bestand heet nu FreeCell-1.4.1.apk, zodat je op je telefoon
  ziet welke versie je hebt.

## 1.4.0 — 5 september 2026

- Het logo van grAItt Studio staat onderaan de pagina en in het
  instellingenscherm.
- Op de downloadpagina staat hoeveel verschillende mensen de app al hebben
  opgehaald.

## 1.3.1 — 5 september 2026

- Het spel controleert bij het opstarten zelf of er een nieuwere versie op de
  site staat, ook als de browser nog oude bestanden bewaart.

## 1.3.0 — 5 september 2026

- Samen spelen: maak een club, deel de code of de uitnodigingslink, en iedereen
  die meedoet staat in dezelfde ranglijst — op tijd, op zetten of op score.
- Je ziet in die lijst ook wie er op dat moment aan het spelen is.
- Wie de code niet heeft, ziet jullie lijst niet; er komt geen account aan te
  pas en alleen je naam en je tijden gaan mee.
- Op de webpagina staat uitleg over samen spelen, met je eigen code erbij.

## 1.2.0 — 5 september 2026

- Mijn menu: tik linksboven op je naam voor je gegevens (naam, foto, een regel
  over jezelf) en de keuze tussen licht en donker.
- Licht of donker, of laat het spel de stand van je telefoon volgen.
- Grotere cijfers en duidelijkere symbolen op de kaarten.
- Het spel zegt het voortaan zelf als er een nieuwe versie klaarstaat.
- Een welkomstgroet bij de allereerste start.

## 1.1.0 — 5 september 2026

- Slepen met je vinger werkt nu zoals het hoort: de kaart volgt je vinger en
  wordt er net boven getekend, zodat je ziet wat je vasthebt.
- Je hebt nu een eigen profiel: bij de eerste start vraagt het spel je naam
  (later te wijzigen), met desgewenst een foto en een regel over jezelf. Je
  naam en avatar staan in de ranglijst en in de balk bovenin.

## 1.0.0 — 5 september 2026

Eerste versie.

- FreeCell met alle regels: 8 kolommen, 4 vrije cellen, 4 aflegstapels,
  reeksen verplaatsen op basis van vrije cellen en lege kolommen.
- Aanklikken verplaatst een kaart zelf, dubbelklikken legt af, slepen kan ook.
- Niveaus Beginner / Gevorderd / Pro, elk met treden die vanzelf zwaarder
  worden: moeilijkere deals, minder hints, minder terugdraaien, minder cellen.
- Ranglijst op tijd, zetten of score, met je lopende potje er live tussen.
- Klassieke Microsoft-spelnummers, dagpuzzel en uitdaaglinks (`?spel=39911`).
- Doelen, statistieken, hint, auto-afleggen, onbeperkt terugdraaien op Beginner.
- Zes achtergronden, vijf kaartstijlen, A-J-Q-K of A-B-V-H, linkshandige stand.
- Werkt offline (service worker), te installeren als webapp of als Android-app.
