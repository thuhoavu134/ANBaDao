// QA page only: observe successful canvas draws and the existing audio buses.
// No new visual/audio content and no combat outcome changes.
(() => {
  let current=null;
  const runs=[];
  const at=()=>Math.round(performance.now()-(current?.t0||0));
  function install(frame){
    const w=frame.contentWindow;if(w.__authoredEvidenceInstalled)return;
    w.__authoredEvidenceInstalled=true;
    // The original Lục Ảnh voice bridge first uses a real HTMLAudioElement.
    // Observe its playing event as well as the Web Audio fallback bus.
    for(const audio of frame.contentDocument.querySelectorAll('audio'))audio.addEventListener('playing',()=>{
      const src=audio.currentSrc||audio.src;
      if(current&&src.includes('voice-'))current.audio.push({kind:'voice-element',key:new URL(src).pathname,played:!audio.muted&&audio.volume>0,playingMs:at(),currentTime:audio.currentTime,volume:audio.volume,muted:audio.muted});
    });
    const draw=w.CanvasRenderingContext2D.prototype.drawImage;
    w.CanvasRenderingContext2D.prototype.drawImage=function(image,...args){
      const result=draw.call(this,image,...args);
      if(current&&image?.src&&/assets\//.test(image.src)){
        const src=new URL(image.src).pathname;
        const item=current.draws[src]||(current.draws[src]={firstMs:at(),lastMs:0,count:0,frames:[]});
        item.lastMs=at();item.count++;
        const frame=args.length===8?args.slice(0,4).join(','):'whole';
        if(item.frames.length<128&&!item.frames.includes(frame))item.frames.push(frame);
      }
      return result;
    };
    for(const [busName,method,kind] of [['HonVietSfx','play','sfx'],['HonVietAudio','playVoice','voice']]){
      const bus=w[busName];if(!bus?.[method])continue;
      const original=bus[method];
      bus[method]=function(key,...args){
        const capture=current,entry={kind,key,requestedMs:at(),played:null};
        if(capture)capture.audio.push(entry);
        const result=original.call(this,key,...args);
        Promise.resolve(result).then(ok=>{entry.played=ok===true;entry.resolvedMs=Math.round(performance.now()-(capture?.t0||0));},error=>{entry.error=String(error);});
        return result;
      };
    }
  }
  function begin(frame,row){
    install(frame);
    current={hero:row.hero,requestedAction:row.action,canonicalAction:row.canonicalAction,t0:performance.now(),draws:{},audio:[],before:frame.contentWindow.__HON_VIET__.getUnits()};
  }
  function finish(frame,row){
    if(!current)return;
    const report={...current,durationMs:at(),complete:row.complete,error:row.error||null,trace:row.trace||[],after:frame.contentWindow.__HON_VIET__.getUnits(),audioState:{...frame.contentDocument.documentElement.dataset}};
    delete report.t0;current=null;runs.push(report);
    const el=document.getElementById('authoredEvidence');
    el.textContent=JSON.stringify({url:location.href,viewport:{width:innerWidth,height:innerHeight},runs},null,2);
  }
  window.SkillTestEvidence={install,begin,finish};
})();
