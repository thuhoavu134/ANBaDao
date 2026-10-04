import {createCanvas,loadImage} from '@napi-rs/canvas';import{readFileSync,writeFileSync}from'node:fs';import vm from'node:vm';
const runtime=readFileSync('src/runtime/damage-floater-renderer.js','utf8'),c=vm.createContext({});vm.runInContext(runtime,c);
const canvas=createCanvas(800,380),x=canvas.getContext('2d');x.fillStyle='#b7b09b';x.fillRect(0,0,800,380);
const img=await loadImage('assets/characters/thay-mo/idle-v3193-atlas.png');x.drawImage(img,3,3,235,264,285,75,230,260);
x.font='18px sans-serif';x.fillStyle='#172622';x.fillText('Compact floater — authored hero frame / sample damage',20,30);
for(const[text,isCrit,y]of [['BẠO KÍCH −184',true,90],['−12345',false,145]]){x.save();c.drawCompactDamageFloater(x,{text,isCrit,x:400,y},.09,()=>({x:400}));x.restore();}
writeFileSync('docs/qa/compact-floaters-20261004/renderer-preview.png',canvas.toBuffer('image/png'));
