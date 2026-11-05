/* 小地的声音：朗读 + 语音回答。
   朗读：固定台词用预先生成的高质量录音（assets/voice/，云夏 / Guy 神经网络声音），按“句子”查表播放；
         查不到的句子（带名字、数字、拼接的话）才用浏览器自带的 speechSynthesis 读。
   Read-aloud: fixed lines play pre-generated clips (looked up per sentence by hash); anything else falls back to browser TTS.
   语音回答：SpeechRecognition / webkitSpeechRecognition。 */
(function(){
"use strict";
const KEY="xiaodi_tts";
const SS=("speechSynthesis" in window)&&typeof window.SpeechSynthesisUtterance!=="undefined"?window.speechSynthesis:null;
const HAS_AUDIO=typeof window.Audio!=="undefined";
let on=true;try{on=localStorage.getItem(KEY)!=="off"}catch(e){}
let gestured=false,voices=[],cache={},speaking=false,seq=0,listeners=[];
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
const BASE=(window.XD_VOICE_BASE||"assets/voice/");
const MAN=window.XD_VOICE_MANIFEST||{zh:{},en:{}};   // {zh:{hash:1,...},en:{...}}（见 assets/voice/manifest.js）

/* ---- 浏览器声音兜底：优先云夏（儿童男声）/ Guy，其次儿童、男声 ---- */
const CHILD=/child|kid|boy|junior|young|小孩|儿童|童|男孩|Yunxia/i;
const MALE_ZH=/Yunxi|Yunyang|Yunjian|Yunfeng|Yunhao|Yunze|Kangkang|Liang|Li-mu|male|男/i;
const MALE_EN=/Junior|Guy|Ryan|Eric|Christopher|Davis|Andrew|Brian|Daniel|Alex|Fred|Aaron|Arthur|Tom|Rishi|\bMale\b/i;
const FEMALE=/female|女|Xiaoxiao|Xiaoyi|Ting-?Ting|Mei-?Jia|Sin-?ji|Huihui|Yaoyao|Samantha|Karen|Moira|Tessa|Victoria|Zira|Aria|Jenny|Susan|Hazel/i;
function loadVoices(){if(!SS)return;try{const v=SS.getVoices()||[];if(v.length){voices=v;cache={}}}catch(e){}}
function pick(lang){if(cache[lang]!==undefined)return cache[lang];loadVoices();
  const zh=lang.startsWith("zh");
  const L=voices.filter(v=>{const l=String(v.lang||"").replace("_","-").toLowerCase();return zh?(l.startsWith("zh-cn")||l==="zh"||l.startsWith("cmn")||l.startsWith("zh-hans")):l.startsWith("en")});
  if(!L.length){cache[lang]=null;return null}
  const score=v=>{const n=v.name||"";const l=String(v.lang||"").replace("_","-").toLowerCase();let s=0;
    if(zh&&/Yunxia/i.test(n))s+=20;if(!zh&&/\bGuy\b/i.test(n))s+=20;   // 和录音同一个声音
    if(CHILD.test(n))s+=8;
    if((zh?MALE_ZH:MALE_EN).test(n))s+=4;
    if(FEMALE.test(n))s-=2;
    if(zh&&l==="zh-cn")s+=2;if(!zh&&(l==="en-us"||l==="en-gb"))s+=1;
    if(/Natural|Neural|Online|Premium|Enhanced/i.test(n))s+=1;
    if(v.localService)s+=.5;return s};
  const best=[...L].sort((a,b)=>score(b)-score(a))[0];cache[lang]=best;return best}
/* 音调/语速：云夏用原声；Guy 和录音一样稍微调高、快 8%；其他声音调高到像小男孩 */
function params(v,zh){const n=(v&&v.name)||"";if(zh&&/Yunxia/i.test(n))return{pitch:1,rate:1};if(!zh&&/\bGuy\b/i.test(n))return{pitch:1.25,rate:1.08};
  const child=CHILD.test(n);return{pitch:child?1.25:(zh?1.6:1.65),rate:zh?1.08:1.1}}

/* ---- 文字清洗：去掉 HTML、emoji、装饰符号（生成录音的脚本用的是同一套规则）---- */
function clean(t){let s=String(t||"");
  s=s.replace(/<br\s*\/?>/gi,"。").replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
  s=s.replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu,"");
  s=s.replace(/[✓✔✕✖★☆⭐→←↑↓…]+/g,m=>m==="…"?"，":" ").replace(/[“”"「」『』《》]/g,"").replace(/\s*\n+\s*/g,"。").replace(/[ \t]{2,}/g," ").replace(/([。！？!?，,])\1+/g,"$1").trim();
  return s}
/* 切成句子：录音就是按这些句子生成的 / split into sentences (same rule as the generator) */
function sents(s){const parts=s.match(/[^。！？!?；;]+[。！？!?；;]*|[。！？!?；;]+/g)||[s];
  return parts.flatMap(p=>p.replace(/\b(Mr|Mrs|Ms|Dr|St|vs|etc|No)\.\s+/g,"$1\u0002").replace(/([.])\s+(?=[A-Z0-9“"(])/g,"$1\u0001").split("\u0001")).map(p=>p.replace(/\u0002/g,". ").replace(/^[\s，,、：:）)]+/,"").replace(/\s+/g," ").trim()).filter(p=>/[\p{L}\p{N}]/u.test(p))}
/* FNV-1a 32 位哈希（UTF-8），和生成脚本一致 */
function hash(str){const b=new TextEncoder().encode(str);let h=0x811c9dc5;for(let i=0;i<b.length;i++){h^=b[i];h=Math.imul(h,0x01000193)>>>0}return("0000000"+h.toString(16)).slice(-8)}
const clipOf=(L,t)=>{const h=hash(L+"|"+t);return MAN[L]&&MAN[L][h]?BASE+L+"/"+h+".mp3":null};
/* Chrome 长句会被截断：浏览器朗读按 ≤140 字分段 */
function chunks(s){const parts=s.match(/[^。！？!?；;\n]+[。！？!?；;]*|[。！？!?；;]+/g)||[s];const out=[];let cur="";
  for(const p of parts){if((cur+p).length>140&&cur){out.push(cur);cur=p}else cur+=p}if(cur.trim())out.push(cur);
  return out.flatMap(c=>c.length>200?c.match(/.{1,180}/g):[c]).filter(c=>/[\p{L}\p{N}]/u.test(c))}

function emit(){listeners.forEach(f=>{try{f()}catch(e){}})}
function duck(ms){try{window.XDSound&&window.XDSound.duck(ms)}catch(e){}}
const soundMuted=()=>{try{return !!(window.XDSound&&!window.XDSound.isOn())}catch(e){return false}};
/* 一个固定的 <audio>（iOS 要在第一次点按时“解锁”同一个元素）*/
let AUD=null;function aud(){if(!AUD&&HAS_AUDIO){AUD=new Audio();AUD.preload="auto";AUD.setAttribute("playsinline","")}return AUD}
let watchdog=null,queue=[],stats={mp3:0,tts:0,fail:0};
function stop(){seq++;queue=[];if(AUD){try{AUD.onended=AUD.onerror=null;AUD.pause()}catch(e){}}
  if(SS){try{SS.cancel()}catch(e){}}if(speaking){speaking=false;duck(0);emit()}clearInterval(watchdog)}
function finish(my){if(my!==seq)return;speaking=false;duck(0);clearInterval(watchdog);emit()}
function ttsItem(text,L,my,next){if(!SS){next();return}const zh=L==="zh";const v=pick(zh?"zh-CN":"en-US");const pr=params(v,zh);const parts=chunks(text);if(!parts.length){next();return}
  try{if(SS.paused)SS.resume()}catch(e){}
  parts.forEach((c,i)=>{const u=new SpeechSynthesisUtterance(c);u.lang=v?v.lang:(zh?"zh-CN":"en-US");if(v)u.voice=v;u.pitch=pr.pitch;u.rate=pr.rate;u.volume=1;
    if(i===parts.length-1){u.onend=u.onerror=()=>{if(my===seq)next()}}try{SS.speak(u)}catch(e){}});
  clearInterval(watchdog);watchdog=setInterval(()=>{try{if(my!==seq){clearInterval(watchdog);return}if(!SS.speaking&&!SS.pending){clearInterval(watchdog);next()}else if(!isIOS&&SS.speaking){SS.pause();SS.resume()}}catch(e){}},9000)}
function mp3Item(it,L,my,next){const a=aud();if(!a){ttsItem(it.text,L,my,next);return}
  let done=false;const fall=()=>{if(done||my!==seq)return;done=true;stats.fail++;ttsItem(it.text,L,my,next)};
  a.onended=()=>{if(done||my!==seq)return;done=true;next()};a.onerror=fall;
  try{a.muted=false;a.src=it.src;const p=a.play();if(p&&p.catch)p.catch(e=>{if(e&&e.name==="AbortError")return;fall()})}catch(e){fall()}}
function runQueue(L,my){const it=queue.shift();if(my!==seq)return;if(!it){finish(my);return}
  const next=()=>runQueue(L,my);if(it.src){stats.mp3++;mp3Item(it,L,my,next)}else{stats.tts++;ttsItem(it.text,L,my,next)}}
/* 把一句话拆成“录音 / 浏览器朗读”的播放队列（连续的浏览器朗读句子合并）*/
function plan(text,L){const s=clean(text);const out=[];for(const t of sents(s)){const src=clipOf(L,t);if(src)out.push({src,text:t});else{const last=out[out.length-1];if(last&&!last.src)last.text+=(L==="zh"?"":" ")+t;else out.push({text:t})}}return out}
const LOG=window.__xdVoiceLog=[];
/* speak(text, lang, {force}) → true 表示开始朗读 */
function speak(text,lang,o={}){
  const L=String(lang||"").startsWith("zh")?"zh":"en";
  const items=plan(text,L);
  if(LOG.length<5000)LOG.push({L,s:sents(clean(text)),items:items.map(i=>({mp3:!!i.src,text:i.text}))});
  if(!o.force&&(!on||!gestured||soundMuted()))return false;
  if(!items.length)return false;
  if(!SS&&!items.some(i=>i.src))return false;
  stop();const my=seq;queue=items;speaking=true;emit();
  const len=items.reduce((a,i)=>a+i.text.length,0);duck(Math.min(30000,1500+len*(L==="zh"?260:75)));
  runQueue(L,my);return true}
/* 第一次点按：解锁浏览器朗读 + 同一个 <audio>（iOS）*/
function unlock(){if(gestured)return;gestured=true;loadVoices();
  if(SS){try{const u=new SpeechSynthesisUtterance(" ");u.volume=0;u.rate=2;SS.speak(u)}catch(e){}}
  const a=aud();if(a){try{a.muted=true;a.src=BASE+"silence.mp3";const p=a.play();const r=()=>{try{if(/silence\.mp3$/.test(a.src))a.pause();a.muted=false}catch(e){}};if(p&&p.then)p.then(r,r);else r()}catch(e){try{a.muted=false}catch(_){}}}emit()}
loadVoices();if(SS){try{SS.addEventListener?SS.addEventListener("voiceschanged",loadVoices):(SS.onvoiceschanged=loadVoices)}catch(e){}
  let n=0;const t=setInterval(()=>{loadVoices();if(voices.length||++n>20)clearInterval(t)},250)}
["pointerdown","keydown","touchend"].forEach(ev=>window.addEventListener(ev,unlock,{capture:true,passive:true}));
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop()});
window.addEventListener("pagehide",stop);
function setOn(v){on=!!v;try{localStorage.setItem(KEY,on?"on":"off")}catch(e){}if(!on)stop();emit()}
try{window.XDSound&&window.XDSound.onChange&&window.XDSound.onChange(()=>{if(soundMuted())stop()})}catch(e){}

/* ---------- 语音回答（STT） ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition||null;
const fileMode=location.protocol==="file:";
const secure=window.isSecureContext!==false||location.hostname==="localhost"||location.hostname==="127.0.0.1";
let rec=null,listening=false;
/* listen({lang,onInterim,onFinal,onError,onEnd}) */
function listen(o){if(!SR)return"unsupported";if(fileMode||!secure)return"insecure";
  stopListen(true);stop();
  let r;try{r=new SR()}catch(e){return"unsupported"}
  rec=r;r.lang=o.lang||"zh-CN";r.interimResults=true;r.continuous=false;r.maxAlternatives=1;
  let finalTxt="",gotFinal=false,err=null;
  r.onresult=ev=>{let interim="";for(let i=ev.resultIndex;i<ev.results.length;i++){const x=ev.results[i];if(x.isFinal)finalTxt+=x[0].transcript;else interim+=x[0].transcript}
    if(interim&&o.onInterim)o.onInterim(finalTxt+interim);if(finalTxt&&!interim)gotFinal=true};
  r.onerror=ev=>{err=ev.error||"error"};
  r.onend=()=>{if(rec===r){rec=null;listening=false}emit();
    if(err&&err!=="aborted"&&!finalTxt){o.onError&&o.onError(err);return}
    if(finalTxt.trim())o.onFinal&&o.onFinal(finalTxt.trim());else if(!err)o.onError&&o.onError("no-speech");else o.onEnd&&o.onEnd()};
  try{r.start();listening=true;emit()}catch(e){rec=null;listening=false;emit();return"error"}
  return"ok"}
function stopListen(abort){const r=rec;if(!r)return;try{abort?r.abort():r.stop()}catch(e){}if(abort){rec=null;listening=false;emit()}}

window.XDVoice={speak,stop,unlock,setOn,toggle:()=>setOn(!on),isOn:()=>on,supported:!!SS||HAS_AUDIO,isSpeaking:()=>speaking,gestured:()=>gestured,onChange:f=>listeners.push(f),clean,sents,hash,plan,pick,params,stats:()=>Object.assign({},stats),
  clips:L=>Object.keys(MAN[L]||{}).length,
  sttSupported:!!SR,fileMode,secure,listen,stopListen,isListening:()=>listening};
})();
