import vm from 'node:vm';
export function rawRenderHook(source){
 const match=source.match(/const hook\s*=\s*String\.raw`([\s\S]*?)`;/);
 if(!match)throw Error('Layout measurement hook boundary');
 new vm.Script(match[1]);return match[1];
}
export function renderDeclaration(source,name){
 const match=new RegExp('\\bconst\\s+'+name+'\\s*=').exec(source);
 if(!match)throw Error('Missing render descriptor '+name);
 let end=match.index;
 while((end=source.indexOf(';',end+1))>=0){const text=source.slice(match.index,end+1);try{new vm.Script(text);return text;}catch{}}
 throw Error('Unterminated render descriptor '+name);
}
