(function(){
  const {cfg, root, auth, EMOJIS, clamp, ensureAnon, listenState, listenQuestion, offQuestion} = MTApp;
  const localKey='mt_debate_profile_v6';
  let profile=JSON.parse(localStorage.getItem(localKey)||'{}');
  if(!profile.emoji) profile.emoji=EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
  let state={questionIndex:0, stage:'join'};
  let q=null;
  let currentIndex=null;
  let side=null;
  let uid=null;
  let busy=false;
  const toast=(t)=>{ const el=document.getElementById('toast'); if(el) el.textContent=t || ''; };
  const save=()=>localStorage.setItem(localKey,JSON.stringify(profile));
  function setBusy(v){ busy=v; ['joinBtn','sendBtn','resetBtn'].forEach(id=>{const el=document.getElementById(id); if(el) el.disabled=v;}); }
  function render(){
    if(!q){ document.getElementById('mobileStage').textContent='活动尚未初始化，请稍候刷新。'; return; }
    document.getElementById('eventName').textContent=(cfg.defaults.title||'2025 MT Graduation').replace(' Debate','');
    document.getElementById('choiceA').textContent=q.sideA||'A';
    document.getElementById('choiceB').textContent=q.sideB||'B';
    document.getElementById('mobileTitle').textContent=side?'贡献你的观点':'选择你的持方';
    document.getElementById('mobileStage').textContent=q.title||'';
    document.getElementById('joinBox').style.display=side?'none':'block';
    document.getElementById('badge').style.display=side?'flex':'none';
    document.getElementById('commentBox').style.display=side?'block':'none';
    document.getElementById('myEmoji').textContent=profile.emoji;
    document.getElementById('myName').textContent=profile.nickname||'Guest';
    document.getElementById('mySide').textContent=side ? `当前持方：${side==='A'?(q.sideA||'A'):(q.sideB||'B')}` : '未选择';
    document.querySelectorAll('.choice').forEach(el=>el.classList.toggle('selected', el.dataset.side===profile.side));
    const sendBtn=document.getElementById('sendBtn');
    if(sendBtn){ sendBtn.textContent = state.stage==='debate' ? '提交观点，等待上墙' : '提交观点，等待上墙'; }
  }
  async function loadMyParticipant(){
    if(!uid) return;
    const snap=await root.child(`questions/${Number(state.questionIndex||0)}/participants/${uid}`).once('value');
    const v=snap.val();
    side=v&&v.side;
    if(v){ profile.nickname=v.nickname; profile.emoji=v.emoji; profile.side=v.side; save(); }
    render();
  }
  document.querySelectorAll('.choice').forEach(el=>el.addEventListener('click',()=>{ profile.side=el.dataset.side; save(); render(); }));
  document.getElementById('joinBtn').addEventListener('click', async ()=>{
    if(busy) return;
    try{
      setBusy(true); toast('正在加入阵营...');
      const guest = await ensureAnon();
      uid = guest.uid;
      const nickname=clamp(document.getElementById('nickname').value, cfg.limits.nicknameMax);
      if(!nickname){ toast('请先输入昵称'); return; }
      if(!profile.side){ toast('请选择A或B持方'); return; }
      profile.nickname=nickname; save();
      const data={nickname, emoji:profile.emoji, side:profile.side, uid, joinedAt:firebase.database.ServerValue.TIMESTAMP};
      await root.child(`questions/${Number(state.questionIndex||0)}/participants/${uid}`).set(data);
      side=profile.side;
      toast('加入成功！请关注大屏。');
      render();
    }catch(e){
      toast('加入失败：'+e.message);
      alert('加入阵营失败：'+e.message+'\n请确认 Firebase Rules 已更新到 v7 版本，允许观众写入当前题 participants。');
    }finally{ setBusy(false); }
  });
  document.getElementById('sendBtn').addEventListener('click', async ()=>{
    if(busy) return;
    try{
      setBusy(true); toast('正在提交观点...');
      const guest = await ensureAnon(); uid = guest.uid;
      const text=clamp(document.getElementById('comment').value, cfg.limits.commentMax);
      if(!text){ toast('请先输入观点'); return; }
      if(!side){ toast('请先加入阵营'); return; }
      await root.child(`questions/${Number(state.questionIndex||0)}/comments`).push({text, side, nickname:profile.nickname||'匿名', emoji:profile.emoji, uid, status:'pending', createdAt:firebase.database.ServerValue.TIMESTAMP});
      document.getElementById('comment').value=''; toast('提交成功，等待审核上墙。');
    }catch(e){ toast('提交失败：'+e.message); alert('提交观点失败：'+e.message); }
    finally{ setBusy(false); }
  });
  document.getElementById('resetBtn').addEventListener('click', async ()=>{
    if(busy) return;
    try{ setBusy(true); const guest = await ensureAnon(); uid = guest.uid; await root.child(`questions/${Number(state.questionIndex||0)}/participants/${uid}`).remove().catch(()=>{}); side=null; profile.side=null; save(); toast('已重置，请重新选择持方'); render(); }
    catch(e){ toast('重置失败：'+e.message); }
    finally{ setBusy(false); }
  });
  (async()=>{ try{ const guest = await ensureAnon(); uid = guest.uid; await loadMyParticipant(); } catch(e){ toast('观众端初始化失败：'+e.message); alert('观众端初始化失败：'+e.message); } })();
  listenState(st=>{
    state=st || {questionIndex:0, stage:'join'};
    const idx=Number(state.questionIndex||0);
    if(currentIndex!==idx){
      if(currentIndex!==null) offQuestion(currentIndex);
      currentIndex=idx;
      side=null;
      listenQuestion(currentIndex, qq=>{ q=qq; loadMyParticipant(); });
    } else render();
  });
})();
