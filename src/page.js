// The chat page. Visitor text is only ever set with textContent (never innerHTML).
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const PAGE = (name) => `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)} · AZIFLOW</title>
<style>
:root{--bg:#f5f7f6;--card:#fff;--fg:#17201c;--muted:#5b6862;--line:#dde3e0;--accent:#1f6b4a;--me:#e3efe9}
@media (prefers-color-scheme:dark){:root{--bg:#101614;--card:#18211d;--fg:#e6ece9;--muted:#9aa8a1;--line:#2a3631;--accent:#5fc496;--me:#1c3329;color-scheme:dark}}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,"Segoe UI",Tahoma,sans-serif;display:flex;flex-direction:column}
header{padding:16px max(16px,env(safe-area-inset-right));border-bottom:1px solid var(--line);font-weight:700}
header span{color:var(--muted);font-weight:400;font-size:14px;margin-inline-start:8px}
#log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;max-width:760px;width:100%;margin:0 auto}
.m{max-width:85%;padding:10px 14px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
.user{align-self:flex-start;background:var(--me)}
.assistant{align-self:flex-end;background:var(--card);border:1px solid var(--line)}
.err{align-self:center;color:var(--muted);font-size:14px}
form{display:flex;gap:8px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));border-top:1px solid var(--line);max-width:760px;width:100%;margin:0 auto}
input{flex:1;min-width:0;font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--fg)}
button{font:inherit;font-weight:600;padding:10px 18px;border:0;border-radius:10px;background:var(--accent);color:#fff;cursor:pointer}
button:disabled{opacity:.5;cursor:default}
input:focus-visible,button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
</style>
</head>
<body>
<header>${esc(name)}<span>AZIFLOW</span></header>
<main id="log" aria-live="polite"></main>
<form id="f">
  <input id="q" maxlength="500" autocomplete="off" placeholder="اكتب سؤالك…" aria-label="سؤالك">
  <button id="b" type="submit">إرسال</button>
</form>
<script>
const log=document.getElementById('log'),f=document.getElementById('f'),q=document.getElementById('q'),b=document.getElementById('b');
const history=[];
const ERR={rate_limited:'كثير طلبات، استنى دقيقة.',message_too_long:'الرسالة طويلة كثير.',ai_unavailable:'الخدمة مش متاحة هلأ، جرّب بعد شوي.'};
function add(cls,text){const d=document.createElement('div');d.className='m '+cls;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;return d}
add('assistant','أهلاً! أنا ${esc(name)}. كيف بقدر أساعدك؟');
f.addEventListener('submit',async e=>{
  e.preventDefault();const msg=q.value.trim();if(!msg)return;
  add('user',msg);q.value='';b.disabled=true;
  try{
    const r=await fetch('/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:msg,history})});
    const j=await r.json();
    if(j.reply){add('assistant',j.reply);history.push({role:'user',content:msg},{role:'assistant',content:j.reply});}
    else add('err',ERR[j.error]||'صار خطأ.');
  }catch{add('err','ما في اتصال.')}
  b.disabled=false;q.focus();
});
</script>
</body>
</html>`;
