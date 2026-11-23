/* Rooktest voor de tik-keuze: controleert de regels die hard in de code
   staan, niet welke kolom "mooier" is.

   LET OP: eerdere versies van dit bestand toetsten ook voorkeuren ("liever
   deze kolom dan die") met zelfbedachte bordjes. Die bordjes waren geen
   geldig kaartspel -- kaarten kwamen er dubbel in voor en ze waren niet te
   winnen -- dus die uitkomsten zeiden niets. Welke plek werkelijk de beste
   is, wordt gemeten met de solver: zie varianten.cjs, beam.cjs en
   TIKKEUZE.md. */
const fs = require('fs');
const code = fs.readFileSync('D:/claude/freecell/js/engine.js', 'utf8');
const Eng = new Function(code + '; return Eng;')();

const S = { s: 0, h: 1, r: 2, k: 3 };               // schoppen harten ruiten klaver
const kaart = (kl, w) => S[kl] * 13 + (w - 1);
const naam = (c) => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'V', 'H'][c % 13] +
  ['♠', '♥', '♦', '♣'][Math.floor(c / 13)];

function stand(kolommen, opties = {}) {
  return {
    deal: 1, cells: 4,
    free: opties.free || [null, null, null, null],
    found: opties.found || [[], [], [], []],
    cols: kolommen, moves: 0, score: 0, undos: 0, hints: 0
  };
}
function waarheen(st, src, metCel) {
  const d = Eng.autoTarget(st, src, metCel);
  if (!d) return 'NERGENS';
  if (d.kind === 'found') return 'aflegstapel';
  if (d.kind === 'free') return 'vrije cel ' + (d.i + 1);
  return 'kolom ' + (d.i + 1) + (st.cols[d.i].length ? ' (op ' + naam(st.cols[d.i][st.cols[d.i].length - 1]) + ')' : ' (leeg)');
}

let fout = 0;
function toets(titel, gekregen, verwacht) {
  const ok = gekregen === verwacht;
  if (!ok) fout++;
  console.log((ok ? '  ok   ' : '  FOUT ') + titel + ' -> ' + gekregen + (ok ? '' : '   (verwacht: ' + verwacht + ')'));
}

console.log('\n1. Een kaart die veilig weg kan, gaat altijd naar de aflegstapel');
{
  const st = stand([
    [kaart('k', 13), kaart('h', 2)],
    [kaart('s', 3)], [kaart('r', 3)], [kaart('k', 4)], [kaart('h', 11)], [kaart('s', 9)], [kaart('h', 10)], [kaart('k', 9)]
  ], { found: [[], [13], [], []] });                              // ♥A ligt al af
  toets('♥2 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'aflegstapel');
}

console.log('\n2. Past nergens, geen lege kolom: alleen met de cel-vlag komt de vrije cel in beeld');
{
  const st = stand([
    [kaart('k', 13), kaart('h', 6)],
    [kaart('s', 2)], [kaart('r', 3)], [kaart('k', 4)], [kaart('h', 11)], [kaart('s', 9)], [kaart('h', 10)], [kaart('k', 9)]
  ]);
  toets('zonder cel-vlag', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'NERGENS');
  toets('met cel-vlag', waarheen(st, { kind: 'col', i: 0, idx: 1 }, true), 'vrije cel 1');
}

console.log('\n3. Een kolom die uit één kaart bestaat, verhuist niet naar een lege kolom');
{
  const st = stand([
    [kaart('h', 6)], [], [kaart('s', 2)], [kaart('r', 3)], [kaart('k', 4)], [kaart('h', 11)], [kaart('s', 9)], [kaart('h', 10)]
  ]);
  toets('♥6 (enige kaart) aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 0 }), 'NERGENS');
}

console.log('\n4. Is er maar één plek, dan gaat de kaart daarheen (zonder rekenwerk)');
{
  const st = stand([
    [kaart('s', 7)], [kaart('k', 2)], [kaart('r', 3)], [kaart('k', 4)], [kaart('h', 11)], [kaart('s', 9)], [kaart('h', 10)], [kaart('k', 9)]
  ], { free: [kaart('h', 6), null, null, null] });
  toets('♥6 uit cel 1', waarheen(st, { kind: 'free', i: 0 }), 'kolom 1 (op 7♠)');
}

console.log('\n5. Een kaart uit de aflegstapel wordt niet per ongeluk teruggepakt');
{
  const st = stand([
    [kaart('s', 7)], [kaart('k', 2)], [kaart('r', 3)], [kaart('k', 4)], [kaart('h', 11)], [kaart('s', 9)], [kaart('h', 10)], [kaart('k', 9)]
  ], { found: [[], [13, 14], [], []] });                          // ♥A en ♥2 liggen af
  const d = Eng.autoTarget(st, { kind: 'found', i: 1 });
  toets('♥2 op de aflegstapel aangetikt', d && d.kind === 'col' ? 'kolom ' + (d.i + 1) : 'NERGENS', 'NERGENS');
}

console.log(fout ? '\n' + fout + ' van de toetsen faalde\n' : '\nAlles goed\n');
process.exit(fout ? 1 : 0);
