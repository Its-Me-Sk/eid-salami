/* ============================================================
   EID SALAMI — script.js  (IP-based tracking via Vercel API)
   ============================================================ */

/* ── COOKIE HELPERS (fallback layer on top of IP tracking) ── */
const setCookie = (n,v,d) => {
  document.cookie=`${n}=${v};expires=${new Date(Date.now()+d*864e5).toUTCString()};path=/;SameSite=Lax`;
};
const getCookie = n => document.cookie.split('; ').reduce((r,v)=>{
  const [k,val]=v.split('='); return k===n?decodeURIComponent(val):r;
},null);

/* ── CURSOR ── */
function initCursor(){
  const dot  = document.createElement('div'); dot.className='cursor';
  const ring = document.createElement('div'); ring.className='cursor-ring';
  document.body.append(dot,ring);
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{ mx=e.clientX; my=e.clientY; });
  const tick=()=>{
    dot.style.cssText=`left:${mx-6}px;top:${my-6}px`;
    rx+=(mx-rx-18)*.15; ry+=(my-ry-18)*.15;
    ring.style.cssText=`left:${rx}px;top:${ry}px`;
    requestAnimationFrame(tick);
  };
  tick();
  document.querySelectorAll('button,a,.opt').forEach(el=>{
    el.addEventListener('mouseenter',()=>{ dot.style.transform='scale(2)'; ring.style.transform='scale(1.5)'; });
    el.addEventListener('mouseleave',()=>{ dot.style.transform=''; ring.style.transform=''; });
  });
}

/* ── STAR FIELD ── */
function initStars(){
  const c=document.getElementById('bgStars'); if(!c)return;
  for(let i=0;i<120;i++){
    const s=document.createElement('div'); s.className='star';
    const sz=Math.random()*2.5+0.5;
    s.style.cssText=`
      width:${sz}px;height:${sz}px;
      left:${Math.random()*100}%;top:${Math.random()*100}%;
      --op1:${(Math.random()*0.15+0.05).toFixed(2)};
      --op2:${(Math.random()*0.6+0.3).toFixed(2)};
      --dur:${(Math.random()*4+2).toFixed(1)}s;
      --delay:-${(Math.random()*6).toFixed(1)}s;
    `;
    c.appendChild(s);
  }
}

/* ── GEOMETRIC CANVAS ── */
function initGeo(){
  const canvas=document.getElementById('bgCanvas'); if(!canvas)return;
  const ctx=canvas.getContext('2d');
  let W,H;
  const resize=()=>{ W=canvas.width=window.innerWidth; H=canvas.height=window.innerHeight; draw(); };
  function drawStar(cx,cy,r,pts,rot){
    ctx.beginPath();
    for(let i=0;i<pts*2;i++){
      const angle=(i*Math.PI/pts)+rot;
      const radius=i%2===0?r:r*0.4;
      i===0?ctx.moveTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius)
           :ctx.lineTo(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius);
    }
    ctx.closePath();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle='rgba(168,85,247,1)'; ctx.lineWidth=0.8;
    const sp=90;
    for(let x=-sp;x<W+sp;x+=sp){
      for(let y=-sp;y<H+sp;y+=sp){
        drawStar(x,y,28,8,Math.PI/8); ctx.stroke();
        drawStar(x+sp/2,y+sp/2,14,6,0); ctx.stroke();
      }
    }
    ctx.strokeStyle='rgba(168,85,247,0.3)'; ctx.lineWidth=0.4;
    for(let x=-sp;x<W+sp;x+=sp){
      for(let y=-sp;y<H+sp;y+=sp){
        ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+sp/2,y+sp/2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x+sp,y); ctx.lineTo(x+sp/2,y+sp/2); ctx.stroke();
      }
    }
  }
  window.addEventListener('resize',resize); resize();
}

/* ── SCREEN TRANSITION ── */
function showScreen(id){
  document.querySelectorAll('.screen.active').forEach(s=>{
    s.classList.remove('active'); s.classList.add('exiting');
    setTimeout(()=>{ s.classList.remove('exiting'); s.classList.add('hidden'); },500);
  });
  setTimeout(()=>{
    const el=document.getElementById(id);
    if(el){ el.classList.remove('hidden','exiting'); el.classList.add('active'); }
  },280);
}

