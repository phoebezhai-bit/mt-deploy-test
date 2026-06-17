(function(){
  const cfg = window.MT_DEBATE_CONFIG;
  if (!cfg) throw new Error('Missing config.js');
  firebase.initializeApp(cfg.firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.database();
  const root = db.ref('events/' + cfg.eventId);
  const EMOJIS = ['🌟','🚀','✨','🔥','💡','🧭','🎯','🌈','🪩','🦋','🌻','🍑','🍒','🧡','💎','🪄','⚡️','☀️','🌙','🪐','🎨','📸','🧠','🫶','🏆','🌊','🍀','💫','🧩','🎈'];
  const $ = (s, el=document)=>el.querySelector(s);
  const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));
  const esc = (v='')=>String(v).replace(/[&<>"]/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const clamp = (v,n)=>(v||'').trim().slice(0,n);
  const getMobileUrl = () => new URL('./mobile/', window.location.href.replace(/\/screen\/.*/, '/')).href;
  const getCurrent = async () => (await root.child('state').once('value')).val() || {questionIndex:0, stage:'join'};
  const qRef = (i)=>root.child('questions/'+i);
  function setText(id, text){ const el=document.getElementById(id); if(el) el.textContent=text; }
  async function ensureAnon(){ if(auth.currentUser) return auth.currentUser; await auth.signInAnonymously(); return new Promise(res=>{const unsub=auth.onAuthStateChanged(u=>{if(u){unsub();res(u)}})}) }
  function listenState(cb){ root.child('state').on('value', s=>cb(s.val()||{questionIndex:0,stage:'join'})); }
  function listenQuestion(i, cb){ return qRef(i).on('value', s=>cb(s.val()||null)); }
  function offQuestion(i){ qRef(i).off(); }
  window.MTApp = {cfg, auth, db, root, EMOJIS, $, $$, esc, clamp, getMobileUrl, getCurrent, qRef, ensureAnon, listenState, listenQuestion, offQuestion, setText};
})();
