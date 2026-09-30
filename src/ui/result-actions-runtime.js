// One native click owner for mouse, keyboard and Safari synthesized taps.
// A failed publish must leave the result visible and retryable.
(()=>{
  if(window.__HV_RESULT_ACTION_OWNER_V1)return;
  window.__HV_RESULT_ACTION_OWNER_V1=true;
  const root=document.getElementById('integratedResultV6');
  if(!root)return;
  let busy=false,busyButton=null;
  window.addEventListener('message',event=>{
    const message=event.data,api=window.__HV_BATTLE_RESULT_API;
    if(event.source!==parent||event.origin!==location.origin||message?.source!=='hon-viet-parent'||
       message.type!=='battle-settlement-error'||message.payload?.sessionId!==api?.sessionId())return;
    api.retry();busy=false;
    root.querySelectorAll('button').forEach(b=>b.disabled=false);
    const status=root.querySelector('[data-result-status]');
    if(status)status.textContent='Chưa lưu được phần thưởng. Bấm lại để thử; phần thưởng chỉ nhận một lần.';
  });
  root.addEventListener('click',event=>{
    const button=event.target?.closest?.('[data-result-action],[data-nav]');
    if(!button||!root.contains(button))return;
    event.preventDefault();event.stopPropagation();
    if(busy&&busyButton?.isConnected)return;
    busy=true;busyButton=button;
    const controls=[...root.querySelectorAll('button')];
    controls.forEach(b=>b.disabled=true);
    let status=root.querySelector('[data-result-status]');
    if(!status){status=document.createElement('p');status.dataset.resultStatus='';status.setAttribute('role','status');root.querySelector('.irv-actions')?.append(status);}
    if(status)status.textContent='Đang lưu kết quả…';
    try{
      const api=window.__HV_BATTLE_RESULT_API;
      if(!api)throw new Error('Kết quả chưa sẵn sàng. Anh bấm lại giúp em.');
      const action=button.dataset.resultAction;
      let sent;
      if(action==='confirm'||action==='next')sent=api.embedded()?api.publish(action):api.continue();
      else sent=window.postToHonVietHost?.('battle-nav',{sessionId:api.sessionId(),target:button.dataset.nav||'campaign'});
      if(sent===false||sent==null)throw new Error('Chưa gửi được kết quả. Hãy bấm lại; phần thưởng chỉ nhận một lần.');
    }catch(error){
      busy=false;controls.forEach(b=>b.disabled=false);
      if(status)status.textContent=error.message||'Chưa lưu được kết quả. Vui lòng thử lại.';
      console.error('Không thể xử lý kết quả trận Hồn Việt.',error);
    }
  });
})();
