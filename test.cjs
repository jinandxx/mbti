// Run with: node test.cjs (Node.js is only needed for development checks.)
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function query(selector) { return selector === '.screen' ? ['start-screen','question-screen','result-screen'].map(id => { if(!elements.has(id)) elements.set(id,element()); const el=elements.get(id); el.id=id; return el; }) : []; }
function element() { return {hidden:false,style:{},classList:{add(){},remove(){}},setAttribute(){},addEventListener(type,fn){this[type]=fn;},replaceChildren(...children){this.children=children;},append(){},focus(){},select(){}}; }
const context = vm.createContext({document:{getElementById(id){if(!elements.has(id)) elements.set(id,element());return elements.get(id);},querySelectorAll:query,createElement:element,createTextNode:t=>t},window:{scrollTo(){}},localStorage:{getItem(){return null;},setItem(){}},setTimeout:fn=>{context.pending=fn;return 1;},clearTimeout(){},navigator:{},location:{protocol:'file:'},console});
vm.runInContext(fs.readFileSync('data.js','utf8')+'\n'+fs.readFileSync('script.js','utf8'),context);
vm.runInContext(`
  if(QUESTIONS.length !== 16 || Object.keys(RESULTS).length !== 16) throw Error('Missing data');
  for(const pair of ['EI','SN','TF','JP']) {
    if(QUESTIONS.filter(q=>pair.includes(q.options[0].code)).length !== 4) throw Error('Unbalanced dimensions');
  }
  globalThis.found = new Set();
  for(let mask=0;mask<65536;mask++) {
    const values=Array.from({length:16},(_,i)=>(mask>>i)&1);
    const value=calculate(values);
    if(!RESULTS[value.code] || value.power<0 || value.power>100) throw Error('Invalid result');
    found.add(value.code);
  }
  start();
`,context);
assert.equal(context.found.size,16);
for(let i=0;i<16;i++) { vm.runInContext('choose(0,document.createElement("button"))',context);context.pending(); }
assert.equal(elements.get('result-screen').hidden,false);
assert.equal(elements.get('question-screen').hidden,true);
vm.runInContext('start()',context);
assert.equal(elements.get('question-screen').hidden,false);
assert.match(elements.get('question-count').textContent,/01 \/ 16/);
vm.runInContext('choose(1,document.createElement("button"))',context);context.pending();
elements.get('back-button').click();
assert.match(elements.get('question-count').textContent,/01 \/ 16/);
console.log('PASS: 65,536 answer combinations, 16 result types, full flow, restart, and previous question.');
