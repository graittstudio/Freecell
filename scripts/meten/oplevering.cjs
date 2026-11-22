/* Wat levert een zet op, in wat het spel zelf telt?
     - zetten : hoeveel zetten er daarna nog nodig zijn om te winnen
     - punten : de eindscore van dat potje (afgelegde kaarten + bonus)
     - afleg  : hoeveel kaarten er binnen tien zetten op de aflegstapel komen
   De speler die dit uitspeelt is bewust de neutrale zoeker, niet de weging
   uit de app -- anders meet je je eigen gelijk. */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');

const sl = (st) => st.cols.map(c => c.join(',')).sort().join('|') + '#' +
  st.free.filter(c => c !== null && c !== 'X').sort((a, b) => a - b).join(',') + '#' + st.found.map(f => f.length).join(',');
function veilig(st) { let n = 0; let g = true; while (g) { g = false; const m = Eng.safeMoves(st); if (m.length) { Eng.apply(st, m[0].src, m[0].dst); g = true; n++; } } return n; }
function neutraal(st) {
  let w = 0;
  for (let i = 0; i < 4; i++) w += st.found[i].length * 100;
  for (let i = 0; i < 8; i++) {
    const c = st.cols[i];
    if (!c.length) { w += 60; continue; }
    for (let j = 0; j < c.length; j++) { const r = (c[j] % 13) + 1; if (r <= 4) w -= (c.length - 1 - j) * 12; }
  }
  for (let i = 0; i < 4; i++) if (st.free[i] === null) w += 25;
  return w;
}

/* Zoekt een manier om te winnen en geeft terug hoeveel zetten dat kostte. */
function zettenTotWinst(start, max = 60000) {
  const b = Eng.clone(start); veilig(b);
  if (Eng.won(b)) return { zetten: b.moves, gevonden: true };
  const gezien = new Set([sl(b)]);
  const stapel = [b];
  let knopen = 0;
  while (stapel.length) {
    if (++knopen > max) return { zetten: null, gevonden: false };
    const st = stapel.pop();
    const kinderen = [];
    for (const z of Eng.allMoves(st)) {
      const t = Eng.clone(st);
      if (!Eng.apply(t, z.src, z.dst)) continue;
      veilig(t);
      if (Eng.won(t)) return { zetten: t.moves, gevonden: true };
      const k = sl(t);
      if (gezien.has(k)) continue;
      gezien.add(k);
      kinderen.push({ t, w: neutraal(t) });
    }
    kinderen.sort((a, b) => a.w - b.w).forEach(x => stapel.push(x.t));
  }
  return { zetten: null, gevonden: false };
}

/* Hoeveel kaarten liggen er na tien zetten op de aflegstapel? (= punten) */
function aflegNaTienZetten(start) {
  let st = Eng.clone(start);
  for (let i = 0; i < 10; i++) {
    veilig(st);
    const m = Eng.bestMove(st, null);
    if (!m) break;
    Eng.apply(st, m.src, m.dst);
  }
  veilig(st);
  return st.found.reduce((s, f) => s + f.length, 0);
}

function doelen(st, src) {
  const d = [], ka = Eng.cardsOf(st, src);
  if (ka.length === 1) { const f = { kind: 'found', i: Eng.suit(ka[0]) }; if (Eng.canMove(st, src, f)) d.push(f); }
  for (let i = 0; i < 8; i++) {
    if (src.kind === 'col' && src.i === i) continue;
    const k = { kind: 'col', i };
    if (!Eng.canMove(st, src, k)) continue;
    if (!st.cols[i].length && src.kind === 'col' && st.cols[src.i].length === ka.length) continue;
    d.push(k);
  }
  return d;
}

const sets = ['/keuzeset-groot.json']
  .filter(f => fs.existsSync(TMP + f)).flatMap(f => JSON.parse(fs.readFileSync(TMP + f, 'utf8')));
const uit = [];
for (const k of sets) {
  const d = doelen(k.st, k.src);
  if (d.length < 2) continue;
  const met = d.map(dst => {
    const t = Eng.clone(k.st); Eng.apply(t, k.src, dst);
    const r = zettenTotWinst(t);
    return { dst, zetten: r.zetten, afleg: aflegNaTienZetten(t) };
  });
  if (met.some(m => m.zetten === null)) continue;
  uit.push({ st: k.st, src: k.src, met });
}
fs.writeFileSync(TMP + '/oplevering-groot.json', JSON.stringify(uit));
console.log('momenten met een volledige meting: ' + uit.length + ' (van ' + sets.length + ')');
const spreiding = uit.map(u => Math.max(...u.met.map(m => m.zetten)) - Math.min(...u.met.map(m => m.zetten)));
console.log('verschil in zetten tussen beste en slechtste plek: gemiddeld ' +
  Math.round(spreiding.reduce((a, b) => a + b, 0) / Math.max(1, spreiding.length)) + ', grootste ' + Math.max(0, ...spreiding));
