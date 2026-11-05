/* 小地的旅行日记 · 声音（全部用 Web Audio API 现场合成，无外部音频文件，无版权音乐）
   Xiaodi's Travel Diary · sound: everything is synthesized live with the Web Audio API — no audio files, no copyrighted music.
   - 背景音乐：轻松的旅行风小曲（尤克里里式拨弦 + 木琴旋律 + 轻柔低音 + 沙锤），每次随机生成旋律，不会一模一样
   - 音效：click / correct / wrong / stamp / levelup / xp / travel / page
   - 只有用户第一次点击后才发声（浏览器自动播放规则）；静音选择保存在 localStorage */
(function(){
const KEY="xiaodi_sound";
let on=true;try{on=localStorage.getItem(KEY)!=="off"}catch(e){}
let ctx=null,master,musicBus,sfxBus,wet,noiseBuf=null,unlocked=false,timer=null,step=0,nextT=0,bar=0,melLast=7,duckUntil=0;
const listeners=[];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function init(){
  if(ctx)return true;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
  try{ctx=new AC()}catch(e){return false}
  master=ctx.createGain();master.gain.value=on?1:0;master.connect(ctx.destination);
  const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;comp.connect(master);
  musicBus=ctx.createGain();musicBus.gain.value=.15;  // 背景音乐默认很轻 / soft by default
  const lp=ctx.createBiquadFilter();lp.type="lowpass";lp.frequency.value=3400;musicBus.connect(lp);lp.connect(comp);
  sfxBus=ctx.createGain();sfxBus.gain.value=.32;sfxBus.connect(comp);
  // 简单回声，营造“空旷户外”的感觉 / simple echo for an open-air feel
  const dl=ctx.createDelay(1);dl.delayTime.value=.36;const fb=ctx.createGain();fb.gain.value=.26;wet=ctx.createGain();wet.gain.value=.5;
  const wf=ctx.createBiquadFilter();wf.type="lowpass";wf.frequency.value=2200;
  wet.connect(dl);dl.connect(wf);wf.connect(fb);fb.connect(dl);wf.connect(comp);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate*.5,ctx.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  return true}
/* ---- 乐器 / instruments ---- */
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec)}
function tone(bus,f,t,{type="sine",a=.005,v=.3,dec=.5,send=0,f2=null}={}){
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+a+dec);
  env(g,t,a,v,dec);o.connect(g);g.connect(bus);if(send){const s=ctx.createGain();s.gain.value=send;g.connect(s);s.connect(wet)}
  o.start(t);o.stop(t+a+dec+.05)}
function pluck(f,t,v=.18,send=.25){tone(musicBus,f,t,{type:"triangle",v,dec:.55,send});tone(musicBus,f*2,t,{type:"sine",v:v*.25,dec:.18})}
function mallet(bus,f,t,v=.22,send=.35){tone(bus,f,t,{type:"sine",v,dec:.7,send});tone(bus,f*4,t,{type:"sine",v:v*.18,dec:.08})}
function bass(f,t,v=.28){tone(musicBus,f,t,{type:"sine",a:.02,v,dec:.6})}
function noise(bus,t,{v=.05,dec=.05,hp=6000,lp=null,bp=null}={}){
  const s=ctx.createBufferSource();s.buffer=noiseBuf;const g=ctx.createGain();let node=s;
  const f=ctx.createBiquadFilter();f.type=bp?"bandpass":lp?"lowpass":"highpass";f.frequency.value=bp||lp||hp;node.connect(f);node=f;
  env(g,t,.003,v,dec);node.connect(g);g.connect(bus);s.start(t);s.stop(t+dec+.05)}
