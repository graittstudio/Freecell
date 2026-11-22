/* Welk werkbudget per tik levert de beste keuze op, en wat kost dat? */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const sets = ['/keuzeset.json', '/keuzeset-leeg.json', '/keuzeset-groot.json']
  .filter(f => fs.existsSync(TMP + f))
  .flatMap(f => JSON.parse(fs.readFileSync(TMP + f, 'utf8')));
const bron = fs.readFileSync('D:/claude/freecell/js/engine.js', 'utf8');
const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;

console.log('momenten: ' + sets.length);
console.log('');
console.log('budget'.padEnd(10) + 'raak'.padEnd(10) + 'werk'.padEnd(8) + 'gemiddeld ms'.padEnd(14) + 'traagste ms');
for (const budget of [0, 300, 800, 1500, 3000, 6000]) {
  const code = budget === 0
    ? bron.replace(/var BEAM_DIEPTE = \d+, BEAM_BREEDTE = \d+;/, 'var BEAM_DIEPTE = 0, BEAM_BREEDTE = 12;')
    : bron.replace(/var BEAM_BUDGET = \d+;/, 'var BEAM_BUDGET = ' + budget + ';');
  const Eng = new Function(code + '; return Eng;')();
  let goed = 0, som = 0, best = 0, totaal = 0, traagste = 0;
  for (const k of sets) {
    const t0 = process.hrtime.bigint();
    const keus = Eng.autoTarget(Eng.clone(k.st), k.src);
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    totaal += ms; if (ms > traagste) traagste = ms;
    const laag = Math.min(...k.met.map(x => x.kosten)), hoog = Math.max(...k.met.map(x => x.kosten));
    const m = k.met.find(x => zelfde(x.dst, keus));
    const kosten = m ? m.kosten : hoog;
    if (kosten === laag) goed++;
    som += kosten; best += laag;
  }
  console.log(String(budget || 'geen').padEnd(10) + (goed + '/' + sets.length).padEnd(10) +
    String(Math.round(som / sets.length)).padEnd(8) + (totaal / sets.length).toFixed(1).padEnd(14) + traagste.toFixed(0));
}
console.log('');
console.log('beste haalbaar: ' + Math.round(sets.reduce((s, k) => s + Math.min(...k.met.map(x => x.kosten)), 0) / sets.length));
