from pathlib import Path
root=Path(__file__).resolve().parent
html=(root/'page.template.html').read_text(encoding='utf-8')
engine=(root/'engine.js').read_text(encoding='utf-8').replace('export function createEngine','function createEngine')
guidance=(root/'guidance.js').read_text(encoding='utf-8').replace('export const ','const ')
app=(root/'app.js').read_text(encoding='utf-8')
app=app.replace("import {createEngine} from './engine.js';",'')
app=app.replace("import {TITLES, INFO, AXES, FIELD_NAME} from './guidance.js';",'')
app=app.replace("fetch('./contract.json').then(r=>{if(!r.ok)throw Error();return r.json();})",'Promise.resolve(CONTRACT)')
contract=(root/'contract.json').read_text(encoding='utf-8')
script='const CONTRACT='+contract+';\n'+engine+'\n'+guidance+'\n'+app
html=html.replace('<script type="module" src="./app.js"></script>','<script>\n'+script.replace('</script','<\\/script')+'\n</script>')
(root/'index.html').write_text(html,encoding='utf-8')
print('Built standalone states/index.html')
