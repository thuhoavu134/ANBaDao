// QA page only: observe successful canvas draws and the existing audio buses.
// No new visual/audio content and no combat outcome changes.
(() => {
  let current=null;
  const runs=[];
  const at=()=>Math.round(performance.now()-(current?.t0||0));
  function install(frame){
    const w=frame.contentWindow;if(w.__authoredEvidenceInstalled)return;
    w.__authoredEvidenceInstalled=true;
    // Also observe detached/lazily created HTMLAudioElement instances.
    const mediaPlay=w.HTMLMediaElement.prototype.play;
    w.HTMLMediaElement.prototype.play=function(...args){
      const capture=current,src=this.currentSrc||this.src;
      const entry=capture&&src.includes('voice-')?{kind:'voice-media',key:new URL(src).pathname,requestedMs:at(),played:null}:null;
      if(entry){capture.audio.push(entry);this.addEventListener('playing',()=>{entry.played=!this.muted&&this.volume>0;entry.playingMs=Math.round(performance.now()-capture.t0);},{once:true});}
      const result=mediaPlay.apply(this,args);
      if(entry)Promise.resolve(result).catch(error=>{entry.played=false;entry.error=String(error);});
      return result;
    };
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
        const src=new URL(image.src).pathname,drawMs=at();
        const item=current.draws[src]||(current.draws[src]={firstMs:drawMs,lastMs:0,count:0,frames:[],frameTimes:[],frameSequence:[]});
        item.lastMs=drawMs;item.count++;
        const crop=args.length===8?args.slice(0,4).join(','):'whole';
        if(item.frames.length<128&&!item.frames.includes(crop))item.frames.push(crop);
        if(args.length===8){
          const [sx,sy,sw,sh]=args;
          const cols=sw>0&&image.naturalWidth>0?Math.max(1,Math.round(image.naturalWidth/sw)):null;
          const frameIndex=cols&&sh>0?Math.max(0,Math.floor(sy/sh))*cols+Math.max(0,Math.floor(sx/sw)):null;
          if(item.frameTimes.length<256&&!item.frameTimes.some(entry=>entry.crop===crop))item.frameTimes.push({crop,frameIndex,firstMs:drawMs});
          const previous=item.frameSequence.at(-1);
          if(item.frameSequence.length<512&&previous?.frameIndex!==frameIndex)item.frameSequence.push({crop,frameIndex,firstMs:drawMs});
        }
      }
      return result;
    };
    const wrapBus=(bus,method,kind,owner)=>{
      if(!bus?.[method]||bus[method].__hvAuthoredEvidenceWrapped)return;
      const original=bus[method];
      const wrapped=function(key,...args){
        const options=args[0]&&typeof args[0]==='object'?args[0]:{};
        const capture=current,entry={kind,key,requestedMs:at(),played:null,voiceBusOwner:kind==='voice'?owner:null,actionId:options.actionId||null,cue:options.cue||null,sampleCue:options.sampleCue||null,cuePerformanceMs:Number.isFinite(Number(options.cuePerformanceMs))?Number(options.cuePerformanceMs):null};
        if(capture)capture.audio.push(entry);
        const result=original.call(this,key,...args);
        Promise.resolve(result).then(ok=>{entry.played=ok===true;entry.resolvedMs=Math.round(performance.now()-(capture?.t0||0));},error=>{entry.error=String(error);});
        return result;
      };
      wrapped.__hvAuthoredEvidenceWrapped=true;
      bus[method]=wrapped;
    };
    wrapBus(w.HonVietSfx,'play','sfx','iframe');
    const voiceBus=(w.parent&&w.parent!==w&&w.parent.HonVietAudio)?w.parent.HonVietAudio:w.HonVietAudio;
    wrapBus(voiceBus,'playVoice','voice',voiceBus===w.HonVietAudio?'iframe':'parent');
  }
  function begin(frame,row){
    install(frame);
    const w=frame.contentWindow;
    current={hero:row.hero,requestedAction:row.action,canonicalAction:row.canonicalAction,frameViewport:{width:w.innerWidth,height:w.innerHeight},t0:performance.now(),frameT0:w.performance.now(),sfxTimingStart:w.HonVietSfx?.timingEvents?.().length||0,authoredCueStart:w.__HV_AUTHORED_AUDIO_QA?.events?.().length||0,draws:{},audio:[],before:w.__HON_VIET__.getUnits()};
  }
  function finish(frame,row){
    if(!current)return;
    const w=frame.contentWindow;
    const voice=w.__HV_LUC_ANH_ULTIMATE_AUDIO_V2?.audio;
    const relative=item=>{
      const copy={...item};
      for(const key of Object.keys(copy))if(/PerformanceMs$/.test(key)&&Number.isFinite(Number(copy[key])))copy[key]=Math.round((Number(copy[key])-current.frameT0)*100)/100;
      return copy;
    };
    const audioTiming=(w.HonVietSfx?.timingEvents?.()||[]).slice(current.sfxTimingStart).map(relative);
    const authoredAudioCues=(w.__HV_AUTHORED_AUDIO_QA?.events?.()||[]).slice(current.authoredCueStart).map(relative);
    const report={...current,durationMs:at(),complete:row.complete,error:row.error||null,trace:row.trace||[],after:w.__HON_VIET__.getUnits(),audioTiming,authoredAudioCues,audioState:{...frame.contentDocument.documentElement.dataset},readiness:w.__HV_BATTLE_ASSET_QA?.events?.()||[],voiceState:{bridgeAvailable:typeof w.__playLucAnhUltimateVoiceGuaranteed==='function',src:voice?.currentSrc||voice?.src,paused:voice?.paused,currentTime:voice?.currentTime,error:voice?.error?.code}};
    delete report.t0;delete report.frameT0;delete report.sfxTimingStart;delete report.authoredCueStart;current=null;runs.push(report);
    const el=document.getElementById('authoredEvidence');
    el.textContent=JSON.stringify({url:location.href,viewport:{width:innerWidth,height:innerHeight},runs},null,2);
  }
  window.SkillTestEvidence={install,begin,finish,runs:()=>runs.map(run=>structuredClone(run)),last:()=>runs.length?structuredClone(runs.at(-1)):null};
})();
