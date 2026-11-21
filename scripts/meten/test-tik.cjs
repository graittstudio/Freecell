/* Controleert waar een tik de kaart heen stuurt, zonder browser. */
const fs = require('fs');
const code = fs.readFileSync('D:/claude/freecell/js/engine.js', 'utf8');
const Eng = new Function(code + '; return Eng;')();

const S = { s: 0, h: 1, r: 2, k: 3 };               // schoppen harten ruiten klaver
const kaart = (kl, w) => S[kl] * 13 + (w - 1);
const naam = (c) => ['A','2','3','4','5','6','7','8','9','10','B','V','H'][c % 13] + ['♠','♥','♦','♣'][Math.floor(c / 13)];

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

console.log('\n1. Twee mogelijke zevens: de nette reeks of de rommelkolom');
{
  const st = stand([
    [kaart('k',13), kaart('h',6)],                                   // 0: ♥6 ligt bovenop
    [kaart('r',9), kaart('s',8), kaart('h',9), kaart('s',7)],        // 1: ♠7, korte kolom
    [kaart('h',13), kaart('r',4), kaart('k',10), kaart('h',3), kaart('r',10),
     kaart('s',2), kaart('h',12), kaart('k',7)],                     // 2: ♣7, lange kolom
    [], [], [], [], []
  ]);
  st.cols[3] = [kaart('s',5)]; st.cols[4] = [kaart('r',3)];          // geen lege kolommen
  st.cols[5] = [kaart('k',4)]; st.cols[6] = [kaart('h',11)]; st.cols[7] = [kaart('s',9)];
  toets('♥6 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'kolom 2 (op 7♠)');
}

console.log('\n2. De linkse zeven staat klaar voor de aflegstapel');
{
  const st = stand([
    [kaart('k',13), kaart('h',6)],
    [kaart('s',7)],                                                   // ♠7 kan zelf weg
    [kaart('h',13), kaart('k',7)],
    [kaart('s',5)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)]
  ], { found: [[0,1,2,3,4,5], [], [], []] });                         // ♠ t/m 6 ligt af
  toets('♥6 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'kolom 3 (op 7♣)');
}

console.log('\n3. Past nergens, wel een lege kolom en lege cellen');
{
  const st = stand([
    [kaart('k',13), kaart('h',6)],
    [], [kaart('s',2)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)]
  ]);
  toets('♥6 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'kolom 2 (leeg)');
}

console.log('\n4. Past nergens, geen lege kolom: eerst niets, na de tweede tik een cel');
{
  const st = stand([
    [kaart('k',13), kaart('h',6)],
    [kaart('s',2)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)], [kaart('k',9)]
  ]);
  toets('eerste tik', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'NERGENS');
  toets('tweede tik', waarheen(st, { kind: 'col', i: 0, idx: 1 }, true), 'vrije cel 1');
}

console.log('\n5. Laatste lege kolom niet volgooien met één kaart als het ook op tafel past');
{
  const st = stand([
    [kaart('k',13), kaart('h',6)],
    [], [kaart('s',7)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)]
  ]);
  toets('♥6 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'kolom 3 (op 7♠)');
}

console.log('\n6. Een kolom met één kaart verhuist niet naar een lege kolom');
{
  const st = stand([
    [kaart('h',6)], [], [kaart('s',2)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)]
  ]);
  toets('♥6 (enige kaart) aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 0 }), 'NERGENS');
}

console.log('\n7. Aflegstapel gaat voor');
{
  const st = stand([
    [kaart('k',13), kaart('h',2)],
    [kaart('s',3)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)], [kaart('k',9)]
  ], { found: [[], [13], [], []] });                                   // ♥A ligt al af
  toets('♥2 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'aflegstapel');
}

console.log('\n8. Kaart uit een vrije cel gaat liever naar tafel dan te blijven staan');
{
  const st = stand([
    [kaart('s',7)], [kaart('k',2)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)], [kaart('k',9)]
  ], { free: [kaart('h',6), null, null, null] });
  toets('♥6 uit cel 1', waarheen(st, { kind: 'free', i: 0 }), 'kolom 1 (op 7♠)');
}

console.log('\n9. Reeks van drie: liever op een passende kaart dan in de lege kolom');
{
  const st = stand([
    [kaart('k',13), kaart('h',8), kaart('s',7), kaart('r',6)],
    [], [kaart('k',9)], [kaart('r',3)], [kaart('k',4)], [kaart('h',11)], [kaart('s',9)], [kaart('h',10)]
  ]);
  toets('♥8-♠7-♦6 aangetikt', waarheen(st, { kind: 'col', i: 0, idx: 1 }), 'kolom 3 (op 9♣)');
}

console.log(fout ? '\n' + fout + ' van de toetsen faalde\n' : '\nAlles goed\n');
process.exit(fout ? 1 : 0);
