/* ============================================================
   HACK SCREEN — Full glitch, screen flicker, crash effect
   ============================================================ */

function runHackAnimation(onDone) {

  const overlay = document.getElementById('hack-overlay');
  const body    = document.getElementById('hack-body');
  const fill    = document.getElementById('hack-prog-fill');
  const label   = document.getElementById('hack-prog-label');

  // ── PHASE CONTROLLER ──
  // Phase 1 (0-2s):   Screen flickers, glitches, "crash" effect
  // Phase 2 (2-5s):   Terminal boots up with scan lines
  // Phase 3 (5-10s):  Hack lines print, progress bar fills
  // Phase 4 (10-11s): Final flash + screen goes black
  // Phase 5 (11s+):   Cheat video revealed

  // ── GLITCH CANVAS (drawn on top of everything) ──
  const gc = document.createElement('canvas');
  gc.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
  gc.width = window.innerWidth; gc.height = window.innerHeight;
  document.body.appendChild(gc);
  const gctx = gc.getContext('2d');

  // ── SCREEN FLASH LAYER ──
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;background:white;opacity:0;transition:opacity 0.05s;';
  document.body.appendChild(flash);

  // ── BLACK OUT LAYER ──
  const blackout = document.createElement('div');
  blackout.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;background:black;opacity:0;';
  document.body.appendChild(blackout);

  // ── NOISE / STATIC ──
  function drawNoise(intensity) {
    const idata = gctx.createImageData(gc.width, gc.height);
    const data  = idata.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.random() < intensity ? (Math.random()*255) : 0;
      data[i]=v; data[i+1]=v*0.3; data[i+2]=v*0.1; data[i+3]=v*0.9;
    }
    gctx.putImageData(idata, 0, 0);
  }

  // ── RGB SHIFT GLITCH ──
  function drawRGBShift() {
    const W = gc.width, H = gc.height;
    gctx.clearRect(0,0,W,H);
    // Horizontal tear lines
    const numTears = Math.floor(Math.random()*8)+3;
    for(let i=0;i<numTears;i++){
      const y      = Math.random()*H;
      const height = Math.random()*30+5;
      const shiftR = (Math.random()-0.5)*60;
      const shiftB = (Math.random()-0.5)*60;
      // Red channel shift
      gctx.fillStyle = `rgba(255,0,0,0.4)`;
      gctx.fillRect(shiftR, y, W, height);
      // Blue channel shift
      gctx.fillStyle = `rgba(0,100,255,0.35)`;
      gctx.fillRect(shiftB, y+2, W, height);
      // White tear
      gctx.fillStyle = `rgba(255,255,255,0.15)`;
      gctx.fillRect(0, y, W, 2);
    }
    // Random glitch blocks
    for(let i=0;i<5;i++){
      const bx=Math.random()*W, by=Math.random()*H;
      const bw=Math.random()*200+50, bh=Math.random()*20+5;
      gctx.fillStyle=`rgba(${Math.random()>0.5?255:0},${Math.random()>0.5?255:0},${Math.random()>0.5?255:0},0.3)`;
      gctx.fillRect(bx,by,bw,bh);
    }
  }

  // ── SCREEN FLICKER ──
  function flicker(times, speed, intensity, onEnd) {
    let count = 0;
    const iv = setInterval(()=>{
      const on = count%2===0;
      blackout.style.opacity = on ? '1' : '0';
      blackout.style.transition = `opacity ${speed}ms`;
      if(on && intensity>0.3) drawNoise(intensity);
      else if(!on) gctx.clearRect(0,0,gc.width,gc.height);
      count++;
      if(count > times*2){ clearInterval(iv); blackout.style.opacity='0'; if(onEnd)onEnd(); }
    }, speed);
  }

  // ── WHITE FLASH ──
  function whiteFlash(dur=80) {
    flash.style.opacity='1';
    setTimeout(()=>{ flash.style.opacity='0'; }, dur);
  }

  // ── SCAN LINE EFFECT on terminal ──
  function addScanLines() {
    const sl = document.createElement('div');
    sl.style.cssText=`position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,65,0.03) 2px,rgba(0,255,65,0.03) 4px);pointer-events:none;z-index:1;border-radius:8px;animation:scanMove 8s linear infinite;`;
    overlay.style.position='relative';
    overlay.appendChild(sl);
  }

  // ── ADD SCANMOVE KEYFRAME ──
  if(!document.getElementById('scanMoveStyle')){
    const style=document.createElement('style');
    style.id='scanMoveStyle';
    style.textContent=`@keyframes scanMove{from{background-position:0 0}to{background-position:0 100px}}`;
    document.head.appendChild(style);
  }

  // ── HACK LOG LINES ──
  const LINES = [
    {t:'SYSTEM BREACH INITIATED',                     cls:'red-txt',    d:0},
    {t:'> Scanning target device...',                 cls:'',           d:300},
    {t:'> IP Address located: 192.168.'+rnd()+'.'+rnd(), cls:'yellow-txt', d:700},
    {t:'> Device OS: Android 13 / Chrome Browser',   cls:'white-txt',  d:1100},
    {t:'> Bypassing security protocols...',           cls:'dim-txt',    d:1500},
    {t:'> ACCESS GRANTED ✓',                          cls:'red-txt',    d:1900},
    {t:'> Reading contact list...',                   cls:'',           d:2300},
    {t:'  [FOUND] '+rndNum(80,200)+' contacts extracted',cls:'white-txt',d:2700},
    {t:'> Accessing SMS messages...',                 cls:'',           d:3000},
    {t:'  [FOUND] '+rndNum(1000,9999)+' messages copied', cls:'white-txt',d:3400},
    {t:'> Accessing camera roll...',                  cls:'red-txt',    d:3700},
    {t:'  [FOUND] '+rndNum(200,800)+' photos uploaded',   cls:'white-txt',d:4100},
    {t:'> Accessing bank apps...',                    cls:'red-txt',    d:4500},
    {t:'  [ERROR] bKash: insufficient permissions 😅',cls:'yellow-txt', d:4900},
    {t:'> Uploading data to remote server...',        cls:'red-txt',    d:5400},
    {t:'  185.220.101.47 — connection established',   cls:'dim-txt',    d:5800},
    {t:'  ████████████████████ 100%',                 cls:'yellow-txt', d:6400},
    {t:'> UPLOAD COMPLETE. Your data is mine. 😈',   cls:'red-txt',    d:6900},
    {t:'',                                            cls:'',           d:7300},
    {t:'> Kidding lol 😂 — but don\'t refresh again!', cls:'white-txt',d:7600},
  ];

  const PROGRESS = [
    {p:8,  l:'Initializing breach...',      t:100},
    {p:22, l:'Locating device...',           t:800},
    {p:38, l:'Bypassing firewall...',        t:1600},
    {p:52, l:'Extracting contacts...',       t:2800},
    {p:65, l:'Reading messages...',          t:3500},
    {p:78, l:'Accessing camera...',          t:4200},
    {p:88, l:'Uploading data...',            t:5500},
    {p:100,l:'COMPLETE 😈',                  t:7000},
  ];

  function rnd(){ return Math.floor(Math.random()*254)+1; }
  function rndNum(min,max){ return Math.floor(Math.random()*(max-min))+min; }

  // ══════════════════════════════
  // START SEQUENCE
  // ══════════════════════════════

  // PHASE 1: Immediate white flash + heavy glitch (0-800ms)
  whiteFlash(120);
  drawNoise(0.6);
  setTimeout(()=>{
    drawRGBShift();
    whiteFlash(60);
  }, 150);
  setTimeout(()=>{ drawNoise(0.4); }, 300);
  setTimeout(()=>{ drawRGBShift(); whiteFlash(80); }, 450);
  setTimeout(()=>{ drawNoise(0.3); }, 600);

  // PHASE 2: Screen goes black (800-1200ms)
  setTimeout(()=>{
    gctx.clearRect(0,0,gc.width,gc.height);
    blackout.style.transition='opacity 0.2s';
    blackout.style.opacity='1';
  }, 800);

  // PHASE 3: Rapid flicker (1200-2000ms)
  setTimeout(()=>{
    let fc=0;
    const fiv=setInterval(()=>{
      const isOn=fc%2===0;
      blackout.style.opacity=isOn?'0':'1';
      if(isOn){drawNoise(0.2);}else{gctx.clearRect(0,0,gc.width,gc.height);}
      fc++;
      if(fc>10){ clearInterval(fiv); blackout.style.opacity='0'; gctx.clearRect(0,0,gc.width,gc.height); }
    }, 80);
  }, 1200);

  // PHASE 4: Terminal appears with glitch (2100ms)
  setTimeout(()=>{
    overlay.style.display='flex';
    addScanLines();
    // RGB shift burst as terminal "loads"
    let gb=0;
    const giv=setInterval(()=>{
      drawRGBShift();
      gb++;
      if(gb>6){ clearInterval(giv); gctx.clearRect(0,0,gc.width,gc.height); }
    },100);
  }, 2100);

  // PHASE 5: Ongoing subtle glitch every 2-4 seconds
  let glitchRunning=true;
  function scheduleGlitch(){
    if(!glitchRunning)return;
    setTimeout(()=>{
      if(!glitchRunning)return;
      whiteFlash(30);
      drawRGBShift();
      setTimeout(()=>{ gctx.clearRect(0,0,gc.width,gc.height); },120);
      // Random blackout blink
      if(Math.random()>0.5){
        setTimeout(()=>{ blackout.style.transition='opacity 0.05s'; blackout.style.opacity='0.8'; },60);
        setTimeout(()=>{ blackout.style.opacity='0'; },160);
      }
      scheduleGlitch();
    }, 1800+Math.random()*2500);
  }
  setTimeout(scheduleGlitch, 2500);

  // PHASE 6: Print hack lines + progress
  LINES.forEach(line=>{
    setTimeout(()=>{
      if(!line.t){body.appendChild(document.createElement('br'));return;}
      const span=document.createElement('span');
      span.className='hack-line '+(line.cls||'');
      // Typewrite each line
      let i=0; span.textContent='';
      body.appendChild(span);
      const iv=setInterval(()=>{
        span.textContent+=line.t[i++];
        body.scrollTop=body.scrollHeight;
        if(i>=line.t.length)clearInterval(iv);
      },18);
    }, line.d + 2100);
  });

  PROGRESS.forEach(step=>{
    setTimeout(()=>{
      fill.style.width=step.p+'%';
      label.textContent=step.l;
    }, step.t + 2100);
  });

  // PHASE 7: Final crash flash before reveal (9.8s)
  setTimeout(()=>{
    glitchRunning=false;
    gctx.clearRect(0,0,gc.width,gc.height);
    // Big finale: rapid flicker 5 times then black
    let fc2=0;
    const fiv2=setInterval(()=>{
      const on=fc2%2===0;
      blackout.style.transition='opacity 0.04s';
      blackout.style.opacity=on?'1':'0';
      if(on)whiteFlash(40);
      fc2++;
      if(fc2>10){
        clearInterval(fiv2);
        blackout.style.opacity='1';
      }
    },80);
  }, 9800);

  // PHASE 8: Reveal cheat video (10.5s)
  setTimeout(()=>{
    glitchRunning=false;
    overlay.style.display='none';
    blackout.style.transition='opacity 0.5s';
    blackout.style.opacity='0';
    gctx.clearRect(0,0,gc.width,gc.height);
    // Cleanup
    setTimeout(()=>{ gc.remove(); flash.remove(); blackout.remove(); },600);

    const reveal=document.getElementById('cheat-reveal');
    reveal.classList.remove('hidden');
    reveal.classList.add('showing');

    const v=document.getElementById('cheat-video');
    if(v){ v.muted=true; v.play().then(()=>setTimeout(()=>{v.muted=false;},300)).catch(()=>{}); }

    if(onDone)onDone();
  }, 10500);
}