/* ── VIDEO ── */
function tryVideo(vidId){
  const v = document.getElementById(vidId);
  if (!v) return;

  // Autoplay requires muted first — then we unmute after user interacts
  v.muted = true;
  v.play().then(() => {
    // After autoplay starts, unmute so they can hear it
    // Small delay so browser doesn't block it
    setTimeout(() => { v.muted = false; }, 300);
  }).catch(() => {
    // Autoplay blocked even muted — just show controls, user taps play
    v.muted = false;
  });
}

/* ── SHOW CHEAT SCREEN ── */
function showCheat(){
  document.querySelectorAll('.screen').forEach(s=>{ s.classList.remove('active'); s.classList.add('hidden'); });
  const cheat=document.getElementById('cheat-screen');
  if(cheat){ cheat.classList.remove('hidden'); cheat.classList.add('active'); }
  setTimeout(()=>tryVideo('cheat-video'),400);
}

function showIntro(){
  tryVideo('intro-video');
}

/* ── IP CHECK via API ── */
async function checkIP(){
  try {
    const res = await fetch('/api/check-visitor');
    const data = await res.json();
    return data.visited === true; // true = has visited before
  } catch(e) {
    // API unreachable (e.g. local dev without backend) — fall back to cookie
    return false;
  }
}

async function stampIP(){
  try {
    await fetch('/api/check-visitor', { method:'POST' });
  } catch(e) { /* silent fail */ }
}

async function markDoneIP(){
  try {
    await fetch('/api/mark-visited', { method:'POST' });
  } catch(e) { /* silent fail */ }
}

/* ── QUIZ ── */
const TOTAL=4;

function goToQuestion(n){
  if(n>=1&&n<=TOTAL) showScreen('screen-q'+n);
}

function checkAnswer(qNum,chosen,isCorrect){
  const card=document.getElementById('screen-q'+qNum); if(!card)return;
  const btns=card.querySelectorAll('.opt');
  btns.forEach(b=>b.setAttribute('disabled',''));

  btns.forEach(b=>{
    const lbl=b.querySelector('.opt-label');
    if(lbl&&lbl.textContent.trim()===chosen)
      b.classList.add(isCorrect?'is-correct':'is-wrong');
  });

  const fb=document.getElementById('fb-q'+qNum);
  if(fb){
    fb.classList.remove('hidden');
    if(isCorrect){ fb.textContent='✅ সঠিক! বাহ!'; fb.className='fb ok'; }
    else         { fb.textContent='❌ ভুল উত্তর!'; fb.className='fb bad'; }
  }

  setTimeout(()=>{
    if(isCorrect){
      if(qNum<TOTAL){
        goToQuestion(qNum+1);
      } else {
        // All correct — mark as done in both IP store and cookie
        markDoneIP();
        setCookie('eid_started','done',365);
        showScreen('screen-outro');
        setTimeout(()=>tryVideo('outro-video'),400);
      }
    } else {
      // Mark as failed in database
      fetch('/api/mark-failed', { method:'POST' }).catch(()=>{});
      showScreen('screen-wrong');
      setTimeout(()=>tryVideo('consolation-video'), 400);
    }
  },1600);
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', async ()=>{
  initStars();
  initGeo();
  initCursor();

  // Show a loading state briefly while we check the IP
  // (screens start hidden except screen-intro which shows as loading)

  // LAYER 1: Check cookie first (instant, no network)
  const cookieVisited = getCookie('eid_started');

  if(cookieVisited){
    showCheat();
    return;
  }

  // LAYER 2: Check IP via API (catches other browsers, incognito, etc.)
  const ipVisited = await checkIP();

  if(ipVisited){
    // Stamp cookie too so future checks are instant
    setCookie('eid_started','yes',7);
    showCheat();
    return;
  }

  // First ever visit — stamp both IP and cookie
  stampIP();
  setCookie('eid_started','yes',7);
  showIntro();
});