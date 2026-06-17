(function(){
  const cfg = window.MT_DEBATE_CONFIG;
  if (!cfg) throw new Error('Missing config.js');
  if (!firebase.apps.length) firebase.initializeApp(cfg.firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.database();
  const root = db.ref('events/' + cfg.eventId);
  const EMOJIS = ['🌟','🚀','✨','🔥','💡','🧭','🎯','🌈','🪩','🦋','🌻','🍑','🍒','🧡','💎','🪄','⚡️','☀️','🌙','🪐','🎨','📸','🧠','🫶','🏆','🌊','🍀','💫','🧩','🎈'];
  const $ = (s, el=document)=>el.querySelector(s);
  const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));
  const esc = (v='')=>String(v).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const clamp = (v,n)=>(v||'').trim().slice(0,n);
  const getBaseUrl = () => {
    const u = new URL(window.location.href);
    u.hash = '';
    u.search = '';
    u.pathname = u.pathname.replace(/\/(screen|mobile|admin)\/?$/, '/');
    return u.href;
  };
  const getMobileUrl = () => new URL('mobile/', getBaseUrl()).href;
  const getCurrent = async () => (await root.child('state').once('value')).val() || {questionIndex:0, stage:'join'};
  const qRef = (i)=>root.child('questions/'+Number(i||0));
  function setText(id, text){ const el=document.getElementById(id); if(el) el.textContent=text; }
  function waitForAuth(){ return new Promise(resolve=>{ const u=auth.currentUser; if(u) return resolve(u); const unsub=auth.onAuthStateChanged(user=>{ if(user){ unsub(); resolve(user); } }); }); }
  async function ensureAnon(){
    if (auth.currentUser) return auth.currentUser;
    await auth.signInAnonymously();
    return waitForAuth();
  }
  function listenState(cb){ root.child('state').on('value', s=>cb(s.val()||{questionIndex:0,stage:'join'})); }
  function listenQuestion(i, cb){ return qRef(i).on('value', s=>cb(s.val()||null)); }
  function offQuestion(i){ qRef(i).off(); }
  window.MTApp = {cfg, auth, db, root, EMOJIS, $, $$, esc, clamp, getBaseUrl, getMobileUrl, getCurrent, qRef, ensureAnon, waitForAuth, listenState, listenQuestion, offQuestion, setText};
})();
