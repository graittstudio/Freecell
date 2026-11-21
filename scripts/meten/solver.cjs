/* Kleine FreeCell-solver, alleen als meetlat: is deze stand nog te winnen? */
const fs = require('fs');

function laadEngine(pad) {
  const deal = fs.readFileSync('D:/claude/freecell/js/deal.js', 'utf8');
  const eng = fs.readFileSync(pad, 'utf8');
  return new Function(deal + '\n' + eng + '\n; return {Deal: Deal, Eng: Eng};')();
}

function sleutel(st) {
  const kol = st.cols.map(c => c.join(',')).sort().join('|');
  const cel = st.free.filter(c => c !== null && c !== 'X').sort((a, b) => a - b).join(',');
  const fnd = st.found.map(f => f.length).join(',');
  return kol + '#' + cel + '#' + fnd;
}

/* Legt alles af wat sowieso veilig is; dat verkleint de zoekruimte enorm. */
function veiligAfleggen(Eng, st) {
  let ging = true;
  while (ging) {
    ging = false;
    const m = Eng.safeMoves(st);
    if (m.length) { Eng.apply(st, m[0].src, m[0].dst); ging = true; }
  }
  return st;
}

function oplosbaar(Eng, start, maxKnopen = 60000) {
  const begin = veiligAfleggen(Eng, Eng.clone(start));
  if (Eng.won(begin)) return { winst: true, knopen: 0 };
  const gezien = new Set([sleutel(begin)]);
  const stapel = [begin];
  let knopen = 0;
  while (stapel.length) {
    if (++knopen > maxKnopen) return { winst: null, knopen };      // niet uitgezocht
    const st = stapel.pop();
    const zetten = Eng.allMoves(st)
      .map(z => {
        const t = veiligAfleggen(Eng, Eng.clone(st));
        if (!Eng.apply(t, z.src, z.dst)) return null;
        veiligAfleggen(Eng, t);
        return { t, w: Eng.bordWaarde(t) };
      })
      .filter(Boolean)
      .sort((a, b) => a.w - b.w);                                   // beste bovenop de stapel
    for (const { t } of zetten) {
      if (Eng.won(t)) return { winst: true, knopen };
      const k = sleutel(t);
      if (gezien.has(k)) continue;
      gezien.add(k);
      stapel.push(t);
    }
  }
  return { winst: false, knopen };
}

module.exports = { laadEngine, oplosbaar, veiligAfleggen, sleutel };

if (require.main === module) {
  const { Deal, Eng } = laadEngine('D:/claude/freecell/js/engine.js');
  for (const nr of [1, 617, 39911, 11982]) {
    const st = Eng.create(nr, 4);
    const t0 = Date.now();
    const r = oplosbaar(Eng, st, 120000);
    console.log('spel #' + nr + ': ' +
      (r.winst === true ? 'te winnen' : r.winst === false ? 'NIET te winnen' : 'onbeslist') +
      '  (' + r.knopen + ' standen, ' + (Date.now() - t0) + ' ms)');
  }
}