/* ---- 背景音乐：C 大调五声音阶，C–Am–F–G 循环，84 BPM，轻微摇摆 ---- */
const BPM=84,S16=60/BPM/4;
const PROG=[[48,[60,64,67]],[45,[57,60,64]],[41,[57,60,65]],[43,[55,59,62]],[48,[60,64,67]],[45,[57,60,64]],[41,[57,60,65]],[43,[55,62,67]]];
const PENTA=[60,62,64,67,69,72,74,76,79,81];
const STRUM=[0,4,6,10,12,14];
function schedule(){
  if(!ctx||!on)return;
  while(nextT<ctx.currentTime+.35){
    const t=nextT+(step%4===2?S16*.18:0); // swing
    const[root,ch]=PROG[bar%8];
    const duck=ctx.currentTime<duckUntil?.25:1;
    if(step===0||step===8)bass(mtof(root),t,.24*duck);
    if(STRUM.includes(step)){const down=step%4===0;const notes=down?ch:[...ch].reverse();notes.forEach((m,i)=>pluck(mtof(m),t+i*.014,(down?.09:.06)*duck,.15))}
    if(step%4===2)noise(musicBus,t,{v:.022*duck,dec:.04,hp:7000});
    // 旋律：随机游走，乐句结尾留白 / melody: gentle random walk with breathing space
    const phraseEnd=(bar%4===3&&step>=8);
    if(step%2===0&&!phraseEnd&&Math.random()<(step%4===0?.55:.28)){
      let i=melLast+[-2,-1,-1,0,1,1,2][Math.floor(Math.random()*7)];i=Math.max(2,Math.min(PENTA.length-1,i));
      if(step===0){const tones=ch.map(m=>m+12);const near=PENTA.map((m,k)=>[k,Math.abs(m-tones[0])]).sort((a,b)=>a[1]-b[1])[0][0];if(Math.random()<.5)i=near}
      melLast=i;mallet(musicBus,mtof(PENTA[i]),t,.16*duck,.4)}
    nextT+=S16;step=(step+1)%16;if(step===0)bar++}
}
function startMusic(){if(!ctx||!on||timer)return;nextT=ctx.currentTime+.08;step=0;timer=setInterval(schedule,90);schedule()}
function stopMusic(){if(timer){clearInterval(timer);timer=null}}
/* ---- 音效 / sound effects ---- */
const FX={
  click:t=>tone(sfxBus,1250,t,{type:"sine",v:.09,dec:.05,f2:900}),
  page:t=>noise(sfxBus,t,{v:.05,dec:.12,bp:2500}),
  correct:t=>{[72,76,79,84].forEach((m,i)=>mallet(sfxBus,mtof(m),t+i*.075,.26,.3))},
  wrong:t=>{tone(sfxBus,mtof(64),t,{type:"triangle",v:.16,dec:.18});tone(sfxBus,mtof(60),t+.13,{type:"triangle",v:.14,dec:.3,f2:mtof(58)})},
  xp:t=>{tone(sfxBus,mtof(84),t,{type:"sine",v:.12,dec:.12});tone(sfxBus,mtof(91),t+.06,{type:"sine",v:.1,dec:.18})},
  stamp:t=>{tone(sfxBus,140,t,{type:"sine",a:.002,v:.7,dec:.28,f2:45});noise(sfxBus,t,{v:.35,dec:.12,lp:900});
    [79,84,88].forEach((m,i)=>mallet(sfxBus,mtof(m),t+.16+i*.06,.2,.5))},
  levelup:t=>{[60,64,67,72,76].forEach((m,i)=>{mallet(sfxBus,mtof(m),t+i*.09,.22,.35)});
    [72,76,79,84].forEach(m=>tone(sfxBus,mtof(m),t+.5,{type:"triangle",a:.02,v:.08,dec:1.1,send:.4}))},
  travel:t=>{noise(sfxBus,t,{v:.08,dec:.5,bp:900});[88,84].forEach((m,i)=>mallet(sfxBus,mtof(m),t+.15+i*.22,.18,.5));[88,84].forEach((m,i)=>mallet(sfxBus,mtof(m),t+.7+i*.22,.14,.5))}
};
function play(name){if(!on||!ctx||!unlocked)return;const f=FX[name];if(!f)return;try{f(ctx.currentTime+.01)}catch(e){}}
function unlock(){if(!init())return;if(ctx.state==="suspended")ctx.resume();unlocked=true;if(on)startMusic()}
function setOn(v){on=!!v;try{localStorage.setItem(KEY,on?"on":"off")}catch(e){}
  if(ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(on?1:0,ctx.currentTime,.08);if(on){if(ctx.state==="suspended")ctx.resume();startMusic()}else stopMusic()}
  listeners.forEach(f=>f(on))}
function duck(ms){if(ctx)duckUntil=ctx.currentTime+ms/1000}
// 第一次点击/按键后才开始（自动播放规则）/ start only after the first user gesture
const first=()=>{unlock();["pointerdown","keydown","touchstart"].forEach(e=>window.removeEventListener(e,first,true))};
["pointerdown","keydown","touchstart"].forEach(e=>window.addEventListener(e,first,true));
document.addEventListener("visibilitychange",()=>{if(!ctx)return;if(document.hidden){stopMusic();ctx.suspend()}else if(on&&unlocked){ctx.resume();startMusic()}});
window.XDSound={play,unlock,setOn,toggle:()=>setOn(!on),isOn:()=>on,onChange:f=>listeners.push(f),duck,isPlaying:()=>!!timer,state:()=>ctx?ctx.state:"none"};
})();
