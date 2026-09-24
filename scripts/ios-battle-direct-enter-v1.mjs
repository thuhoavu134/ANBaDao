import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const target = join(process.cwd(), 'dist', 'index.html');
let html = readFileSync(target, 'utf8');

function replaceOnce(source, from, to, label) {
  if (source.split(from).length !== 2) throw new Error('iOS battle memory patch anchor missing or ambiguous: ' + label);
  return source.replace(from, to);
}

const from = `    // Grok/iOS preview is itself an iframe; a nested battle iframe stays blank.
    // Open combat as the preview document so the player actually sees the fight.
    if (window.parent !== window) {
      window.name = \`hvBattleConfig:\${encodeURIComponent(serializedBattleConfig)}\`;
      location.assign(url);
      return;
    }`;

const to = `    // Keep iPhone/iPad combat in the host document so its unlocked audio context survives.
    // Only a nested preview uses full-page transport because another iframe stays blank.
    const __HV_IOS_DIRECT_BATTLE=(()=>{try{
      const n=navigator,ua=String(n?.userAgent||''),platform=String(n?.platform||''),touch=Number(n?.maxTouchPoints||0);
      return /iPad|iPhone|iPod/i.test(ua)||(platform==='MacIntel'&&touch>1);
    }catch(_){return false;}})();
    if (window.parent !== window) {
      window.name = \`hvBattleConfig:\${encodeURIComponent(serializedBattleConfig)}\`;
      location.assign(url);
      return;
    }`;

if (html.split(from).length !== 2) {
  throw new Error('iOS direct battle enter owner missing or ambiguous');
}
html = html.replace(from, to);

const watchdogFrom = `      activeBattle.loadWatchdog = setTimeout(() => {
        if (!activeBattle || activeBattle.sessionId !== sessionId || loading.hidden) return;
        loading.firstChild.textContent = "Chiến trường đang khởi tạo — vui lòng chờ thêm…";
      }, 12000);`;
const watchdogTo = [
  "      activeBattle.loadWatchdog = setTimeout(() => {",
  "        if (!activeBattle || activeBattle.sessionId !== sessionId || loading.hidden) return;",
  "        if (__HV_IOS_DIRECT_BATTLE) {",
  "          try {",
  "            window.name = `hvBattleConfig:${encodeURIComponent(serializedBattleConfig)}`;",
  "            location.assign(url);",
  "            return;",
  "          } catch (_) {}",
  "        }",
  "        loading.firstChild.textContent = \"Chiến trường đang khởi tạo — vui lòng chờ thêm…\";",
  "      }, 12000);"
].join("\n");
if (html.split(watchdogFrom).length !== 2) {
  throw new Error('iOS direct battle fallback watchdog owner missing or ambiguous');
}
html = html.replace(watchdogFrom, watchdogTo);
const memoryOwner = `<script id="hv-ios-battle-host-memory-v1">
(()=>{
  let released=false,images=[],videos=[];
  const attrs=(node,names)=>names.map(name=>({name,has:node.hasAttribute(name),value:node.getAttribute(name)}));
  const remove=(node,names)=>names.forEach(name=>node.removeAttribute(name));
  const restore=(node,values)=>values.forEach(item=>{if(item.has)node.setAttribute(item.name,item.value);else node.removeAttribute(item.name);});
  window.__HV_BATTLE_HOST_MEMORY_RELEASE=overlay=>{
    if(released)return;
    released=true;
    for(const node of document.querySelectorAll('img[src],img[srcset],picture source[srcset]')){
      if(overlay?.contains(node))continue;
      const names=['sizes','srcset','src'];
      const saved=attrs(node,names);
      if(!saved.some(item=>item.has))continue;
      images.push({node,saved});
      remove(node,['srcset','src']);
    }
    for(const video of document.querySelectorAll('video')){
      if(overlay?.contains(video))continue;
      const sources=[...video.querySelectorAll('source')].map(node=>({node,saved:attrs(node,['sizes','srcset','src'])}));
      const saved={node:video,attributes:attrs(video,['src','poster']),sources,time:Number(video.currentTime)||0,paused:video.paused};
      if(!saved.attributes.some(item=>item.has)&&!sources.some(row=>row.saved.some(item=>item.has)))continue;
      videos.push(saved);
      try{video.pause();remove(video,['src','poster']);for(const row of sources)remove(row.node,['srcset','src']);video.load();}catch(_){}
    }
    document.documentElement.dataset.battleHostImagesReleased=String(images.length);
    document.documentElement.dataset.battleHostVideosReleased=String(videos.length);
  };
  window.__HV_BATTLE_HOST_MEMORY_RESTORE=()=>{
    if(!released)return;
    for(const row of images)if(row.node.isConnected)restore(row.node,row.saved);
    for(const row of videos){
      if(!row.node.isConnected)continue;
      for(const source of row.sources)if(source.node.isConnected)restore(source.node,source.saved);
      restore(row.node,row.attributes);
      try{
        row.node.load();
        const resume=()=>{
          if(!row.paused){
            try{if(row.time>0&&Number.isFinite(row.time))row.node.currentTime=row.time;}catch(_){}
            row.node.play().catch(()=>{});
          }
        };
        if(row.node.readyState>=1)resume();else row.node.addEventListener('loadedmetadata',resume,{once:true});
      }catch(_){}
    }
    images=[];videos=[];released=false;
    delete document.documentElement.dataset.battleHostImagesReleased;
    delete document.documentElement.dataset.battleHostVideosReleased;
  };
})();
</script>`;
if (!html.includes('id="hv-ios-battle-host-memory-v1"')) {
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd < 0) throw new Error('iOS battle memory owner body end missing');
  html = html.slice(0, bodyEnd) + memoryOwner + html.slice(bodyEnd);
}

html = replaceOnce(
  html,
  '    frame.src = url;\n',
  '    if (__HV_IOS_DIRECT_BATTLE) window.__HV_BATTLE_HOST_MEMORY_RELEASE?.(overlay);\n    frame.src = url;\n',
  'iOS host image release before battle iframe'
);

html = replaceOnce(
  html,
  '  function closeOverlay() {\n    // Stop combat SFX; preserve the current BGM until the next screen crossfades to its track.\n',
  '  function closeOverlay() {\n    // Stop combat SFX; preserve the current BGM until the next screen crossfades to its track.\n    window.__HV_BATTLE_HOST_MEMORY_RESTORE?.();\n',
  'restore host images after battle'
);

writeFileSync(target, html);
console.log('iOS battle stays in host frame for continuous audio; delayed direct fallback protects stalled entry');
