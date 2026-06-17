(function(){
 const {root, esc, getMobileUrl, listenState, listenQuestion, offQuestion} = MTApp;
 let currentIndex = null;
 const stageLabel = {join:'阵营选择中', debate:'观点提交中', paused:'暂停互动', result:'结果展示'};
 function makeQR(){ const el=document.getElementById('qr'); const url=getMobileUrl(); el.src=''; const box=document.createElement('div'); new QRCode(box,{text:url,width:320,height:320,correctLevel:QRCode.CorrectLevel.M}); setTimeout(()=>{ const img=box.querySelector('img'); const canvas=box.querySelector('canvas'); if(img) el.src=img.src; else if(canvas) el.src=canvas.toDataURL('image/png'); },50); }
 function render(q, state){
   if(!q){ document.getElementById('qTitle').textContent='请在后台初始化活动数据'; return; }
   const ps=Object.values(q.participants||{});
   const a=ps.filter(p=>p.side==='A'), b=ps.filter(p=>p.side==='B'), total=a.length+b.length;
   document.getElementById('qTitle').textContent=q.title||'';
   document.getElementById('sideAName').textContent=q.sideA||'A'; document.getElementById('sideBName').textContent=q.sideB||'B';
   document.getElementById('stagePill').textContent=stageLabel[state.stage]||state.stage||'等待中'; document.getElementById('totalPill').textContent=`${total} 位观众已加入`;
   document.getElementById('countA').textContent=a.length; document.getElementById('countB').textContent=b.length;
   document.getElementById('pctA').textContent= total? Math.round(a.length/total*100)+'%' : '0%'; document.getElementById('pctB').textContent= total? Math.round(b.length/total*100)+'%' : '0%';
   document.getElementById('avatarsA').innerHTML=a.slice(-80).map(p=>`<div class="avatar" title="${esc(p.nickname)}">${esc(p.emoji||'✨')}</div>`).join('');
   document.getElementById('avatarsB').innerHTML=b.slice(-80).map(p=>`<div class="avatar" title="${esc(p.nickname)}">${esc(p.emoji||'✨')}</div>`).join('');
   const cs=Object.values(q.comments||{}).filter(c=>c.status==='approved').sort((x,y)=>(x.createdAt||0)-(y.createdAt||0));
   const ca=cs.filter(c=>c.side==='A').slice(-8), cb=cs.filter(c=>c.side==='B').slice(-8);
   const cHtml=c=>`<div class="comment"><div class="commentTop"><span>${esc(c.emoji||'✨')}</span><b>${esc(c.nickname||'匿名')}</b></div><div class="commentText">${esc(c.text)}</div></div>`;
   document.getElementById('commentsA').innerHTML=ca.map(cHtml).join(''); document.getElementById('commentsB').innerHTML=cb.map(cHtml).join('');
 }
 let latestState={questionIndex:0,stage:'join'};
 listenState(st=>{ latestState=st; if(currentIndex!==st.questionIndex){ if(currentIndex!==null) offQuestion(currentIndex); currentIndex=st.questionIndex; listenQuestion(currentIndex,q=>render(q,latestState)); } else root.child('questions/'+currentIndex).once('value').then(s=>render(s.val(),latestState)); });
 makeQR();
})();
