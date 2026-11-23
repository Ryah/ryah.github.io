/* Structural recovery only. Never execute pasted markup. */
export function createEngine(contract) {
 const schema=contract.schema, known=[...new Set(Object.values(schema).flat().concat('internal_states','loc_load'))];
 schema['state:locations']=[...schema['state:locations'],'loc_load']; schema.loc_load=schema.loc_rend;
 const clean=s=>s.replace(/\u2800/g,' ');
 const distance=(a,b)=>{let r=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){let q=[i+1];for(let j=0;j<b.length;j++)q.push(Math.min(q[j]+1,r[j+1]+1,r[j]+(a[i]!==b[j])));r=q;}return r[b.length];};
 function repair(input){
  const changes=[],warnings=[];
  const first=/<\s*(?:internal_states|state\s*:\s*[\w]+|ent_off|ent_on)\s*>/i.exec(input);
  if(!first) return {error:'No Internal States tags found. Paste the raw response, not the rendered panels.'};
  const start=first.index; const endMatches=[...input.matchAll(/<\s*\/\s*internal_states\s*>/gi)];
  let end=endMatches.find(m=>m.index>=start);end=end?end.index+end[0].length:input.length;
  if(!endMatches.length){let tail=/<\s*\/\s*state\s*:\s*vent\s*>/i.exec(input.slice(start));if(tail)end=start+tail.index+tail[0].length;}
  if(endMatches.filter(m=>m.index>=start).length>1 || [...input.matchAll(/<\s*internal_states\s*>/gi)].length>1)return {error:'Multiple state envelopes found. Paste one response at a time so no state block is overwritten.'};
  const source=input.slice(start,end),root={tag:'root',children:[]},stack=[root];let last=0;
  const log=(message)=>changes.push(message);
  const closeMissing=()=>{const n=stack.at(-1);if(!n.children.some(c=>c.tag)){const t=n.children.at(-1);if(t?.text!==undefined)t.text=t.text.replace(/\r?\n[ \t\u2800]*$/,'');}stack.pop();};
  const tokens=[...source.matchAll(/<\s*(\/?)\s*([\w: -]+?)\s*>/g)];
  for(const m of tokens){
   let parent=stack.at(-1),between=source.slice(last,m.index); if(between)parent.children.push({text:between});
   let close=!!m[1],raw=m[2],tag=raw.replace(/\s*:\s*/g,':').trim();
   const exact=known.find(k=>k.toLowerCase()===tag.toLowerCase());
   if(exact)tag=exact;
   else if(close && stack.length>1){tag=stack.at(-1).tag;warnings.push(`Inferred closing tag </${raw}> as </${tag}>. Review this repair.`);}
   else {const candidates=(schema[parent.tag]||known).map(k=>[k,distance(tag.toLowerCase(),k.toLowerCase())]).sort((a,b)=>a[1]-b[1]);if(candidates[0]?.[1]<=2 && candidates[0][1]< (candidates[1]?.[1]??99))tag=candidates[0][0];else{parent.children.push({text:m[0]});warnings.push(`Unrecognized tag ${m[0]} retained. Edit it in Output if needed.`);last=m.index+m[0].length;continue;}}
   if(tag!==raw)log(`Renamed ${close?'</':'<'}${raw}> to ${close?'</':'<'}${tag}>.`);
   if(close){let idx=stack.map(n=>n.tag).lastIndexOf(tag);if(idx<1){if(stack.length>1 && !schema[stack.at(-1).tag]){log(`Matched </${raw}> to <${stack.at(-1).tag}>.`);stack.pop();}else{parent.children.push({text:m[0]});warnings.push(`Unmatched </${raw}> retained.`);}}else{while(stack.length-1>idx){log(`Added missing </${stack.at(-1).tag}>.`);closeMissing();}stack.pop();}}
   else {
    // A new sibling closes an unfinished leaf or record, using the template's parent rules.
    if(parent!==root && !(schema[parent.tag]||[]).includes(tag)){
     let idx=-1;for(let i=stack.length-2;i>=0;i--)if((schema[stack[i].tag]||[]).includes(tag)){idx=i;break;}
     if(idx>=0)while(stack.length-1>idx){log(`Added missing </${stack.at(-1).tag}> before <${tag}>.`);closeMissing();}
     else if(!schema[parent.tag]){log(`Added missing </${parent.tag}>.`);closeMissing();}
    }
    const node={tag,children:[]};stack.at(-1).children.push(node);stack.push(node);
   }
   last=m.index+m[0].length;
  }
  if(last<source.length)stack.at(-1).children.push({text:source.slice(last)});
  while(stack.length>1){log(`Added missing </${stack.at(-1).tag}> at end. Confirm the paste was complete.`);stack.pop();}
  // Drop only whitespace between structural tags, retaining text values exactly.
  function tidy(n){if(!n.children)return;const has=n.children.some(c=>c.tag);if(has)n.children=n.children.filter(c=>c.tag||clean(c.text).trim());const order=schema[n.tag];if(order&&n.children.every(c=>c.tag&&order.includes(c.tag))){const sorted=[...n.children].sort((a,b)=>order.indexOf(a.tag)-order.indexOf(b.tag));if(sorted.some((c,i)=>c!==n.children[i])){n.children=sorted;log(`Restored template field order inside <${n.tag}>.`);}}n.children.forEach(tidy);}
  tidy(root);
  return {root,prefix:input.slice(0,start),suffix:input.slice(end),changes,warnings,original:input};
 }
 const serialize=(n,level=0)=>n.text!==undefined?n.text:n.tag==='root'?n.children.map(c=>serialize(c,0)).join('\n'):!n.children.some(c=>c.tag)?`<${n.tag}>${n.children.map(c=>serialize(c)).join('')}</${n.tag}>`:`<${n.tag}>\n${n.children.map(c=>'  '.repeat(level+1)+serialize(c,level+1)).join('\n')}\n${'  '.repeat(level)}</${n.tag}>`;
 function walk(n,fn){if(n.tag)fn(n);n.children?.forEach(c=>walk(c,fn));}
 const required={ 'state:world':['ct','loc','time','weather','room','user_pos','entries','obstacles','audio','pacing'],ent_on:['name','parrott','residualMood','tfdy','salience','agenda','why','end','move'],ent_off:['name','loc','agenda','why','goal','end','mood','tfdy','salience'],ent_col:['name','fontColor','look','voice','persona','private'],ent_think:['name','tQ1','tQ2','tQ3','tQ4','tQ5'],'state:arc':['info','timeline','ki','sho','ten','ketsu'],'state:chekhov':['chamber','locked','fired'],'state:inv':['inv','titles','status'],'state:story_notes':['threads','seeds','motives','horizon','GremlinNote','heckle']};
 const scopes={'06 - Tabs - World':'state:world','08 - Contents - On-Screen':'ent_on','10 - Contents - Off-Screen':'ent_off','18 - Contents - Entity State':'ent_col','21 - Contents - Thoughts':'ent_think','24 - Contents - Dam':'ent_dam','27 - Contents - Pair':'pair','36 - Contents - Arc':'state:arc','39 - Contents - Chekhov':'state:chekhov','42 - Contents - Inventory':'state:inv','45 - Contents - Story Notes':'state:story_notes'};
 function validate(doc){const issues=[];const text=clean(serialize(doc.root));const checks=contract.patterns.map(p=>{const rx=()=>new RegExp(p.pattern,p.flags.replace('g',''));let nodes=[];walk(doc.root,n=>{if(n.tag===scopes[p.name]&&(n.tag!=='pair'||n.children.some(c=>c.tag==='names')))nodes.push(n);});const failed=nodes.filter(n=>!rx().test(clean(serialize(n))));return {name:p.name,pass:scopes[p.name]?nodes.length>0&&!failed.length:rx().test(text),total:nodes.length,failed:failed.length,absent:!!scopes[p.name]&&!nodes.length};});
  walk(doc.root,n=>{if(!schema[n.tag])return;const expected=schema[n.tag];const children=n.children.filter(c=>c.tag);const missing=expected.filter(t=>!children.some(c=>c.tag===t));
   if(missing.length)issues.push({node:n,missing,message:`${n.tag}: absent ${missing.join(', ')}. Add only what this record needs.`});
  });return {issues,checks};}
 return {repair,serialize,validate,schema,walk,clean,required};
}
