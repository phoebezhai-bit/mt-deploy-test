(function(){
  const {cfg, auth, root, esc, listenState, listenQuestion, offQuestion, $$} = MTApp;
  let state = {questionIndex:0, stage:'join'};
  let q = null;
  let currentIndex = null;
  let isEditingQuestion = false;
  const stageLabel = {join:'阵营选择阶段', debate:'观点滚动阶段', paused:'暂停互动', result:'结果展示阶段'};
  const textFieldIds = ['qTitle','qA','qB'];
  const toast = (t)=>{ const el=document.getElementById('toast'); if(el) el.textContent=t || ''; };
  const requireLogin = () => { if(!auth.currentUser){ alert('请先登录后台'); return false; } return true; };

  async function initData(){
    if(!requireLogin()) return;
    const questions = {};
    cfg.defaults.questions.forEach((x,i)=>{ questions[i] = {title:x.title, sideA:x.sideA, sideB:x.sideB}; });
    await root.update({
      meta:{title:cfg.defaults.title, subtitle:cfg.defaults.subtitle, updatedAt:firebase.database.ServerValue.TIMESTAMP},
      state:{questionIndex:0, stage:'join', updatedAt:firebase.database.ServerValue.TIMESTAMP},
      questions
    });
    toast('活动数据已初始化/修复');
  }

  function render(){
    const box = document.getElementById('adminBox');
    if(!box) return;
    const idx = Number(state.questionIndex || 0);
    const stageNow = document.getElementById('stageNow'); if(stageNow) stageNow.textContent = stageLabel[state.stage] || state.stage || '-';
    $$('#stageTabs .tab').forEach(t=>t.classList.toggle('active', t.dataset.stage === state.stage));
    const sel = document.getElementById('questionSelect');
    if(sel && sel.options.length !== cfg.defaults.questions.length){
      sel.innerHTML = cfg.defaults.questions.map((x,i)=>`<option value="${i}">第${i+1}题</option>`).join('');
    }
    if(sel) sel.value = String(idx);
    if(!q){
      if(!isEditingQuestion){
        const qt=document.getElementById('qTitle'); if(qt) qt.value='请先初始化活动数据';
      }
      return;
    }
    if(!isEditingQuestion){
      document.getElementById('qTitle').value = q.title || '';
      document.getElementById('qA').value = q.sideA || '';
      document.getElementById('qB').value = q.sideB || '';
    }
    const ps = Object.values(q.participants || {});
    const countNow = document.getElementById('countNow'); if(countNow) countNow.textContent = `${ps.length}人加入`;
    const comments = Object.entries(q.comments || {}).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0));
    const pending = comments.filter(([id,c])=>c.status === 'pending');
    const approved = comments.filter(([id,c])=>c.status === 'approved').slice(0,20);
    const likeCount = c => c && c.likes ? Object.keys(c.likes).filter(k=>c.likes[k]).length : 0;
    const row = ([id,c], isPending)=>`<div class="pending"><b>${esc(c.emoji||'✨')} ${esc(c.nickname||'匿名')}</b> · ${esc(c.side==='A'?(q.sideA||'A'):(q.sideB||'B'))} · <span class="admin-like">♥ ${likeCount(c)}</span><div style="margin-top:6px;color:#fff4d6">${esc(c.text)}</div><div class="actions">${isPending?`<button class="secondary good" data-approve="${id}">通过上墙</button><button class="secondary danger" data-reject="${id}">删除</button>`:`<button class="secondary" data-hide="${id}">下墙</button>`}</div></div>`;
    document.getElementById('pendingList').innerHTML = pending.length ? pending.map(x=>row(x,true)).join('') : '<p style="color:rgba(255,247,220,.65)">暂无待审核观点。</p>';
    document.getElementById('approvedList').innerHTML = approved.length ? approved.map(x=>row(x,false)).join('') : '<p style="color:rgba(255,247,220,.65)">暂无已上墙观点。</p>';
    $$('[data-approve]').forEach(b=>b.onclick=()=>root.child(`questions/${idx}/comments/${b.dataset.approve}/status`).set('approved').catch(e=>alert('通过失败：'+e.message)));
    $$('[data-reject]').forEach(b=>b.onclick=()=>root.child(`questions/${idx}/comments/${b.dataset.reject}/status`).set('rejected').catch(e=>alert('删除失败：'+e.message)));
    $$('[data-hide]').forEach(b=>b.onclick=()=>root.child(`questions/${idx}/comments/${b.dataset.hide}/status`).set('hidden').catch(e=>alert('下墙失败：'+e.message)));
  }

  document.getElementById('loginBtn').addEventListener('click', async ()=>{
    try{
      await auth.signInWithEmailAndPassword(document.getElementById('email').value.trim(), document.getElementById('password').value);
    }catch(e){ alert('登录失败：'+e.message); }
  });
  document.getElementById('logoutBtn').addEventListener('click', ()=>auth.signOut());

  textFieldIds.forEach(id=>{ const el=document.getElementById(id); if(el){ el.addEventListener('focus',()=>{isEditingQuestion=true;}); el.addEventListener('input',()=>{isEditingQuestion=true;}); }});
  document.getElementById('saveQuestionBtn').addEventListener('click', async ()=>{
    try{
      if(!requireLogin()) return;
      const idx=Number(state.questionIndex||0);
      const title=document.getElementById('qTitle').value.trim();
      const sideA=document.getElementById('qA').value.trim();
      const sideB=document.getElementById('qB').value.trim();
      if(!title || !sideA || !sideB){ toast('请完整填写辩题、A持方名称、B持方名称'); return; }
      await root.child(`questions/${idx}`).update({title, sideA, sideB, updatedAt:firebase.database.ServerValue.TIMESTAMP});
      isEditingQuestion=false;
      toast('题目文字已保存，大屏端和观众端会实时更新');
    }catch(e){ alert('保存失败：'+e.message); }
  });
  document.getElementById('initBtn').addEventListener('click', ()=>initData().catch(e=>alert('初始化失败：请确认 Database Rules 已填入管理员 UID。\n'+e.message)));

  async function updateStage(nextStage){
    try{
      if(!requireLogin()) return;
      const nextState = {questionIndex:Number(state.questionIndex||0), stage:nextStage, updatedAt:firebase.database.ServerValue.TIMESTAMP};
      await root.child('state').set(nextState);
      state = {...state, ...nextState};
      render();
      toast('已切换到：'+(stageLabel[nextStage]||nextStage));
    }catch(e){
      alert('阶段切换失败：'+e.message+'\n请确认 Realtime Database Rules 允许管理员写入 events/'+cfg.eventId+'/state。');
    }
  }
  async function updateQuestionIndex(nextIndex){
    try{
      if(!requireLogin()) return;
      isEditingQuestion=false;
      const nextState = {questionIndex:Number(nextIndex), stage:'join', updatedAt:firebase.database.ServerValue.TIMESTAMP};
      await root.child('state').set(nextState);
      state = {...state, ...nextState};
      render();
      toast('已切换到第 '+(Number(nextIndex)+1)+' 题，并进入阵营选择阶段');
    }catch(e){ alert('题目切换失败：'+e.message+'\n请确认 Realtime Database Rules 允许管理员写入 state。'); }
  }
  document.getElementById('questionSelect').addEventListener('change', e=>updateQuestionIndex(e.target.value));
  document.getElementById('stageTabs').addEventListener('click', e=>{
    const b=e.target.closest('[data-stage]');
    if(!b) return;
    e.preventDefault();
    updateStage(b.dataset.stage);
  });
  document.getElementById('resetCurrentBtn').addEventListener('click', async ()=>{
    if(!confirm('确定清空当前题的观众阵营和观点吗？')) return;
    try{ if(!requireLogin()) return; await root.child(`questions/${Number(state.questionIndex||0)}`).update({participants:null, comments:null}); toast('当前题数据已清空'); }
    catch(e){ alert('清空失败：'+e.message); }
  });

  auth.onAuthStateChanged(u=>{
    document.getElementById('loginBox').style.display = u ? 'none' : 'block';
    document.getElementById('adminBox').style.display = u ? 'block' : 'none';
    document.getElementById('adminEmail').textContent = u ? (u.email || u.uid) : '';
    if(u) render();
  });
  listenState(st=>{
    state = st || {questionIndex:0, stage:'join'};
    const idx=Number(state.questionIndex||0);
    if(currentIndex !== idx){
      if(currentIndex !== null) offQuestion(currentIndex);
      currentIndex=idx;
      listenQuestion(currentIndex, qq=>{q=qq; render();});
    } else {
      root.child('questions/'+currentIndex).once('value').then(s=>{q=s.val(); render();});
    }
    render();
  });
})();
