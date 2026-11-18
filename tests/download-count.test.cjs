const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../assets/download-count.js'),'utf8');
const urls=['shared.json','st-regex.json','lumi.json','lumi-regex.json','shared.json','tavo.zip'].map(name=>'https://github.com/example/vexa/releases/download/v1/'+name);
const names=[...new Set(urls.map(u=>decodeURIComponent(new URL(u).pathname.split('/').at(-1))))];
const assets=names.map((name,i)=>({name,download_count:(i+1)*10}));
async function run({storage=new Map(),response=assets,fail=false,blocked=false,links=urls,counters=1}={}){
  const section={querySelectorAll:()=>links.map(href=>({href}))};
  const nodes=Array.from({length:counters},()=>{const total={textContent:''},note={textContent:''};return {hidden:true,title:'',total,note,
    closest:()=>section,querySelector:selector=>selector==='[data-download-total]'?total:note};});
  let calls=0;
  await vm.runInNewContext(source,{document:{querySelectorAll:()=>nodes},URL,Intl,AbortController,setTimeout,clearTimeout,
    localStorage:{getItem:key=>{if(blocked)throw Error('blocked');return storage.get(key)||null;},setItem:(key,value)=>{if(blocked)throw Error('blocked');storage.set(key,value);}},
    fetch:async()=>{calls++;if(fail)return {ok:false,status:429};return {ok:true,json:async()=>({assets:response})};}});
  return {nodes,calls,storage};
}
test('shared ST/Tavo asset counted once; same release fetched once for multiple counters',async()=>{
  const {nodes,calls}=await run({counters:2});assert.equal(calls,1);
  for(const n of nodes){assert.equal(n.total.textContent,'150');assert.equal(n.hidden,false);}
});
test('fresh cache reused and future link changes invalidate it',async()=>{
  const first=await run();assert.equal((await run({storage:first.storage,fail:true})).calls,0);
  const changed=await run({storage:first.storage,links:urls.map(u=>u.replace('/v1/','/v2/'))});assert.equal(changed.calls,1);
});
test('expired count is clearly marked when GitHub is rate-limited',async()=>{
  const first=await run();const key=[...first.storage.keys()][0],record=JSON.parse(first.storage.get(key));record.at-=6*60*1000;first.storage.set(key,JSON.stringify(record));
  const {nodes,calls}=await run({storage:first.storage,fail:true});assert.equal(calls,1);assert.equal(nodes[0].total.textContent,'150');assert.match(nodes[0].note.textContent,/last available/);
});
test('network failures and missing assets never display a false zero or partial total',async()=>{
  for(const opts of [{fail:true},{response:assets.slice(1)}])assert.equal((await run(opts)).nodes[0].hidden,true);
});
test('blocked storage still displays live counts, including a legitimate zero',async()=>{
  const {nodes}=await run({blocked:true,response:assets.map(a=>({...a,download_count:0}))});assert.equal(nodes[0].hidden,false);assert.equal(nodes[0].total.textContent,'0');
});
