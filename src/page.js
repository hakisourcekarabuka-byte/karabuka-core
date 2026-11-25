// The chat page. Visitor and model text is only ever set with textContent (never innerHTML).
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const SUGGESTIONS = ["شو هي AZIFLOW؟", "شو الخدمات اللي بتقدموها؟", "كيف بتواصل معكم؟"];

export const PAGE = (name) => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>${esc(name)} · AZIFLOW</title>
<style>
:root{--bg:#f3f6f5;--card:#fff;--fg:#14201b;--muted:#5b6862;--line:#dde3e0;--accent:#1f6b4a;--accent2:#2f9e6e;--me:#e1efe8;--glow:rgba(47,158,110,.35)}
@media (prefers-color-scheme:dark){:root{--bg:#0b110f;--card:#141d19;--fg:#e6ece9;--muted:#93a29b;--line:#24302b;--accent:#5fc496;--accent2:#8fe0b9;--me:#18302a;--glow:rgba(95,196,150,.28)}}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--fg);font:16px/1.65 system-ui,"Segoe UI",Tahoma,sans-serif;display:flex;flex-direction:column}
header{display:flex;align-items:center;gap:12px;padding:14px max(16px,env(safe-area-inset-right)) 14px max(16px,env(safe-area-inset-left));border-bottom:1px solid var(--line)}
.orb{width:34px;height:34px;border-radius:50%;flex:none;background:radial-gradient(circle at 35% 30%,var(--accent2),var(--accent) 60%,transparent 72%);box-shadow:0 0 18px var(--glow);animation:pulse 3.2s ease-in-out infinite}
.busy .orb{animation-duration:.9s}
@keyframes pulse{50%{box-shadow:0 0 30px var(--glow);transform:scale(1.06)}}
header b{font-size:17px}
header small{display:block;color:var(--muted);font-size:13px;line-height:1.2}
#log{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;gap:10px;max-width:760px;width:100%;margin:0 auto}
.m{max-width:85%;padding:10px 14px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere;animation:in .18s ease-out}
@keyframes in{from{opacity:.4;transform:translateY(4px)}}
.user{align-self:flex-start;background:var(--me);border-end-start-radius:4px}
.assistant{align-self:flex-end;background:var(--card);border:1px solid var(--line);border-end-end-radius:4px}
.err{align-self:center;color:var(--muted);font-size:14px}
.dots{display:inline-flex;gap:4px;padding:4px 0}
.dots i{width:7px;height:7px;border-radius:50%;background:var(--muted);animation:blink 1s infinite}
.dots i:nth-child(2){animation-delay:.15s}.dots i:nth-child(3){animation-delay:.3s}
@keyframes blink{50%{opacity:.25}}
#chips{display:flex;flex-wrap:wrap;gap:8px;max-width:760px;width:100%;margin:0 auto;padding:0 16px 8px}
#chips button{background:var(--card);color:var(--fg);border:1px solid var(--line);font-weight:500;padding:6px 12px;border-radius:999px}
#chips button:hover{border-color:var(--accent)}
form{display:flex;gap:8px;padding:12px max(16px,env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));border-top:1px solid var(--line);max-width:760px;width:100%;margin:0 auto}
input{flex:1;min-width:0;font:inherit;padding:11px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:var(--fg)}
button{font:inherit;font-weight:600;padding:10px 18px;border:0;border-radius:12px;background:var(--accent);color:#fff;cursor:pointer}
@media (prefers-color-scheme:dark){form button{color:#0b110f}}
button:disabled{opacity:.5;cursor:default}
header .ghost{margin-inline-start:auto;background:transparent;color:var(--muted);border:1px solid var(--line);font-weight:500;font-size:13px;padding:6px 12px}
header .ghost:hover{color:var(--fg);border-color:var(--accent)}
input:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>
</head>
<body>
<header><div class="orb" aria-hidden="true"></div><div><b>${esc(name)}</b><small>عقل AZIFLOW</small></div><button id="clr" type="button" class="ghost" title="بيمسح اللي بتذكره المحادثة">محادثة جديدة</button></header>
<main id="log" aria-live="polite"></main>
<div id="chips"></div>
<form id="f">
  <input id="q" maxlength="500" autocomplete="off" placeholder="اكتب سؤالك…" aria-label="سؤالك">
  <button id="b" type="submit">إرسال</button>
</form>
<script>
const log=document.getElementById('log'),f=document.getElementById('f'),q=document.getElementById('q'),b=document.getElementById('b'),chips=document.getElementById('chips');
const history=[];
// A random id kept in this browser only, so the chat remembers this visitor for a day.
let sid='';try{sid=localStorage.getItem('karabuka.sid')||'';if(!/^[A-Za-z0-9_-]{16,64}$/.test(sid)){sid=crypto.randomUUID().replace(/-/g,'');localStorage.setItem('karabuka.sid',sid)}}catch{sid=''}
const ERR={rate_limited:'كثير طلبات، استنى دقيقة.',message_too_long:'الرسالة طويلة كثير.',ai_unavailable:'الخدمة مش متاحة هلأ، جرّب بعد شوي.'};
function add(cls,text){const d=document.createElement('div');d.className='m '+cls;if(text!=null)d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
add('assistant','أهلاً! أنا ${esc(name)}. اسألني أي إشي عن AZIFLOW.');
${JSON.stringify(SUGGESTIONS)}.forEach(s=>{const c=document.createElement('button');c.type='button';c.textContent=s;c.onclick=()=>send(s);chips.appendChild(c)});
async function send(msg){
  msg=msg.trim();if(!msg||b.disabled)return;
  chips.hidden=true;add('user',msg);q.value='';b.disabled=true;document.body.classList.add('busy');
  const out=add('assistant');out.innerHTML='<span class="dots"><i></i><i></i><i></i></span>';
  let text='';
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:msg,history,stream:true,sid:sid||undefined})});
    if(!r.ok){let e='';try{e=(await r.json()).error}catch{}out.remove();add('err',ERR[e]||'صار خطأ.');}
    else{
      const rd=r.body.getReader(),dec=new TextDecoder();
      for(;;){const {done,value}=await rd.read();if(done)break;text+=dec.decode(value,{stream:true});out.textContent=text;log.scrollTop=log.scrollHeight}
      text=text.trim();
      if(text){out.textContent=text;history.push({role:'user',content:msg},{role:'assistant',content:text});}
      else{out.remove();add('err','ما وصل رد، جرّب كمان مرة.');}
    }
  }catch{out.remove();add('err','ما في اتصال.')}
  b.disabled=false;document.body.classList.remove('busy');q.focus();
}
f.addEventListener('submit',e=>{e.preventDefault();send(q.value)});
const memo=(forget)=>fetch('/api/history',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sid,forget})}).then(r=>r.ok?r.json():{history:[]});
if(sid)memo(false).then(d=>{const h=Array.isArray(d.history)?d.history:[];if(!h.length||history.length)return;chips.hidden=true;for(const m of h){history.push(m);add(m.role,m.content)}}).catch(()=>{});
document.getElementById('clr').onclick=()=>{history.length=0;log.textContent='';chips.hidden=false;add('assistant','بلّشنا من جديد. شو بدك تعرف عن AZIFLOW؟');if(sid)memo(true).catch(()=>{})};
</script>
</body>
</html>`;
