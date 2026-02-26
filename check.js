const fs = require('fs');
const c = fs.readFileSync('d:/Code/jianmei/index.html', 'utf8');
const marker = 'type="module">';
const s = c.indexOf(marker) + marker.length;
const e = c.lastIndexOf('</script>');
const code = c.slice(s, e);
const consts = code.match(/const \w+ =/g) || [];
const seen = {}, dups = [];
consts.forEach(x => {
  const n = x.match(/const (\w+)/)[1];
  if (seen[n]) dups.push(n); else seen[n] = 1;
});
if (dups.length) console.log('DUPLICATE CONSTS:', dups.join(', '));
else console.log('No duplicate consts found');

try { new Function(code); console.log('Syntax OK'); }
catch(e2) { console.log('SYNTAX ERROR:', e2.message); }
