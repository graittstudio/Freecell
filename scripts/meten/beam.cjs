/* Helpt het om bij een tik een paar zetten vooruit te kijken (beam search)? */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');

const sets = ['/keuzeset.json', '/keuzeset-leeg.json']
  .filter(f => fs.existsSync(TMP + f))
  .flatMap(f => JSON.parse(fs.readFileSync(TMP + f, 'utf8')));
const groot = TMP + '/keuzeset-groot.json';
if (fs.existsSync(groot)) sets.push(...JSON.parse(fs.readFileSync(groot, 'utf8')));

function veilig(st) { let g = true; while (g) { g = false; const m = Eng.safeMoves(st); if (m.length) { Eng.apply(st, m[0].src, m[0].dst); g = true; } } return st; }

/* Hoe goed kan het bord er over een paar zetten uitzien? */
function beam(st, diepte, breedte) {
  let laag = [st], beste = Eng.bordWaarde(st);
  for (let d = 0; d < diepte; d++) {
    const volgende = [];
    for (const s of laag) {
      for (const z of Eng.allMoves(s)) {
        const t = Eng.clone(s);
        if (!Eng.apply(t, z.src, z.dst)) continue;
        veilig(t);
        volgende.push({ t, w: Eng.bordWaarde(t) });
      }
    }
    if (!volgende.length) break;
    volgende.sort((a, b) => b.w - a.w);
    if (volgende[0].w > beste) beste = volgende[0].w;
    laag = volgende.slice(0, breedte).map(x => x.t);
  }
  return beste;
}

function kiezer(diepte, breedte, mengsel) {
  return (st, src) => {
    const ka = Eng.cardsOf(st, src);
    if (!ka.length) return null;
    const c = ka[0];
    if (ka.length === 1) {
      const f = { kind: 'found', i: Eng.suit(c) };
      if (Eng.canMove(st, src, f) && Eng.isSafe(st, c)) return f;
    }
    let best = null, bestW = -1e9;
    const weeg = (dst) => {
      if (!Eng.canMove(st, src, dst)) return;
      const na = Eng.clone(st);
      if (!Eng.apply(na, src, dst)) return;
      const nu = Eng.bordWaarde(na);
      let w = diepte ? nu * (1 - mengsel) + beam(na, diepte, breedte) * mengsel : nu;
      if (dst.kind === 'found') w += 8;
      if (src.kind === 'free') w += 15;
      if (w > bestW) { bestW = w; best = dst; }
    };
    if (ka.length === 1) weeg({ kind: 'found', i: Eng.suit(c) });
    for (let i = 0; i < 8; i++) {
      if (src.kind === 'col' && src.i === i) continue;
      if (!st.cols[i].length && src.kind === 'col' && st.cols[src.i].length === ka.length) continue;
      weeg({ kind: 'col', i });
    }
    return best;
  };
}

const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;
function meet(kies) {
  let goed = 0, som = 0, best = 0, t0 = Date.now();
  for (const k of sets) {
    const keus = kies(Eng.clone(k.st), k.src);
    const laag = Math.min(...k.met.map(x => x.kosten)), hoog = Math.max(...k.met.map(x => x.kosten));
    const m = k.met.find(x => zelfde(x.dst, keus));
    const kosten = m ? m.kosten : hoog;
    if (kosten === laag) goed++;
    som += kosten; best += laag;
  }
  return { goed, n: sets.length, gem: Math.round(som / sets.length), best: Math.round(best / sets.length), ms: (Date.now() - t0) / sets.length };
}

console.log('momenten in de meting: ' + sets.length);
console.log('');
console.log('manier van kiezen'.padEnd(34) + 'raak      werk   ms/tik');
const rijen = [
  ['nu in de app (alleen waardering)', kiezer(0, 0, 0)],
  ['diepte 6, breedte 8', kiezer(6, 8, 1)],
  ['diepte 6, breedte 12', kiezer(6, 12, 1)],
  ['diepte 8, breedte 8', kiezer(8, 8, 1)],
  ['diepte 8, breedte 12', kiezer(8, 12, 1)],
  ['diepte 8, breedte 16', kiezer(8, 16, 1)],
  ['diepte 10, breedte 12', kiezer(10, 12, 1)],
  ['diepte 10, breedte 16', kiezer(10, 16, 1)]
];
for (const [naam, k] of rijen) {
  const r = meet(k);
  console.log(naam.padEnd(34) + (r.goed + '/' + r.n).padEnd(10) + String(r.gem).padEnd(7) + r.ms.toFixed(1));
}
console.log('');
console.log('beste haalbaar'.padEnd(34) + (sets.length + '/' + sets.length).padEnd(10) + meet(() => null).best);
