// Readiness only: original images, existing cache, existing combat audio bus.
export function createLegacyAuthoredReadiness({cache,describe,sound,enabled,timeoutMs=15000}) {
  async function prepare(actor,action,signal) {
    const assets=describe(actor,action)||[];
    const native=assets.filter(a=>a.key);
    const cap=(()=>{try{const i=cache.inspect?.();return (i&&(i.configuredMaxBytes||i.maxBytes))||64*1024*1024;}catch(_){return 64*1024*1024;}})();
    const need=native.reduce((n,a)=>n+a.bytes,0);
    // Never lease more than the device can hold: over-leasing made every page fail admission and the cast never
    // started. Pinning the part that fits still keeps the cache from thrashing while it decodes.
    const releaseCache=native.length?cache.retain(native.map(a=>a.key),Math.min(need,Math.max(8*1024*1024,cap*0.85))):()=>{};
    let released=false;
    const release=()=>{if(released)return;released=true;releaseCache();signal?.removeEventListener('abort',release);};
    signal?.addEventListener('abort',release,{once:true});
    const abort=()=>Object.assign(new Error('Authored action cancelled'),{name:'AbortError'});
    const deadline=Date.now()+timeoutMs;
    const check=()=>{if(signal?.aborted)throw abort();if(Date.now()>deadline)throw new Error('Authored atlas readiness timeout');};
    const wait=promise=>new Promise((resolve,reject)=>{
      let timer;
      const done=(error,value)=>{clearTimeout(timer);signal?.removeEventListener('abort',cancel);error?reject(error):resolve(value);};
      const cancel=()=>done(abort());
      signal?.addEventListener('abort',cancel,{once:true});
      timer=setTimeout(()=>done(new Error('Authored atlas decode timeout')),Math.max(1,deadline-Date.now()));
      Promise.resolve(promise).then(v=>done(null,v),e=>done(e));
    });
    try{
      // The first asset is the action itself and must be there. The rest are VFX sheets: wait a short while, and if
      // the device cannot hold them let the action play without that layer instead of cancelling the turn.
      for(let index=0;index<assets.length;index++){
        const asset=assets[index];
        check();let image;
        const grabDeadline=Date.now()+(index===0?Math.max(1,deadline-Date.now()):3500);
        while(!(image=asset.image())){
          check();
          if(Date.now()>grabDeadline){
            if(index===0)throw new Error('Original atlas unavailable: '+(asset.key||''));
            break;
          }
          await wait(new Promise(resolve=>setTimeout(resolve,20)));
        }
        if(!image)continue;
        try{await wait(image.decode());}catch(error){if(index===0)throw error;continue;}
        check();
        if(!image.complete||image.naturalWidth<2){
          if(index===0)throw new Error('Original atlas unavailable: '+(image.src||asset.key));
          continue;
        }
      }
      // Decode before the cast clock, using the remaining resource budget.
      // Do not give up after 2s and let the action lease cancel a cold sound.
      if(enabled()&&sound()?.prepare)await sound().prepare(action==='ultimate'?'ultimate':action==='skill'?'skill':'basic',{signal,timeoutMs:Math.max(1,deadline-Date.now())}).catch(()=>false);
      // The atlas deadline has already been checked after every decode.
      // An optional sound exhausting its budget must not turn valid images
      // into a false atlas error; cancellation still prevents a stale cast.
      if(signal?.aborted)throw abort();
      return {release};
    }catch(error){release();throw error;}
  }
  return {prepare};
}

