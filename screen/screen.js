(function(){
  const {root, esc, getMobileUrl, listenState, listenQuestion, offQuestion} = MTApp;
  let currentIndex = null;
  const stageLabel = {join:'阵营选择阶段', debate:'观点滚动阶段', paused:'暂停互动', result:'结果展示阶段'};
  const stageHint = {join:'扫码选择持方', debate:'观点贡献中', paused:'互动暂停', result:'结果展示中'};
  function ensureStatusBadge(){
    let el=document.getElementById('screenStatusBadge');
    if(!el){ el=document.createElement('div'); el.id='screenStatusBadge'; el.className='screen-status-badge'; document.querySelector('.stage')?.appendChild(el); }
    return el;
  }
  function makeQR(){
    const el=document.getElementById('qr'); if(!el) return;
    const url=getMobileUrl(); const box=document.createElement('div');
    new QRCode(box,{text:url,width:360,height:360,correctLevel:QRCode.CorrectLevel.M});
    setTimeout(()=>{ const img=box.querySelector('img'); const canvas=box.querySelector('canvas'); if(img) el.src=img.src; else if(canvas) el.src=canvas.toDataURL('image/png'); },80);
  }
  function avatarHtml(p){ return `<div class="avatar" title="${esc(p.nickname||'Guest')}">${esc(p.emoji||'✨')}<small>${esc(p.nickname||'Guest')}</small></div>`; }
  function commentHtml(c){ return `<div class="comment"><div class="meta"><span class="mini">${esc(c.emoji||'✨')}</span><span>${esc(c.nickname||'匿名')}</span></div><div class="text">${esc(c.text||'')}</div></div>`; }
  function render(q, state){
    if(!q){ const el=document.getElementById('qTitle'); if(el) el.textContent='请在后台初始化活动数据'; return; }
    const metaTitle=(window.MT_DEBATE_CONFIG.defaults&&window.MT_DEBATE_CONFIG.defaults.title)||'2025 MT Graduation';
    const metaSub=(window.MT_DEBATE_CONFIG.defaults&&window.MT_DEBATE_CONFIG.defaults.subtitle)||'蓄光显影，自在亮相';
    document.getElementById('eventName').textContent=metaTitle.replace(' Debate','');
    document.getElementById('slogan').textContent=metaSub;
    const ps=Object.values(q.participants||{});
    const a=ps.filter(p=>p.side==='A'), b=ps.filter(p=>p.side==='B'), total=a.length+b.length;
    const pa= total? Math.round(a.length/total*100) : 50; const pb= total? 100-pa : 50;
    document.getElementById('qTitle').textContent=q.title||'';
    document.getElementById('sideAName').textContent=q.sideA||'A'; document.getElementById('sideBName').textContent=q.sideB||'B';
    document.getElementById('stagePill').textContent=stageLabel[state.stage]||state.stage||'等待中';
    ensureStatusBadge().innerHTML=`<b>当前状态</b><span>${stageLabel[state.stage]||state.stage||'等待中'}</span><em>${stageHint[state.stage]||'扫码参与'}</em>`;
    document.getElementById('countA').textContent=a.length; document.getElementById('countB').textContent=b.length;
    document.getElementById('pctA').textContent=total?pa+'%':'0%'; document.getElementById('pctB').textContent=total?pb+'%':'0%';
    document.getElementById('barA').style.width=(total?pa:50)+'%'; document.getElementById('barB').style.width=(total?pb:50)+'%';
    const showComments=state.stage==='debate'||state.stage==='result';
    document.getElementById('avatarsA').style.display=showComments?'none':'flex'; document.getElementById('avatarsB').style.display=showComments?'none':'flex';
    document.getElementById('commentsA').style.display=showComments?'flex':'none'; document.getElementById('commentsB').style.display=showComments?'flex':'none';
    document.getElementById('avatarsA').innerHTML=a.slice(-80).map(avatarHtml).join('');
    document.getElementById('avatarsB').innerHTML=b.slice(-80).map(avatarHtml).join('');
    const cs=Object.values(q.comments||{}).filter(c=>c.status==='approved').sort((x,y)=>(x.createdAt||0)-(y.createdAt||0));
    document.getElementById('commentsA').innerHTML=cs.filter(c=>c.side==='A').slice(-8).map(commentHtml).join('');
    document.getElementById('commentsB').innerHTML=cs.filter(c=>c.side==='B').slice(-8).map(commentHtml).join('');
  }
  let latestState={questionIndex:0,stage:'join'};
  listenState(st=>{
    latestState=st||{questionIndex:0,stage:'join'};
    const idx=Number(latestState.questionIndex||0);
    if(currentIndex!==idx){ if(currentIndex!==null) offQuestion(currentIndex); currentIndex=idx; listenQuestion(currentIndex,q=>render(q,latestState)); }
    else root.child('questions/'+currentIndex).once('value').then(s=>render(s.val(),latestState));
  });
  makeQR();
})();
