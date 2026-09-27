import { readFileSync, writeFileSync } from 'node:fs';
const path='dist/battle.html';let html=readFileSync(path,'utf8');
function once(from,to){if(html.split(from).length!==2)throw new Error('AUTHORED_VFX_CLOCK_ANCHOR: '+from);html=html.replace(from,to);}
// RAF timestamps represent the start of the frame. A timer may create the
// effect later in that same frame. Pending effects must survive until the
// renderer reaches their start; duration/frames remain authored constants.
once('if(elapsed<0||elapsed>=fx.duration)return false;',
  'if(elapsed<0)return true;if(elapsed>=fx.duration)return false;');
once('if(elapsed<0||elapsed>=fx.duration){dinhLoiFx=null;return;}',
  'if(elapsed<0)return;if(elapsed>=fx.duration){dinhLoiFx=null;return;}');
writeFileSync(path,html);
