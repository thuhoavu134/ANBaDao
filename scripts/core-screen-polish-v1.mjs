import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export function installCoreScreenPolish(root){
 const path=join(root,'dist/index.html'),html=readFileSync(path,'utf8');
 if(!html.includes('</head>'))throw new Error('Core screen polish: head missing');
 if(html.includes('id="lt-core-screen-polish"'))throw new Error('Core screen polish installed twice');
 const css=readFileSync(join(root,'src/ui/core-screen-polish.css'),'utf8')+'\n'+readFileSync(join(root,'src/ui/hero-detail-vo-cac.css'),'utf8');
 writeFileSync(path,html.replace('</head>','<style id="lt-core-screen-polish">\n'+css+'\n</style>\n</head>'));
}

