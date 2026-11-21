/* Draait verschillende manieren van kiezen tegen de vaste testset. */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { execSync } = require('child_process');
const { laadEngine } = require(TMP + '/solver.cjs');
/* De oude versies komen rechtstreeks uit de geschiedenis, zodat de
   vergelijking klopt met wat er destijds op de telefoon stond. */
for (const [bestand, commit] of [['engine-1.6.0.js', 'c61e2e3'], ['engine-1.5.0.js', 'c910c04']]) {
  if (!fs.existsSync(TMP + '/' + bestand))
    fs.writeFileSync(TMP + '/' + bestand, execSync('git -C D:/claude/freecell show ' + commit + ':js/engine.js').toString());
}
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');
const V16 = laadEngine(TMP + '/engine-1.6.0.js').Eng;
const V15 = laadEngine(TMP + '/engine-1.5.0.js').Eng;
const setKolom = JSON.parse(fs.readFileSync(TMP + '/keuzeset.json', 'utf8'));
const setLeeg = JSON.parse(fs.readFileSync(TMP + '/keuzeset-leeg.json', 'utf8'));

const rank = c => (c % 13) + 1, suit = c => Math.floor(c / 13);
const rood = c => suit(c) === 1 || suit(c) === 2;
const zelfdeKleur = (a, b) => rood(a) === rood(b);

/* Aantal losse blokken boven positie j: een nette reeks telt als één blok,
   want die gaat in één beweging weg. */
function blokkenBoven(col, j) {
  let blokken = 0;
  for (let k = j + 1; k < col.length; k++) {
    if (k === j + 1 || !(rank(col[k - 1]) === rank(col[k]) + 1 && !zelfdeKleur(col[k - 1], col[k]))) blokken++;
  }
  return blokken;
}

function maakWaarde(p) {
  return function (st) {
    let w = 0;
    for (let i = 0; i < 4; i++) w += st.found[i].length * p.afgelegd;
    let leeg = 0, vrij = 0;
    for (let i = 0; i < 8; i++) if (!st.cols[i].length) leeg++;
    for (let i = 0; i < 4; i++) if (st.free[i] === null) vrij++;
    w += leeg * p.legeKolom + vrij * p.vrijeCel;
    for (let i = 0; i < 8; i++) {
      const col = st.cols[i];
      for (let j = 0; j < col.length; j++) {
        const c = col[j], r = rank(c), s = suit(c);
        const last = p.perBlok ? blokkenBoven(col, j) : (col.length - 1 - j);
        if (st.found[s].length === r - 1) w -= last * p.aanDeBeurt;
        else if (r <= 5) w -= (6 - r) * last * p.laag;
        if (j > 0 && rank(col[j - 1]) === r + 1 && !zelfdeKleur(col[j - 1], c)) w += p.reeks;
      }
    }
    return w;
  };
}

function maakKiezer(p) {
  const waarde = maakWaarde(p);
  function naZicht(st) {
    let beste = waarde(st);
    for (const z of Eng.allMoves(st)) {
      const t = Eng.clone(st);
      if (!Eng.apply(t, z.src, z.dst)) continue;
      const w = waarde(t);
      if (w > beste) beste = w;
    }
    return beste;
  }
  return function (st, src) {
    const kaarten = Eng.cardsOf(st, src);
    if (!kaarten.length) return null;
    const c = kaarten[0];
    if (kaarten.length === 1) {
      const f = { kind: 'found', i: suit(c) };
      if (Eng.canMove(st, src, f) && Eng.isSafe(st, c)) return f;
    }
    let best = null, bestW = -1e9;
    const weeg = (dst) => {
      if (!Eng.canMove(st, src, dst)) return;
      const na = Eng.clone(st);
      if (!Eng.apply(na, src, dst)) return;
      const nu = waarde(na);
      let w = p.vooruit ? nu + (naZicht(na) - nu) * p.vooruit : nu;
      if (dst.kind === 'found') w += 8;
      if (src.kind === 'free') w += 15;
      if (w > bestW) { bestW = w; best = dst; }
    };
    if (kaarten.length === 1) weeg({ kind: 'found', i: suit(c) });
    for (let i = 0; i < 8; i++) {
      if (src.kind === 'col' && src.i === i) continue;
      if (!st.cols[i].length && src.kind === 'col' && st.cols[src.i].length === kaarten.length) continue;
      weeg({ kind: 'col', i });
    }
    return best;
  };
}

const basis = { afgelegd: 60, legeKolom: 50, vrijeCel: 20, aanDeBeurt: 10, laag: 1, reeks: 14, perBlok: false, vooruit: 0.4 };
const varianten = {
  '1.5.0 (meest linkse)': (st, src) => V15.autoTarget(st, src),
  '1.6.0 (op telefoon)': (st, src) => V16.autoTarget(st, src),
  'C nu in de map': (st, src) => Eng.autoTarget(st, src),
  'D per blok': maakKiezer({ ...basis, perBlok: true }),
  'E per blok, reeks zwaar': maakKiezer({ ...basis, perBlok: true, reeks: 30 }),
  'F per blok, geen vooruitblik': maakKiezer({ ...basis, perBlok: true, vooruit: 0 }),
  'G per blok, lege kolom duur': maakKiezer({ ...basis, perBlok: true, legeKolom: 90, reeks: 25 }),
  'H per blok, beurt zwaar': maakKiezer({ ...basis, perBlok: true, aanDeBeurt: 25, reeks: 25 })
};

