(function(){
  const {root, esc, getMobileUrl, listenState, listenQuestion, offQuestion} = MTApp;
  let currentIndex = null;
  let latestState={questionIndex:0,stage:'join'};
  let lastCommentIds={A:'',B:''};
  function makeQR(){
    const el=document.getElementById('qr'); if(!el) return;
    const url=getMobileUrl(); const box=document.createElement('div');
    new QRCode(box,{text:url,width:360,height:360,correctLevel:QRCode.CorrectLevel.M});
    setTimeout(()=>{ const img=box.querySelector('img'); const canvas=box.querySelector('canvas'); if(img) el.src=img.src; else if(canvas) el.src=canvas.toDataURL('image/png'); },80);
  }
  function likesCount(c){ return c && c.likes ? Object.keys(c.likes).filter(k=>c.likes[k]).length : 0; }
  function avatarHtml(p){ return `<div class="avatar" title="${esc(p.nickname||'Guest')}">${esc(p.emoji||'✨')}<small>${esc(p.nickname||'Guest')}</small></div>`; }
  function commentHtml(c){ return `<div class="comment" data-comment-id="${esc(c.id||'')}"><div class="meta"><span><span class="mini">${esc(c.emoji||'✨')}</span><span>${esc(c.nickname||'匿名')}</span></span><span class="like-count">♥ ${likesCount(c)}</span></div><div class="text">${esc(c.text||'')}</div></div>`; }
  function maybeScroll(container, side, commentIds){
    if(!container) return;
    const lastId=commentIds[commentIds.length-1]||'';
    const nearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 40;
    const changed = lastId && lastId !== lastCommentIds[side];
    if(changed || nearBottom){
      requestAnimationFrame(()=>{ container.scrollTop = container.scrollHeight; });
    }
    lastCommentIds[side]=lastId;
  }
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
    document.getElementById('countA').textContent=a.length; document.getElementById('countB').textContent=b.length;
    document.getElementById('pctA').textContent=total?pa+'%':'0%'; document.getElementById('pctB').textContent=total?pb+'%':'0%';
    document.getElementById('barA').style.width=(total?pa:50)+'%'; document.getElementById('barB').style.width=(total?pb:50)+'%';
    const showComments=state.stage==='debate'||state.stage==='result';
    document.getElementById('avatarsA').style.display=showComments?'none':'flex'; document.getElementById('avatarsB').style.display=showComments?'none':'flex';
    const caEl=document.getElementById('commentsA'), cbEl=document.getElementById('commentsB');
    caEl.style.display=showComments?'flex':'none'; cbEl.style.display=showComments?'flex':'none';
    document.getElementById('avatarsA').innerHTML=a.slice(-80).map(avatarHtml).join('');
    document.getElementById('avatarsB').innerHTML=b.slice(-80).map(avatarHtml).join('');
    const cs=Object.entries(q.comments||{}).map(([id,c])=>({id,...c})).filter(c=>c.status==='approved').sort((x,y)=>(x.createdAt||0)-(y.createdAt||0));
    const csA=cs.filter(c=>c.side==='A');
    const csB=cs.filter(c=>c.side==='B');
    caEl.innerHTML=csA.map(commentHtml).join('');
    cbEl.innerHTML=csB.map(commentHtml).join('');
    if(showComments){
      maybeScroll(caEl,'A',csA.map(c=>c.id));
      maybeScroll(cbEl,'B',csB.map(c=>c.id));
    }
  }
  listenState(st=>{
    latestState=st||{questionIndex:0,stage:'join'};
    const idx=Number(latestState.questionIndex||0);
    if(currentIndex!==idx){ if(currentIndex!==null) offQuestion(currentIndex); currentIndex=idx; lastCommentIds={A:'',B:''}; listenQuestion(currentIndex,q=>render(q,latestState)); }
    else root.child('questions/'+currentIndex).once('value').then(s=>render(s.val(),latestState));
  });
  makeQR();
})();
