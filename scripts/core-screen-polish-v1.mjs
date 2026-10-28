import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
export function installCoreScreenPolish(root){
 const path=join(root,'dist/index.html'),html=readFileSync(path,'utf8');
 if(!html.includes('</head>'))throw new Error('Core screen polish: head missing');
 if(html.includes('id="lt-core-screen-polish"'))throw new Error('Core screen polish installed twice');
 const css=readFileSync(join(root,'src/ui/core-screen-polish.css'),'utf8')+'\n'+readFileSync(join(root,'src/ui/hero-detail-vo-cac.css'),'utf8')+'\n'+readFileSync(join(root,'src/ui/hero-roster-concept.css'),'utf8');
 // Owner-approved display brand; technical IDs, routes and save keys stay stable.
 const branded=html.replace(/(>\s*)Lục Thần(\s*<)/g,'$1An Bá Đạo$2')
   .replace(/(>\s*)LỤC THẦN(\s*<)/g,'$1AN BÁ ĐẠO$2')
   .replace(/aria-label="Đăng nhập Lục Thần"/g,'aria-label="Đăng nhập An Bá Đạo"');
 writeFileSync(path,branded.replace('</head>','<style id="lt-core-screen-polish">\n'+css+'\n</style>\n</head>'));
}



