/* Welke manier van kiezen levert de minste zetten en de meeste afgelegde
   kaarten op? Gemeten met oplevering.json (zetten tot winst per plek). */
const fs = require('fs');
const { execSync } = require('child_process');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const data = ['/oplevering.json', '/oplevering-groot.json']
  .filter(f => fs.existsSync(TMP + f)).flatMap(f => JSON.parse(fs.readFileSync(TMP + f, 'utf8')));
const bron = fs.readFileSync('D:/claude/freecell/js/engine.js', 'utf8');
for (const [b, c] of [['engine-1.6.0.js', 'c61e2e3'], ['engine-1.7.0.js', '2b4a768']])
  if (!fs.existsSync(TMP + '/' + b))
    fs.writeFileSync(TMP + '/' + b, execSync('git -C D:/claude/freecell show ' + c + ':js/engine.js').toString());

const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;
function meet(Eng, naam) {
  let beste = 0, zetten = 0, afleg = 0, besteZetten = 0, slechtste = 0;
  for (const k of data) {
    const keus = Eng.autoTarget(Eng.clone(k.st), k.src);
    const laag = Math.min(...k.met.map(m => m.zetten));
    const hoog = Math.max(...k.met.map(m => m.zetten));
    const m = k.met.find(x => zelfde(x.dst, keus)) || { zetten: hoog, afleg: 0 };
    if (m.zetten === laag) beste++;
    zetten += m.zetten; afleg += m.afleg; besteZetten += laag; slechtste += hoog;
  }
  const n = data.length;
  console.log(naam.padEnd(32) + (beste + '/' + n).padEnd(10) +
    String(Math.round(zetten / n)).padEnd(10) + (afleg / n).toFixed(1));
  return { zetten: Math.round(zetten / n), besteZetten: Math.round(besteZetten / n), slechtste: Math.round(slechtste / n) };
}

console.log('momenten: ' + data.length);
console.log('');
console.log('manier van kiezen'.padEnd(32) + 'kortste  zetten'.padEnd(20) + 'afgelegd na 10 zetten');
const v16 = laadEngine(TMP + '/engine-1.6.0.js').Eng;
const v17 = laadEngine(TMP + '/engine-1.7.0.js').Eng;
meet(v16, '1.6.0 (vuistregels)');
meet(v17, '1.7.0 (waardering)');
const nu = meet(laadEngine('D:/claude/freecell/js/engine.js').Eng, 'nu: waardering + vooruitkijken');

/* varianten: hoe zwaar moet afleggen wegen in de waardering? */
for (const gewicht of [60, 120, 250, 500]) {
  const code = bron.replace(/w \+= st\.found\[i\]\.length \* 60;/, 'w += st.found[i].length * ' + gewicht + ';');
  meet(new Function(code + '; return Eng;')(), '  afleggen x' + gewicht);
}
console.log('');
console.log('kortst mogelijk: ' + nu.besteZetten + ' zetten   |   slechtste keuze: ' + nu.slechtste + ' zetten');
