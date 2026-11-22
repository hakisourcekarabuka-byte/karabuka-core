// The site widget: one script tag on any allowed AZIFLOW page adds a floating chat button.
// It opens the chat (/embed) in an iframe, so the chat keeps its own CSP and talks only to
// its own origin: the host page never sees visitor text and needs no CORS.
//   <script src="https://<worker>/widget.js" defer></script>
//   optional: data-side="left" (default right), data-label="اسأل Haki"

// Only https origins (host + optional port) may frame /embed. Anything else is dropped.
export function frameAncestors(raw) {
  const ok = String(raw || "")
    .split(/[\s,]+/)
    .filter((o) => /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+(:\d{1,5})?$/i.test(o));
  return ok.length ? ok.join(" ") : "'none'";
}

export const WIDGET = (name) => `(()=>{
const me=document.currentScript;if(!me||window.__karabuka)return;window.__karabuka=1;
const base=new URL(me.src).origin,side=me.dataset.side==='left'?'left':'right',label=me.dataset.label||${JSON.stringify("اسأل " + name)};
const host=document.createElement('div');host.style.cssText='position:fixed;bottom:20px;'+side+':20px;z-index:2147483000';
const root=host.attachShadow({mode:'closed'});
root.innerHTML='<style>'+
':host{all:initial}'+
'button{all:unset;cursor:pointer;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;color:#fff;background:radial-gradient(circle at 35% 30%,#2f9e6e,#1f6b4a 65%);box-shadow:0 6px 22px rgba(31,107,74,.45);transition:transform .15s}'+
'button:hover{transform:scale(1.06)}button:focus-visible{outline:3px solid #2f9e6e;outline-offset:3px}'+
'svg{width:26px;height:26px}'+
'.p{position:absolute;bottom:72px;'+side+':0;width:min(380px,calc(100vw - 32px));height:min(600px,calc(100vh - 110px));border:0;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.28);background:#f3f6f5;display:none}'+
'.p.o{display:block}'+
'@media (prefers-reduced-motion:reduce){button{transition:none}}'+
'</style><iframe class="p" loading="lazy"></iframe><button type="button" aria-expanded="false"></button>';
const frame=root.querySelector('iframe'),btn=root.querySelector('button');
frame.title=label;
const CHAT='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>';
const X='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function set(open){frame.classList.toggle('o',open);btn.innerHTML=open?X:CHAT;btn.setAttribute('aria-expanded',String(open));btn.setAttribute('aria-label',open?'إغلاق':label);if(open&&!frame.src)frame.src=base+'/embed'}
set(false);btn.onclick=()=>set(!frame.classList.contains('o'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&frame.classList.contains('o'))set(false)});
(document.body||document.documentElement).appendChild(host);
})();
`;
