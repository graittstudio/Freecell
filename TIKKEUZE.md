# Hoe de tik-keuze is afgesteld

Als je een kaart aantikt, moet het spel zelf de beste bestemming kiezen. Dat
ging twee keer mis, en beide keren was de oorzaak dat de keuze op vuistregels
berustte in plaats van op meting.

* **1.5.0** koos simpelweg de meest linkse kolom die paste.
* **1.6.0** gaf elke kolom een cijfer op basis van bedachte regels (sluit hij
  aan op een reeks, hoe lang is de kolom). Dat voelde logisch, maar bleek bij
  nameten *slechter* dan 1.5.0.
* **1.7.0** rekent elke mogelijke zet door op een kopie van het bord en kiest
  de stand die daarna het gunstigst is. De gewichten zijn nagemeten.

## De meetlat

In `scripts/meten` staat een kleine solver. Die kan van een stand uitrekenen
hoeveel standen hij moet onderzoeken om het potje alsnog te winnen. Minder
werk = gunstiger positie. Als controle: de solver bevestigt dat het beroemde
spel **#11982** niet te winnen is, en lost spel #1 wel op.

Daarmee is een vaste verzameling keuzemomenten gebouwd (`keuzeset*.json`):
39 situaties uit echte potjes waarin een kaart meer dan een bestemming had
en die bestemmingen duidelijk verschilden. Voor elke bestemming is
uitgerekend hoeveel werk er daarna nog nodig was. De zoekvolgorde van die
meting gebruikt met opzet een *andere* weging dan de app, anders meet je je
eigen gelijk.

## Wat eruit kwam

| versie | kiest de gunstigste plek | werk dat daarna nog nodig is |
|---|---|---|
| 1.5.0 (meest linkse) | 17 van de 36 | 1253 |
| 1.6.0 (vuistregels) | **9 van de 36** | 1291 |
| 1.7.0 (doorrekenen) | 17-18 van de 36 | 1204 |
| perfect gekozen | 36 van de 36 | 553 |

Twee dingen zijn daarbij gebleken:

1. **Begraven tellen per kaart was de fout.** Een reeks van vijf kaarten
   ergens op leggen werd vijf keer zo zwaar bestraft als een losse kaart,
   terwijl zo'n nette reeks in een beweging weer weg kan. Daardoor vluchtte
   alles naar lege kolommen. Nu telt een aaneengesloten reeks als een blok.
2. **Vooruitkijken en een mini-solver leveren niets op.** Een zet vooruit
   kijken gaf exact dezelfde keuzes. Per kandidaat een paar duizend standen
   doorrekenen scoorde zelfs slechter (14-17 van de 39) en kostte 50-220 ms
   per tik. Beide zijn daarom bewust niet ingebouwd.

Perfect kiezen zou een volledige solver per tik vragen; dat is op een
telefoon te traag. Wat er nu staat is ongeveer twee keer zo vaak raak als de
vorige versie.

## Zelf nameten

    node scripts/meten/test-tik.js       # negen gerichte situaties
    node scripts/meten/varianten.js      # versies naast elkaar op de vaste set
    node scripts/meten/testset.js        # nieuwe keuzemomenten verzamelen (duurt lang)

`docs/` is in dit project de webversie en wordt bij elke bouw leeggegooid --
documentatie hoort dus hier in de hoofdmap.


## Tweede ronde (22 november 2026): meten op zetten

Paul gaf een scherpere maatstaf: de zet moet gaan naar de plek die het meeste
oplevert *in wat het spel telt* — zetten, punten, afgelegde kaarten. De eerste
meetlat ("hoeveel werk kost het de solver nog") is daar een omweg voor.

Daarom opnieuw gemeten, nu op **hoeveel zetten er na de keuze nog nodig zijn
om te winnen**, over 179 keuzemomenten uit echte potjes:

| manier van kiezen | kiest de kortste | zetten daarna |
|---|---|---|
| 1.6.0 (vuistregels) | 93 van de 179 | 357 |
| 1.7.0 / nu (waardering) | 95 van de 179 | **294** |
| met vooruitkijken (beam, 10 diep) | 95 van de 179 | 338 |
| perfect gekozen | 179 van de 179 | 243 |

Daar volgen drie dingen uit:

1. **Vooruitkijken maakt het slechter.** Op de eerste meetlat leek een
   beam-zoektocht beter (26 van de 39 tegen 18), maar op zetten gemeten kost
   hij er juist meer. Hij is daarom weer verwijderd — dat scheelt ook 90 ms
   per tik.
2. **Verder afstellen levert niets op.** Alle 972 doorgerekende combinaties
   van gewichten komen uit op 294 zetten of slechter.
3. **Het gewicht van "afleggen" doet niets** bij een keuze tussen twee
   kolommen: de aflegstapel verandert daar immers niet van.

Het verschil tussen de beste en de slechtste plek is gemiddeld 193 zetten en
liep in het ergste geval op tot 4101. Een tik op de verkeerde plek kost dus
echt wat.

    node scripts/meten/oplevering.cjs        # meet zetten-tot-winst per plek
    node scripts/meten/zetten-vergelijk.cjs  # versies naast elkaar
    node scripts/meten/raster-zetten.cjs     # zoekt betere gewichten
