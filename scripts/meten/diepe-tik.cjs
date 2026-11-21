/* Loont het om bij een tik een paar duizend standen vooruit te rekenen? */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');
const set = JSON.parse(fs.readFileSync(TMP + '/keuzeset.json', 'utf8'))
  .concat(JSON.parse(fs.readFileSync(TMP + '/keuzeset-leeg.json', 'utf8')));

const sl = (st) => st.cols.map(c => c.join(',')).sort().join('|') + '#' +
  st.free.filter(c => c !== null && c !== 'X').sort((a, b) => a - b).join(',') + '#' + st.found.map(f => f.length).join(',');
function veilig(st) { let g = true; while (g) { g = false; const m = Eng.safeMoves(st); if (m.length) { Eng.apply(st, m[0].src, m[0].dst); g = true; } } return st; }

/* Korte zoektocht: lukt het binnen 'max' standen om te winnen? */
function snelOplossen(start, max) {
  const b = veilig(Eng.clone(start));
  if (Eng.won(b)) return 1;
  const z = new Set([sl(b)]); const stapel = [b]; let k = 0;
  while (stapel.length) {
    if (++k > max) return null;
    const st = stapel.pop(); const kid = [];
    for (const m of Eng.allMoves(st)) {
      const t = Eng.clone(st);
      if (!Eng.apply(t, m.src, m.dst)) continue;
      veilig(t);
      if (Eng.won(t)) return k;
      const key = sl(t); if (z.has(key)) continue;
      z.add(key); kid.push({ t, w: Eng.bordWaarde(t) });
    }
    kid.sort((a, b) => a.w - b.w).forEach(x => stapel.push(x.t));
  }
  return null;
}
function doelen(st, src) {
  const d = [], ka = Eng.cardsOf(st, src);
  if (ka.length === 1) { const f = { kind: 'found', i: Eng.suit(ka[0]) }; if (Eng.canMove(st, src, f)) d.push(f); }
  for (let i = 0; i < 8; i++) {
    if (src.kind === 'col' && src.i === i) continue;
    const k = { kind: 'col', i }; if (!Eng.canMove(st, src, k)) continue;
    if (!st.cols[i].length && src.kind === 'col' && st.cols[src.i].length === ka.length) continue;
    d.push(k);
  }
  return d;
}
const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;

for (const budget of [300, 1000, 3000, 10000]) {
  let goed = 0, som = 0, best = 0, tijd = 0, opgelost = 0, totaalKand = 0;
  for (const k of set) {
    const st = Eng.clone(k.st);
    const d = doelen(st, k.src);
    const t0 = Date.now();
    let keus = null, beste = Infinity;
    for (const dst of d) {
      const na = Eng.clone(st); Eng.apply(na, k.src, dst);
      totaalKand++;
      const kosten = snelOplossen(na, budget);
      if (kosten !== null) { opgelost++; if (kosten < beste) { beste = kosten; keus = dst; } }
    }
    if (!keus) keus = Eng.autoTarget(st, k.src);          // niets opgelost: terug naar de weging
    tijd += Date.now() - t0;
    const laag = Math.min(...k.met.map(x => x.kosten)), hoog = Math.max(...k.met.map(x => x.kosten));
    const m = k.met.find(x => zelfde(x.dst, keus));
    const kost = m ? m.kosten : hoog;
    if (kost === laag) goed++;
    som += kost; best += laag;
  }
  console.log('budget ' + String(budget).padStart(6) + ' standen: ' + (goed + '/' + set.length).padEnd(8) +
    ' werk ' + String(Math.round(som / set.length)).padStart(5) + ' (beste ' + Math.round(best / set.length) + ')' +
    '   gemiddeld ' + Math.round(tijd / set.length) + ' ms per tik' +
    '   kandidaten opgelost: ' + Math.round(opgelost / totaalKand * 100) + '%');
}
console.log('\nter vergelijking, alleen de weging:');
let g = 0, s2 = 0, b2 = 0, t2 = 0;
for (const k of set) {
  const st = Eng.clone(k.st); const t0 = Date.now();
  const keus = Eng.autoTarget(st, k.src); t2 += Date.now() - t0;
  const laag = Math.min(...k.met.map(x => x.kosten)), hoog = Math.max(...k.met.map(x => x.kosten));
  const m = k.met.find(x => zelfde(x.dst, keus));
  const kost = m ? m.kosten : hoog;
  if (kost === laag) g++; s2 += kost; b2 += laag;
}
console.log('  ' + (g + '/' + set.length) + '   werk ' + Math.round(s2 / set.length) + '   ' + (t2 / set.length).toFixed(1) + ' ms per tik');
