/* ============================================================
   EID SALAMI — script.js
   Features: Timer, Confetti, Shake, Typewriter, Hack Screen
   ============================================================ */

/* ── COOKIES ── */
const setCookie = (n,v,d) => { document.cookie=`${n}=${v};expires=${new Date(Date.now()+d*864e5).toUTCString()};path=/;SameSite=Lax`; };
const getCookie = n => document.cookie.split('; ').reduce((r,v)=>{ const [k,val]=v.split('='); return k===n?decodeURIComponent(val):r; },null);

/* ── QUESTION TEXTS ── */
const QUESTIONS = {
  1: 'আমি কি সিঙ্গেল?',
  2: 'আমার কি কোনো এক্স আছে?',
  3: 'আমি কি নিজেকে নিয়ে গর্বিত?',
  4: 'আমার প্রিয় অভিনেত্রী কে?'
};
const TOTAL = 4;
const TIMER_SECS = 15;
let activeTimer = null;

/* ── CURSOR ── */
function initCursor() {
  const dot=document.createElement('div'); dot.className='cursor';
  const ring=document.createElement('div'); ring.className='cursor-ring';
  document.body.append(dot,ring);
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;});
  const tick=()=>{
    dot.style.cssText=`left:${mx-6}px;top:${my-6}px`;
    rx+=(mx-rx-18)*.15; ry+=(my-ry-18)*.15;
    ring.style.cssText=`left:${rx}px;top:${ry}px`;
    requestAnimationFrame(tick);
  };
  tick();
}