const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;

/* Het geval uit spel #1106 dat ik eerder vond: een reeks van vijf die op een
   dame past of in een lege kolom kan. Hier ging de huidige versie de mist in. */
function geval1106() {
  let st = Eng.create(1106, 4);
  for (let i = 0; i < 23; i++) { const m = Eng.bestMove(st, null); if (!m) break; Eng.apply(st, m.src, m.dst); }
  let gevonden = null;
  for (let i = 0; i < 8 && !gevonden; i++) {
    for (let j = 0; j < st.cols[i].length; j++) {
      if (Eng.runLength(st, i, j) < 2) continue;
      const src = { kind: 'col', i, idx: j };
      const d = [];
      for (let k = 0; k < 8; k++) {
        if (k === i) continue;
        const dst = { kind: 'col', i: k };
        if (!Eng.canMove(st, src, dst)) continue;
        if (!st.cols[k].length && st.cols[i].length === Eng.cardsOf(st, src).length) continue;
        d.push(dst);
      }
      if (d.length >= 2 && d.some(x => !st.cols[x.i].length)) { gevonden = { src, d }; break; }
    }
  }
  if (!gevonden) return [];
  const met = gevonden.d.map(dst => {
    const t = Eng.clone(st); Eng.apply(t, gevonden.src, dst);
    return { dst, kosten: ruweKosten(t) };
  });
  return [{ deal: 1106, st: JSON.parse(JSON.stringify(Eng.clone(st))), src: gevonden.src, met }];
}
function ruweKosten(start) {
  const sl = (st) => st.cols.map(c => c.join(',')).sort().join('|') + '#' +
    st.free.filter(c => c !== null && c !== 'X').sort((a, b) => a - b).join(',') + '#' + st.found.map(f => f.length).join(',');
  const veilig = (st) => { let g = true; while (g) { g = false; const m = Eng.safeMoves(st); if (m.length) { Eng.apply(st, m[0].src, m[0].dst); g = true; } } return st; };
  const neutraal = (st) => { let w = 0; for (let i = 0; i < 4; i++) w += st.found[i].length * 100;
    for (let i = 0; i < 8; i++) { const c = st.cols[i]; if (!c.length) { w += 60; continue; }
      for (let j = 0; j < c.length; j++) { const r = (c[j] % 13) + 1; if (r <= 4) w -= (c.length - 1 - j) * 12; } }
    for (let i = 0; i < 4; i++) if (st.free[i] === null) w += 25; return w; };
  const b = veilig(Eng.clone(start)); if (Eng.won(b)) return 1;
  const z = new Set([sl(b)]); const stapel = [b]; let k = 0;
  while (stapel.length) { if (++k > 150000) return 150000; const st = stapel.pop(); const kid = [];
    for (const m of Eng.allMoves(st)) { const t = Eng.clone(st); if (!Eng.apply(t, m.src, m.dst)) continue; veilig(t);
      if (Eng.won(t)) return k; const key = sl(t); if (z.has(key)) continue; z.add(key); kid.push({ t, w: neutraal(t) }); }
    kid.sort((a, b) => a.w - b.w).forEach(x => stapel.push(x.t)); }
  return 150000;
}

const setsLeeg = setLeeg.concat(geval1106());
function meet(set, kiezer) {
  let goed = 0, som = 0, besteSom = 0;
  for (const k of set) {
    const keus = kiezer(Eng.clone(k.st), k.src);
    const laag = Math.min(...k.met.map(x => x.kosten)), hoog = Math.max(...k.met.map(x => x.kosten));
    const m = k.met.find(x => zelfde(x.dst, keus));
    const kosten = m ? m.kosten : hoog;
    if (kosten === laag) goed++;
    som += kosten; besteSom += laag;
  }
  return { goed, n: set.length, gem: Math.round(som / set.length), best: Math.round(besteSom / set.length) };
}

console.log('');
console.log('kolom-tegen-kolom: ' + setKolom.length + ' momenten   |   met lege kolom: ' + setsLeeg.length + ' momenten');
console.log('');
console.log('variant'.padEnd(30) + 'kolommen      lege kolom     werk (kolom/leeg)');
for (const [naam, kiezer] of Object.entries(varianten)) {
  const a = meet(setKolom, kiezer), b = meet(setsLeeg, kiezer);
  console.log(naam.padEnd(30) + (a.goed + '/' + a.n).padEnd(14) + (b.goed + '/' + b.n).padEnd(15) +
    a.gem + ' / ' + b.gem);
}
const a0 = meet(setKolom, () => null), b0 = meet(setsLeeg, () => null);
console.log('');
console.log('beste haalbaar'.padEnd(30) + (a0.n + '/' + a0.n).padEnd(14) + (b0.n + '/' + b0.n).padEnd(15) + a0.best + ' / ' + b0.best);
