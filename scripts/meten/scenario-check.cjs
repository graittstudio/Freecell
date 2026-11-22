/* Voor de negen gerichte situaties: wat zegt de solver dat het beste is? */
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');
const S = { s: 0, h: 1, r: 2, k: 3 };
const kaart = (kl, w) => S[kl] * 13 + (w - 1);
const kn = (c) => ['A','2','3','4','5','6','7','8','9','10','B','V','H'][c % 13] + ['♠','♥','♦','♣'][Math.floor(c / 13)];
const sl = (st) => st.cols.map(c => c.join(',')).sort().join('|') + '#' +
  st.free.filter(c => c !== null && c !== 'X').sort((a, b) => a - b).join(',') + '#' + st.found.map(f => f.length).join(',');
function veilig(st) { let g = true; while (g) { g = false; const m = Eng.safeMoves(st); if (m.length) { Eng.apply(st, m[0].src, m[0].dst); g = true; } } return st; }
function neutraal(st) { let w = 0; for (let i = 0; i < 4; i++) w += st.found[i].length * 100;
  for (let i = 0; i < 8; i++) { const c = st.cols[i]; if (!c.length) { w += 60; continue; }
    for (let j = 0; j < c.length; j++) { const r = (c[j] % 13) + 1; if (r <= 4) w -= (c.length - 1 - j) * 12; } }
  for (let i = 0; i < 4; i++) if (st.free[i] === null) w += 25; return w; }
function kosten(start, max = 200000) {
  const b = veilig(Eng.clone(start)); if (Eng.won(b)) return 1;
  const z = new Set([sl(b)]); const stapel = [b]; let k = 0;
  while (stapel.length) { if (++k > max) return null; const st = stapel.pop(); const kid = [];
    for (const m of Eng.allMoves(st)) { const t = Eng.clone(st); if (!Eng.apply(t, m.src, m.dst)) continue; veilig(t);
      if (Eng.won(t)) return k; const key = sl(t); if (z.has(key)) continue; z.add(key); kid.push({ t, w: neutraal(t) }); }
    kid.sort((a, b) => a.w - b.w).forEach(x => stapel.push(x.t)); }
  return null; }

/* Realistischer versies van de scenario's: kolommen met echte vulling,
   zodat het bord niet half leeg is. */
function stand(kolommen, opties = {}) {
  return { deal: 1, cells: 4, free: opties.free || [null, null, null, null],
    found: opties.found || [[], [], [], []], cols: kolommen, moves: 0, score: 0, undos: 0, hints: 0 };
}
const vulling = [
  [kaart('k',13), kaart('r',12), kaart('s',11)],
  [kaart('h',13), kaart('k',12), kaart('r',11)],
  [kaart('s',13), kaart('h',12), kaart('k',11)],
  [kaart('r',13), kaart('s',12), kaart('h',11)]
];
const gevallen = [
  { naam: 'twee zevens: nette reeks of rommelkolom',
    st: stand([[kaart('k',13), kaart('h',6)],
               [kaart('r',9), kaart('s',8), kaart('h',9), kaart('s',7)],
               [kaart('h',13), kaart('r',4), kaart('k',10), kaart('h',3), kaart('r',10), kaart('s',2), kaart('h',12), kaart('k',7)],
               vulling[0], vulling[1], vulling[2], vulling[3], [kaart('s',9), kaart('h',4), kaart('k',3)]]),
    src: { kind: 'col', i: 0, idx: 1 } },
  { naam: 'linkse zeven kan zelf worden afgelegd',
    st: stand([[kaart('k',13), kaart('h',6)], [kaart('s',7)], [kaart('h',13), kaart('k',7)],
               vulling[0], vulling[1], vulling[2], vulling[3], [kaart('s',9), kaart('h',4)]],
              { found: [[0,1,2,3,4,5], [], [], []] }),
    src: { kind: 'col', i: 0, idx: 1 } },
  { naam: 'lege kolom tegenover een passende zeven',
    st: stand([[kaart('k',13), kaart('h',6)], [], [kaart('s',7), kaart('h',2)],
               vulling[0], vulling[1], vulling[2], vulling[3], [kaart('s',9), kaart('h',4)]]),
    src: { kind: 'col', i: 0, idx: 1 } },
  { naam: 'reeks van drie: lege kolom of passende negen',
    st: stand([[kaart('k',13), kaart('h',8), kaart('s',7), kaart('r',6)], [], [kaart('k',9), kaart('h',2)],
               vulling[0], vulling[1], vulling[2], vulling[3], [kaart('s',9), kaart('h',4)]]),
    src: { kind: 'col', i: 0, idx: 1 } }
];
function doelen(st, src) { const d = [], ka = Eng.cardsOf(st, src);
  if (ka.length === 1) { const f = { kind: 'found', i: Eng.suit(ka[0]) }; if (Eng.canMove(st, src, f)) d.push(f); }
  for (let i = 0; i < 8; i++) { if (src.kind === 'col' && src.i === i) continue; const k = { kind: 'col', i };
    if (!Eng.canMove(st, src, k)) continue;
    if (!st.cols[i].length && src.kind === 'col' && st.cols[src.i].length === ka.length) continue; d.push(k); }
  return d; }
const naam = (st, d) => d.kind === 'found' ? 'aflegstapel'
  : 'kolom ' + (d.i + 1) + (st.cols[d.i].length ? ' (op ' + kn(st.cols[d.i][st.cols[d.i].length - 1]) + ')' : ' LEEG');
const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;

for (const g of gevallen) {
  const d = doelen(g.st, g.src);
  const keus = Eng.autoTarget(Eng.clone(g.st), g.src);
  console.log('\n' + g.naam + '  (' + Eng.cardsOf(g.st, g.src).map(kn).join(' ') + ')');
  let laagste = Infinity;
  const met = d.map(dst => { const t = Eng.clone(g.st); Eng.apply(t, g.src, dst); const k = kosten(t); if (k !== null && k < laagste) laagste = k; return { dst, k }; });
  met.forEach(m => console.log('   ' + naam(g.st, m.dst).padEnd(22) + ' kosten ' + String(m.k === null ? 'te diep' : m.k).padStart(8) +
    (m.k === laagste ? '  <= beste' : '') + (zelfde(m.dst, keus) ? '   [het spel kiest dit]' : '')));
}
