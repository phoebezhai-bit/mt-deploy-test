(function(){
 const {cfg, auth, root, esc, listenState, listenQuestion, offQuestion, $$} = MTApp;
 let state={questionIndex:0,stage:'join'}, q=null, currentIndex=null;
 const toast=t=>{const el=document.getElementById('toast'); if(el) el.textContent=t;};
 const stageLabel={join:'阵营选择',debate:'观点提交',paused:'暂停互动',result:'结果展示'};
 async function initData(){ const questions={}; cfg.defaults.questions.forEach((x,i)=>{questions[i]={title:x.title, sideA:x.sideA, sideB:x.sideB}}); await root.update({meta:{title:cfg.defaults.title,subtitle:cfg.defaults.subtitle,updatedAt:firebase.database.ServerValue.TIMESTAMP}, state:{questionIndex:0,stage:'join',updatedAt:firebase.database.ServerValue.TIMESTAMP}, questions}); toast('活动数据已初始化'); }
 function render(){
   if(!document.getElementById('adminBox')) return;
   document.getElementById('stageNow').textContent=stageLabel[state.stage]||state.stage; $$('#stageTabs .tab').forEach(t=>t.classList.toggle('active',t.dataset.stage===state.stage));
   const sel=document.getElementById('questionSelect'); if(sel.options.length!==cfg.defaults.questions.length){ sel.innerHTML=cfg.defaults.questions.map((x,i)=>`<option value="${i}">第${i+1}题</option>`).join(''); } sel.value=String(state.questionIndex||0);
   if(!q){document.getElementById('qTitle').value='请先初始化活动数据';return;}
   document.getElementById('qTitle').value=q.title||'-'; document.getElementById('qA').value=q.sideA||'-'; document.getElementById('qB').value=q.sideB||'-';
   const ps=Object.values(q.participants||{}); document.getElementById('countNow').textContent=`${ps.length}人加入`;
   const comments=Object.entries(q.comments||{}).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0)); const pending=comments.filter(([id,c])=>c.status==='pending'); const approved=comments.filter(([id,c])=>c.status==='approved').slice(0,20);
   const row=([id,c],isPending)=>`<div class="pending"><b>${esc(c.emoji||'✨')} ${esc(c.nickname||'匿名')}</b> · ${esc(c.side==='A'?(q.sideA||'A'):(q.sideB||'B'))}<div style="margin-top:6px;color:#fff4d6">${esc(c.text)}</div><div class="actions">${isPending?`<button class="secondary good" data-approve="${id}">通过上墙</button><button class="secondary danger" data-reject="${id}">删除</button>`:`<button class="secondary" data-hide="${id}">下墙</button>`}</div></div>`;
   document.getElementById('pendingList').innerHTML=pending.length?pending.map(x=>row(x,true)).join(''):'<p style="color:rgba(255,247,220,.65)">暂无待审核观点。</p>';
   document.getElementById('approvedList').innerHTML=approved.length?approved.map(x=>row(x,false)).join(''):'<p style="color:rgba(255,247,220,.65)">暂无已上墙观点。</p>';
   $$('[data-approve]').forEach(b=>b.onclick=()=>root.child(`questions/${state.questionIndex}/comments/${b.dataset.approve}/status`).set('approved'));
   $$('[data-reject]').forEach(b=>b.onclick=()=>root.child(`questions/${state.questionIndex}/comments/${b.dataset.reject}/status`).set('rejected'));
   $$('[data-hide]').forEach(b=>b.onclick=()=>root.child(`questions/${state.questionIndex}/comments/${b.dataset.hide}/status`).set('hidden'));
 }
 document.getElementById('loginBtn').onclick=async()=>{ try{ await auth.signInWithEmailAndPassword(document.getElementById('email').value.trim(),document.getElementById('password').value); }catch(e){ alert('登录失败：'+e.message); } };
 document.getElementById('logoutBtn').onclick=()=>auth.signOut();
 document.getElementById('initBtn').onclick=()=>initData().catch(e=>alert('初始化失败：请确认 Database Rules 已填入管理员 UID。\n'+e.message));
 document.getElementById('questionSelect').onchange=e=>root.child('state').update({questionIndex:Number(e.target.value),stage:'join',updatedAt:firebase.database.ServerValue.TIMESTAMP});
 $$('#stageTabs .tab').forEach(b=>b.onclick=()=>root.child('state').update({stage:b.dataset.stage,updatedAt:firebase.database.ServerValue.TIMESTAMP}));
 document.getElementById('resetCurrentBtn').onclick=async()=>{ if(!confirm('确定清空当前题的观众阵营和观点吗？')) return; await root.child(`questions/${state.questionIndex}`).update({participants:null,comments:null}); toast('当前题数据已清空'); };
 auth.onAuthStateChanged(u=>{ document.getElementById('loginBox').style.display=u?'none':'block'; document.getElementById('adminBox').style.display=u?'block':'none'; document.getElementById('adminEmail').textContent=u?u.email:''; if(u) render(); });
 listenState(st=>{ state=st; if(currentIndex!==st.questionIndex){ if(currentIndex!==null) offQuestion(currentIndex); currentIndex=st.questionIndex; listenQuestion(currentIndex,qq=>{q=qq;render();}); } else root.child('questions/'+currentIndex).once('value').then(s=>{q=s.val();render();}); render(); });
})();