/* ── STARS ── */
function initStars() {
  const c=document.getElementById('bgStars'); if(!c)return;
  for(let i=0;i<120;i++){
    const s=document.createElement('div'); s.className='star';
    const sz=Math.random()*2.5+0.5;
    s.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--op1:${(Math.random()*.15+.05).toFixed(2)};--op2:${(Math.random()*.6+.3).toFixed(2)};--dur:${(Math.random()*4+2).toFixed(1)}s;--delay:-${(Math.random()*6).toFixed(1)}s;`;
    c.appendChild(s);
  }
}

/* ── GEO CANVAS ── */
function initGeo() {
  const canvas=document.getElementById('bgCanvas'); if(!canvas)return;
  const ctx=canvas.getContext('2d'); let W,H;
  const resize=()=>{W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;draw();};
  function drawStar(cx,cy,r,pts,rot){
    ctx.beginPath();
    for(let i=0;i<pts*2;i++){const a=(i*Math.PI/pts)+rot,rad=i%2===0?r:r*.4;i===0?ctx.moveTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad):ctx.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);}
    ctx.closePath();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);ctx.strokeStyle='rgba(168,85,247,1)';ctx.lineWidth=0.8;
    const sp=90;
    for(let x=-sp;x<W+sp;x+=sp)for(let y=-sp;y<H+sp;y+=sp){drawStar(x,y,28,8,Math.PI/8);ctx.stroke();drawStar(x+sp/2,y+sp/2,14,6,0);ctx.stroke();}
    ctx.strokeStyle='rgba(168,85,247,0.3)';ctx.lineWidth=0.4;
    for(let x=-sp;x<W+sp;x+=sp)for(let y=-sp;y<H+sp;y+=sp){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+sp/2,y+sp/2);ctx.stroke();ctx.beginPath();ctx.moveTo(x+sp,y);ctx.lineTo(x+sp/2,y+sp/2);ctx.stroke();}
  }
  window.addEventListener('resize',resize);resize();
}

/* ── SCREEN TRANSITION ── */
function showScreen(id) {
  document.querySelectorAll('.screen.active').forEach(s=>{
    s.classList.remove('active');s.classList.add('exiting');
    setTimeout(()=>{s.classList.remove('exiting');s.classList.add('hidden');},500);
  });
  setTimeout(()=>{const el=document.getElementById(id);if(el){el.classList.remove('hidden','exiting');el.classList.add('active');}},280);
}

/* ── VIDEO ── */
function tryVideo(vidId) {
  const v=document.getElementById(vidId); if(!v)return;
  const src=v.querySelector('source')?.getAttribute('src')||'';
  if(!src){v.style.display='none';return;}
  v.muted=true;
  v.play().then(()=>setTimeout(()=>{v.muted=false;},300)).catch(()=>{v.muted=false;});
}

/* ── TYPEWRITER ── */
function typewrite(elId, text, onDone) {
  const el=document.getElementById(elId); if(!el)return;
  el.textContent=''; let i=0;
  const iv=setInterval(()=>{
    el.textContent+=text[i++];
    if(i>=text.length){clearInterval(iv);if(onDone)onDone();}
  }, 55);
}

/* ── TIMER ── */
function startTimer(qNum, onTimeout) {
  clearTimer();
  let remaining = TIMER_SECS;
  const numEl  = document.getElementById(`timer-q${qNum}`);
  const arcEl  = document.getElementById(`arc-q${qNum}`);
  const circumference = 94.2;

  function update() {
    if(numEl) { numEl.textContent=remaining; numEl.classList.toggle('urgent', remaining<=5); }
    if(arcEl) {
      const offset = circumference - (remaining/TIMER_SECS)*circumference;
      arcEl.style.strokeDashoffset=offset;
      arcEl.classList.toggle('urgent', remaining<=5);
    }
  }
  update();
  activeTimer = setInterval(()=>{
    remaining--;
    update();
    if(remaining<=0){clearTimer();if(onTimeout)onTimeout();}
  },1000);
}

function clearTimer() {
  if(activeTimer){clearInterval(activeTimer);activeTimer=null;}
}

/* ── CONFETTI ── */
function launchConfetti() {
  const canvas=document.getElementById('confetti-canvas');
  if(!canvas)return;
  canvas.width=window.innerWidth; canvas.height=window.innerHeight;
  const ctx=canvas.getContext('2d');
  const colors=['#a855f7','#f59e0b','#10b981','#ec4899','#e9d5ff','#fbbf24','#ffffff'];
  const pieces=[];
  for(let i=0;i<160;i++){
    pieces.push({
      x:Math.random()*canvas.width, y:-10-Math.random()*200,
      vx:(Math.random()-0.5)*6, vy:Math.random()*4+3,
      color:colors[Math.floor(Math.random()*colors.length)],
      size:Math.random()*8+4, angle:Math.random()*360,
      spin:(Math.random()-0.5)*8, shape:Math.random()>.5?'rect':'circle'
    });
  }
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.angle+=p.spin;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
      ctx.fillStyle=p.color; ctx.globalAlpha=Math.max(0,1-frame/120);
      if(p.shape==='rect'){ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);}
      else{ctx.beginPath();ctx.arc(0,0,p.size/2,0,Math.PI*2);ctx.fill();}
      ctx.restore();
    });
    frame++;
    if(frame<140)requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}

/* ── SCREEN SHAKE ── */
function shakeScreen() {
  const card=document.querySelector('.screen.active .card');
  if(!card)return;
  card.classList.remove('shake');
  void card.offsetWidth; // reflow
  card.classList.add('shake');
  setTimeout(()=>card.classList.remove('shake'),700);
}

/* ── HACK ANIMATION ── */
const HACK_LINES = [
  {t:'[SYS] Intrusion detected at port 443...', cls:'red-txt',   delay:0},
  {t:'[NET] Tracing IP address...', cls:'',           delay:400},
  {t:'[NET] IP: 192.168.'+Math.floor(Math.random()*255)+'.'+Math.floor(Math.random()*255), cls:'yellow-txt', delay:900},
  {t:'[SYS] Scanning device fingerprint...', cls:'',  delay:1400},
  {t:'[OK]  Device identified: Android/Chrome', cls:'white-txt', delay:1900},
  {t:'[SYS] Accessing contact list...', cls:'red-txt', delay:2400},
  {t:'[OK]  127 contacts found', cls:'white-txt',      delay:2900},
  {t:'[SYS] Reading messages...', cls:'red-txt',       delay:3300},
  {t:'[OK]  Messages extracted: 4,821', cls:'white-txt',delay:3700},
  {t:'[SYS] Uploading data to remote server...', cls:'red-txt', delay:4100},
  {t:'[NET] Connecting to 185.220.101.47...', cls:'dim-txt', delay:4500},
  {t:'████████████████ 67%', cls:'yellow-txt',          delay:5000},
  {t:'████████████████████ 89%', cls:'yellow-txt',      delay:5600},
  {t:'[OK]  Upload complete. Data secured. 😈', cls:'red-txt', delay:6200},
  {t:'[SYS] Locking device...', cls:'red-txt',          delay:6800},
  {t:'> Just kidding 😂 — but next time think twice!', cls:'white-txt', delay:7400},
];

const HACK_PROGRESS_STEPS = [
  {pct:5,  label:'Initializing breach...',      time:200},
  {pct:18, label:'Scanning open ports...',       time:700},
  {pct:33, label:'Bypassing firewall...',        time:1500},
  {pct:50, label:'Extracting device data...',    time:2800},
  {pct:67, label:'Accessing contacts...',        time:3800},
  {pct:80, label:'Uploading to remote server...',time:4800},
  {pct:95, label:'Finalizing...',                time:6000},
  {pct:100,label:'Complete. 😈',                 time:7000},
];

function runHackAnimation(onDone) {
  const body   = document.getElementById('hack-body');
  const fill   = document.getElementById('hack-prog-fill');
  const label  = document.getElementById('hack-prog-label');

  // Schedule log lines
  HACK_LINES.forEach(line=>{
    setTimeout(()=>{
      const span=document.createElement('span');
      span.className='hack-line '+(line.cls||'');
      span.textContent='$ '+line.t;
      body.appendChild(span);
      body.scrollTop=body.scrollHeight;
    }, line.delay);
  });

  // Schedule progress bar
  HACK_PROGRESS_STEPS.forEach(step=>{
    setTimeout(()=>{
      fill.style.width=step.pct+'%';
      label.textContent=step.label;
    }, step.time);
  });

  // After animation — show cheat video
  setTimeout(()=>{
    document.getElementById('hack-overlay').style.display='none';
    const reveal=document.getElementById('cheat-reveal');
    reveal.classList.remove('hidden');
    reveal.classList.add('showing');
    tryVideo('cheat-video');
    if(onDone)onDone();
  }, 8200);
}

/* ── SHOW CHEAT ── */
function showCheat() {
  document.querySelectorAll('.screen').forEach(s=>{s.classList.remove('active');s.classList.add('hidden');});
  const cheat=document.getElementById('cheat-screen');
  cheat.classList.remove('hidden');
  cheat.classList.add('active');
  // Start hack animation after tiny delay
  setTimeout(()=>runHackAnimation(()=>{}), 300);
}

/* ── QUIZ ── */
function goToQuestion(n) {
  if(n<1||n>TOTAL)return;
  clearTimer();
  showScreen('screen-q'+n);
  // Typewrite the question after screen appears
  setTimeout(()=>{
    typewrite('qt-'+n, QUESTIONS[n], ()=>{
      // Start timer only after question finishes typing
      startTimer(n, ()=>{
        // Time's up → treat as wrong answer
        handleTimeout(n);
      });
    });
  }, 400);
}

function handleTimeout(qNum) {
  const card=document.getElementById('screen-q'+qNum);
  if(!card)return;
  card.querySelectorAll('.opt').forEach(b=>b.setAttribute('disabled',''));
  shakeScreen();
  const fb=document.getElementById('fb-q'+qNum);
  if(fb){fb.textContent='⏰ সময় শেষ! ভুল হয়ে গেছে!';fb.className='fb bad';}
  fetch('/api/mark-failed',{method:'POST'}).catch(()=>{});
  setTimeout(()=>{
    showScreen('screen-wrong');
    setTimeout(()=>tryVideo('consolation-video'),400);
  },1500);
}

function checkAnswer(qNum, chosen, isCorrect) {
  clearTimer();
  const card=document.getElementById('screen-q'+qNum); if(!card)return;
  const btns=card.querySelectorAll('.opt');
  btns.forEach(b=>b.setAttribute('disabled',''));
  btns.forEach(b=>{
    const lbl=b.querySelector('.opt-label');
    if(lbl&&lbl.textContent.trim()===chosen) b.classList.add(isCorrect?'is-correct':'is-wrong');
  });
  const fb=document.getElementById('fb-q'+qNum);
  if(fb){
    fb.classList.remove('hidden');
    if(isCorrect){fb.textContent='✅ সঠিক! বাহ!';fb.className='fb ok';}
    else{fb.textContent='❌ ভুল উত্তর!';fb.className='fb bad';}
  }
  if(isCorrect){
    launchConfetti();
    setTimeout(()=>{
      if(qNum<TOTAL){goToQuestion(qNum+1);}
      else{
        setCookie('eid_started','done',365);
        fetch('/api/mark-visited',{method:'POST'}).catch(()=>{});
        showScreen('screen-outro');
        launchConfetti();
        setTimeout(()=>tryVideo('outro-video'),400);
      }
    },1600);
  } else {
    shakeScreen();
    fetch('/api/mark-failed',{method:'POST'}).catch(()=>{});
    setTimeout(()=>{
      showScreen('screen-wrong');
      setTimeout(()=>tryVideo('consolation-video'),400);
    },1600);
  }
}

/* ── INIT ── */
window.addEventListener('DOMContentLoaded',()=>{
  initStars(); initGeo(); initCursor();
  const visited=getCookie('eid_started');
  if(visited){
    showCheat();
  } else {
    setCookie('eid_started','yes',7);
    tryVideo('intro-video');
  }
});