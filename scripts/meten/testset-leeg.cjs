/* Zelfde opzet, maar nu gericht op standen waar een lege kolom meedoet. */
const fs = require('fs');
const TMP = __dirname.split(String.fromCharCode(92)).join('/');
const { laadEngine } = require(TMP + '/solver.cjs');
const { Eng } = laadEngine('D:/claude/freecell/js/engine.js');

function neutraal(st){let w=0;for(let i=0;i<4;i++)w+=st.found[i].length*100;for(let i=0;i<8;i++){const c=st.cols[i];if(!c.length){w+=60;continue;}for(let j=0;j<c.length;j++){const r=(c[j]%13)+1;if(r<=4)w-=(c.length-1-j)*12;}}for(let i=0;i<4;i++)if(st.free[i]===null)w+=25;return w;}
const sleutel=(st)=>st.cols.map(c=>c.join(',')).sort().join('|')+'#'+st.free.filter(c=>c!==null&&c!=='X').sort((a,b)=>a-b).join(',')+'#'+st.found.map(f=>f.length).join(',');
function veilig(st){let g=true;while(g){g=false;const m=Eng.safeMoves(st);if(m.length){Eng.apply(st,m[0].src,m[0].dst);g=true;}}return st;}
function inspanning(start,max){const b=veilig(Eng.clone(start));if(Eng.won(b))return 1;const z=new Set([sleutel(b)]);const s=[b];let k=0;
  while(s.length){if(++k>max)return null;const st=s.pop();const kid=[];for(const m of Eng.allMoves(st)){const t=Eng.clone(st);if(!Eng.apply(t,m.src,m.dst))continue;veilig(t);if(Eng.won(t))return k;const key=sleutel(t);if(z.has(key))continue;z.add(key);kid.push({t,w:neutraal(t)});}kid.sort((a,b)=>a.w-b.w).forEach(x=>s.push(x.t));}
  return null;}
function doelen(st,src){const d=[],ka=Eng.cardsOf(st,src);if(ka.length===1){const f={kind:'found',i:Eng.suit(ka[0])};if(Eng.canMove(st,src,f))d.push(f);}
  for(let i=0;i<8;i++){if(src.kind==='col'&&src.i===i)continue;const k={kind:'col',i};if(!Eng.canMove(st,src,k))continue;if(!st.cols[i].length&&src.kind==='col'&&st.cols[src.i].length===ka.length)continue;d.push(k);}return d;}

const set = [], gezien = new Set();
for (let n = 0; n < 300 && set.length < 25; n++) {
  let st = Eng.create(200 + n * 61, 4);
  const standen = new Set();
  for (let stap = 0; stap < 70 && set.length < 25; stap++) {
    const sl = sleutel(st);
    if (standen.has(sl)) break;
    standen.add(sl);
    const heeftLeeg = st.cols.some(c => !c.length);
    if (heeftLeeg) {
      let perStand = 0;
      const bronnen = [];
      for (let i = 0; i < 8; i++) for (let j = 0; j < st.cols[i].length; j++) if (Eng.runLength(st, i, j) > 0) bronnen.push({ kind: 'col', i, idx: j });
      for (let i = 0; i < 4; i++) if (st.free[i] !== null && st.free[i] !== 'X') bronnen.push({ kind: 'free', i });
      for (const src of bronnen) {
        const d = doelen(st, src);
        if (d.length < 2) continue;
        if (!d.some(x => x.kind === 'col' && !st.cols[x.i].length)) continue;    // moet een lege kolom als keuze hebben
        const id = sl + '@' + JSON.stringify(src);
        if (gezien.has(id)) continue;
        const met = d.map(dst => { const t = Eng.clone(st); Eng.apply(t, src, dst); return { dst, kosten: inspanning(t, 60000) }; });
        if (met.some(m => m.kosten === null)) continue;
        const laag = Math.min(...met.map(m => m.kosten)), hoog = Math.max(...met.map(m => m.kosten));
        if (hoog < laag * 1.25) continue;
        gezien.add(id);
        set.push({ deal: 200 + n * 61, stap, st: JSON.parse(JSON.stringify(Eng.clone(st))), src, met });
        if (++perStand >= 2) break;
      }
    }
    let m;
    if ((n + stap) % 2 === 0) m = Eng.bestMove(st, null);
    else { const alle = Eng.allMoves(st); m = alle.length ? alle[(stap * 7 + n * 13) % alle.length] : null; }
    if (!m) break;
    Eng.apply(st, m.src, m.dst);
    if (Eng.won(st)) break;
  }
}
fs.writeFileSync(TMP + '/keuzeset-leeg.json', JSON.stringify(set));
console.log('keuzemomenten met een lege kolom in het spel: ' + set.length);
