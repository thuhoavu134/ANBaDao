// Readiness only: original images, existing cache, existing combat audio bus.
export function createLegacyAuthoredReadiness({cache,describe,sound,enabled,timeoutMs=15000}) {
  async function prepare(actor,action,signal) {
    const assets=describe(actor,action);
    if(!assets?.length)return {release(){}};
    const native=assets.filter(a=>a.key);
    const releaseCache=cache.retain(native.map(a=>a.key),native.reduce((n,a)=>n+a.bytes,0));
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
      for(const asset of assets){
        check();let image;
        while(!(image=asset.image())){check();await wait(new Promise(resolve=>setTimeout(resolve,20)));}
        await wait(image.decode());check();
        if(!image.complete||image.naturalWidth<2)throw new Error('Original atlas unavailable: '+(image.src||asset.key));
      }
      if(enabled()&&sound()?.prepare)await sound().prepare(action==='ultimate'?'ultimate':action==='skill'?'skill':'basic',{signal,timeoutMs:2000}).catch(()=>false);
      check();return {release};
    }catch(error){release();throw error;}
  }
  return {prepare};
}
