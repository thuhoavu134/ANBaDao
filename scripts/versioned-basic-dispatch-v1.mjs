import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';

// The predicate requires the current action. Omitting it bypassed the authored
// Basic owner (including Ong Pho's second contact and rage gain).
export function patchVersionedBasicDispatch(html){
 if(html.includes('/* HV_VERSIONED_BASIC_DISPATCH_V1 */'))return html;
 const calls=html.match(/isVersionedBasic\(actor\)/g)||[];
 if(calls.length<10)throw Error('Versioned Basic dispatch anchors missing');
 return html.replace('function isVersionedBasic(actor,action)', '/* HV_VERSIONED_BASIC_DISPATCH_V1 */\n  function isVersionedBasic(actor,action)')
  .replaceAll('isVersionedBasic(actor)','isVersionedBasic(actor,action)');
}
export function installVersionedBasicDispatch(root){
 const path=join(root,'dist','battle.html');
 writeFileSync(path,patchVersionedBasicDispatch(readFileSync(path,'utf8')));
}
