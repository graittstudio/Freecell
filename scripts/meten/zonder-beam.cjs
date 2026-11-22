/* Varianten rond versie 1.7.0 (zonder vooruitkijken), gemeten op zetten. */
const fs = require('fs');
const { execSync } = require('child_process');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const data = JSON.parse(fs.readFileSync(TMP + '/oplevering.json', 'utf8'));
if (!fs.existsSync(TMP + '/engine-1.7.0.js'))
  fs.writeFileSync(TMP + '/engine-1.7.0.js', execSync('git -C D:/claude/freecell show 2b4a768:js/engine.js').toString());
const basis = fs.readFileSync(TMP + '/engine-1.7.0.js', 'utf8');
const zelfde = (a, b) => a && b && a.kind === b.kind && a.i === b.i;

function meet(code, naam) {
  const Eng = new Function(code + '; return Eng;')();
  let beste = 0, zetten = 0, afleg = 0;
  for (const k of data) {
    const keus = Eng.autoTarget(Eng.clone(k.st), k.src);
    const laag = Math.min(...k.met.map(m => m.zetten)), hoog = Math.max(...k.met.map(m => m.zetten));
    const m = k.met.find(x => zelfde(x.dst, keus)) || { zetten: hoog, afleg: 0 };
    if (m.zetten === laag) beste++;
    zetten += m.zetten; afleg += m.afleg;
  }
  const n = data.length;
  console.log(naam.padEnd(34) + (beste + '/' + n).padEnd(10) + String(Math.round(zetten / n)).padEnd(10) + (afleg / n).toFixed(2));
  return Math.round(zetten / n);
}

console.log('momenten: ' + data.length);
console.log('');
console.log('variant'.padEnd(34) + 'kortste   zetten    afgelegd');
meet(basis, '1.7.0 zoals nu live');
for (const g of [120, 250]) meet(basis.replace(/w \+= st\.found\[i\]\.length \* 60;/, 'w += st.found[i].length * ' + g + ';'), '  afleggen x' + g);
for (const g of [25, 80]) meet(basis.replace(/w \+= emptyCols\(st\) \* 50;/, 'w += emptyCols(st) * ' + g + ';'), '  lege kolom x' + g);
for (const g of [10, 40]) meet(basis.replace(/w \+= 25;  \/\/ nette reeks/, 'w += ' + g + ';  // nette reeks')
  .replace(/\) w \+= 25;$/m, ') w += ' + g + ';'), '  nette reeks x' + g);
for (const g of [5, 20]) meet(basis.replace(/w -= last \* 10;/, 'w -= last * ' + g + ';'), '  begraven x' + g);
const laagste = Math.min(...data.map(k => Math.min(...k.met.map(m => m.zetten))));
console.log('');
console.log('kortst haalbaar gemiddeld: ' + Math.round(data.reduce((s, k) => s + Math.min(...k.met.map(m => m.zetten)), 0) / data.length));
