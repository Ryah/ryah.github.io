from pathlib import Path
import re,base64
root=Path(__file__).resolve().parent
html=(root/'page.template.html').read_text(encoding='utf-8')
engine=(root/'engine.js').read_text(encoding='utf-8').replace('export function createEngine','function createEngine')
app=(root/'app.js').read_text(encoding='utf-8')
app=app.replace("import {createEngine} from './engine.js';",'')
app=app.replace("fetch('./contract.json').then(r=>{if(!r.ok)throw Error();return r.json();})",'Promise.resolve(CONTRACT)')
contract=(root/'contract.json').read_text(encoding='utf-8')
script='const CONTRACT='+contract+';\n'+engine+'\n'+app
html=html.replace('<script type="module" src="./app.js"></script>','<script>\n'+script.replace('</script','<\\/script')+'\n</script>')
font=root.parent.parent/'assets/fonts/space-grotesk.ttf'
html=html.replace("url('../../assets/fonts/space-grotesk.ttf')",'url(data:font/ttf;base64,'+base64.b64encode(font.read_bytes()).decode()+')')
(root/'index.html').write_text(html,encoding='utf-8')
print('Built standalone states/index.html')
