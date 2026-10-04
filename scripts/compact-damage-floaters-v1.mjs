import{readFileSync,writeFileSync}from'node:fs';import{join}from'node:path';
export function patchCompactDamageFloaters(html,runtime){
 if(html.includes('/* HV_COMPACT_DAMAGE_FLOATERS_V1 */'))return html;
 const start=html.indexOf('      if(floater.isDamage){\n        let pop=1;'),end=html.indexOf('\n      }else{\n        const weight=floater.large?900:800;',start);
 if(start<0||end<0)throw new Error('Damage floater painter missing');
 const loop='    for (const floater of floaters) {';if(html.split(loop).length!==2)throw new Error('Floater painter loop missing');
 html=html.slice(0,start)+'      if(floater.isDamage){\n        drawCompactDamageFloater(context,floater,age,visibleFloaterBounds);'+html.slice(end);
 html=html.replace(loop,'/* HV_COMPACT_DAMAGE_FLOATERS_V1 */\n'+runtime+'\n'+loop);
 const a='const baseSize=floater.large?25:18;',b='context.lineWidth=5;\n        context.strokeStyle="rgba(5,18,16,.85)";';
 if(html.split(a).length!==2||html.split(b).length!==2)throw new Error('Status floater painter missing');
 return html.replace(a,'const baseSize=floater.large?16:13;').replace(b,'context.lineWidth=2;\n        context.strokeStyle="rgba(5,18,16,.85)";');
}
export function installCompactDamageFloaters(root){const p=join(root,'dist','battle.html');writeFileSync(p,patchCompactDamageFloaters(readFileSync(p,'utf8'),readFileSync(join(root,'src/runtime/damage-floater-renderer.js'),'utf8')));}
