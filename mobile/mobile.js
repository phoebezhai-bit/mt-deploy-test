(function(){
 const {cfg, root, auth, EMOJIS, clamp, ensureAnon, listenState, listenQuestion, offQuestion} = MTApp;
 const localKey='mt_debate_profile_v3'; let profile=JSON.parse(localStorage.getItem(localKey)||'{}'); if(!profile.emoji) profile.emoji=EMOJIS[Math.floor(Math.random()*EMOJIS.length)]; let state={questionIndex:0,stage:'join'}; let q=null; let currentIndex=null; let side=null; let uid=null;
 const toast=(t)=>{const el=document.getElementById('toast'); if(el) el.textContent=t;};
 function save(){localStorage.setItem(localKey,JSON.stringify(profile));}
 function render(){
   if(!q){document.getElementById('mobileStage').textContent='活动尚未初始化，请稍候刷新。'; return;}
   document.getElementById('eventName').textContent=(cfg.defaults.title||'2025 MT Graduation').replace(' Debate','');
   document.getElementById('choiceA').textContent=q.sideA||'A'; document.getElementById('choiceB').textContent=q.sideB||'B';
   document.getElementById('mobileTitle').textContent=side?'贡献你的观点':'选择你的持方';
   document.getElementById('mobileStage').textContent= q.title||'';
   document.getElementById('joinBox').style.display= side?'none':'block'; document.getElementById('badge').style.display= side?'flex':'none';
   document.getElementById('commentBox').style.display= side && state.stage==='debate'?'block': side?'block':'none';
   document.getElementById('myEmoji').textContent=profile.emoji; document.getElementById('myName').textContent=profile.nickname||'Guest';
   document.getElementById('mySide').textContent= side ? `当前持方：${side==='A'?(q.sideA||'A'):(q.sideB||'B')}`:'未选择';
   document.querySelectorAll('.choice').forEach(el=>el.classList.toggle('selected', el.dataset.side===profile.side));
 }
 async function loadMyParticipant(){ if(!uid) return; const s=await root.child(`questions/${state.questionIndex}/participants/${uid}`).once('value'); const v=s.val(); side=v&&v.side; if(v){ profile.nickname=v.nickname; profile.emoji=v.emoji; profile.side=v.side; save(); } render(); }
 document.querySelectorAll('.choice').forEach(el=>el.onclick=()=>{ profile.side=el.dataset.side; render(); });
 document.getElementById('joinBtn').onclick=async()=>{ try{ await ensureAnon(); uid=auth.currentUser.uid; const nickname=clamp(document.getElementById('nickname').value, cfg.limits.nicknameMax); if(!nickname){toast('请先输入昵称'); return;} if(!profile.side){toast('请选择A或B持方'); return;} profile.nickname=nickname; save(); const data={nickname, emoji:profile.emoji, side:profile.side, uid, joinedAt:firebase.database.ServerValue.TIMESTAMP}; await root.child(`questions/${state.questionIndex}/participants/${uid}`).set(data); side=profile.side; toast('加入成功！请关注大屏。'); render(); }catch(e){ toast('加入失败：'+e.message); } };
 document.getElementById('sendBtn').onclick=async()=>{ try{ await ensureAnon(); uid=auth.currentUser.uid; const text=clamp(document.getElementById('comment').value, cfg.limits.commentMax); if(!text){toast('请先输入观点'); return;} if(!side){toast('请先加入阵营'); return;} await root.child(`questions/${state.questionIndex}/comments`).push({text, side, nickname:profile.nickname||'匿名', emoji:profile.emoji, uid, status:'pending', createdAt:firebase.database.ServerValue.TIMESTAMP}); document.getElementById('comment').value=''; toast('提交成功，等待审核上墙。'); }catch(e){ toast('提交失败：'+e.message); } };
 document.getElementById('resetBtn').onclick=async()=>{ if(!uid && auth.currentUser) uid=auth.currentUser.uid; if(uid){ await root.child(`questions/${state.questionIndex}/participants/${uid}`).remove().catch(()=>{}); } side=null; profile.side=null; save(); render(); };
 auth.onAuthStateChanged(async u=>{ if(u){uid=u.uid; await loadMyParticipant();} }); ensureAnon();
 listenState(st=>{ state=st; if(currentIndex!==st.questionIndex){ if(currentIndex!==null) offQuestion(currentIndex); currentIndex=st.questionIndex; side=null; listenQuestion(currentIndex,qq=>{q=qq; loadMyParticipant();}); } else render(); });
})();