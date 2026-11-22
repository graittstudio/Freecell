/* Zoekt de weging die de minste zetten oplevert (de maat die het spel telt). */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');
const data = ['/oplevering.json', '/oplevering-groot.json']
  .filter(f => fs.existsSync(TMP + f)).flatMap(f => JSON.parse(fs.readFileSync(TMP + f, 'utf8')));

const rank = c => (c % 13) + 1, suit = c => Math.floor(c / 13);
const rood = c => suit(c) === 1 || suit(c) === 2;
const zelfdeKleur = (a, b) => rood(a) === rood(b);
function blokken(col, j) { let b = 0; for (let k = j + 1; k < col.length; k++) if (k === j + 1 || !(rank(col[k-1]) === rank(col[k]) + 1 && !zelfdeKleur(col[k-1], col[k]))) b++; return b; }

function kiezer(p) {
  const waarde = (st) => {
    let w = 0, leeg = 0, vrij = 0;
    for (let i = 0; i < 4; i++) w += st.found[i].length * 60;
    for (let i = 0; i < 8; i++) if (!st.cols[i].length) leeg++;
    for (let i = 0; i < 4; i++) if (st.free[i] === null) vrij++;
    w += leeg * p.leeg + vrij * p.cel;
    for (let i = 0; i < 8; i++) {
      const col = st.cols[i];
      for (let j = 0; j < col.length; j++) {
        const c = col[j], r = rank(c), s = suit(c);
        const last = p.perBlok ? blokken(col, j) : (col.length - 1 - j);
        if (st.found[s].length === r - 1) w -= last * p.beurt;
        else if (r <= 5) w -= (6 - r) * last * p.laag;
        if (j > 0 && rank(col[j-1]) === r + 1 && !zelfdeKleur(col[j-1], c)) w += p.reeks;
      }
    }
    return w;
  };
  return (st, src) => {
    const ka = Eng.cardsOf(st, src); if (!ka.length) return null;
    const c = ka[0];
    if (ka.length === 1) { const f = { kind: 'found', i: suit(c) }; if (Eng.canMove(st, src, f) && Eng.isSafe(st, c)) return f; }
    const kand = [];
    if (ka.length === 1) { const f = { kind: 'found', i: suit(c) }; if (Eng.canMove(st, src, f)) kand.push(f); }
    for (let i = 0; i < 8; i++) {
      if (src.kind === 'col' && src.i === i) continue;
      if (!st.cols[i].length && src.kind === 'col' && st.cols[src.i].length === ka.length) continue;
      const d = { kind: 'col', i }; if (Eng.canMove(st, src, d)) kand.push(d);
    }
    if (kand.length === 1) return kand[0];
    let best = null, bw = -1e9;
    for (const d of kand) {
      const na = Eng.clone(st); if (!Eng.apply(na, src, d)) continue;
      let w = waarde(na);
      if (d.kind === 'found') w += p.aflegBonus;
      if (src.kind === 'free') w += 15;
      if (w > bw) { bw = w; best = d; }
    }
    return best;
  };
}
const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;
function meet(kies) {
  let kort = 0, zetten = 0;
  for (const k of data) {
    const keus = kies(Eng.clone(k.st), k.src);
    const laag = Math.min(...k.met.map(m => m.zetten)), hoog = Math.max(...k.met.map(m => m.zetten));
    const m = k.met.find(x => zelfde(x.dst, keus)) || { zetten: hoog };
    if (m.zetten === laag) kort++;
    zetten += m.zetten;
  }
  return { kort, gem: zetten / data.length };
}

const uit = [];
for (const perBlok of [true, false])
for (const leeg of [20, 50, 90])
for (const beurt of [4, 10, 20])
for (const laag of [0.5, 1, 2])
for (const reeks of [10, 25, 45])
for (const cel of [10, 20, 35])
for (const aflegBonus of [8, 60]) {
  const p = { perBlok, leeg, beurt, laag, reeks, cel, aflegBonus };
  const r = meet(kiezer(p));
  uit.push({ p, ...r });
}
uit.sort((a, b) => a.gem - b.gem);
const nu = meet((st, src) => Eng.autoTarget(st, src));
console.log('momenten: ' + data.length + '   |   nu in de app: ' + nu.kort + ' kortste, ' + Math.round(nu.gem) + ' zetten');
console.log('kortst haalbaar: ' + Math.round(data.reduce((s, k) => s + Math.min(...k.met.map(m => m.zetten)), 0) / data.length) + ' zetten');
console.log('');
console.log('blok  leeg beurt laag reeks cel  afleg | kortste  zetten');
for (const u of uit.slice(0, 8)) {
  const p = u.p;
  console.log(String(p.perBlok).padEnd(6) + String(p.leeg).padEnd(5) + String(p.beurt).padEnd(6) + String(p.laag).padEnd(5) +
    String(p.reeks).padEnd(6) + String(p.cel).padEnd(5) + String(p.aflegBonus).padEnd(6) + '| ' +
    String(u.kort).padEnd(9) + Math.round(u.gem));
}
console.log('');
console.log('slechtste van de ' + uit.length + ' combinaties: ' + Math.round(uit[uit.length - 1].gem) + ' zetten');
