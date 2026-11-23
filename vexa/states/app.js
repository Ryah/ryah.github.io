import {createEngine} from './engine.js';
import {TITLES, INFO, AXES, FIELD_NAME} from './guidance.js';

const $ = s => document.querySelector(s);
const make = (tag, text, cls) => {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
};
let engine, contract, doc, selected, dirty = false;
let fields = new Map(), diagnostics = [], sections = [];
const text = n => (n?.children || []).map(c => c.text ?? '').join('');
const clean = s => engine.clean(s).trim();
const title = n => TITLES[n.tag] || FIELD_NAME(n.tag);
const child = (n, tag) => n.children.find(c => c.tag === tag);
function identity(n) {
  const key = n.children?.find(c => ['name','names','pair','id'].includes(c.tag));
  return key ? clean(text(key)) || 'Unnamed character or place' : title(n);
}
function status(s) { $('#status').textContent = s; }
function insert(parent, tag, value = '') {
  const order = engine.schema[parent.tag] || [];
  const i = parent.children.findIndex(c => c.tag && order.indexOf(c.tag) > order.indexOf(tag));
  const node = {tag, children: value ? [{text:value}] : []};
  parent.children.splice(i < 0 ? parent.children.length : i, 0, node);
  dirty = true;
  return node;
}
function write(n, value) { n.children = [{text:value}]; dirty = true; sync(); }
const scopes = {
  '06 - Tabs - World':'state:world','08 - Contents - On-Screen':'ent_on',
  '10 - Contents - Off-Screen':'ent_off','18 - Contents - Entity State':'ent_col',
  '21 - Contents - Thoughts':'ent_think','24 - Contents - Dam':'ent_dam',
  '27 - Contents - Pair':'pair','36 - Contents - Arc':'state:arc',
  '39 - Contents - Chekhov':'state:chekhov','42 - Contents - Inventory':'state:inv',
  '45 - Contents - Story Notes':'state:story_notes'
};
function diagnose() {
  const issues = [];
  for (const [tag,heading,reason] of [
    ['state:world','The World panel is missing','The display starts by looking for World. Without it, the entire console may stay hidden.'],
    ['state:vent','The console has no finishing section','The display waits for the end of Commentary to know the state block is complete. Without it, the console can stay on its loading screen.']
  ]) if (!sections.some(n => n.tag === tag)) issues.push({kind:'section',tag,heading,reason,
    remedy:'Restore this section with empty fields. Then add any details the story establishes. You do not need to invent missing information.'});
  for (const section of sections) engine.walk(section, n => {
    for (const tag of engine.required[n.tag] || []) if (!child(n,tag)) issues.push({kind:'missing',node:n,tag,section,
      heading:`${identity(n)}: ${FIELD_NAME(tag)} is missing`,
      reason:n === section ? `The ${title(section)} panel reads these fields in a fixed sequence. This field is absent, so the panel cannot read the surrounding details correctly.` : `The ${title(section)} display reads this character’s fields together. One missing field can hide the whole card, even when other characters still appear.`,
      remedy:`${INFO[tag]?.[1] || 'Use an established detail from the story.'} You can also restore this field empty. Its missing container, rather than missing story information, is what breaks this pattern.`});
  });
  for (const pattern of contract.patterns) {
    if (!scopes[pattern.name]) continue;
    for (const section of sections) engine.walk(section, n => {
      if (n.tag !== scopes[pattern.name] || (n.tag === 'pair' && section.tag !== 'state:pair')) return;
      if (new RegExp(pattern.pattern,pattern.flags.replace('g','')).test(engine.clean(engine.serialize(n)))) return;
      if (issues.some(i => i.node === n)) return;
      let tag, reason, remedy;
      if (n.tag === 'ent_col' && child(n,'fontColor')) {
        const color = clean(text(child(n,'fontColor')));
        if (!/^(?:Hex Color:\s*)?(?:(?:cornflower|marigold|jade|orchid|rust|citrine|lilac|seafoam|peach|coral|matcha|electric|periwinkle|fuchsia|mint|blush)\s+)?(?:#[0-9a-f]{6}|cornflower|marigold|jade|orchid|rust|citrine|lilac|seafoam|peach|coral|matcha|electric|periwinkle|fuchsia|mint|blush)$/i.test(color)) {
          tag='fontColor'; reason='The character color is not a recognized palette name or six-digit hex color. That prevents the Character details card from being read.';
          remedy='Restore this character’s established color. Accepted examples: coral, #F26D5B, or coral #F26D5B. Do not choose a new identity color unless you intend to change it.';
        }
      }
      if (n.tag === 'pair' && child(n,'matrix')) {
        const missing = AXES.filter(([emoji]) => !text(child(n,'matrix')).includes(emoji));
        if (missing.length) { tag='matrix'; reason=`The relationship card needs all twelve feelings in order. Missing: ${missing.map(([,label])=>label).join(', ')}.`; remedy='Restore the missing feeling values from an earlier working response. Do not guess them. Advanced saved text is available to restore the complete line.'; }
        else {
          const invalid=AXES.filter(([emoji])=>!new RegExp(`${emoji}\\s*\\[?([+-]?\\d+)\\s*,\\s*([+−-]?\\d+|[+−-])\\]?`).test(engine.clean(text(child(n,'matrix')))));
          if(invalid.length){tag='matrix';reason=`The saved numbers for ${invalid.map(([,label])=>label).join(', ')} cannot be read. Each feeling needs a strength and a change value, separated by a comma.`;remedy='Use the two values from a working response. The saved format is, for example, 🎲[8,-1]: strength 8, change -1. This is a format example, not a suggested value for your character.';}
        }
      }
      if(!tag && ['pair','ent_dam'].includes(n.tag)){
        const tests=n.tag==='pair'?[
          ['names',/↔/,'The two people are no longer linked with the relationship arrow.','Keep both existing names and put ↔ between them.'],
          ['mode',/mode:\s*\[?[a-z-]+/i,'The relationship mode lost its saved label format.','Keep the existing mode and restore its mode: prefix.'],
          ['dam',/E:\s*\[?[a-z]+\]?\s*L:\s*\[?[a-z]+\]?\s*Gate:\s*\[?[a-z-]+/i,'One of the expression channels or the feeling stage is missing its saved prefix.','Restore E: for Emotion, L: for Language, and Gate: for the feeling stage, using the values from a working response.'],
          ['wall',/(?:wall:\s*)?\[?[^<>\]\s]+\]?/,'The conflicting-feelings entry has no readable value.','Use ∅ if the existing state had no conflict, or restore its saved emoji pair.']
        ]:[
          ['pair',/→/,'This directional relationship lost its from-person → to-person arrow.','Keep the established names and place → between them.'],
          ['sluice',/E:\s*\[?[a-z-]+\]?\s*L:\s*\[?[a-z-]+\]?/i,'The Emotion or Language channel is missing its saved prefix.','Use the previous response to restore E:sealed or E:open and L:sealed or L:open.'],
          ['filters',/Soc:\s*\[?(?:hard|cracked|restricted|open|[hcro]|∅)/i,'The Social filter is missing or has an unrecognized setting.','Restore its saved Social setting: hard, cracked, restricted, or open. The saved prefixes are Soc:, Val:, Comp:, and Rel:.'],
          ['misc',/clash:\s*\[?(?:yes|y|no|—|∅)\]?\s*\|\s*T(?:ension)?:\s*\[?(?:yes|y|no|—|∅)/i,'A Clash or Tension flag is missing its saved label or separator.','Restore the established yes/no flags with a | between them, such as clash:no | T:no. Do not change the flags just to fix formatting.']
        ];
        const broken=tests.find(([field,rx])=>!child(n,field)||!rx.test(engine.clean(text(child(n,field)))));
        if(broken){[tag,,reason,remedy]=broken;}
      }
      issues.push({kind:'format',node:n,section,tag,
        heading:`${identity(n)}: ${tag ? FIELD_NAME(tag)+' needs a different format' : 'this card still cannot be read'}`,
        reason:reason || 'The fields are present, but this card still does not match its display pattern. A value may have lost a required separator, arrow, or prefix, or an extra field may interrupt the sequence.',
        remedy:remedy || 'Open this card and compare its guided fields with an earlier working response. The technical check is available in Advanced details. Do not invent story facts to make the check pass.'});
    });
  }
  if (doc.warnings.length) issues.push({kind:'review',heading:'An uncertain formatting repair needs your review',
    reason:'A damaged tag could not be identified with certainty. Its value was kept and a likely closer was used where possible.',
    remedy:'Review Formatting changes. If the guess is wrong, use Advanced text to correct it before copying.'});
  return issues;
}
function reveal(issue) {
  if (issue.kind==='section') return addSection(issue.tag);
  if (issue.kind==='review') { $('#repairs').open=true; $('#repairs').scrollIntoView({block:'center'}); return; }
  openSection(issue.section,issue.node,issue.tag);
}
function sync() {
  if (!doc) return;
  $('#output').value=doc.prefix+engine.serialize(doc.root)+doc.suffix;
  diagnostics=diagnose();
  const blocking=diagnostics.filter(i=>i.kind!=='review');
  $('#health').textContent=blocking.length ? `${blocking.length} display ${blocking.length===1?'problem':'problems'} to fix` : doc.warnings.length ? 'Display checks pass · review the repair' : 'Ready to copy back';
  $('#health').className=blocking.length?'warn':'good';
  $('#issue-count').textContent=blocking.length?'Fix what’s hidden':'Your display checks pass';
  $('#issue-intro').textContent=blocking.length?'Each problem points to the part of the console it can hide. Fix one at a time; known story details can stay as they are.':'The included display patterns can read the present records. Absent optional sections and empty free-text fields are not treated as errors.';
  $('#issues').replaceChildren();
  for (const issue of diagnostics) {
    const card=make('article',undefined,'issue-card');card.append(make('h3',issue.heading),make('p',issue.reason));
    const details=make('details');details.append(make('summary','How to fix it'),make('p',issue.remedy));card.append(details);
    const button=make('button',issue.kind==='section'?'Restore this section':issue.kind==='review'?'Review repair':`Fix ${issue.tag ? FIELD_NAME(issue.tag) : 'this card'}`);
    button.onclick=()=>reveal(issue);card.append(button);$('#issues').append(card);
  }
  $('#issues').hidden=!diagnostics.length;
  for (const button of $('#sections').querySelectorAll('button')) {
    const section=sections.find(n=>n.tag===button.dataset.section), count=diagnostics.filter(i=>i.section===section).length;
    button.textContent=title(section)+(count?` · ${count}`:'');button.classList.toggle('has-error',count>0);
  }
  $('#checks').replaceChildren();
  for (const c of engine.validate(doc).checks) $('#checks').append(make('p',`${c.absent?'Not present':c.pass?'Pass':c.failed?`${c.failed} of ${c.total} records fail`:'Fail'} · ${c.name}`,c.pass?'good':c.absent?'muted':'warn'));
  briefing();$('#copy').disabled=false;$('#export').disabled=false;
}
function briefing() {
  const world=sections.find(n=>n.tag==='state:world');$('#briefing').replaceChildren(make('h3','World'));
  for (const tag of ['loc','time','weather']) {
    const item=world&&child(world,tag), row=make('div',undefined,'brief-line');
    row.append(make('small',FIELD_NAME(tag)),make('span',item?clean(text(item))||'Not recorded':'Missing field'));$('#briefing').append(row);
  }
  const button=make('button','Edit world details');button.onclick=()=>world?openSection(world):addSection('state:world');$('#briefing').append(button);
}
function navigation() {
  $('#sections').replaceChildren();
  for (const section of sections) { const button=make('button',title(section));button.dataset.section=section.tag;button.onclick=()=>openSection(section);$('#sections').append(button); }
}
function openSection(section,target,tag) {
  selected=section;fields=new Map();$('#editor').replaceChildren(make('h2',title(section)));
  $('#section-context').textContent='Edit the details you recognize from the console. Changes update the response you copy; they do not send a message or advance the story.';
  for (const b of $('#sections').querySelectorAll('button')) { if (b.dataset.section===section.tag) b.setAttribute('aria-current','page');else b.removeAttribute('aria-current'); }
  render(section,$('#editor'));
  if (target) {
    const record=target===section?$('#editor'):fields.get(target);
    const wrapper=(tag&&record?.querySelector(`[data-field="${tag}"]`))||record;
    if (wrapper) { let parent=wrapper.parentElement;while(parent&&parent!==document.body){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement;}wrapper.classList.add('focused-fix');wrapper.scrollIntoView({block:'center'});wrapper.querySelector('textarea,input,select,button')?.focus({preventScroll:true}); }
  }
}
function addSection(tag) {
  const parent=doc.root.children.find(n=>n.tag==='internal_states')||doc.root;
  let section=parent.children.find(n=>n.tag===tag);
  if (!section) { section=insert(parent,tag);for(const t of engine.required[tag]||(tag==='state:vent'?['vent']:[]))insert(section,t);sections.push(section);sections.sort((a,b)=>engine.schema.internal_states.indexOf(a.tag)-engine.schema.internal_states.indexOf(b.tag));navigation(); }
  sync();openSection(section);status('Section restored with empty fields. Add established details if you know them; nothing was invented.');
}
function select(options,current,onChange,label) {
  const input=make('select');input.setAttribute('aria-label',label);
  if (!options.some(o=>(Array.isArray(o)?o[0]:o)===current)) options=[['','Not recorded'],...options,...(current?[[current,`Saved value: ${current}`]]:[])];
  for (const item of options) {const [value,label]=Array.isArray(item)?item:[item,item];const option=make('option',label);option.value=value;input.append(option);}
  input.value=current;input.onchange=()=>onChange(input.value);return input;
}
function tokenControls(n,host) {
  const specs={
    sluice:[['Emotion','E',[['sealed','Sealed'],['open','Open']]],['Language','L',[['sealed','Sealed'],['open','Open']]]],
    dam:[['Emotion','E',[['s','Sealed'],['o','Open']]],['Language','L',[['s','Sealed'],['o','Open']]]],
    misc:[['Clash','clash',[['y','Yes'],['—','No'],['yes','Yes (full word)'],['no','No (full word)'],['∅','Not recorded']]],['Tension / unaddressed transgression','T',[['yes','Yes'],['no','No'],['y','Yes (short form)'],['—','No (dash)'],['∅','Not recorded']]]],
    main:[['Story pressure','pressure',[['none','None'],['low','Low'],['high','High'],['vacuum','Vacuum']]]],
    info:[['Focus','focus',[['Entity','Character'],['user','Your character']]],['Your character’s role','user role',[['focus','Focus'],['ally','Ally'],['obstacle','Obstacle'],['witness','Witness'],['rival','Rival']]]],
    filters:[['Social','Soc'],['Values','Val'],['Competence','Comp'],['Relationship','Rel']].map(([label,key])=>[label,key,[['h','Hard'],['c','Cracked'],['r','Restricted'],['o','Open'],['hard','Hard (full word)'],['cracked','Cracked (full word)'],['restricted','Restricted (full word)'],['open','Open (full word)']]])
  };
  if (!specs[n.tag]) return false;
  const group=make('div',undefined,'choice-grid');let count=0;
  for (const [label,key,options] of specs[n.tag]) {
    const alternatives=options.map(([value])=>value).sort((a,b)=>b.length-a.length).join('|');
    const rx=new RegExp(`\\b${key}:[\\s\\u2800]*\\[?(${alternatives})\\]?`,'i');
    const match=text(n).match(rx);if(!match)continue;count++;
    const row=make('label',undefined,'choice');row.append(make('span',label),select(options,match[1],next=>write(n,text(n).replace(rx,(whole,value)=>whole.replace(value,next))),label));group.append(row);
  }
  if(n.tag==='dam'){
    const rx=/\bGate:[\s\u2800]*\[?([a-z-]+)\]?/i, match=text(n).match(rx);
    if(match){count++;const row=make('label',undefined,'choice');row.append(make('span','Feeling stage'),select(['dormant','attentive','aware','longing','open'],match[1],next=>write(n,text(n).replace(rx,(whole,value)=>whole.replace(value,next))),'Feeling stage'));group.append(row);}
  }
  if(count)host.append(group);return count>0;
}
function numericTokens(n,host) {
  if (!['tfdy','salience'].includes(n.tag)) return false;
  const keys=n.tag==='tfdy'?[['T','Tenderness'],['F','Fury'],['D','Dread'],['Y','Yearning'],['IW','Outward warmth']]:[['sal:','Scene importance']];
  const group=make('div',undefined,'feeling-grid');let count=0;
  for (const [key,label] of keys) {
    const rx=new RegExp(`\\b${key}[\\s\\u2800]*([+-]?\\d+)`), match=text(n).match(rx);if(!match)continue;count++;
    const row=make('label',undefined,'choice');row.append(make('span',label));const input=make('input');input.type='number';input.step='1';input.value=match[1];if(n.tag==='tfdy'){input.min='0';input.max='4';}input.setAttribute('aria-label',label);
    input.onchange=()=>{if(input.reportValidity())write(n,text(n).replace(rx,(whole,value)=>whole.replace(value,input.value)));};row.append(input);group.append(row);
  }
  if(count)host.append(group);return count>0;
}
function matrix(n,host) {
  host.append(make('p','Strength is 0–20. Change per turn is the saved drift, not another feeling score.','field-help'));
  const panel=make('div',undefined,'matrix');let count=0;
  for (const [emoji,label] of AXES) {
    const rx=new RegExp(`${emoji}[\\s\\u2800]*\\[([^,]+),([^\\]]+)\\]`), match=text(n).match(rx);if(!match)continue;count++;
    const row=make('div',undefined,'axis'), heading=make('div',undefined,'axis-heading'), output=make('output',match[1]);heading.append(make('span',`${emoji} ${label}`),output);row.append(heading);
    const slider=make('input');slider.type='range';slider.min='0';slider.max='20';slider.step='1';slider.value=match[1];slider.setAttribute('aria-label',`${label} strength`);slider.oninput=()=>{output.textContent=slider.value;write(n,text(n).replace(rx,(_,charge,drift)=>`${emoji}[${slider.value},${drift}]`));};row.append(slider);
    const driftRow=make('label',undefined,'axis-drift');driftRow.append(make('span','Change per turn'));const drift=make('input');drift.type=/^[+−-]?\d+$/.test(match[2])?'number':'text';drift.value=match[2].replace('−','-');drift.setAttribute('aria-label',`${label} change per turn`);drift.onchange=()=>write(n,text(n).replace(rx,(_,charge)=>`${emoji}[${charge},${drift.value}]`));driftRow.append(drift);row.append(driftRow);panel.append(row);
  }
  host.append(panel);return count===12;
}
function field(n,host,parent) {
  const wrapper=make('div',undefined,'field');wrapper.dataset.field=n.tag;
  const label=make('label',FIELD_NAME(n.tag)), id=`field-${fields.size}`;label.htmlFor=id;wrapper.append(label);
  if(INFO[n.tag]?.[1])wrapper.append(make('p',INFO[n.tag][1],'field-help'));
  host.append(wrapper);fields.set({parent,tag:n.tag},wrapper);
  let special=tokenControls(n,wrapper)||numericTokens(n,wrapper)||(n.tag==='matrix'&&(matrix(n,wrapper),true));
  if(n.tag==='beat'){
    const rx=/\b(LOCKED|UNLOCKED|ACTIVE|FIRED)\b/,match=text(n).match(rx);
    if(match){wrapper.append(select([['LOCKED','Locked · conditions not met'],['UNLOCKED','Unlocked · ready'],['ACTIVE','Active · happening now'],['FIRED','Fired · already happened']],match[1],next=>write(n,text(n).replace(rx,next)),'Story beat status'));special=true;}
  }
  let editorHost=wrapper;
  if(special){const details=make('details',undefined,'advanced-field');details.append(make('summary','Advanced saved text'));wrapper.append(details);editorHost=details;label.removeAttribute('for');}
  let input;
  if(n.tag==='pacing')input=select([['SLOW','Slow · let the scene breathe'],['FLOW','Flow · continue normally'],['PUSH','Push · move things forward']],text(n),next=>write(n,next),FIELD_NAME(n.tag));
  else if(['ct','z','active_level'].includes(n.tag)){input=make('input');input.type='number';input.step='1';input.value=clean(text(n));input.oninput=()=>write(n,input.value);}
  else {input=make('textarea');input.rows=text(n).length>160?3:2;const prefix=['mode','wall','intent'].includes(n.tag)?text(n).match(/^([\s\u2800]*(?:mode|wall|intent):[\s\u2800]*)([\s\S]*)$/i):null;input.value=prefix?prefix[2]:text(n);input.oninput=()=>write(n,(prefix?prefix[1]:'')+input.value);}
  input.id=id;input.setAttribute('aria-label',FIELD_NAME(n.tag));if(INFO[n.tag]?.[2])input.placeholder=`Example only: ${INFO[n.tag][2]}`;editorHost.append(input);
  if(special)editorHost.append(make('small',`Saved as <${n.tag}>`,'technical-label'));
}
function missingField(parent,tag,host) {
  const wrapper=make('div',undefined,'field missing-field');wrapper.dataset.field=tag;
  wrapper.append(make('h3',`${FIELD_NAME(tag)} is missing`),make('p',INFO[tag]?.[1]||'Restore this field without changing the rest of the record.','field-help'));
  const input=make('textarea');input.rows=2;input.setAttribute('aria-label',FIELD_NAME(tag));input.placeholder=INFO[tag]?.[2]?`Example only: ${INFO[tag][2]}`:'Leave blank if this detail is unknown.';wrapper.append(input);
  wrapper.append(make('p','This display needs the field to exist, but accepts empty text here. You can fix the formatting without making up an answer.','fix-hint'));
  const restore=make('button','Save this field');restore.onclick=()=>{insert(parent,tag,input.value);sync();openSection(selected,parent,tag);status(`${FIELD_NAME(tag)} restored${input.value?'':' empty'}. Your other values were kept.`);};
  const blank=make('button','Restore empty field','quiet');blank.onclick=()=>{insert(parent,tag);sync();openSection(selected,parent,tag);status(`${FIELD_NAME(tag)} restored empty. You can fill in a story detail later.`);};
  const actions=make('div',undefined,'toolbar');actions.append(restore,blank);wrapper.append(actions);host.append(wrapper);
}
function render(n,host) {
  const children=n.children.filter(c=>c.tag);
  for (const item of children) {
    if(item.children.some(c=>c.tag)||(engine.schema[item.tag]&&!text(item).trim())){
      const details=make('details',undefined,'record');fields.set(item,details);details.append(make('summary',identity(item)));const body=make('div',undefined,'record-body');details.append(body);host.append(details);render(item,body);
      const tools=make('details',undefined,'record-tools');tools.append(make('summary','Manage this record'));const remove=make('button','Remove this record');remove.onclick=()=>{if(confirm(`Remove ${identity(item)} and its saved details?`)){n.children=n.children.filter(c=>c!==item);dirty=true;sync();openSection(selected);}};tools.append(remove);body.append(tools);
    }else field(item,host,n);
  }
  const missing=(engine.schema[n.tag]||[]).filter(tag=>!children.some(c=>c.tag===tag));
  for(const tag of missing.filter(tag=>(engine.required[n.tag]||[]).includes(tag)))missingField(n,tag,host);
  const optional=missing.filter(tag=>!(engine.required[n.tag]||[]).includes(tag));
  if(optional.length){const details=make('details',undefined,'optional-fields');details.append(make('summary','More details you can add'),make('p','These are absent, not automatically broken. Leave them out unless you want to record them.','muted'));for(const tag of optional){const button=make('button',`Add ${TITLES[tag]||FIELD_NAME(tag)}`);button.onclick=()=>{insert(n,tag);sync();openSection(selected);};details.append(button);}host.append(details);}
  const prototype=children.find(c=>c.children.some(v=>v.tag));
  if(prototype){const button=make('button',`Add ${TITLES[prototype.tag]||'another entry'}`,'quiet');button.onclick=()=>{const empty=item=>({tag:item.tag,children:item.children.filter(c=>c.tag).map(empty)});n.children.push(empty(prototype));dirty=true;sync();openSection(selected);};host.append(button);}
}
function load() {
  if(dirty&&!confirm('Replace your current edits with this paste?'))return;
  const result=engine.repair($('#input').value);if(result.error){status(result.error);return;}
  doc=result;dirty=false;sections=[];engine.walk(doc.root,n=>{if(n.tag.startsWith('state:'))sections.push(n);});
  $('#workspace').hidden=false;$('#input-panel').open=false;navigation();$('#report').replaceChildren();
  for(const message of [...doc.changes,...doc.warnings])$('#report').append(make('li',message));
  if(!doc.changes.length&&!doc.warnings.length)$('#report').append(make('li','No broken tags found. Export still standardizes indentation between fields.'));
  $('#repair-summary').textContent=doc.changes.length?`${doc.changes.length} formatting repairs applied`:'No tag repairs needed';
  sync();const first=diagnostics.find(i=>i.section)?.section||sections[0];if(first)openSection(first);else $('#editor').replaceChildren(make('p','Restore World or Commentary using the buttons above.'));
  status('Response checked. Review the display problems below, then copy the updated response back.');$('#workspace').scrollIntoView({block:'start'});
}
$('#repair').onclick=load;
$('#add-section').onclick=()=>{if(doc)addSection($('#section-choice').value);};
$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText($('#output').value);status('Copied. Paste this over the original response in your chat editor.');}catch{$('#advanced').open=true;$('#output').focus();$('#output').select();status('Clipboard unavailable. The output is selected; copy it manually.');}};
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([$('#output').value],{type:'text/plain;charset=utf-8'}));const link=make('a');link.href=url;link.download='vexa-repaired-response.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);dirty=false;};
$('#reparse').onclick=()=>{if(confirm('Use advanced text as the new input? This replaces the original paste.')){$('#input').value=$('#output').value;dirty=false;load();}};
$('#output').oninput=()=>{dirty=true;status('Advanced text changed. Re-open it to refresh the guided fields and checks.');};
$('#demo').onclick=()=>{
  $('#input').value='The library settles into a quiet evening.\n<internal_states>\n<state:world><ct>12</ct><loc>Manor library</loc><time>06:30 PM</time><room>Oak desk and a window overlooking the garden</room><user_pos>By the window</user_pos><entries>South door to the hallway</entries><obstacles>Bookcase beside the door</obstacles><audio>Quiet rain against the windows</audio><pacing>SLOW</pacing></state:world>\n<state:offscreen_agendas><ent_off><name>Charlotte Claymore</name><loc>Library</loc><why>The accounts are due tomorrow</why><goal>Finish reviewing the mill accounts</goal><end>07:00 PM</end><moody>ParrotEmotion:[Joy→Contentment→Peace]</mood><tfdy>T2 F2 D2 Y2 | IW2</tfdy><salience>sal:6</salience></ent_off></state:offscreen_agendas>\n<state:vent><vent>A quiet evening, with one ledger still open.</vent></state:vent>\n</internal_states>';
  load();
};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
fetch('./contract.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  contract=data;engine=createEngine(data);for(const tag of engine.schema.internal_states){const option=make('option',TITLES[tag]);option.value=tag;$('#section-choice').append(option);}$('#repair').disabled=false;status('Ready. Your response stays in this browser tab.');
}).catch(()=>status('The format definitions could not load. Reload the page to try again.'));
