/* 小地的中国旅行日记 · 可玩原型（纯前端，规则评分，无需大模型）
   Xiaodi's Travel Diary · playable prototype (front-end only, rule-based scoring, no LLM). 中文 / English */
(function(){
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const P=window.GEO_PROVINCES, PM=Object.fromEntries(P.map(p=>[p.n,p]));
const QS=Object.fromEntries(P.flatMap(p=>p.qs.map((q,i)=>[q.id,Object.assign({prov:p.n,idx:i},q)])));
const URLP=new URLSearchParams(location.search);
const FAST=URLP.has('fast')||URLP.has('shot');

/* ---------- 语言 / Language ---------- */
const LKEY="xiaodi_lang";
let LANG=(()=>{const q=URLP.get("lang");if(q==="en"||q==="zh"){try{localStorage.setItem(LKEY,q)}catch(e){}return q}
  try{const v=localStorage.getItem(LKEY);if(v==="en"||v==="zh")return v}catch(e){}return"zh"})();
const isEN=()=>LANG==="en";
const tr=(z,e)=>isEN()?e:z;
const inL=(l,fn)=>{const o=LANG;LANG=l;try{return fn()}finally{LANG=o}};
const both=fn=>({zh:inL("zh",fn),en:inL("en",fn)});
const GE=window.GEO_EN||{},DE=window.GEO_DIM_EN||{},RE=window.GEO_REG_EN||{};
const E=n=>isEN()&&GE[n]?GE[n]:null;
const pn=n=>E(n)?E(n).n:n;
const pcap=n=>E(n)?E(n).c:PM[n].c;
const pstamp=n=>E(n)?E(n).stamp:PM[n].stamp;
const pspot=n=>E(n)?E(n).spot:PM[n].spot;
const pfood=n=>E(n)?E(n).food:PM[n].food;
const pfact=(n,d)=>E(n)?E(n).f[d]:PM[n].f[d];
const dn=d=>isEN()?(DE[d]||d):d;
const rn=r=>isEN()&&RE[r]?RE[r][0]:r;
const RSHORT={西北:"Northwest",华北:"North",东北:"Northeast",西南:"Southwest",华中:"Central",华东:"East",华南:"South",港澳台:"HK·Macao·TW"};
const rns=r=>isEN()?RSHORT[r]:r;
const ra=r=>isEN()&&RE[r]?RE[r][1]:GEO_REGIONS[r];
const LS=()=>tr("、",", ");
const enq=q=>GE[q.prov]&&GE[q.prov].qs[q.idx];
const buddy=()=>S.name?tr(S.name+"旅伴",S.name):tr("旅伴","Travel Buddy");

const DIMS=["气候","地形","美食","景点","特产","经济支柱","方言","性格特点","名人","冷知识"];
const BADGE={气候:["qihou","天气预报员","Weather Forecaster"],地形:["dixing","地形探险家","Terrain Explorer"],美食:["meishi","美食家","Foodie"],景点:["jingdian","打卡达人","Sightseeing Star"],特产:["techan","特产买手","Specialty Shopper"],经济支柱:["jingji","经济观察员","Economy Watcher"],方言:["fangyan","方言达人","Dialect Pro"],性格特点:["xingge","人情观察家","People Watcher"],名人:["mingren","名人传记官","Biography Keeper"],冷知识:["lengzhishi","冷知识王","Fun-Fact Champion"]};
const bn=d=>tr(BADGE[d][1],BADGE[d][2]);
const TIER={金:"Gold",银:"Silver",铜:"Bronze"};const tn=t=>tr(t,TIER[t]);
const LEVELS=[[0,"见习导游"],[150,"初级导游"],[400,"中级导游"],[800,"高级导游"],[1400,"金牌导游"],[2200,"地理大师"]];
const LVEN={见习导游:"Trainee Guide",初级导游:"Junior Guide",中级导游:"Skilled Guide",高级导游:"Senior Guide",金牌导游:"Gold-Medal Guide",地理大师:"Geography Master"};
const lvn=nm=>tr(nm,LVEN[nm]||nm);
const ROUTE=["西南","华南","华中","华东","华北","东北","西北","港澳台"];
/* 旅程地图节点：按真实相对方位摆放（上北下南、左西右东）；x=由西向东 %，y=由北向南 % */
const REGPOS={西北:[17,30],华北:[52,22],东北:[84,15],西南:[25,68],华中:[52,55],华东:[79,46],华南:[52,85],港澳台:[84,80]};
const NPC={华北:["huabei","京巴“京京”","Jingjing the Pekingese"],东北:["dongbei","虎妞","Huniu the Tiger Cub"],华东:["huadong","鹤先生","Mr. Crane"],华中:["huazhong","江豚船长","Captain Porpoise"],华南:["huanan","长臂猿“椰椰”","Yeye the Gibbon"],西南:["xinan","熊猫阿宝","Abao the Panda"],西北:["xibei","驼驼","Tuotuo the Camel"],港澳台:["gat","白海豚“粉粉”","Fenfen the Pink Dolphin"]};
const npcn=r=>tr(NPC[r][1],NPC[r][2]);
const XD={idle:["main","😊 准备出发","😊 Ready to go"],ask:["confused","🤔 犯迷糊中","🤔 A bit confused"],listen:["listening","👂 认真听讲","👂 Listening closely"],eureka:["eureka","💡 恍然大悟","💡 Aha!"],diary:["diary","✍️ 写游记中","✍️ Writing the diary"],cele:["celebrate","🎉 太开心了","🎉 So happy!"],oops:["oops","😅 哎呀又粗心了","😅 Oops, careless again"]};
const DAY=86400000;

/* ---------- 情感化台词池（洗牌抽取，短时间内不重复） / emotional line pools ---------- */
const LINES_ZH={
 wrong:[["oops","咦？可我的小本本上好像写的不一样……我们俩是不是都有一点点搞混了？再帮我想想～"],
  ["ask","等等等等，我脑袋上冒出一个大问号❓这个说法好像和我之前听到的不一样，你再确认一下？"],
  ["oops","嘿嘿，原来你也被迷思大王骗到过！没关系，大脑就是在“犯错—修正”里长本事的💪 再试一次？"],
  ["ask","我的地图开始转圈圈了🌀……这一句我们再核对一下，好不好？"],
  ["oops","别担心，错过一次的知识反而记得更牢！要不要翻翻📚旅行档案再讲给我听？"]],
 stuck:[["ask","我们卡住啦～要不要点“💡请求帮助”？我给你一点小线索。"],
  ["listen","慢慢来，我等你～小地最有耐心了（除了排队买小吃的时候😋）。"],
  ["ask","你已经讲到一半啦！再补一个“为什么”或者“比如”，我就能懂了！"],
  ["listen","卡住一下下很正常，大脑正在“搬家具”呢。点“📚翻秘籍”或“💡请求帮助”都可以哦～"]],
 dunno:[["ask","我也不知道呀，所以才请你教我嘛！😆"],["ask","嘿嘿，那我们俩现在是“不知道二人组”了！"],["ask","没关系～不知道是学会的第一步！"]],
 offtopic:[["ask","嘿嘿，这个我待会儿再想～不过我还卡在刚才的问题上呢，旅伴先救救我吧！"],
  ["listen","好问题！我先记在小本本“以后再聊”那一页📒，咱们先把这题搞定？"],
  ["oops","我的注意力像小猫追毛线一样跑远了🧶……拉回来拉回来！刚才那题我还没弄懂呢～"]],
 eurekaPS:["我要把这句写进游记，署上你的名字！✍️","你讲得比导游阿姨还清楚～","今天的我，比昨天的我聪明了一点点！","我的小本本又多了一页，嘿嘿。","我感觉脑袋里有一盏小灯“叮”地亮了💡"],
 silly:[["oops","刚才我把地图拿倒了，还以为海南在最北边🙈 还好想起来：地图是“上北下南、左西右东”！"],
  ["oops","我的笔记本又被我画满了小星星⭐……正事一个字都没记！快继续教我～"],
  ["cele","听你讲课比吃辣条还上头🌶️（辣条我也只剩一包了）"],
  ["oops","我刚刚把“省会”写成了“省会儿”，好像这个地方“一会儿”就会跑掉😂"],
  ["eureka","我发现一个秘密：每次你说“因为”，我就记得特别牢！"]],
 combo:["🔥 连击×{n}！你今天是“讲解永动机”吧！","🔥 连击×{n}！小地的小本本快写不下啦！","🔥 连击×{n}！迷思大王听到都在发抖～"],
 streak:["🔥 连续 {n} 天见面啦！咱俩的友谊像火锅底料一样，越熬越香～","🔥 连续 {n} 天！你比熊猫阿宝吃竹子还准时🎋","🔥 连续 {n} 天！小地请你吃一碗四川冰粉🍧，奖励坚持的你！","🔥 连续 {n} 天！我已经在护照背面偷偷给你画了一朵小红花🌺"],
 bossTaunt:["哼哼，你以为你能打败我？我的迷思可是攒了好多年的！","小地早就被我说服啦，你就别白费口舌了～","我收集了 999 个迷思，你能拆几个？嘿嘿嘿","光说“不对”可打不倒我，有本事拿出证据来！"],
 bossWrong:["哈哈哈，你确定？再想想～","嘿嘿，差点就被我骗到了吧！","这个选项是我最喜欢的迷思之一，谢谢你喜欢它～"],
 bossHit:["哎哟！这个证据太硬了！","啊啊啊，我的迷思碎了一个角！","不……不可能！你居然有理有据！"],
 bossDefeat:["我……我还会回来的！下次带更多迷思来！（化成一阵雾）","好吧好吧，有理有据，我认输……这块迷思碎片送你当纪念！"]
};
const LINES_EN={
 wrong:[["oops","Hmm? My little notebook says something different… maybe we’re both a tiny bit mixed up? Help me think again~"],
  ["ask","Wait, wait—a giant question mark just popped over my head ❓ That doesn’t match what I heard before. Can you double-check?"],
  ["oops","Hehe, so the Myth King fooled you once too! That’s okay—brains get stronger by “oops → fix” 💪 Try again?"],
  ["ask","My map is starting to spin 🌀… shall we check this one together again?"],
  ["oops","Don’t worry—things you get wrong once stick even better! Want to flip through the 📚 Travel Guidebook and then explain it to me?"]],
 stuck:[["ask","We’re stuck~ Want to tap “💡 Ask for help”? I’ll give you a little clue."],
  ["listen","Take your time, I’ll wait~ Xiaodi is super patient (except when lining up for snacks 😋)."],
  ["ask","You’re halfway there! Add one “because” or “for example” and I’ll get it!"],
  ["listen","Getting stuck for a moment is normal—your brain is “moving furniture”. You can tap “📚 Peek at the guidebook” or “💡 Ask for help”~"]],
 dunno:[["ask","I don’t know either—that’s why I asked you to teach me! 😆"],["ask","Hehe, now we’re the “Don’t-Know Duo”!"],["ask","That’s okay~ “I don’t know” is the first step to knowing!"]],
 offtopic:[["ask","Hehe, I’ll think about that later~ But I’m still stuck on the last question—please rescue me first, buddy!"],
  ["listen","Good question! I’ll write it on my “chat later” page 📒. Shall we finish this one first?"],
  ["oops","My attention ran off like a kitten chasing yarn 🧶… pull it back, pull it back! I still don’t get that last question~"]],
 eurekaPS:["I’m writing this into my diary—with your name on it! ✍️","You explained it better than the tour guide~","Today’s me is a tiny bit smarter than yesterday’s me!","My notebook just got one page longer, hehe.","I feel a little light bulb go “ding!” in my head 💡"],
 silly:[["oops","I was holding the map upside down and thought Hainan was in the far north 🙈 Luckily I remembered: on a map, north is up, south is down, west is left, east is right!"],
  ["oops","My notebook is full of little doodled stars again ⭐… and not one real note! Quick, keep teaching me~"],
  ["cele","Listening to you is more addictive than spicy snacks 🌶️ (and I only have one bag left)"],
  ["oops","I just wrote “capital” as “capi-tall”—like the city is about to grow legs and walk away 😂"],
  ["eureka","I found a secret: every time you say “because”, I remember it extra well!"]],
 combo:["🔥 Combo ×{n}! Are you an “explaining machine” today?","🔥 Combo ×{n}! Xiaodi’s notebook is almost full!","🔥 Combo ×{n}! The Myth King is shaking just hearing this~"],
 streak:["🔥 {n} days in a row! Our friendship is like hotpot broth—the longer it simmers, the better~","🔥 {n} days in a row! You’re more punctual than Abao the Panda at bamboo time 🎋","🔥 {n} days in a row! Xiaodi treats you to a bowl of Sichuan ice jelly 🍧 for sticking with it!","🔥 {n} days in a row! I secretly drew you a little red flower on the back of the passport 🌺"],
 bossTaunt:["Hmph, you think you can beat me? I’ve been collecting these myths for years!","Xiaodi already believes me—don’t waste your breath~","I’ve collected 999 myths. How many can you break? Mwahaha","Just saying “wrong” won’t defeat me. Show me your evidence!"],
 bossWrong:["Hahaha, are you sure? Think again~","Hehe, I almost fooled you, didn’t I!","That option is one of my favourite myths—thanks for liking it~"],
 bossHit:["Ouch! That evidence is rock-solid!","Argh, a corner of my myth just broke off!","N-no… impossible! You actually have reasons AND evidence!"],
 bossDefeat:["I… I’ll be back! With even more myths next time! (vanishes into a puff of fog)","Fine, fine—you have reasons and evidence. I give up… take this myth shard as a souvenir!"]
};
const _bag={},_last={};
function line(k,vars){const pool=(isEN()?LINES_EN:LINES_ZH)[k];const bk=LANG+k;let b=_bag[bk];if(!b||!b.length){b=_bag[bk]=[...pool.keys()].sort(()=>Math.random()-.5);if(b.length>1&&b[0]===_last[bk])b.push(b.shift())}
  const i=b.shift();_last[bk]=i;let v=pool[i];if(vars){const rep=t=>t.replace(/\{(\w+)\}/g,(_,x)=>vars[x]);v=Array.isArray(v)?[v[0],rep(v[1])]:rep(v)}return v}
async function sayLine(k,o={}){const[x,t]=line(k);setXD(x);return say("xd",t,o)}
/* 方言彩蛋：讲对后小地用当地话夸你（括号里是意思）/ dialect praise: pinyin + meaning */
const DIALECT={四川:["巴适得板！（四川话：特别好、特别舒服）","Bāshì de bǎn! (Sichuanese: “Super great, so comfy!”)"],重庆:["雄起！（重庆话：加油、给力）","Xióngqǐ! (Chongqing dialect: “Rise up! Go for it!”)"],河南:["中！（河南话：行、好）","Zhōng! (Henan dialect: “Okay! Good!”)"],陕西:["嘹咋咧！（陕西话：好得很）","Liáo zá liē! (Shaanxi dialect: “Really, really good!”)"],云南:["板扎！（云南话：很棒）","Bǎnzhā! (Yunnan dialect: “Awesome!”)"],北京:["倍儿棒！（北京话：特别棒）","Bèir bàng! (Beijing dialect: “Super awesome!”)"],天津:["真哏儿！（天津话：真有意思）","Zhēn génr! (Tianjin dialect: “So funny and fun!”)"],黑龙江:["嘎嘎好！（东北话：特别好）","Gāgā hǎo! (Northeastern dialect: “Super good!”)"],吉林:["嘎嘎好！（东北话：特别好）","Gāgā hǎo! (Northeastern dialect: “Super good!”)"],辽宁:["嘎嘎好！（东北话：特别好）","Gāgā hǎo! (Northeastern dialect: “Super good!”)"],上海:["老灵额！（上海话：很好）","Lao lin ghe! (Shanghainese: “Very good!”)"],广东:["好犀利！（粤语：好厉害）","Hóu sāi-leih! (Cantonese: “So impressive!”)"],香港:["好犀利！（粤语：好厉害）","Hóu sāi-leih! (Cantonese: “So impressive!”)"],澳门:["好犀利！（粤语：好厉害）","Hóu sāi-leih! (Cantonese: “So impressive!”)"]};
const dial=n=>DIALECT[n]?DIALECT[n][isEN()?1:0]:"";
/* NPC 个性 / NPC personalities: [zh action, zh line, en action, en line] */
const NPCP={西南:["（慢悠悠地嚼着竹子）","吃饱了才有力气学习，这是熊猫的真理🎋","(slowly munching bamboo) ","A full tummy gives you energy to learn—that’s panda wisdom 🎋 "],华南:["（在树枝上荡了个秋千）","快快快，跟上我的节奏！","(swings from a branch) ","Quick, quick, keep up with me! "],华中:["（从江面上探出圆圆的脑袋，咧嘴一笑）","长江可长啦，我们慢慢游～","(pops a round head out of the river and grins) ","The Yangtze is really long—let’s swim slowly~ "],华东:["（优雅地单脚站着，推了推眼镜）","咳咳，请注意听讲。","(stands elegantly on one leg and pushes up its glasses) ","Ahem, please pay attention. "],华北:["（摇着尾巴，打了个喷嚏）","汪！这片儿我熟！","(wags its tail and sneezes) ","Woof! I know this area well! "],东北:["（伸了个大懒腰，抖掉身上的雪）","来都来了，整点知识再走呗！","(stretches big and shakes off the snow) ","You’re here anyway—grab some knowledge before you go! "],西北:["（不紧不慢地嚼着骆驼刺）","沙漠里赶路，不急，稳着来。","(calmly chewing camelthorn) ","In the desert, no rush—slow and steady. "],港澳台:["（从海里跳出来，溅起一朵浪花）","欢迎来到海边～","(leaps out of the sea with a splash) ","Welcome to the seaside~ "]};
const npcp=(r,i)=>NPCP[r][isEN()?i+2:i];

/* ---------- 状态 ---------- */
const KEY="xiaodi_geo_v1";
const fresh=()=>({name:"",home:"",fav:"",xp:0,aff:50,streak:0,lastDay:"",freeze:1,stamps:[],badges:{},cards:[],diary:[],perf:{},pending:[],reviews:[],refl:[],achv:[],offset:0,combo:0,flow:{fails:0,wins:0},dailyXp:"",poems:[],stars:0,onb:false,peeks:0});
let S=load();
function load(){try{return Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||"{}"))}catch(e){return fresh()}}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
const now=()=>Date.now()+S.offset*DAY;
const dayStr=t=>{const d=new Date(t);return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()};
const levelOf=xp=>{let n=LEVELS[0][1];for(const[x,nm]of LEVELS)if(xp>=x&&(nm!=="地理大师"||S.stamps.length>=34))n=nm;return n};
const nextLv=xp=>LEVELS.find(l=>l[0]>xp);
const relOf=a=>a<60?tr("初识旅伴","New travel buddies"):a<80?tr("熟悉的旅伴","Familiar buddies"):a<95?tr("好朋友","Good friends"):tr("最佳旅伴","Best travel buddies");
const regionOf=n=>PM[n]&&PM[n].r;
function prevOf(r){const i=ROUTE.indexOf(r);return i>0?ROUTE[i-1]:""}
function prevList(r){const pr=prevOf(r);return P.filter(p=>p.r===pr).map(p=>pn(p.n)).join(isEN()?", ":"、")}
function lockMsg(r){const pr=prevOf(r);return tr(`🔒 ${r}还没解锁：先去「${pr}」（${prevList(r)}）任选一个省教会小地、盖 1 枚章就能开啦`,`🔒 ${rn(r)} is locked: first get 1 stamp in ${rn(pr)} (${prevList(r)})`)}
function unlocked(r){const i=ROUTE.indexOf(r);if(i<=0||r===regionOf(S.home))return true;const prev=ROUTE[i-1];return P.some(p=>p.r===prev&&S.stamps.includes(p.n))}

/* ---------- 小工具 ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,FAST?0:ms));
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove("on"),2200)}
function confetti(n=60){if(FAST)return;const c=["#d9622b","#1f4e9c","#c99a2e","#3f8f5a","#e86f9a"];for(let i=0;i<n;i++){const d=document.createElement("i");d.className="confetti";d.style.left=Math.random()*100+"vw";d.style.background=c[i%5];d.style.animationDuration=(1.6+Math.random()*1.6)+"s";d.style.animationDelay=Math.random()*.4+"s";document.body.appendChild(d);setTimeout(()=>d.remove(),3800)}}
let xdCur="idle";
function setXD(k){xdCur=k;const[img,m,me]=XD[k]||XD.idle;const el=$("#xdImg");el.style.opacity=.2;setTimeout(()=>{el.src=`assets/xd/${img}.jpg`;el.style.opacity=1},120);$("#xdMood").textContent=tr(m,me)}
function phase(i){$$("#phase span").forEach((s,j)=>s.classList.toggle("on",j===i))}
function stepBar(total,cur){$("#steps").innerHTML=Array.from({length:total},(_,i)=>`<i class="${i<cur?'done':i===cur?'cur':''}"></i>`).join("")}
/* 关卡标题（切换语言时可重绘）/ level header, re-rendered on language switch */
let HEAD=null;
function setHead(h){HEAD=h;drawHead()}
function drawHead(){const h=HEAD;if(!h){$("#lvName").textContent=tr("当前关卡：未开始","Current level: not started");$("#chatSub").textContent=tr("好奇心爆棚，但有点粗心的新同学","Super curious, a little careless new classmate");return}
  if(h.k==="sc"){$("#lvName").textContent=tr("当前关卡：西南 · 四川","Current level: Southwest · Sichuan");$("#chatSub").textContent=tr("第 1 站：四川 ｜ 向导：熊猫阿宝","Stop 1: Sichuan | Guide: Abao the Panda")}
  else if(h.k==="pr"){const r=PM[h.n].r;$("#lvName").textContent=tr(`当前关卡：${r} · ${h.n}（练习模式）`,`Current level: ${rn(r)} · ${pn(h.n)} (practice)`);$("#chatSub").textContent=tr(`${h.n} ｜ 向导：${NPC[r][1]}`,`${pn(h.n)} | Guide: ${NPC[r][2]}`)}
  else if(h.k==="rv"){$("#lvName").textContent=tr("复习：小地忘记啦","Review: Xiaodi forgot!")}
  else if(h.k==="demo"){$("#lvName").textContent=tr("示例对话：都江堰（川-02）","Sample chat: Dujiangyan (川-02)")}}

/* ---------- 每日与连续学习（带“休息卡”宽限） ---------- */
function touchDay(){
  const today=dayStr(now());if(S.lastDay===today)return;
  const diff=S.lastDay?Math.round((new Date(today)-new Date(S.lastDay))/DAY):0;
  let msg="";
  if(!S.lastDay)S.streak=1;
  else if(diff===1)S.streak++;
  else if(diff===2&&S.freeze>0){S.freeze--;S.streak++;msg=tr("小地用一张“休息卡”帮你守住了连续天数 🛡️","Xiaodi used a “rest card” to protect your streak 🛡️")}
  else {S.streak=1;msg=tr("旅伴你回来啦！小地在火车站等了好久～连续天数从 1 重新开始，没关系！","You’re back, buddy! Xiaodi waited at the station for ages~ Your streak starts again from 1—that’s totally fine!")}
  if(S.streak>0&&S.streak%7===0)S.freeze++;
  S.lastDay=today;S.aff=Math.min(100,S.aff+1);
  addXP(10,tr("每日签到","Daily check-in"));
  if(msg)setTimeout(()=>toast(msg),800);
  else if(S.streak>=2&&![3,7,14,30].includes(S.streak))setTimeout(()=>toast(line("streak",{n:S.streak})),800);
  if([3,7,14,30].includes(S.streak))setTimeout(()=>toast(tr({3:"连续3天！小地寄来一张明信片 📮",7:"连续7天！称号“风雨无阻导游” + 1 张休息卡",14:"连续14天！解锁小地的复习小本本 📒",30:"连续30天！称号“铁杆旅伴”"},{3:"3 days in a row! Xiaodi sent you a postcard 📮",7:"7 days in a row! Title “Rain-or-Shine Guide” + 1 rest card",14:"14 days in a row! Unlocked Xiaodi’s review notebook 📒",30:"30 days in a row! Title “Super-Loyal Travel Buddy”"})[S.streak]),1800);
}

/* ---------- XP / 升级 ---------- */
let lvXP=0;
function addXP(n,why){
  const before=levelOf(S.xp);S.xp+=n;lvXP+=n;save();refreshTop();
  $("#lvXp").textContent=lvXP;
  if(why)toast(`+${n} XP · ${why}`);
  const after=levelOf(S.xp);
  if(after!==before)queueOverlay(()=>showLevelUp(before,after));
}
function calcTeachXP(r,prov){
  let base,det=[];
  if(r.probe===0&&r.hint===0&&!r.peek){base=30;det.push(tr("一次讲清+30 ⭐独立讲清","Clear on the first try +30 ⭐ solo star"));S.stars=(S.stars||0)+1}
  else if(r.hint===0){base=20;det.push(r.probe?tr("追问后讲清+20","Clear after follow-up +20"):tr("翻秘籍后讲清+20","Clear after peeking +20"))}
  else{base=Math.max(8,15-3*(r.hint-1));det.push(tr(`用提示后讲清+${base}`,`Clear with hints +${base}`))}
  if(r.peek&&(r.probe||r.hint)){base=Math.max(5,base-5);det.push(tr("翻秘籍-5","Peeked -5"))}
  if(r.fix){base+=10;det.push(tr("纠错奖+10","Correction bonus +10"))}
  if(r.ex){base+=5;det.push(tr("举例奖+5","Example bonus +5"))}
  S.combo++;if(S.combo>=3){const b=S.combo===3?15:5;base+=b;det.push(tr(`连击×${S.combo}+${b}`,`Combo ×${S.combo} +${b}`));setTimeout(()=>toast(line("combo",{n:S.combo})),1200)}
  if(prov===S.home){base=Math.round(base*1.5);det.push(tr("家乡×1.5","Hometown ×1.5"))}
  return[base,det.join(" ")];
}
function bumpBadge(d){
  S.badges[d]=(S.badges[d]||0)+1;const off=d===S.fav?1:0;
  for(const[need,t]of[[15,"金"],[8,"银"],[3,"铜"]])if(S.badges[d]===need-off){queueOverlay(()=>showBadge(d,t));break}
}
function tierOf(d){const c=S.badges[d]||0,o=d===S.fav?1:0;return c>=15-o?3:c>=8-o?2:c>=3-o?1:0}
function achieve(id,name){if(S.achv.includes(id))return;S.achv.push(id);save();toast(tr("🏆 解锁成就：","🏆 Achievement unlocked: ")+name)}

/* ---------- 弹层队列 ---------- */
const OQ=[];let ovBusy=false;
function queueOverlay(fn){OQ.push(fn);if(!ovBusy)nextOv()}
function nextOv(){const fn=OQ.shift();if(!fn){ovBusy=false;$("#ov").classList.remove("on");return}ovBusy=true;$("#ov").classList.add("on");fn()}
function ov(html,btn,cb){btn=btn||tr("好耶！","Yay!");$("#ovc").innerHTML=html+`<div style="margin-top:14px"><button class="btn o" id="ovOk">${btn}</button></div>`;$("#ovOk").onclick=()=>{cb&&cb();nextOv()}}
function overlayDone(){return new Promise(r=>{const t=setInterval(()=>{if(!ovBusy){clearInterval(t);r()}},120)})}
function showLevelUp(a,b){confetti();setXD("cele");ov(`<div class="levelup"><img src="assets/ui/levelup.jpg"><div class="lt">${tr("升级啦！","Level up!")}<br>${lvn(b)}<small>${lvn(a)} → ${lvn(b)}</small></div></div><p>${unlockText(b)}</p>`,tr("继续旅行","Keep traveling"))}
function unlockText(b){return tr({初级导游:"解锁：小地会寄“明信片”彩蛋 📮",中级导游:"解锁：可以点名去任意已开放区域的省份",高级导游:"解锁：两省“对比题”（XP×1.2）",金牌导游:"解锁：“小地考考你”反转关",地理大师:"终章游记解锁！"},{初级导游:"Unlocked: Xiaodi will send surprise postcards 📮",中级导游:"Unlocked: pick any province in an open region",高级导游:"Unlocked: two-province “compare” questions (XP ×1.2)",金牌导游:"Unlocked: the “Xiaodi quizzes you” reverse level",地理大师:"Final diary chapter unlocked!"})[b]||""}
function showBadge(d,t){confetti(30);ov(`<img src="assets/badge/${BADGE[d][0]}.png" class="stampin" style="transform:none"><h3>${tr("获得徽章：","New badge: ")}${bn(d)}·${tn(t)}</h3><p class="mini">${tr(`${d}维度深度讲解 ${S.badges[d]} 次`,`${dn(d)}: ${S.badges[d]} deep explanations`)}</p>`)}

/* ---------- 聊天 ---------- */
const msgs=()=>$("#msgs");
function avatarOf(who,npc){return who==="xd"?"assets/xd/main.jpg":who==="npc"?`assets/npc/${npc||"xinan"}.jpg`:who==="boss"?"assets/boss.jpg":"assets/ui/passport.jpg"}
async function say(who,text,o={}){
  const wrap=document.createElement("div");wrap.className="m "+(who==="me"?"me":who==="sys"?"sys":who==="npc"?"npc xd":"xd");
  const tag=o.tag?`<span class="tag">${o.tag}</span><br>`:"";
  if(who!=="me"&&who!=="sys"){wrap.innerHTML=`<img class="av" src="${avatarOf(who,o.npc)}"><div class="bub"><span class="typing"><i></i><i></i><i></i></span></div>`;msgs().appendChild(wrap);scrollDown();await sleep(Math.min(1400,300+text.length*(isEN()?7:18)))}
  else{wrap.innerHTML=`<div class="bub"></div>`;msgs().appendChild(wrap)}
  wrap.querySelector(".bub").innerHTML=tag+(o.html?text:esc(text));scrollDown();return wrap;
}
function panel(html){const w=document.createElement("div");w.className="m sys";w.style.maxWidth="100%";w.style.width="100%";w.innerHTML=`<div class="panel" style="width:100%">${html}</div>`;msgs().appendChild(w);scrollDown();return w.querySelector(".panel")}
function scrollDown(){const m=msgs();m.scrollTop=m.scrollHeight}
const esc=s=>String(s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function choose(list,o={}){return new Promise(res=>{const p=panel((o.title?`<b>${o.title}</b>`:"")+`<div class="opts">${list.map((t,i)=>`<button data-i="${i}">${t}</button>`).join("")}</div>`);
  p.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(o.check){const ok=o.check(+b.dataset.i);b.classList.add(ok?"ok":"no");if(!ok){o.onWrong&&o.onWrong(+b.dataset.i);return}}p.querySelectorAll("button").forEach(x=>x.disabled=true);res(+b.dataset.i)})})}
let waiter=null;
function waitInput(){return new Promise(r=>waiter=r)}
const CMDEN={翻秘籍:"📚 Peek at the guidebook",请求帮助:"💡 Ask for help",切换问题:"🔀 Skip this question",查看反馈:"📊 My feedback",我的护照:"🛂 My passport"};
const cmdLabel=v=>isEN()?(CMDEN[v]||v):v;
function submit(kind,v){if(!waiter){if(kind==="cmd")freeCmd(v);else toast(tr("先点左边“开始四川关卡”，或去旅程地图选一个省份～","First tap “Start the Sichuan level” on the left, or pick a province on the Journey map~"));return}const w=waiter;waiter=null;say("me",kind==="cmd"?cmdLabel(v):v);w({kind,v})}
function setStarters(list){$("#starters").innerHTML=list.map(s=>`<span class="chip" data-s="${s}">${s}</span>`).join("");$$("#starters .chip").forEach(c=>c.onclick=()=>{$("#inp").value+=c.dataset.s;$("#inp").focus()})}
const ST3=()=>tr(["其实……","因为……","比如……"],["Actually… ","Because… ","For example… "]);
function freeCmd(c){if(c==="查看反馈")feedbackCard();else if(c==="我的护照")go("passport");else toast(tr("关卡开始后才能用这个按钮哦","This button works once a level has started"))}
function feedbackCard(){const nx=nextLv(S.xp);const b=DIMS.filter(d=>S.badges[d]).map(d=>`${bn(d)} ${S.badges[d]}`).join("｜")||tr("还没有","none yet");
  panel(tr(`<b>🧳 ${esc(S.name||"旅伴")} 的导游档案</b><div class="mini" style="text-align:left;line-height:1.9;margin-top:6px">等级：${levelOf(S.xp)}（XP ${S.xp}${nx?" / 下一级 "+nx[0]:""}）<br>护照：已盖 ${S.stamps.length}/34 章 ${S.stamps.map(n=>PM[n].em).join("")}<br>徽章进度：${b}<br>好感度：${S.aff}（${relOf(S.aff)}）｜连续学习 ${S.streak} 天<br>待解之谜：${S.pending.length} 个 ${S.pending.join("、")}<br>本关：深度讲解 ${ST.deep} 次｜用提示 ${ST.hint} 次｜翻秘籍 ${ST.peek||0} 次｜追问后补充 ${ST.probed} 次<br>⭐ 独立讲清星：${S.stars||0} 颗<br>💡 建议：${ST.hint>1?"下一题先试试不用提示，讲讲“为什么”":"试着每次都举一个例子，会更有说服力"}</div>`,
  `<b>🧳 ${esc(S.name||"Travel Buddy")}’s guide file</b><div class="mini" style="text-align:left;line-height:1.9;margin-top:6px">Level: ${lvn(levelOf(S.xp))} (XP ${S.xp}${nx?" / next level at "+nx[0]:""})<br>Passport: ${S.stamps.length}/34 stamps ${S.stamps.map(n=>PM[n].em).join("")}<br>Badge progress: ${b}<br>Friendship: ${S.aff} (${relOf(S.aff)}) | Streak: ${S.streak} day(s)<br>Unsolved mysteries: ${S.pending.length} ${S.pending.join(", ")}<br>This level: deep explanations ${ST.deep} | hints ${ST.hint} | peeks ${ST.peek||0} | added after follow-up ${ST.probed}<br>⭐ Solo stars: ${S.stars||0}<br>💡 Tip: ${ST.hint>1?"next time, try without hints and explain the “why”":"try giving an example every time—it’s more convincing"}</div>`))}

/* ---------- 规则评分（中英文都识别）/ rule-based scoring, works for Chinese and English ---------- */
const hit=(t,arr)=>arr.some(re=>re.test(t));
function evalSpecific(T,t){const g={};for(const k in T.groups)g[k]=hit(t,T.groups[k]);
  const deep=T.deep(g);const wrong=T.wrong.some(re=>re.test(t))&&!g.fix&&!deep;return{g,deep,wrong,fix:!!g.fix,ex:!!g.ex}}
function bigrams(s){s=s.replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g,"");const o=new Set();for(let i=0;i<s.length-1;i++)o.add(s.slice(i,i+2));return o}
const stem=w=>w.length>5?w.replace(/(ing|ed|es|s)$/,""):w;
const words=t=>new Set((t.toLowerCase().replace(/’/g,"'").match(/[a-z][a-z'\-]{2,}/g)||[]).map(w=>stem(w.replace(/['\-]+$/,""))));
const RX={fixZ:/不是|不对|其实|并不|不只|不全|不一定|错|不止/,whyZ:/因为|所以|由于|原因|因此|导致|为了|于是/,exZ:/比如|例如|就像|像是|举个/,
  fixE:/\b(not|no|isn'?t|aren'?t|wasn'?t|doesn'?t|don'?t|didn'?t|can'?t|actually|wrong|mistaken|incorrect|untrue|myth)\b/i,
  whyE:/\b(because|since|so|therefore|that'?s why|due to|which means|thanks to|in order to|as a result|the reason)\b/i,
  exE:/\b(for example|for instance|such as|like|e\.g\.|just like|e\.g)\b/i};
function evalGeneric(q,t){const kb=bigrams(q.key),ab=bigrams(t);let ov=0;ab.forEach(x=>{if(kb.has(x))ov++});
  let ek=0;const kw=q.en&&q.en.kw;if(kw){const W=words(t);new Set(kw.map(k=>stem(k))).forEach(k=>{if(W.has(k))ek++})}
  const g={fix:RX.fixZ.test(t)||RX.fixE.test(t),why:RX.whyZ.test(t)||RX.whyE.test(t),ex:RX.exZ.test(t)||RX.exE.test(t),key:ov>=4||ek>=3};
  const n=[g.fix,g.why,g.ex,g.key].filter(Boolean).length;return{g,deep:g.key&&n>=2,wrong:false,fix:g.fix,ex:g.ex}}

/* ---------- 四川关卡内容（中文 + English；评分正则两种语言都收）---------- */
const SC=[
 {qid:"川-01",dim:"美食",trigger:"🚄 我到成都啦！街边飘来的香味辣得我直打喷嚏～我决定了：川菜就是辣，每一道都辣得冒火！对吧旅伴？川菜到底是什么味道的呀？",
  groups:{fix:[/不是|不都|不全|并不|并非|不一定|不止|也有不辣|有的不辣/,/\b(not|isn'?t|aren'?t|no)\b|n't\b|not (all|every)|actually|some (are|dishes are)n'?t/i],
   kind:[/鱼香|糖醋|椒麻|咸鲜|荔枝|怪味|家常|甜|多种|很多种|味型|一菜一格|百菜百味|各种味/,/fish[- ]?fragrant|yu ?xiang|sweet|sour|jiaoma|savou?ry|lychee|strange[- ]flavou?r|home[- ]style|mild|many (different |kinds of )?(flavou?rs|tastes)|lots of (flavou?rs|tastes)|flavou?r types?|different (flavou?rs|tastes)|hundred (dishes|flavou?rs)|each dish (has )?its own/i],
   ex:[/开水白菜|宫保|鱼香肉丝|回锅肉|夫妻肺片|清淡|比如|例如/,/boiled[- ]water cabbage|kaishui|cabbage|kung ?pao|gong ?bao|twice[- ]cooked|fuqi|for example|for instance|such as|e\.g/i]},
  deep:g=>[g.fix,g.kind,g.ex].filter(Boolean).length>=2&&(g.kind||g.ex),wrong:[/都(很)?辣|全(都)?是辣|就是辣|每(一)?道都辣/,/\ball (very )?spicy|(every|each) dish is spicy|just spicy|only spicy|always spicy/i],
  probes:["谢谢旅伴！那除了辣，川菜还有别的味道吗？能说出一两种吗？","我还是有点晕～有没有一道一点都不辣的川菜，能让我放心吃？"],
  hints:["一级提示：川菜有一道“开水白菜”，听名字你觉得辣不辣？","二级提示：想想“味型”这个词。川菜有一句话叫“一菜一格，____”。","三级提示：选一个并告诉我理由 —— A. 川菜道道都辣　B. 川菜有很多味型，也有不辣的菜"],
  recap:"哇我懂了！我原来以为川菜道道都辣，原来川菜讲究“一菜一格，百菜百味”，除了麻辣还有鱼香、糖醋、咸鲜……开水白菜就一点都不辣！",
  why:"我还想多问一个为什么：一个地方的菜，为什么会发展出这么多种味道呀？",
  review:{q:"旅伴，我又忘了……川菜是不是道道都辣来着？说一道不辣的川菜给我听听？",ok:g=>g.kind||g.ex},
  en:{trigger:"🚄 I made it to Chengdu! The smell from the street stalls is so spicy it made me sneeze~ I’ve decided: Sichuan food = spicy, and every single dish is fiery hot! Right, buddy? So what does Sichuan food actually taste like?",
   probes:["Thanks, buddy! So besides spicy, what other flavors does Sichuan food have? Can you name one or two?","I’m still a bit dizzy~ Is there a Sichuan dish that isn’t spicy at all, so I can eat it without worrying?"],
   hints:["Hint 1: Sichuan has a dish called “boiled-water cabbage” (kāishuǐ báicài). From the name, do you think it’s spicy?","Hint 2: Think about the idea of “flavor types”. There’s a Sichuan saying: “each dish its own style, a hundred dishes a hundred ____.”","Hint 3: Pick one and tell me why — A. Every Sichuan dish is spicy　B. Sichuan food has many flavor types, including dishes that aren’t spicy"],
   recap:"Wow, I get it now! I used to think every Sichuan dish was spicy, but Sichuan food is all about “each dish its own style, a hundred dishes a hundred flavors”—besides numbing-spicy there’s fish-fragrant, sweet-and-sour, savory… and boiled-water cabbage isn’t spicy at all!",
   why:"I want to ask one more “why”: how did one place’s food end up with so many different flavors?",
   reviewQ:"Buddy, I forgot again… is every Sichuan dish spicy? Tell me one Sichuan dish that isn’t spicy?"}},
 {qid:"川-02",dim:"景点",trigger:"下午要去都江堰！我猜它一定是一座超级大的水坝，把岷江整个拦住，对吧？都江堰到底是什么样的呀？",
  groups:{fix:[/不是(一座)?(大)?(水)?坝|没有(大)?坝|无坝|不用(大)?坝|不靠(大)?坝|不拦/,/\bnot (a |one )?(big |huge |giant )?dam|\bno (big |huge )?dam|without (a |any )?dam|dam[- ]?free|isn'?t a (big |huge )?dam|doesn'?t (block|use a dam|need a dam)|no need for a dam|not block/i],
   struct:[/鱼嘴|飞沙堰|宝瓶口|内江|外江|分水|引水|排沙/,/fish[- ]?mouth|yuzui|flying[- ]sand|feishayan|bottle[- ]?neck|baopingkou|inner (river|stream|channel)|outer (river|stream|channel)|splits?|divid|divert|drains?|silt|sand|weir/i],
   why:[/顺着|顺应|因势|地形|水流|灌溉|成都平原|两千|李冰/,/follow|works? with|terrain|the land|flow|irrigat|chengdu plain|2,?000|two thousand|li bing/i],ex:[/比如|就像|像/,/for example|for instance|such as|just like|\blike\b/i]},
  deep:g=>g.struct&&(g.fix||g.why),wrong:[/是(一座)?(超级)?(大)?(的)?(拦河)?(大)?(水)?坝|拦住|拦河大坝/,/\b(is|it'?s) (just )?(a |one )?(huge |big |giant |super )?(river )?dam\b|blocks? the (whole )?(min )?river/i],
  probes:["没有大坝……那它是怎么把江水分开的呀？","那泥沙和多出来的洪水去哪儿了呢？会不会把渠道堵住？"],
  hints:["一级提示：都江堰有三个主要部分，其中一个叫“鱼嘴”。你觉得“鱼嘴”在江里做什么？","二级提示：三个部分各有分工——一个负责“分”，一个负责“排”，一个负责“引”。","三级提示：选一个并告诉我理由 —— A. 都江堰靠一座拦河大坝　B. 鱼嘴分水、飞沙堰排沙、宝瓶口引水"],
  recap:"原来都江堰是“无坝引水”：鱼嘴把岷江分成内江和外江，飞沙堰排走泥沙和多余的水，宝瓶口把水引进成都平原。顺着水的脾气来治水！",
  why:"再追问一个为什么：不建大坝，为什么反而能用两千多年？",
  review:{q:"上次你教我的都江堰……它是靠哪几个部分来管水的来着？",ok:g=>g.struct},
  en:{trigger:"This afternoon we’re going to Dujiangyan! I bet it’s a super-huge dam that blocks the whole Min River, right? What is Dujiangyan really like?",
   probes:["No big dam… then how does it split the river water?","Then where do the sand and the extra floodwater go? Won’t they block the channels?"],
   hints:["Hint 1: Dujiangyan has three main parts, and one is called the “Fish Mouth”. What do you think the Fish Mouth does in the river?","Hint 2: Each of the three parts has a job—one “splits”, one “drains”, and one “brings water in”.","Hint 3: Pick one and tell me why — A. Dujiangyan relies on a dam across the river　B. The Fish Mouth splits the water, the Flying Sand Weir drains sand, the Bottle-Neck Channel brings water in"],
   recap:"So Dujiangyan is a “dam-free” water project: the Fish Mouth splits the Min River into an inner and an outer river, the Flying Sand Weir drains away sand and extra water, and the Bottle-Neck Channel brings water into the Chengdu Plain. It manages water by going along with the water’s nature!",
   why:"One more “why”: without a big dam, how has it kept working for more than 2,000 years?",
   reviewQ:"That Dujiangyan you taught me last time… which parts does it use to manage the water again?"}},
 {qid:"川-03",dim:"冷知识",trigger:"明天去看大熊猫！🐼 我听说野生大熊猫只住在四川，别的地方一只都没有，是真的吗？",
  groups:{fix:[/不只|不仅|不止|还有|也有|不是只/,/not only|not just|\balso\b|\btoo\b|as well|besides|isn'?t only|aren'?t only|other places|other provinces/i],place:[/陕西|秦岭|甘肃/,/shaanxi|qinling|gansu/i],
   more:[/主要|大部分|多数|国家公园|竹|山|保护|栖息/,/mainly|mostly|most of|national park|bamboo|mountain|forest|protect|habitat/i],ex:[/比如|例如/,/for example|for instance|such as/i]},
  deep:g=>g.place&&(g.fix||g.more),wrong:[/只(住|在|生活)(在)?四川|只有四川/,/only (live |found |lives )?(in )?sichuan|just (in )?sichuan/i],
  probes:["哦？那除了四川，还有哪些地方能找到野生大熊猫？","那它们喜欢住在什么样的地方呢？"],
  hints:["一级提示：秦岭在哪个省？那里也有大熊猫吗？","二级提示：往四川的北边看看，有两个邻省也在大熊猫国家公园里。","三级提示：选一个并告诉我理由 —— A. 野生大熊猫只在四川　B. 主要在四川，陕西、甘肃也有"],
  recap:"原来野生大熊猫主要住在四川，陕西秦岭和甘肃南部也有！大熊猫国家公园就横跨川陕甘三省。",
  why:"我好奇：大熊猫为什么喜欢住在这些山里？",
  review:{q:"我又迷糊了：除了四川，哪里还有野生大熊猫？",ok:g=>g.place},
  en:{trigger:"Tomorrow we’re going to see giant pandas! 🐼 I heard wild giant pandas live only in Sichuan and there isn’t a single one anywhere else. Is that true?",
   probes:["Oh? Then besides Sichuan, where else can you find wild giant pandas?","And what kind of places do they like to live in?"],
   hints:["Hint 1: Which province are the Qinling Mountains in? Are there pandas there too?","Hint 2: Look north of Sichuan—two neighboring provinces are also part of Giant Panda National Park.","Hint 3: Pick one and tell me why — A. Wild giant pandas live only in Sichuan　B. Mainly in Sichuan, but also in Shaanxi and Gansu"],
   recap:"So wild giant pandas live mainly in Sichuan, and also in the Qinling Mountains of Shaanxi and in southern Gansu! Giant Panda National Park spans all three provinces: Sichuan, Shaanxi and Gansu.",
   why:"I’m curious: why do giant pandas like living in these mountains?",
   reviewQ:"I’m confused again: besides Sichuan, where else do wild giant pandas live?"}}
];
const TT=(T,k)=>isEN()&&T.en&&T.en[k]!=null?T.en[k]:T[k];
const STARTERS=()=>[ST3(),[ST3()[1]],[]];
const BOSS=[
 {claim:"川菜？就一个字：辣！不辣不是川菜！",opts:["对，川菜都辣","川菜有很多味型，也有不辣的菜","川菜其实都是甜的"],ok:1,
  reasons:["因为川菜讲究“一菜一格，百菜百味”，比如开水白菜","因为四川人不吃辣椒","因为辣椒是四川原产的"],rok:0,
  en:{claim:"Sichuan food? One word: SPICY! If it’s not spicy, it’s not Sichuan food!",opts:["Right, all Sichuan food is spicy","Sichuan food has many flavor types, including non-spicy dishes","Sichuan food is actually all sweet"],
   reasons:["Because Sichuan food is “each dish its own style, a hundred dishes a hundred flavors”—like boiled-water cabbage","Because Sichuan people don’t eat chili","Because chili peppers originally come from Sichuan"]}},
 {claim:"都江堰嘛，一堵大坝拦住岷江，简单！",opts:["都江堰是一座拦河大坝","都江堰是无坝引水工程","都江堰是一座大桥"],ok:1,
  reasons:["鱼嘴分水、飞沙堰排沙、宝瓶口引水，顺应地形和水流","因为它是去年才修好的","因为它在海边"],rok:0,
  en:{claim:"Dujiangyan? Just one big dam blocking the Min River. Easy!",opts:["Dujiangyan is a dam across the river","Dujiangyan is a dam-free water project","Dujiangyan is a big bridge"],
   reasons:["The Fish Mouth splits the water, the Flying Sand Weir drains sand, the Bottle-Neck Channel brings water in—working with the land and the flow","Because it was only finished last year","Because it’s by the sea"]}},
 {claim:"大熊猫？四川专属！别处一只都没有！",opts:["没错，只有四川有","野生大熊猫主要在四川，陕西、甘肃也有","大熊猫主要生活在海南"],ok:1,
  reasons:["大熊猫国家公园横跨四川、陕西、甘肃三省","因为大熊猫会坐火车","因为别的省都没有竹子"],rok:0,
  en:{claim:"Giant pandas? Sichuan only! Not a single one anywhere else!",opts:["Exactly, only Sichuan has them","Wild pandas live mainly in Sichuan, and also in Shaanxi and Gansu","Giant pandas mainly live in Hainan"],
   reasons:["Giant Panda National Park spans Sichuan, Shaanxi and Gansu","Because pandas can ride trains","Because no other province has bamboo"]}}
];
/* [中文, 对错, 中文解释, English, English explanation] */
const QUIZ=[["四川盆地被称为“天府之国”",1,"","The Sichuan Basin is called the “Land of Abundance”",""],["贡嘎山被称为“蜀山之王”",1,"","Mount Gongga is called the “King of Sichuan’s Mountains”",""],["都江堰修建了一座拦河大坝",0,"都江堰是无坝引水工程","Dujiangyan was built as a dam across the river","Dujiangyan is a dam-free water project"],["苏轼是四川眉山人",1,"","Su Shi was from Meishan, Sichuan",""],
 ["鄱阳湖是中国最大的淡水湖",1,"","Poyang Lake is China’s largest freshwater lake",""],["泰山是中国最高的山",0,"泰山约1545米，地位高但不最高","Mount Tai is China’s tallest mountain","Mount Tai is about 1,545 m—important, but not the tallest"],["螺蛳粉的“臭味”主要来自酸笋",1,"","Luosifen’s “stinky” smell mainly comes from sour bamboo shoots",""],["青海湖是淡水湖",0,"青海湖是中国最大的咸水湖","Qinghai Lake is a freshwater lake","Qinghai Lake is China’s largest saltwater lake"],
 ["吉林省的省会是吉林市",0,"省会是长春","The capital of Jilin Province is Jilin City","The capital is Changchun"],["香港的菠萝包里有菠萝",0,"因外皮纹路像菠萝而得名","Hong Kong pineapple buns contain pineapple","They’re named for the crust that looks like pineapple skin"],["重庆是中国面积最大的直辖市",1,"","Chongqing is China’s largest municipality by area",""],["海南岛是中国第一大岛",0,"第一是台湾岛，海南岛第二","Hainan Island is China’s largest island","Taiwan Island is the largest; Hainan is second"]];
/* [美食, 省份, English food] */
const MATCH=[["麻婆豆腐","四川","Mapo tofu"],["过桥米线","云南","Crossing-the-bridge noodles"],["肉夹馍","陕西","Roujiamo"],["虾饺","广东","Har gow (shrimp dumplings)"],["螺蛳粉","广西","Luosifen"],["酥油茶","西藏","Butter tea"]];
const CARDS=[{id:"doubanjiang",n:"郫县豆瓣",rar:"n",p:.4,fact:"被称为“川菜之魂”，用蚕豆和辣椒发酵制成。",ne:"Pixian Chili Bean Paste",fe:"Called the “soul of Sichuan cooking”, it’s made by fermenting broad beans and chili."},{id:"huajiao",n:"汉源花椒",rar:"n",p:.3,fact:"麻香浓郁，“麻”是很多川菜味型的灵魂。",ne:"Hanyuan Sichuan Pepper",fe:"Rich and tingly—that numbing “má” feeling is the soul of many Sichuan flavor types."},{id:"zhuyeqing",n:"竹叶青茶",rar:"r",p:.2,fact:"峨眉山一带的扁形绿茶，冲泡后芽叶常竖立在杯中。",ne:"Zhuyeqing Green Tea",fe:"A flat green tea from around Mount Emei; when brewed, the leaves often stand upright in the cup."},{id:"shuxiu",n:"蜀绣",rar:"h",p:.1,fact:"中国四大名绣之一，熊猫、芙蓉是常见图案。",ne:"Shu Embroidery",fe:"One of China’s Four Famous Embroideries; pandas and hibiscus flowers are common patterns."}];
const cn_=c=>tr(c.n,c.ne),cf_=c=>tr(c.fact,c.fe);
const RARN={n:["普通款","Common"],r:["稀有款","Rare"],h:["✨隐藏款","✨ Secret"]};const rarn=k=>tr(RARN[k][0],RARN[k][1]);

/* ---------- 讲解一题（触发→探索→整合→解决） ---------- */
let ST={deep:0,hint:0,probed:0,why:0,peek:0,snips:[]};
const isLatin=t=>/[A-Za-z]/.test(t)&&!/[\u4e00-\u9fa5]/.test(t);
async function teach(T,idx,prov,generic){
  phase(0);setXD("ask");
  await say("xd",TT(T,"trigger"),{tag:`${pn(prov)}·${dn(T.dim)}`});
  setStarters(S.flow.fails>=2?ST3():STARTERS()[Math.min(idx,2)]);
  if(idx===1&&!generic)say("sys",tr("🪜 支架渐隐：这题我只给你一个开头词啦，相信你！","🪜 Fading support: just one sentence starter this time—I believe in you!"));
  if(idx===2&&!generic)say("sys",tr("🪜 支架全部撤掉！这一题完全靠你自己～","🪜 All support removed! This one is all you~"));
  phase(1);
  let hint=0,probe=0,peek=0,res,last="";const hasFact=!!(PM[prov]&&PM[prov].f&&PM[prov].f[T.dim]);
  while(true){
    const r=await waitInput();
    if(r.kind==="cmd"){
      if(r.v==="请求帮助"){hint++;ST.hint++;if(hint<=3){setXD("listen");const H=TT(T,"hints");await say("xd",(H?H[hint-1]:genHint(T,hint)),{tag:tr("提示支架 ","Hint ladder ")+hint+"/3"});
          if(hint===3)await say("xd",tr("我也不知道答案呀，所以才请你教我嘛！选好了用你自己的话讲给我听～","I don’t know the answer either—that’s why I need you to teach me! Once you’ve picked, explain it to me in your own words~"));continue}
        await say("xd",tr("没关系！我把这个问题记进“待解之谜”🔒，咱们先往前走，回头再一起破解。","No worries! I’ll put this question into “Unsolved Mysteries” 🔒. Let’s keep going and crack it together later."));if(!S.pending.includes(T.qid))S.pending.push(T.qid);S.perf[T.qid]="放弃";S.combo=0;save();return{cat:"放弃"}}
      if(r.v==="切换问题"){await say("xd",tr("好呀，这题先放进“待解之谜”，不扣分～","Sure! This one goes into “Unsolved Mysteries”—no points lost~"));if(!S.pending.includes(T.qid))S.pending.push(T.qid);S.perf[T.qid]="放弃";S.combo=0;save();return{cat:"放弃"}}
      if(r.v==="查看反馈"){feedbackCard();continue}
      if(r.v==="翻秘籍"){if(!hasFact){toast(tr("这一题没有对应的档案页","This question has no guidebook page"));continue}
        if(!peek){peek=1;ST.peek++;S.peeks=(S.peeks||0)+1;save()}
        panel(tr(`<b>📚 翻秘籍 · ${prov}档案「${T.dim}」页</b>`,`<b>📚 Guidebook peek · ${pn(prov)} · “${dn(T.dim)}” page</b>`)+archCard(prov,T.dim)+tr(`<div class="mini" style="margin-top:6px">🪜 关卡外看档案免费；答题中翻秘籍：本题不再计“⭐独立讲清”，若还用了提示/追问再 -5 XP。<br>✍️ 看完请<b>合上秘籍</b>，用你自己的话讲给小地听——照抄的话小地会听出来哦！</div>`,`<div class="mini" style="margin-top:6px">🪜 Reading the guidebook outside a level is free; peeking during a question means no “⭐ solo star” for it, and −5 XP if you also used hints or follow-ups.<br>✍️ When you’re done, <b>close the guidebook</b> and explain it to Xiaodi in your own words—Xiaodi can tell if you copy!</div>`));
        setXD("listen");continue}
      if(r.v==="我的护照"){await say("xd",tr(`护照上已经有 ${S.stamps.length} 枚章啦 ${S.stamps.map(n=>PM[n].em).join("")}，这一枚还等着你帮我拿到！`,`My passport already has ${S.stamps.length} stamp(s) ${S.stamps.map(n=>PM[n].em).join("")}—and this one is waiting for you to help me get it!`));continue}
      continue;
    }
    touchDay();setXD("listen");await sleep(500);
    const t=r.v;last=t;ST.snips.push(t);S.aff=Math.min(100,S.aff+2);
    const dunno=(/不知道|不会|答案|告诉我|忘了|不记得/.test(t)&&t.length<14)||(/\b(i )?(don'?t|do not) know\b|\bdunno\b|\bno idea\b|\bnot sure\b|\btell me\b|\bi forgot\b|\b(don'?t|can'?t) remember\b|\bidk\b|\bthe answer\b/i.test(t)&&t.length<40);
    if(dunno){await sayLine("dunno");
      if(hasFact&&!peek){const c=await choose(tr(["📚 好呀，先翻翻旅行档案","💡 给我一个提示","🤔 我再想想"],["📚 Okay, let’s check the guidebook","💡 Give me a hint","🤔 Let me think a bit more"]),{title:tr("小地：要不要我们先去查查旅行档案？📚","Xiaodi: Shall we look it up in the Travel Guidebook first? 📚")});
        if(c===0){submitLater("cmd","翻秘籍")}else if(c===1){submitLater("cmd","请求帮助")}else await say("xd",tr("好！我相信你，慢慢想～","Okay! I believe in you—take your time~"));}
      else await say("xd",tr("要不点“💡请求帮助”，我给你一点提示？","Want to tap “💡 Ask for help”? I’ll give you a little hint."));continue}
    if((/火锅|好玩|你是谁|模型|作业|游戏/.test(t)&&t.length<16)||(/\b(hot ?pot|who are you|are you (an? )?(ai|robot|model|bot)|homework|video game|let'?s play)\b/i.test(t)&&t.length<40)){await sayLine("offtopic");continue}
    if(hasFact&&(copied(t,PM[prov].f[T.dim])||(GE[prov]&&copied(t,GE[prov].f[T.dim])))){setXD("oops");await say("xd",tr("嘿嘿，这句话怎么和档案上一模一样😆 你能合上秘籍，用你自己的话、再加一个“比如”讲给我听吗？自己说出来的，才会变成你自己的知识哦！","Hehe, that sounds exactly like the guidebook 😆 Can you close it and tell me in your own words—plus one “for example”? What you say yourself is what becomes YOUR knowledge!"));continue}
    const e=generic?evalGeneric(T,t):evalSpecific(T,t);
    if(e.deep){res=e;break}
    S.flow.fails++;S.flow.wins=0;
    if(e.wrong){await sayLine("wrong");phase(2);continue}
    if(probe<2){probe++;ST.probed++;phase(2);setXD("ask");const PR=TT(T,"probes");await say("xd",PR?PR[probe-1]:genProbe(e,probe));
      if(S.flow.fails>=2){setStarters(ST3());say("sys",tr("🎚️ 难度自适应：看起来有点难，开头词又回来帮你啦。","🎚️ Adaptive difficulty: this looks tricky, so the sentence starters are back to help you."))}continue}
    await sayLine("stuck");
  }
  // 解决
  phase(3);setXD("eureka");S.flow.fails=0;S.flow.wins++;ST.deep++;
  const r={probe,hint,peek,fix:res.fix,ex:res.ex};const solo=!probe&&!hint&&!peek;
  const rc=TT(T,"recap")||tr(`哇，我懂了！我原来以为“${T.wrong}”，听你一讲，原来${T.key}`,`Wow, I get it! I used to think “${TT(T,"wrong")}”, but after your explanation: ${TT(T,"key")}`);
  await say("xd",rc+"\n\n"+praise(res,generic)+(dial(prov)&&Math.random()<.6?"\n🗣️ "+dial(prov):"")+"\n"+line("eurekaPS")+(solo?tr("\n⭐ 没翻秘籍、没用提示就一次讲清——额外奖励 1 颗“独立讲清星”！","\n⭐ No peeking, no hints, clear on the first try—bonus: 1 “solo star”!"):""));
  const[xp,det]=calcTeachXP(r,prov);addXP(xp,det);
  S.perf[T.qid]="深度";S.pending=S.pending.filter(x=>x!==T.qid);bumpBadge(T.dim);
  $("#lvCombo").textContent=S.combo;save();
  // 心流：连续顺利 → 挑战追问（精细化“为什么”）
  if(S.flow.wins>=2&&hint===0&&T.why){
    await say("xd",tr("⚡ 你状态超好！挑战模式开启：","⚡ You’re on fire! Challenge mode on: ")+TT(T,"why"),{tag:tr("挑战追问 +10","Challenge question +10")});
    const a=await waitInput();
    if(a.kind==="text"&&(RX.whyZ.test(a.v)||RX.whyE.test(a.v))){ST.why++;setXD("eureka");await say("xd",tr("这个解释好有道理！我记在小本本上了📒（这道追问的标准答案我也不知道，我们回头一起查资料验证～）","That explanation makes so much sense! I wrote it in my notebook 📒 (I don’t know the official answer to this one either—let’s look it up together later to check~)"));addXP(10,tr("挑战追问","Challenge question"))}
    else await say("xd",tr("嘿嘿，这题确实难，我们先记下，下次再聊～","Hehe, this one really is hard—let’s note it down and chat next time~"));
  }
  return{cat:"深度",text:last};
}
function praise(e,generic){const p=[];if(e.fix)p.push(tr("你明确指出了我错在哪","you clearly pointed out where I went wrong"));if(e.g.why||e.g.kind||e.g.struct)p.push(tr("你讲清了原因或细节","you explained the reason or details"));if(e.ex)p.push(tr("你还举了例子，我一下就记住了","and you gave an example, so I remembered it right away"));return tr("📝 小地的小结：","📝 Xiaodi’s summary: ")+(p.join(tr("，",", "))||tr("讲得很清楚","that was really clear"))+tr("！","!")}
function submitLater(k,v){setTimeout(()=>submit(k,v),FAST?0:250)}
function copied(t,fact){if(!fact)return false;const c=x=>x.toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]/g,"");const a=c(t),b=c(fact);const W=isLatin(t)?40:16;if(a.length<W)return false;for(let i=0;i+W<=a.length;i++)if(b.includes(a.slice(i,i+W)))return true;return false}
function genHint(q,h){return h===1?tr("一级提示：","Hint 1: ")+TT(q,"hint").replace(/^提示：|^Hint: /,""):h===2?tr("二级提示：试着用“其实……因为……比如……”三段来讲：先纠正我，再说原因，最后举个例子。","Hint 2: Try three parts—“Actually… Because… For example…”: first correct me, then give the reason, then an example."):tr("三级提示：先想清楚我那句“"+q.wrong+"”哪里不对，再说出正确的说法和理由。","Hint 3: First work out what’s wrong with my idea “"+TT(q,"wrong")+"”, then tell me the right idea and why.")}
function genProbe(e,n){if(!e.g.fix)return tr("谢谢旅伴！所以我原来那个说法到底哪里不对呀？","Thanks, buddy! So what exactly was wrong with what I said?");if(!e.g.why)return tr("嗯嗯！那能告诉我“为什么”吗？","Mm-hm! Can you tell me “why”?");return tr("能举个例子吗？我想记得更牢一点～","Can you give me an example? I want to remember it better~")}

/* ---------- 小游戏 ---------- */
function gameMatch(){return new Promise(res=>{
  const L=[...MATCH].sort(()=>Math.random()-.5),R=[...MATCH].sort(()=>Math.random()-.5);const t0=Date.now();let sel=null,done=0,miss=0;
  const p=panel(`<b>${tr("🍜 美食连连看","🍜 Food Match-Up")}</b><div class="mini">${tr("点左边的美食，再点右边的省份（不同省份穿插练习）","Tap a dish on the left, then its province on the right (provinces are mixed for interleaved practice)")}</div><div class="match" style="margin-top:8px"><div class="grid" style="gap:8px">${L.map(x=>`<button data-f="${x[0]}">${tr(x[0],x[2])}</button>`).join("")}</div><div class="grid" style="gap:8px">${R.map(x=>`<button data-mp="${x[1]}">${pn(x[1])}</button>`).join("")}</div></div><div class="mini" id="mres"></div>`);
  p.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{p.querySelectorAll("[data-f]").forEach(x=>x.classList.remove("sel"));b.classList.add("sel");sel=b});
  p.querySelectorAll("[data-mp]").forEach(b=>b.onclick=()=>{if(!sel)return;const ok=MATCH.find(m=>m[0]===sel.dataset.f)[1]===b.dataset.mp;
    if(ok){sel.classList.add("done");b.classList.add("done");sel.classList.remove("sel");sel=null;done++;if(done===MATCH.length){const s=Math.round((Date.now()-t0)/1000);p.querySelector("#mres").textContent=tr(`完成！用时 ${s} 秒，失误 ${miss} 次`,`Done! Time: ${s} s, misses: ${miss}`);res({s,miss})}}
    else{miss++;b.classList.add("no");setTimeout(()=>b.classList.remove("no"),350)}})})}
function gameQuiz(){return new Promise(async res=>{
  const qs=[...QUIZ].sort(()=>Math.random()-.5).slice(0,5);let right=0,wrongs=[];
  const p=panel(`<b>${tr("⚡ 闪电问答","⚡ Lightning Quiz")}</b><div class="mini">${tr("每题 7 秒，判断对错！（提取练习：从记忆里“捞”知识）","7 seconds per question—true or false? (Retrieval practice: “fish” knowledge out of your memory)")}</div><div id="qz"></div>`);const box=p.querySelector("#qz");
  const qt=q=>tr(q[0],q[3]),qe=q=>tr(q[2],q[4]);
  for(let i=0;i<qs.length;i++){const q=qs[i];
    const a=await new Promise(r=>{box.innerHTML=`<div style="margin-top:10px;font-size:17px;font-weight:700">${i+1}/5　${qt(q)}</div><div class="timer"><i id="tb"></i></div><div class="tf"><button class="y">${tr("✓ 对","✓ True")}</button><button class="n">${tr("✗ 错","✗ False")}</button></div>`;
      const tb=box.querySelector("#tb");tb.style.transition=FAST?"none":"width 7s linear";requestAnimationFrame(()=>tb.style.width="0%");
      const to=setTimeout(()=>r(-1),FAST?50:7000);box.querySelector(".y").onclick=()=>{clearTimeout(to);r(1)};box.querySelector(".n").onclick=()=>{clearTimeout(to);r(0)}});
    if(a===q[1])right++;else wrongs.push(q);}
  box.innerHTML=`<div style="margin-top:10px"><b>${tr(`答对 ${right}/5`,`${right}/5 correct`)}</b>${wrongs.length?`<div class="mini" style="text-align:left;margin-top:6px">${wrongs.map(w=>`❌ ${qt(w)} → ${w[1]?tr("这句是对的","this one is true"):tr("错，","false: ")+qe(w)}`).join("<br>")}</div>`:""}</div>`;res(right)})}
function gameBoss(){return new Promise(async res=>{
  let hp=3,miss=0;const p=panel(`<div class="boss"><img src="assets/boss.jpg"><div style="text-align:left"><b>${tr("迷思大王 · 西南分身","Myth King · Southwest Clone")}</b><div class="hp" id="hp">💜💜💜</div><div class="mini">${tr("它把小地脑子里的迷思都收集起来了！选对“说法”，再选对“证据”，才能击退它。","It has collected all the myths in Xiaodi’s head! Choose the right “claim”, then the right “evidence”, to drive it away.")}</div></div></div><div id="bq"></div>`);
  const bq=p.querySelector("#bq");
  for(const r of BOSS){
    let stage=0;
    await new Promise(done=>{
      const render=()=>{const R=isEN()?Object.assign({},r,r.en):r;const list=stage===0?R.opts:R.reasons,ok=stage===0?r.ok:r.rok;
        bq.innerHTML=`<div style="margin-top:10px;text-align:left"><b>${tr("👑 迷思大王：","👑 Myth King: ")}</b>“${R.claim}”${stage===0?`<div class="mini taunt">😈 ${line("bossTaunt")}</div>`:""}</div><div class="mini" style="text-align:left">${stage===0?tr("第一步：哪个说法是对的？","Step 1: Which claim is right?"):tr("第二步：你的证据是？（光说“不对”打不倒它）","Step 2: What’s your evidence? (Just saying “wrong” won’t beat it)")}</div><div class="opts">${list.map((t,i)=>`<button data-i="${i}">${t}</button>`).join("")}</div>`;
        bq.querySelectorAll("button").forEach(b=>b.onclick=()=>{if(+b.dataset.i===ok){b.classList.add("ok");setTimeout(()=>{if(stage===0){stage=1;render()}else{hp--;p.querySelector("#hp").textContent="💜".repeat(hp)+"🤍".repeat(3-hp);toast("👑 "+line("bossHit"));done()}},FAST?0:450)}else{miss++;b.classList.add("no");setXD("oops");toast(tr("👑 迷思大王：","👑 Myth King: ")+line("bossWrong")+tr(" 别灰心，排除一个错误选项也是进步！"," Don’t give up—ruling out a wrong option is progress too!"))}})};render()})}
  bq.innerHTML=`<div style="margin-top:10px"><b>${tr("🎉 迷思大王被击退啦！","🎉 The Myth King has been driven away!")}</b><div class="mini">👑 “${line("bossDefeat")}”</div><div class="mini">${tr(`失误 ${miss} 次${miss?"——每次选错都让你离正确答案更近一步":"，完美！"}。`,`Misses: ${miss}${miss?"—every wrong pick brought you one step closer to the right answer":". Perfect!"}`)}</div></div>`;res(miss)})}
async function gameDiaryFix(name,s1,s2){
  setXD("diary");
  const sn=t=>(t||"").replace(/\s+/g," ").slice(0,40)+((t||"").length>40?"…":"");
  const SZ=[["第一站，"+name+"旅伴带我来到了四川成都。",0],["我原来以为川菜道道都辣，多亏"+name+"告诉我：“"+sn(s1)+"”",0],["原来川菜讲究“一菜一格，百菜百味”，开水白菜一点都不辣。",0],
    ["下午我去了都江堰，原来它是一座超级大的拦河水坝！",1,"下午我去了都江堰，原来它没有大坝，是靠鱼嘴分水、飞沙堰排沙、宝瓶口引水。"],["旅伴说：“"+sn(s2)+"”",0],
    ["最后我见到了大熊猫，原来大熊猫只住在四川，别的地方一只都没有。",1,"最后我见到了大熊猫：野生大熊猫主要住在四川，陕西秦岭和甘肃也有。"],["下一站，我想去重庆或者云南。听说重庆的轻轨会从楼里穿过去，这是真的吗？",0]];
  const who=name||"my Travel Buddy";
  const SE=[["First stop: "+(name?name+", my Travel Buddy,":"my Travel Buddy")+" took me to Chengdu, Sichuan.",0],["I used to think every Sichuan dish was spicy, but "+who+" told me: “"+sn(s1)+"”",0],["It turns out Sichuan food is “each dish its own style, a hundred dishes a hundred flavors”—boiled-water cabbage isn’t spicy at all.",0],
    ["In the afternoon I went to Dujiangyan—it turns out it’s a gigantic dam that blocks the whole river!",1,"In the afternoon I went to Dujiangyan—it turns out it has no dam: the Fish Mouth splits the water, the Flying Sand Weir drains the sand, and the Bottle-Neck Channel brings the water in."],["My buddy said: “"+sn(s2)+"”",0],
    ["Finally I met the giant pandas—it turns out pandas live only in Sichuan and nowhere else.",1,"Finally I met the giant pandas: wild pandas live mainly in Sichuan, and also in the Qinling Mountains of Shaanxi and in Gansu."],["Next stop, I want to go to Chongqing or Yunnan. I heard Chongqing’s monorail goes right through a building—is that true?",0]];
  const sents=isEN()?SE:SZ;
  await say("xd",tr("我写好第一章游记啦！不过……我太粗心了，里面好像写错了 2 句 😅 旅伴帮我找出来好不好？","I finished the first chapter of my travel diary! But… I’m so careless, I think I wrote 2 sentences wrong 😅 Can you help me find them, buddy?"));
  return new Promise(res=>{let found=0;const p=panel(`<b>${tr("🔎 游记找茬：点出小地写错的句子","🔎 Diary detective: tap the sentences Xiaodi got wrong")}</b><div class="diaryq" style="text-align:left;margin-top:8px"><p>${sents.map((s,i)=>`<span class="s" data-i="${i}">${esc(s[0])}${isEN()?" ":""}</span>`).join("")}</p></div><div class="mini" id="fx">${tr("还差 2 处","2 left to find")}</div>`);
    p.querySelectorAll(".s").forEach(el=>el.onclick=()=>{const s=sents[+el.dataset.i];if(el.classList.contains("fixed"))return;
      if(s[1]){found++;el.classList.add("found");setTimeout(()=>{el.classList.remove("found");el.classList.add("fixed");el.textContent=s[2]+(isEN()?" ":"")},FAST?0:600);addXP(10,tr("找茬成功","Mistake found"));
        p.querySelector("#fx").textContent=found<2?tr("还差 1 处","1 left to find"):tr("全部找到！小地已经改正啦","All found! Xiaodi has fixed them");if(found===2)res({zh:SZ.map(s=>s[1]?s[2]:s[0]),en:SE.map(s=>s[1]?s[2]:s[0])})}
      else{el.classList.add("nope");toast(tr("这句没写错哦～再找找","That one is correct~ keep looking"));setTimeout(()=>el.classList.remove("nope"),700)}})})}

/* ---------- 奖励：盖章 + 盲盒 ---------- */
function stampProvince(n){if(S.stamps.includes(n))return false;S.stamps.push(n);(PM[n].po||[]).forEach((_,i)=>{const k=n+"|"+i;if(!S.poems.includes(k))S.poems.push(k)});const b=n===S.home?60:40;S.aff=Math.min(100,S.aff+(n===S.home?10:5));addXP(b,tr("护照盖章","Passport stamp")+(n===S.home?tr("（家乡）"," (hometown)"):""));
  const reg=PM[n].r;if(P.filter(p=>p.r===reg).every(p=>S.stamps.includes(p.n))){const add=50*P.filter(p=>p.r===reg).length;addXP(add,tr("集齐"+reg,"Completed "+rn(reg)));achieve("reg_"+reg,tr("集齐"+reg+" · "+GEO_REGIONS[reg],"Completed "+rn(reg)+" · "+ra(reg)))}save();return true}
function showStamp(n){return new Promise(r=>queueOverlay(()=>{confetti();setXD("cele");const p=PM[n];
  ov(`<h3 style="margin:4px 0">${tr("🛂 护照盖章！","🛂 Passport stamped!")}</h3>${p.simg?`<img class="stampin" src="assets/stamp/${p.simg}.png">`:`<div class="stampin" style="display:flex;align-items:center;justify-content:center;border-radius:50%;border:5px double var(--orange);font-size:60px;background:#fff6ee">${p.em}</div>`}<h3>${p.em} ${pstamp(n)}</h3><p class="mini">${tr(`已盖 ${S.stamps.length}/34`,`${S.stamps.length}/34 stamped`)}${(p.po||[]).length?tr(` ｜ 📜 解锁文学锦囊 ${p.po.length} 首`,` | 📜 ${p.po.length} poem(s) unlocked in the Poem Pouch`):""}</p>`,n==="四川"?tr("开特产盲盒 🎁","Open the specialty blind box 🎁"):(p.po||[]).length?tr("打开文学锦囊 📜","Open the Poem Pouch 📜"):tr("好耶！","Yay!"),r)}))}
function drawCard(){let x=Math.random(),c=CARDS[0];for(const k of CARDS){if(x<k.p){c=k;break}x-=k.p}return c}
function showBlindBox(forced){return new Promise(r=>queueOverlay(()=>{
  $("#ovc").innerHTML=`<h3>${tr("🎁 四川特产盲盒","🎁 Sichuan Specialty Blind Box")}</h3><p class="mini">${tr("点一下盒子拆开！（普通 70%｜稀有 20%｜隐藏款 10%）","Tap the box to open it! (Common 70% | Rare 20% | Secret 10%)")}</p><img class="box3d" id="bx" src="assets/ui/blindbox.jpg">`;
  $("#bx").onclick=()=>{$("#bx").classList.add("open");setTimeout(()=>{const c=forced?CARDS.find(k=>k.id===forced):drawCard();const dup=S.cards.includes(c.id);if(!dup)S.cards.push(c.id);save();
    if(c.rar==="h")confetti(90);
    ov(`<span class="rar ${c.rar}">${rarn(c.rar)}</span><img class="flip" src="assets/card/${c.id}.jpg"><h3 style="margin:4px">${cn_(c)}</h3><p>${cf_(c)}</p>${dup?`<p class="mini">${tr("重复卡 → 转换为 +20 XP","Duplicate card → converted to +20 XP")}</p>`:""}`,tr("收进卡册","Add to my album"),()=>{if(dup)addXP(20,tr("重复卡转换","Duplicate converted"));r()})},FAST?0:600)}}))}

/* ---------- 旅行档案（输入）：关卡前免费看；答题中“翻秘籍”有代价（支架渐隐） ---------- */
const DIMICON=d=>`assets/badge/${BADGE[d][0]}.png`;
function archCard(n,d){return`<div class="acard"><img src="${DIMICON(d)}" alt=""><div><b>${dn(d)}</b>${d==="性格特点"?`<span class="mini">${tr("（常听人说的印象，不代表每个人）"," (common impressions—not true of everyone)")}</span>`:""}<p>${esc(pfact(n,d))}</p></div></div>`}
function poTitle(n,i){const x=PM[n].po[i],e=E(n)&&E(n).po[i];return e?`“${e.t}” 《${x.t}》`:`《${x.t}》`}
function poBy(n,i){const x=PM[n].po[i],e=E(n)&&E(n).po[i];return e?`${e.dy} · ${e.a}`:`${x.dy}·${x.a}`}
/* 面积·人口（来源见 面积人口_数据来源.md）与学习顺序 / area, population & route step */
const GS=n=>(window.GEO_STATS||{})[n];
function statLine(n){const g=GS(n);if(!g)return"";
  const pop={res:tr(`常住人口${g.pz}（2025年末）`,`Resident population ${g.pe} (end of 2025)`),hk:tr(`人口${g.pz}（2025年底临时数字）`,`Population ${g.pe} (end of 2025, provisional)`),mo:tr(`总人口${g.pz}（2025年底）`,`Population ${g.pe} (end of 2025)`),tw:tr(`户籍人口${g.pz}（2025年底，含金门、马祖）`,`Registered population ${g.pe} (end of 2025, incl. Kinmen & Matsu)`)}[g.k];
  return`<span title="${tr("人口：各地2025年统计公报/港澳官方统计；面积：各省级政府官网，均为约数","Population: 2025 official statistics; area: provincial government figures (rounded)")}">📏 ${tr(`面积${g.az}`,`Area ${g.ae}`)}${tr(" ｜ "," | ")}👥 ${pop}</span>`}
function stepLine(r){const i=ROUTE.indexOf(r),pr=prevOf(r),ok=unlocked(r);
  return`🧭 ${tr(`第${i+1}站·${r}`,`Stop ${i+1} · ${rn(r)}`)}${tr(" ｜ "," | ")}${i===0?tr("起点站，一开始就能去","Starting stop—open from the start"):tr(`解锁条件：在「${pr}」（${prevList(r)}）任选一省盖 1 枚章`,`Unlock: get 1 stamp anywhere in ${rn(pr)} (${prevList(r)})`)} <b class="${ok?"ok":"no"}">${ok?tr("✅ 已解锁","✅ Unlocked"):tr("🔒 未解锁","🔒 Locked")}</b>`}
function routeBar(){return`<b>${tr("🧭 学习顺序：","🧭 Route order: ")}</b>`+ROUTE.map((r,i)=>`<span class="rstep ${unlocked(r)?"":"lock"}">${i+1} ${rns(r)}</span>`).join(`<i>→</i>`)+`<span class="mini">${tr("（每站盖 1 枚章，下一站就解锁）"," (1 stamp in a stop unlocks the next)")}</span>`}
function archiveHTML(n,o={}){const p=PM[n];const got=S.stamps.includes(n);
  const meta=tr(`简称“${p.a}” ｜ ${p.r} ｜ 省会/首府：${p.c}`,`Short name “${p.a}” | ${rn(p.r)} | Capital: ${pcap(n)}`);
  const head=p.img?`<div class="ahero" style="background-image:url(assets/scene/${p.img}.jpg)"><div class="aht"><b>${p.em} ${pn(n)}</b><span>${meta}</span></div></div>`:`<div class="ahero ph2"><div class="aht"><b>${p.em} ${pn(n)}</b><span>${meta}</span></div></div>`;
  const po=(p.po||[]);const poem=po.length?`<div class="apoem"><b>${tr("📜 文学锦囊","📜 Poem Pouch")}</b> ${got?po.map((x,i)=>`<button class="chip" data-po="${n}|${i}">${poTitle(n,i)} ${poBy(n,i)}</button>`).join(""):`<span class="mini">${tr(`🔒 帮小地在${n}盖章后解锁 ${po.length} 首与这里有关的诗文`,`🔒 Help Xiaodi get the ${pn(n)} stamp to unlock ${po.length} poem(s) about this place`)}</span>`}</div>`:"";
  return`${head}<div class="astat">${stepLine(p.r)}<br>${statLine(n)}</div><div class="mini atip">${tr("📖 先读档案（输入）→ 再合上档案，用自己的话教小地（输出）。读的时候可以想一想：小地最可能把哪一条搞混？","📖 Read the guidebook first (input) → then close it and teach Xiaodi in your own words (output). While reading, think: which fact is Xiaodi most likely to mix up?")}</div><div class="agrid">${DIMS.map(d=>archCard(n,d)).join("")}</div>${poem}`}
let archCur="四川";
function renderArchive(){const sel=$("#archSel");
  sel.innerHTML=ROUTE.map(r=>`<optgroup label="${rn(r)}">${P.filter(p=>p.r===r).map(p=>`<option value="${p.n}" ${p.n===archCur?"selected":""}>${pn(p.n)}</option>`).join("")}</optgroup>`).join("");
  sel.onchange=()=>{archCur=sel.value;renderArchive()};
  $("#archBody").innerHTML=archiveHTML(archCur);bindPoemChips("#archBody");
  const lock=!unlocked(PM[archCur].r);
  $("#archGo").textContent=lock?tr(`🔒 ${PM[archCur].r}还没解锁，先去「${prevOf(PM[archCur].r)}」盖 1 枚章（档案可以先看）`,`🔒 ${rn(PM[archCur].r)} locked: get 1 stamp in ${rn(prevOf(PM[archCur].r))} first (you can read anyway)`):archCur==="四川"?tr("🎒 看完了，合上档案去教小地（四川完整关卡）","🎒 Done reading—close it and go teach Xiaodi (full Sichuan level)"):tr(`🎒 看完了，合上档案去教小地（${archCur}练习）`,`🎒 Done reading—close it and go teach Xiaodi (${pn(archCur)} practice)`);
  $("#archGo").onclick=()=>runPractice(archCur)}
function openArchive(n){archCur=n;go("arch")}
async function preArchive(n){
  const c=await choose(tr(["📚 先翻翻旅行档案（免费）","🚀 直接出发（挑战：不看秘籍一次讲清，额外得⭐）"],["📚 Read the Travel Guidebook first (free)","🚀 Go straight away (challenge: explain it right the first time without peeking for a bonus ⭐)"]),{title:tr(`出发前：要不要先看看「${n}」的旅行档案？`,`Before we go: want to read the ${pn(n)} Travel Guidebook first?`)});
  if(c===0){ST.pre=1;const pn_=panel(`<b>📚 ${tr(n+" · 旅行档案",pn(n)+" · Travel Guidebook")}</b>`+archiveHTML(n));bindPoemChips(pn_);
    await say("npc",tr("看完了吗？待会儿要<b>合上档案</b>，用你自己的话讲给小地听哦——自己说出来的知识，才记得最牢！","Finished reading? In a moment, <b>close the guidebook</b> and explain it to Xiaodi in your own words—what you say yourself is what you remember best!"),{npc:NPC[PM[n].r][0],html:true});
    await choose([tr("✅ 看好啦，合上档案出发！","✅ Got it—closing the guidebook, let’s go!")]);setXD("idle")}
  else await say("xd",tr("哇，挑战模式！😎 那我可要认真听了！","Whoa, challenge mode! 😎 Then I’d better listen carefully!"))}
/* ---------- 文学锦囊：逐字浮现 + 朗读（英文模式：原文 + 自译白话释义）---------- */
function poemKeys(){return P.flatMap(p=>(p.po||[]).map((_,i)=>p.n+"|"+i))}
function poemHTML(n,i){const x=PM[n].po[i],e=E(n)&&E(n).po[i];let k=0;
  const lines=x.l.map(l=>`<p>${[...l].map(ch=>`<span style="animation-delay:${FAST?0:(k++*0.09+0.4).toFixed(2)}s">${ch}</span>`).join("")}</p>`).join("");
  const n_=PM[n].po.length;
  if(e){const gd=FAST?0:(k*0.09+0.6).toFixed(2);
    return`<div class="poem"><div class="ptag">📜 Poem Pouch · ${pn(n)} <small>${i+1}/${n_}</small></div><h3 class="pen">${esc(e.t)}</h3><div class="pau">《${x.t}》 · ${esc(e.dy)} · ${esc(e.a)} <span class="mini">(${x.a})</span></div><div class="plines">${lines}</div>
  <div class="pgloss" style="animation-delay:${gd}s"><div class="glab">Plain English gloss (our own, not a published translation)</div>${e.g.map(g=>`<p>${esc(g)}</p>`).join("")}</div><div class="pnote">📍 ${esc(e.n)}</div>
  <div class="pbtns"><button class="btn g sm" id="pSpeak">🔊 Read in Chinese</button><button class="btn g sm" id="pSpeakEn">🔊 Read the English</button><button class="btn g sm" id="pReplay">↺ Replay</button>${n_>1?`<button class="btn g sm" id="pNext">Next ›</button>`:""}</div></div>`}
  return`<div class="poem"><div class="ptag">📜 文学锦囊 · ${n} <small>${i+1}/${n_}</small></div><h3>《${x.t}》</h3><div class="pau">${x.dy} · ${x.a}</div><div class="plines">${lines}</div><div class="pnote">📍 ${x.n}</div>
  <div class="pbtns"><button class="btn g sm" id="pSpeak">🔊 朗读</button><button class="btn g sm" id="pReplay">↺ 再看一遍</button>${n_>1?`<button class="btn g sm" id="pNext">下一首 ›</button>`:""}</div></div>`}
function speak(text,lang){
  if(!("speechSynthesis" in window)||typeof SpeechSynthesisUtterance==="undefined"){toast(tr("这个浏览器暂时不支持朗读～可以自己大声读一读，效果更好！","This browser can’t read aloud yet~ Try reading it out loud yourself—it works even better!"));return}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=lang==="zh-CN"?.8:.9;
    const re=lang==="zh-CN"?/zh[-_]CN|cmn|Chinese/i:/en[-_](US|GB)|English/i;
    const v=speechSynthesis.getVoices().find(v=>re.test(v.lang+v.name));if(v)u.voice=v;else if(speechSynthesis.getVoices().length)toast(lang==="zh-CN"?tr("没找到中文语音包，读音可能不准；也可以自己读一读～","No Chinese voice found, so pronunciation may be off—you can read it yourself too~"):tr("没找到英文语音包～","No English voice found~"));
    u.onerror=()=>toast(tr("朗读没能播放～可以自己大声读一读！","Couldn’t play the reading~ Try reading it out loud yourself!"));speechSynthesis.speak(u);setXD("listen")}catch(e){toast(tr("朗读没能播放～可以自己大声读一读！","Couldn’t play the reading~ Try reading it out loud yourself!"))}}
function speakPoem(n,i){const x=PM[n].po[i];speak(`${x.t}。${x.dy}，${x.a}。`+x.l.join(""),"zh-CN")}
function speakGloss(n,i){const e=GE[n]&&GE[n].po[i];if(e)speak(`${e.t}. By ${e.a}, ${e.dy}. `+e.g.join(" "),"en-US")}
function bindPoem(n,i){$("#pSpeak").onclick=()=>speakPoem(n,i);const se=$("#pSpeakEn");if(se)se.onclick=()=>speakGloss(n,i);$("#pReplay").onclick=()=>{const b=$("#ovc .poem");b.outerHTML=poemHTML(n,i);bindPoem(n,i)};
  const nx=$("#pNext");if(nx)nx.onclick=()=>{const j=(i+1)%PM[n].po.length;$("#ovc .poem").outerHTML=poemHTML(n,j);bindPoem(n,j)}}
function showPoem(n,i=0,reward){return new Promise(r=>queueOverlay(()=>{if(reward)setXD("cele");
  $("#ovc").innerHTML=(reward?`<div class="mini">${tr("🎁 盖章奖励：收进卡册的「文学锦囊」","🎁 Stamp reward: a poem for the Poem Pouch in your album")}</div>`:"")+poemHTML(n,i)+`<div style="margin-top:12px"><button class="btn o" id="ovOk">${reward?tr("收进锦囊","Keep it in the pouch"):tr("合上锦囊","Close the pouch")}</button></div>`;
  bindPoem(n,i);$("#ovOk").onclick=()=>{try{speechSynthesis.cancel()}catch(e){}nextOv();r()}}))}
function bindPoemChips(root){const el=typeof root==="string"?$(root):root;el.querySelectorAll("[data-po]").forEach(b=>b.onclick=()=>{const[n,i]=b.dataset.po.split("|");showPoem(n,+i)})}

/* ---------- 四川完整关卡 ---------- */
let running=false;
const GOALS=()=>tr(["🎯 不用提示，讲清至少 2 题","❓ 每次讲解都说出“为什么”","⚔️ 打败迷思大王"],["🎯 Explain at least 2 questions without hints","❓ Say “why” in every explanation","⚔️ Defeat the Myth King"]);
const BESTS=()=>tr(["川菜的味型","都江堰怎么治水","大熊猫住在哪","打败迷思大王"],["Sichuan flavor types","How Dujiangyan manages water","Where pandas live","Beating the Myth King"]);
const NEXTS=()=>tr(["少用一点提示","多举例子","多讲“为什么”","去一个新的区域"],["Use fewer hints","Give more examples","Explain more “why”","Visit a new region"]);
async function runSichuan(){
  if(running)return;running=true;go("play");msgs().innerHTML="";lvXP=0;$("#lvXp").textContent=0;ST={deep:0,hint:0,probed:0,why:0,peek:0,snips:[]};
  setHead({k:"sc"});
  const TOTAL=10;let st=0;stepBar(TOTAL,st);
  setXD("idle");
  await say("npc",npcp("西南",0)+tr("我是熊猫阿宝，西南大区的向导！🎋 小地要去四川啦，可它脑子里装了好多“迷思”。你是它的旅伴——别直接把答案丢给它，要讲清楚“为什么”哦。","I’m Abao the Panda, guide of the Southwest! 🎋 Xiaodi is heading to Sichuan, but its head is full of “myths”. You’re its Travel Buddy—don’t just toss it the answer; explain the “why”."),{npc:"xinan",tag:tr("NPC 向导","NPC guide")});
  // SRL 计划
  await say("npc",tr("出发前先给自己定个小目标（计划）👇","Before we set off, set yourself a small goal (planning) 👇"),{npc:"xinan"});
  const gi=await choose(GOALS(),{title:tr("这一关我的目标是：","My goal for this level:")});
  const ci=await choose(["⭐","⭐⭐","⭐⭐⭐","⭐⭐⭐⭐","⭐⭐⭐⭐⭐"],{title:tr("你觉得自己对四川有多了解？（先估一估，关卡结束再对照）","How much do you think you know about Sichuan? (Guess now, compare at the end)")});
  await preArchive("四川");
  stepBar(TOTAL,++st);
  const r1=await teach(SC[0],0,"四川");stepBar(TOTAL,++st);
  await say("npc",tr("讲得好！休息一下，玩个美食连连看——不只四川，别的省也混在里面哦。","Nicely explained! Take a break with Food Match-Up—it’s not just Sichuan, other provinces are mixed in too."),{npc:"xinan"});
  const m=await gameMatch();addXP(20+(m.s<30?10:0),tr("连连看","Match-Up")+(m.s<30?tr("（30秒内+10）"," (under 30 s +10)"):""));if(m.miss===0)achieve("match",tr("连连看零失误","Perfect Match-Up"));stepBar(TOTAL,++st);
  await sayLine("silly");
  const r2=await teach(SC[1],1,"四川");stepBar(TOTAL,++st);
  await say("npc",tr("⚡ 闪电问答来啦！别紧张，答错也是在帮大脑“加固记忆”。","⚡ Lightning Quiz time! Don’t worry—even wrong answers help your brain “reinforce memory”."),{npc:"xinan"});
  const qz=await gameQuiz();addXP(qz*5,tr(`闪电问答 ${qz}/5`,`Lightning Quiz ${qz}/5`));if(qz===5)achieve("quiz",tr("闪电侠：5题全对","Lightning Hero: 5/5"));stepBar(TOTAL,++st);
  const r3=await teach(SC[2],2,"四川");stepBar(TOTAL,++st);
  // Boss
  setXD("ask");await say("xd",tr("啊！旅伴快看，迷思大王来了！它说我脑子里那些错误想法才是对的！😱","Ah! Look, buddy—the Myth King is here! It says all those wrong ideas in my head are actually right! 😱"));
  const bm=await gameBoss();addXP(50,tr("击退迷思大王","Drove away the Myth King"));achieve("boss_xinan",tr("迷思克星 · 西南","Myth Buster · Southwest"));setXD("cele");stepBar(TOTAL,++st);
  // 盖章 + 盲盒
  const deepN=SC.filter(t=>S.perf[t.qid]==="深度").length;
  if(deepN>=2&&stampProvince("四川")){await showStamp("四川");await showBlindBox(URLP.get("card"));await showPoem("四川",0,true);await overlayDone()}
  else if(deepN<2)await say("sys",tr("这关有 "+(3-deepN)+" 题进了“待解之谜”，补完就能盖章哦！",(3-deepN)+" question(s) from this level went into “Unsolved Mysteries”—finish them to get the stamp!"));
  stepBar(TOTAL,++st);
  // 游记 + 找茬
  const paras=await gameDiaryFix(S.name||"",r1.text,r2.text);
  S.diary=S.diary.filter(d=>d.prov!=="四川");S.diary.push({no:S.diary.length+1,prov:"四川",img:"sichuan",title:"四川｜不用大坝的两千岁水利",title_en:"Sichuan | A 2,000-year-old waterworks with no dam",paras:paras.zh,paras_en:paras.en,date:dayStr(now())});save();
  await say("xd",tr("改好啦！这一章已经存进《小地游记》📔 你是共同作者哦～","All fixed! This chapter is saved in “Xiaodi’s Travel Diary” 📔 You’re the co-author~"));stepBar(TOTAL,++st);
  // SRL 反思
  setXD("listen");
  const met=gi===0?(ST.deep-Math.min(ST.deep,ST.hint))>=2&&ST.hint===0:gi===1?ST.why>=1||ST.deep>=3:true;
  const perf=Math.max(1,Math.min(5,1+ST.deep+(ST.hint===0?1:0)+(qz>=4?1:0)-(bm>2?1:0)));
  const goal=GOALS()[gi];
  await say("npc",tr(`回顾时间（监控 + 反思）📋\n你的目标：${goal} → ${met?"✅ 达成！":"🔸 还差一点点"}\n本关数据：深度讲解 ${ST.deep} 次｜用提示 ${ST.hint} 次｜翻秘籍 ${ST.peek} 次｜追问后补充 ${ST.probed} 次｜挑战追问 ${ST.why} 次\n出发前你给自己打了 ${ci+1} 星，实际表现约 ${perf} 星。${perf>ci+1?"你比自己想的更厉害！":perf<ci+1?"有些地方比想象中难，这很正常～":"估得很准！"}`,
    `Review time (monitoring + reflection) 📋\nYour goal: ${goal} → ${met?"✅ Achieved!":"🔸 Almost there"}\nThis level: deep explanations ${ST.deep} | hints ${ST.hint} | peeks ${ST.peek} | added after follow-up ${ST.probed} | challenge questions ${ST.why}\nBefore starting you gave yourself ${ci+1} star(s); your actual performance was about ${perf} star(s). ${perf>ci+1?"You’re even better than you thought!":perf<ci+1?"Some parts were harder than expected—that’s totally normal~":"Spot-on estimate!"}`),{npc:"xinan"});
  const a1=await choose(BESTS(),{title:tr("这一关，我讲得最清楚的是：","This level, what I explained best was:")});
  const a2=await choose(NEXTS(),{title:tr("下一关，我想试试：","Next level, I want to try:")});
  S.refl.push({date:dayStr(now()),prov:"四川",gi,bi:a1,ni:a2,goal:inL("zh",GOALS)[gi],met,conf:ci+1,perf,best:inL("zh",BESTS)[a1],next:inL("zh",NEXTS)[a2],stats:{...ST,snips:undefined}});
  addXP(10,tr("完成反思","Reflection done"));achieve("refl",tr("反思家","Reflector"));
  // 间隔复习排期
  SC.forEach(t=>{if(S.perf[t.qid]==="深度"&&!S.reviews.find(r=>r.qid===t.qid))S.reviews.push({qid:t.qid,box:1,due:now()+DAY})});save();
  stepBar(TOTAL,TOTAL);setXD("cele");
  await say("xd",tr("四川之旅完成！🎉 明天我可能会忘掉一点点……到时候还要请你再提醒我（间隔复习）。下一站想去重庆还是云南？","Sichuan trip complete! 🎉 Tomorrow I might forget a little bit… then I’ll need you to remind me (spaced review). Next stop: Chongqing or Yunnan?"));
  setStarters([]);running=false;renderAll();
}

/* ---------- 其他省份：练习模式（简版规则评分） ---------- */
async function runPractice(n){
  if(running)return;const p=PM[n];if(!unlocked(p.r)){toast(lockMsg(p.r));return}
  if(n==="四川")return runSichuan();
  running=true;go("play");msgs().innerHTML="";lvXP=0;$("#lvXp").textContent=0;ST={deep:0,hint:0,probed:0,why:0,peek:0,snips:[]};
  setHead({k:"pr",n});stepBar(3,0);
  await say("npc",tr(`${npcp(p.r,0)}欢迎来到${n}！我是${NPC[p.r][1]}，${npcp(p.r,1)}这一站是练习模式：小地会问 3 个问题，按“纠错 + 原因 + 例子 + 关键内容”简单打分（正式版由大模型判断）。`,`${npcp(p.r,0)}Welcome to ${pn(n)}! I’m ${NPC[p.r][2]}. ${npcp(p.r,1)}This stop is practice mode: Xiaodi will ask 3 questions, scored simply on “correction + reason + example + key content” (the full version uses an AI model to judge).`),{npc:NPC[p.r][0],tag:tr("NPC 向导","NPC guide")});
  const qs=[...p.qs].sort((a,b)=>(b.d===S.fav)-(a.d===S.fav));
  await preArchive(n);
  for(let i=0;i<qs.length;i++){const q=qs[i];if(i===1)await sayLine("silly");const qq=QS[q.id],e=enq(qq);
    await teach({qid:q.id,dim:q.d,trigger:q.ask,key:q.key,hint:q.hint,wrong:q.wrong,en:e?{trigger:e.ask,key:e.key,hint:e.hint,wrong:e.wrong,kw:e.kw}:null},i,n,true);stepBar(3,i+1)}
  const deepN=p.qs.filter(q=>S.perf[q.id]==="深度").length;
  if(deepN>=2&&stampProvince(n)){await showStamp(n);if(p.po&&p.po.length)await showPoem(n,0,true);await overlayDone();
    const sn=ST.snips.slice(0,3);
    const pz=[`这一站，${S.name||""}旅伴带我来到了${n}。`,...sn.map(s=>`旅伴说：“${s.slice(0,50)}”`),`下一站去哪里呢？我已经开始期待啦！`];
    const pe=[`On this stop, ${S.name?S.name+", my Travel Buddy,":"my Travel Buddy"} took me to ${GE[n]?GE[n].n:n}.`,...sn.map(s=>`My buddy said: “${s.slice(0,60)}”`),`Where to next? I’m already excited!`];
    S.diary.push({no:S.diary.length+1,prov:n,img:p.img,title:`${n}｜旅伴带我认识的${n}`,title_en:`${GE[n]?GE[n].n:n} | The ${GE[n]?GE[n].n:n} my buddy showed me`,paras:pz,paras_en:pe,date:dayStr(now())});
    p.qs.forEach(q=>{if(S.perf[q.id]==="深度"&&!S.reviews.find(r=>r.qid===q.id))S.reviews.push({qid:q.id,box:1,due:now()+DAY})});save();
    await say("xd",tr("这一章游记写好啦，去《小地游记》看看吧📔","This diary chapter is done—go check it out in “Xiaodi’s Travel Diary” 📔"));}
  setStarters([]);running=false;renderAll();
}

/* ---------- 间隔复习（Leitner：1/3/7/14 天） ---------- */
const BOXD=[0,1,3,7,14];
async function runReview(qid){
  if(running)return;running=true;go("play");msgs().innerHTML="";const T=SC.find(t=>t.qid===qid);const q=QS[qid];const e=enq(q);
  setHead({k:"rv"});stepBar(1,0);setXD("oops");
  await say("xd",T?tr(T.review.q,T.en.reviewQ):tr(`旅伴……我好像把“${q.prov}”的这个忘了：${q.ask}`,`Buddy… I think I forgot this one about ${pn(q.prov)}: ${e?e.ask:q.ask}`),{tag:tr("间隔复习 · ","Spaced review · ")+qid});
  setStarters([]);let ok=false;
  const G=T?null:{key:q.key,en:e?{kw:e.kw}:null};
  while(true){const r=await waitInput();if(r.kind!=="text"){if(r.v==="请求帮助"){await say("xd",tr("提示：","Hint: ")+(T?TT(T,"hints")[0]:(isEN()&&e?e.hint:q.hint)));continue}break}
    touchDay();const ev=T?evalSpecific(T,r.v):evalGeneric(G,r.v);ok=T?T.review.ok(ev.g):ev.deep;break}
  const it=S.reviews.find(x=>x.qid===qid);
  if(ok){setXD("eureka");it.box=Math.min(4,it.box+1);it.due=now()+BOXD[it.box]*DAY;await say("xd",tr(`对对对！我想起来了！谢谢旅伴～这次我会记得更久（下次复习：${BOXD[it.box]} 天后）。`,`Yes, yes, yes! I remember now! Thanks, buddy~ This time I’ll remember it longer (next review in ${BOXD[it.box]} day(s)).`));addXP(15,tr("间隔复习","Spaced review"))}
  else{setXD("ask");it.box=1;it.due=now()+DAY;await say("xd",tr("嗯……我们俩好像都有点模糊了。明天再一起想一想吧！（已安排明天复习）","Hmm… we both seem a bit fuzzy on this. Let’s think about it together again tomorrow! (Review scheduled for tomorrow)"))}
  save();stepBar(1,1);running=false;renderAll();
}

/* ---------- 示例对话（来自《示例对话与使用说明.md》） ---------- */
async function demoTalk(){
  if(running)return;running=true;go("play");msgs().innerHTML="";setHead({k:"demo"});stepBar(4,0);
  const DZ=[["xd","🚄 我到成都啦！导游阿姨说下午去都江堰，我好激动！我猜都江堰一定是一座超级大的水坝，把岷江整个拦住，对吧？旅伴，都江堰到底是什么样的呀？","ask",0,"① 触发"],
   ["me","不是大坝。","listen",1],["xd","啊？不是大坝吗😮 谢谢旅伴！可是……没有大坝，它怎么管住那么大的江水呢？","ask",2,"③ 整合·追问"],
   ["me","请求帮助","listen",2],["xd","好呀，我们一起想想～💡 一级提示：都江堰有三个主要部分，其中一个叫“鱼嘴”。你觉得“鱼嘴”在江里做什么？","listen",2,"提示支架 1/3"],
   ["me","鱼嘴像鱼的嘴巴一样立在江中间，把岷江分成内江和外江。内江的水通过宝瓶口流进成都平原灌溉，飞沙堰可以把多余的水和沙子排回外江。它是顺着水流和地形来治水的，不用拦住整条江，所以两千多年了还在用。就像我们家门口的小溪，用石头分一下水就能浇菜地。","listen",1],
   ["xd","哇，我懂了！🤩 我原来以为都江堰是一堵把江拦住的大墙，原来它是用鱼嘴分水、飞沙堰排沙、宝瓶口引水，顺着水的脾气来治水，所以不用大坝。你还用小溪浇菜地举例，我一下就记住了！\n我还有个小好奇：为什么不用大坝反而能用两千多年呀？（下次再告诉我～）\n🎒 +45 XP（用提示后讲清+15｜纠错奖+10｜举例奖+5｜家乡×1.5）","eureka",3,"④ 解决"],
   ["me","你喜欢吃火锅吗？","listen",3],["xd","嘿嘿，火锅我待会儿肯定要吃！🌶️ 不过我还有四川的最后一个问题没弄懂呢——我听说大熊猫只住在四川，别的地方都没有，是真的吗？","ask",0,"离题拉回 → 下一题触发"]];
  const DE_=[["xd","🚄 I made it to Chengdu! The tour guide said we’re going to Dujiangyan this afternoon—I’m so excited! I bet Dujiangyan is a super-huge dam that blocks the whole Min River, right? Buddy, what is Dujiangyan really like?","ask",0,"① Trigger"],
   ["me","It’s not a dam.","listen",1],["xd","Huh? It’s not a dam? 😮 Thanks, buddy! But… without a dam, how does it control such a big river?","ask",2,"③ Integrate · follow-up"],
   ["me","💡 Ask for help","listen",2],["xd","Sure, let’s think together~ 💡 Hint 1: Dujiangyan has three main parts, and one is called the “Fish Mouth”. What do you think the Fish Mouth does in the river?","listen",2,"Hint ladder 1/3"],
   ["me","The Fish Mouth stands in the middle of the river like a fish’s mouth and splits the Min River into an inner river and an outer river. Water from the inner river flows through the Bottle-Neck Channel into the Chengdu Plain to water the fields, and the Flying Sand Weir sends extra water and sand back to the outer river. It works with the flow of the water and the shape of the land, so it doesn’t need to block the whole river—that’s why it still works after more than 2,000 years. It’s like the stream by our house: you can split the water with a few stones to water the vegetable patch.","listen",1],
   ["xd","Wow, I get it! 🤩 I thought Dujiangyan was a giant wall blocking the river, but it uses the Fish Mouth to split the water, the Flying Sand Weir to drain sand, and the Bottle-Neck Channel to bring water in—it goes along with the water’s nature, so it doesn’t need a dam. And your example about the stream and the vegetable patch made me remember it right away!\nI’m still a little curious: why can it last more than 2,000 years without a dam? (Tell me next time~)\n🎒 +45 XP (clear with hints +15 | correction bonus +10 | example bonus +5 | hometown ×1.5)","eureka",3,"④ Resolve"],
   ["me","Do you like hotpot?","listen",3],["xd","Hehe, I’m definitely having hotpot later! 🌶️ But I still have one last Sichuan question I don’t get—I heard giant pandas live only in Sichuan and nowhere else. Is that true?","ask",0,"Off-topic → back on track → next trigger"]];
  const D=isEN()?DE_:DZ;
  for(const[w,t,x,ph,tag]of D){setXD(x);phase(ph);if(w==="me"){await sleep(700);say("me",t)}else await say("xd",t,{tag});await sleep(400)}
  stepBar(4,4);running=false;
}

/* ---------- 渲染 ---------- */
function refreshTop(){$("#topLevel").textContent=`${lvn(levelOf(S.xp))} · ${S.xp} XP`}
function renderHome(){
  $("#hHello").textContent=tr(`${S.name||""}旅伴，你来啦！`,`${S.name?"Hi, "+S.name:"Hi, Travel Buddy"}—you’re here!`);
  const homeP=PM[S.home];
  $("#hLine").innerHTML=S.stamps.length?tr(`护照已经有 <b>${S.stamps.length}</b> 枚章了，小地想继续出发！`,`The passport already has <b>${S.stamps.length}</b> stamp(s)—Xiaodi wants to keep going!`):tr(`第一站去${homeP&&homeP.n==="四川"?"旅伴的家乡——":""}<b>四川</b>！熊猫阿宝已经在等你们了。`,`First stop: ${homeP&&homeP.n==="四川"?"your hometown, ":""}<b>Sichuan</b>! Abao the Panda is already waiting for you.`);
  const due=S.reviews.filter(r=>r.due<=now());
  $("#hPost").innerHTML=`<img src="assets/scene/sichuan.jpg"><div style="flex:1"><b>${tr("📮 小地寄来明信片","📮 A postcard from Xiaodi")}</b><div class="mini">${due.length?tr(`“旅伴，我好像忘了 ${due.length} 件事……能再提醒我一下吗？”`,`“Buddy, I think I forgot ${due.length} thing(s)… can you remind me again?”`):S.stamps.includes("四川")?tr("“四川太好玩了！下一站想去云南看石林～”","“Sichuan was so much fun! Next I want to see the Stone Forest in Yunnan~”"):tr("“我在成都闻到一股好香的味道，可我搞不清川菜到底是什么味……快来救我！”","“I smelled something delicious in Chengdu, but I can’t figure out what Sichuan food really tastes like… come rescue me!”")}</div></div><button class="btn o sm" id="hGo">${due.length?tr("去复习","Review"):tr("出发","Let’s go")}</button>`;
  $("#hGo").onclick=()=>due.length?runReview(due[0].qid):S.stamps.includes("四川")?go("map"):runSichuan();
  const a=S.aff;$("#hAffT").textContent=a;$("#hAff").style.width=a+"%";$("#hRel").textContent=tr("关系：","Relationship: ")+relOf(a);
  const mood=due.length?["oops",tr("有点迷糊，需要你","A bit fuzzy—needs you")]:S.stamps.length?["eureka",tr("兴奋！想继续旅行","Excited! Wants to keep traveling")]:["confused",tr("好奇又紧张","Curious and a bit nervous")];
  $("#hAvatar").src=`assets/xd/${mood[0]}.jpg`;$("#hMood").textContent=mood[1];
  const lv=levelOf(S.xp),nx=nextLv(S.xp),prev=[...LEVELS].reverse().find(l=>l[0]<=S.xp)[0];
  $("#hLevel").textContent=lvn(lv);$("#hXpT").textContent=S.xp+" XP";$("#hNext").textContent=nx?tr(`下一级「${nx[1]}」${nx[0]}`,`Next: ${lvn(nx[1])} at ${nx[0]}`):tr("已满级","Max level");
  $("#hXp").style.width=(nx?((S.xp-prev)/(nx[0]-prev)*100):100)+"%";
  $("#hStampsT").textContent=S.stamps.length+"/34";$("#hStars").textContent=tr(`⭐ 独立讲清星 ${S.stars||0} 颗 ｜ 📜 文学锦囊 ${S.poems.length}/${poemKeys().length}`,`⭐ Solo stars: ${S.stars||0} | 📜 Poems: ${S.poems.length}/${poemKeys().length}`);$("#hStamps").style.width=S.stamps.length/34*100+"%";
  $("#hStreak").textContent=S.streak;$("#hFreeze").textContent=tr(`🛡️ 休息卡 ${S.freeze} 张：断一天也不怕，小地帮你守住连续天数（每连续 7 天 +1 张）`,`🛡️ Rest cards: ${S.freeze}. Miss a day? No problem—Xiaodi protects your streak (+1 card every 7 days in a row)`);
  const today=dayStr(now())===S.lastDay;
  $("#hQuest").innerHTML=[[tr("教小地 1 题","Teach Xiaodi 1 question"),today],[tr("完成 1 次复习","Finish 1 review"),due.length===0&&S.reviews.length>0],[tr("开 1 个盲盒","Open 1 blind box"),S.cards.length>0]].map(q=>`<div class="mini">${q[1]?"✅":"⬜"} ${q[0]}</div>`).join("");
  $("#hReviews").innerHTML=S.reviews.length?S.reviews.map(r=>{const q=QS[r.qid];const e=enq(q);const d=Math.ceil((r.due-now())/DAY);const ask=isEN()&&e?e.ask:q.ask;const cut=isEN()?70:34;return`<div class="review"><img src="assets/xd/${r.due<=now()?"oops":"listening"}.jpg"><div style="flex:1"><b>${pn(q.prov)} · ${dn(q.d)}</b><div class="mini">${esc(ask.slice(0,cut))}${ask.length>cut?"…":""}</div><div class="mini">${tr(`记忆盒 ${r.box}/4`,`Memory box ${r.box}/4`)} ｜ ${r.due<=now()?`<b style='color:var(--orange)'>${tr("今天该复习啦","Review due today")}</b>`:tr(d+" 天后复习","Review in "+d+" day(s)")}</div></div>${r.due<=now()?`<button class="btn o sm" data-r="${r.qid}">${tr("提醒小地","Remind Xiaodi")}</button>`:""}</div>`}).join(""):`<div class="card mini">${tr("还没有要复习的内容。完成一关后，小地会按 1 / 3 / 7 / 14 天的间隔来“忘记”再问你。","Nothing to review yet. After you finish a level, Xiaodi will “forget” and ask you again after 1 / 3 / 7 / 14 days.")}</div>`;
  $$("[data-r]").forEach(b=>b.onclick=()=>runReview(b.dataset.r));
  const rec=["四川","云南","重庆","贵州"].map(n=>PM[n]);$("#hRec").innerHTML=rec.map(pcard).join("");bindCards("#hRec");
}
function pcard(p){const lock=!unlocked(p.r),got=S.stamps.includes(p.n),home=p.n===S.home;
  const rb=got?`<span class="ribbon g">${tr("✅ 已盖章","✅ Stamped")}</span>`:home?`<span class="ribbon">${tr("🏠 家乡","🏠 Home")}</span>`:p.n==="四川"?`<span class="ribbon b">${tr("▶ 完整关卡","▶ Full level")}</span>`:lock?`<span class="ribbon k">${tr("🔒 未解锁","🔒 Locked")}</span>`:"";
  const pic=p.img?`<div class="pic" style="background-image:url(assets/scene/${p.img}.jpg)${lock?";filter:grayscale(.7)":""}"></div>`:`<div class="ph"><div class="em">${p.em}</div><div class="ab">${p.a}</div><div class="sp">${pspot(p.n)} · ${pfood(p.n)}</div></div>`;
  return`<div class="pcard" data-p="${p.n}">${rb}${pic}<div class="info"><b>${p.em} ${pn(p.n)}</b><span>${rns(p.r)} ｜ ${pcap(p.n)} ｜ ${p.n==="四川"?tr("教学+小游戏+Boss","Teaching + games + Boss"):tr("练习模式 3 题","Practice · 3 Qs")}</span></div></div>`}
function bindCards(sel){$$(sel+" .pcard").forEach(c=>c.onclick=()=>openArchive(c.dataset.p))}
let galFilter="全部";
function renderMap(){
  const pts=ROUTE.slice(0,7).map(r=>REGPOS[r].join(",")).join(" ");
  $("#map").innerHTML=`<svg class="route" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}"/><polyline class="sea" points="${REGPOS.华南.join(",")} ${REGPOS.港澳台.join(",")}"/></svg><div class="compass" title="${tr("指北针：上北下南、左西右东","Compass: north up, south down, west left, east right")}"><i>▲</i><b>${tr("北","N")}</b></div>`+ROUTE.map((r,i)=>{const[x,y]=REGPOS[r];const ps=P.filter(p=>p.r===r),got=ps.filter(p=>S.stamps.includes(p.n)).length;const lock=!unlocked(r);const cur=!lock&&got<ps.length&&(r==="西南"||got>0||r===regionOf(S.home));
    return`<button class="node ${lock?"lock":""} ${cur?"cur":""}" style="left:${x}%;top:${y}%" data-r="${r}"><div class="ring" style="--p:${got/ps.length*100}%"><img src="assets/npc/${NPC[r][0]}.jpg"></div><div class="lab">${lock?"🔒 ":""}${i+1}. ${rns(r)} <small>${got}/${ps.length}</small></div></button>`}).join("");
  const rb_=$("#routeBar");if(rb_)rb_.innerHTML=routeBar();
  $$("#map .node").forEach(b=>b.onclick=()=>{galFilter=b.dataset.r;renderGallery();document.getElementById("galTitle").scrollIntoView({behavior:"smooth"});if(!unlocked(b.dataset.r))toast(lockMsg(b.dataset.r))});
  renderGallery();
}
function renderGallery(){
  $("#filters").innerHTML=["全部",...ROUTE].map(r=>`<span class="chip ${r===galFilter?"on":""}" data-f="${r}">${r==="全部"?tr("全部","All"):rns(r)}</span>`).join("");
  $$("#filters .chip").forEach(c=>c.onclick=()=>{galFilter=c.dataset.f;renderGallery()});
  const list=P.filter(p=>galFilter==="全部"||p.r===galFilter).sort((a,b)=>(b.n==="四川")-(a.n==="四川")||(!!b.img)-(!!a.img));
  $("#galTitle").textContent=galFilter==="全部"?tr("选一个省份出发（34 个省级行政区）","Pick a place to start (34 provincial-level divisions)"):tr(`${galFilter} · 向导 ${NPC[galFilter][1]}`,`${rn(galFilter)} · Guide: ${NPC[galFilter][2]}`);
  $("#gallery").innerHTML=list.map(pcard).join("");bindCards("#gallery");
}
function renderPassport(){
  $("#ppSum").textContent=tr(`${S.name||"旅伴"} 的护照 · 已盖 ${S.stamps.length}/34`,`${S.name||"Travel Buddy"}’s passport · ${S.stamps.length}/34 stamped`);
  $("#ppPage").innerHTML=ROUTE.map(r=>{const ps=P.filter(p=>p.r===r);const full=ps.every(p=>S.stamps.includes(p.n));
    return`<div class="region"><h4>${rn(r)} <span class="mini">${ra(r)}${full?" ✅":""}</span></h4><div class="slots">${ps.map(p=>S.stamps.includes(p.n)?`<div class="slot got">${p.simg?`<img src="assets/stamp/${p.simg}.png">`:`<div class="emst"><span style="font-size:26px">${p.em}</span>${p.a}</div>`}<span class="nm">${pn(p.n)}</span></div>`:`<div class="slot">${p.a}<span class="nm">${pn(p.n)}</span></div>`).join("")}</div><div style="height:16px"></div></div>`}).join("")}
function renderBadges(){
  $("#badgeWall").innerHTML=DIMS.map(d=>{const t=tierOf(d),c=S.badges[d]||0,o=d===S.fav?1:0,need=[3,8,15].map(x=>x-o).find(x=>x>c);
    return`<div class="card badge ${t?"":"lock"}"><img src="assets/badge/${BADGE[d][0]}.png"><b>${bn(d)}${d===S.fav?" ❤️":""}</b><small>${tr(`${d} · 深度讲解 ${c} 次`,`${dn(d)} · ${c} deep explanation(s)`)}</small><br><span class="tier t${t}">${tr(["未获得","铜","银","金"],["Not yet","Bronze","Silver","Gold"])[t]}${need?tr(` · 下一级还差 ${need-c}`,` · ${need-c} more to next tier`):""}</span></div>`}).join("");
  const A=[["boss_xinan","⚔️","迷思克星·西南","打败西南迷思大王","Myth Buster · Southwest","Beat the Southwest Myth King"],["match","🍜","连连看零失误","一次不错地配完美食","Perfect Match-Up","Match all dishes with no misses"],["quiz","⚡","闪电侠","闪电问答 5 题全对","Lightning Hero","Get 5/5 in the Lightning Quiz"],["refl","🪞","反思家","完成一次关卡反思","Reflector","Finish one level reflection"],["reg_西南","🎋","集齐西南","西南 5 省全部盖章","Southwest Complete","Stamp all 5 Southwest divisions"]];
  $("#achv").innerHTML=A.map(a=>`<div class="card badge ${S.achv.includes(a[0])?"":"lock"}" style="padding:16px"><div style="font-size:34px;${S.achv.includes(a[0])?"":"filter:grayscale(1);opacity:.4"}">${a[1]}</div><b>${tr(a[2],a[4])}</b><small>${tr(a[3],a[5])}</small></div>`).join("")}
function renderCards(){
  const own=CARDS.map(c=>`<div class="ccard ${S.cards.includes(c.id)?"":"lock"}"><img src="assets/card/${c.id}.jpg"><div style="margin-top:6px"><span class="rar ${c.rar}">${rarn(c.rar)}</span></div><b>${S.cards.includes(c.id)?cn_(c):"？？？"}</b><div class="mini">${S.cards.includes(c.id)?cf_(c):tr("盖四川章后开盲盒获得","Get it from the blind box after the Sichuan stamp")}</div></div>`).join("");
  const more=["云南","广东","新疆","浙江"].map(n=>`<div class="ccard"><div class="pcard"><div class="ph"><div class="em">${PM[n].em}</div><div class="ab">${PM[n].a}</div><div class="sp">${tr(n+"特产系列 · 敬请期待",pn(n)+" specialty series · coming soon")}</div></div></div></div>`).join("");
  const keys=poemKeys();$("#poemSum").textContent=tr(`已收集 ${S.poems.length}/${keys.length} 首 · 覆盖 ${P.filter(p=>(p.po||[]).length).length} 个省级行政区（没有找到可靠诗作的地方宁缺毋滥）`,`Collected ${S.poems.length}/${keys.length} poems · covering ${P.filter(p=>(p.po||[]).length).length} provincial-level divisions (where we found no reliable poem, we left it empty rather than guess)`);
  $("#poemBook").innerHTML=keys.map(k=>{const[n,i]=k.split("|");const x=PM[n].po[+i];const e=E(n)&&E(n).po[+i];const own=S.poems.includes(k);
    return`<div class="pcardp ${own?"":"lock"}" ${own?`data-po="${k}"`:""}><div class="pv">${own?x.l[0].replace(/[，。？！；、]$/,""):"？？？？？"}</div><b>${own?(e?esc(e.t):`《${x.t}》`):tr("未解锁","Locked")}</b><small>${pn(n)}${own?(e?` · 《${x.t}》 · ${esc(e.a)}`:` · ${x.dy} · ${x.a}`):tr(" · 盖章后解锁"," · unlock with a stamp")}</small></div>`}).join("");bindPoemChips("#poemBook");
  $("#cardBook").innerHTML=`<div style="grid-column:1/-1"><b>${tr("四川系列","Sichuan series")}</b> <span class="mini">${S.cards.length}/4</span></div>`+own+`<div style="grid-column:1/-1;margin-top:10px"><b>${tr("更多省份系列","More province series")}</b></div>`+more}
function renderDiary(){
  $("#diaryList").innerHTML=S.diary.length?S.diary.map((d,i)=>{const T_=isEN()&&d.title_en?d.title_en:d.title,PA=isEN()&&d.paras_en?d.paras_en:d.paras;return`<div class="chapter">${d.img?`<img src="assets/scene/${d.img}.jpg">`:`<div class="pcard"><div class="ph"><div class="em">${PM[d.prov].em}</div><div class="ab">${PM[d.prov].a}</div></div></div>`}<div><div class="mini">${d.date}</div><h3>${tr(`《小地游记·第${i+1}章：${esc(T_)}》`,`Xiaodi’s Travel Diary · Chapter ${i+1}: ${esc(T_)}`)}</h3>${PA.map(p=>`<p>${esc(p)}</p>`).join("")}<p class="mini">${tr(`—— 小地 & ${esc(S.name||"旅伴")}（共同作者）`,`— Xiaodi & ${esc(S.name||"Travel Buddy")} (co-authors)`)}</p></div></div>`}).join(""):`<div class="empty"><img src="assets/xd/diary.jpg"><p>${tr("游记还是空白的～带小地完成第一站，它就会用你教的话写下第一章！","The diary is still blank~ Help Xiaodi finish the first stop and it will write Chapter 1 using what you taught!")}</p></div>`;
  $("#reflList").innerHTML=S.refl.length?S.refl.map(r=>{const g=r.gi!=null?GOALS()[r.gi]:r.goal,b=r.bi!=null?BESTS()[r.bi]:r.best,nx=r.ni!=null?NEXTS()[r.ni]:r.next;return`<div class="card" style="margin-bottom:10px"><b>${r.date} · ${pn(r.prov)}</b><div class="mini" style="line-height:1.9">${tr("🎯 目标：","🎯 Goal: ")}${g} → ${r.met?tr("✅ 达成","✅ Achieved"):tr("🔸 还差一点","🔸 Almost")}<br>${tr(`📏 自评 ${r.conf} 星 → 表现约 ${r.perf} 星`,`📏 Self-rating ${r.conf} star(s) → performance about ${r.perf} star(s)`)}<br>${tr("👍 讲得最清楚：","👍 Explained best: ")}${b} ｜ ${tr("➡️ 下次想试：","➡️ Next time: ")}${nx}<br>${tr(`📊 深度讲解 ${r.stats.deep}｜提示 ${r.stats.hint}｜追问后补充 ${r.stats.probed}｜挑战追问 ${r.stats.why}`,`📊 Deep explanations ${r.stats.deep} | hints ${r.stats.hint} | added after follow-up ${r.stats.probed} | challenge questions ${r.stats.why}`)}</div></div>`}).join(""):`<div class="card mini">${tr("完成一关后，这里会记录你的“计划—监控—反思”。","After you finish a level, your “plan → monitor → reflect” record appears here.")}</div>`}
function renderAll(){refreshTop();renderHome();renderMap();renderPassport();renderBadges();renderCards();renderDiary();renderArchive()}
let curScreen="home";
function go(s){curScreen=s;$$(".screen").forEach(x=>x.classList.toggle("on",x.id==="s-"+s));$$("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.s===s));$("#topbar").style.display=s==="onb"?"none":"";
  refreshTop();if(s!=="play"&&s!=="onb")renderAll();window.scrollTo(0,0)}

/* ---------- 语言切换 / language switch ---------- */
function applyStatic(){
  document.documentElement.lang=isEN()?"en":"zh-CN";
  document.title=tr("小地的中国旅行日记 · 学习空间","Xiaodi’s Travel Diary · Learning Space");
  $$("[data-en]").forEach(el=>{if(el.dataset.zh==null)el.dataset.zh=el.innerHTML;el.innerHTML=isEN()?el.dataset.en:el.dataset.zh});
  $$("[data-enph]").forEach(el=>{if(el.dataset.zhph==null)el.dataset.zhph=el.placeholder;el.placeholder=isEN()?el.dataset.enph:el.dataset.zhph});
  $$("[data-entitle]").forEach(el=>{if(el.dataset.zhtitle==null)el.dataset.zhtitle=el.title;el.title=isEN()?el.dataset.entitle:el.dataset.zhtitle});
  $$("#langBtn [data-l], #onbLang [data-lang]").forEach(x=>x.classList.toggle("on",(x.dataset.l||x.dataset.lang)===LANG));
  document.body.classList.toggle("en",isEN());
}
function setLang(l,quiet){if(l!=="en"&&l!=="zh")return;LANG=l;try{localStorage.setItem(LKEY,l)}catch(e){}S.lang=l;save();
  applyStatic();renderOnb();drawHead();setXD(xdCur);if(!running)setStarters([]);renderAll();
  if(!quiet)toast(tr("已切换为中文 🇨🇳","Switched to English 🌐"))}

/* ---------- 档案设置 ---------- */
let onbFav="美食";
function renderOnb(){const hv=$("#fHome").value;
  $("#fHome").innerHTML=`<option value="">${tr("请选择","Choose…")}</option>`+["华北","东北","华东","华中","华南","西南","西北","港澳台"].map(r=>`<optgroup label="${rn(r)}">${P.filter(p=>p.r===r).map(p=>`<option value="${p.n}">${pn(p.n)}</option>`).join("")}</optgroup>`).join("")+`<option value="其他">${tr("不在这里 / 不想说","Not listed / prefer not to say")}</option>`;
  $("#fHome").value=hv;
  $("#fFav").innerHTML=DIMS.map(d=>`<span class="chip ${d===onbFav?"on":""}" data-d="${d}">${dn(d)}</span>`).join("");
  $$("#fFav .chip").forEach(c=>c.onclick=()=>{onbFav=c.dataset.d;$$("#fFav .chip").forEach(x=>x.classList.toggle("on",x===c))})}
function setupOnb(){
  renderOnb();
  $("#fGo").onclick=()=>{S.name=$("#fName").value.trim();S.onb=true;S.home=$("#fHome").value;S.fav=onbFav;S.lang=LANG;save();go("home");
    if(S.home&&S.home!=="四川"&&PM[S.home])setTimeout(()=>toast(tr(`你的家乡「${S.home}」已标记 🏠：可以在旅程地图里先去练习，完整关卡先从四川体验`,`Your hometown “${pn(S.home)}” is marked 🏠: you can practice it from the Journey map; the full level starts in Sichuan`)),600)};
  $("#fDemo").onclick=()=>{seedDemo();go("home")};
}
function seedDemo(){const nm=tr("小富婆","Mia");S=Object.assign(fresh(),{name:nm,home:"四川",fav:"美食",xp:520,aff:76,streak:4,lastDay:dayStr(Date.now()),freeze:1,lang:LANG,
  stamps:["四川","云南","广东","广西","浙江"],onb:true,stars:3,poems:["四川|0","四川|1","四川|2","广东|0","广东|1","广西|0","浙江|0","浙江|1"],badges:{美食:4,景点:3,冷知识:2,方言:2,地形:1},cards:["doubanjiang","zhuyeqing"],achv:["boss_xinan","refl","match"],
  perf:{"川-01":"深度","川-02":"深度","川-03":"深度"},pending:["晋-03"],reviews:[{qid:"川-02",box:1,due:Date.now()-1000},{qid:"川-01",box:2,due:Date.now()+3*DAY}],
  diary:[{no:1,prov:"四川",img:"sichuan",title:"四川｜不用大坝的两千岁水利",title_en:"Sichuan | A 2,000-year-old waterworks with no dam",date:dayStr(Date.now()-3*DAY),
    paras:[`第一站，${nm}旅伴带我来到了四川成都。`,`我原来以为川菜道道都辣，多亏${nm}告诉我：“其实川菜有很多味型，比如鱼香、糖醋，开水白菜一点都不辣。”`,"下午我去了都江堰，原来它没有大坝，是靠鱼嘴分水、飞沙堰排沙、宝瓶口引水。旅伴说，这就像用石头给小溪分水浇菜地。","最后我见到了大熊猫：野生大熊猫主要住在四川，陕西秦岭和甘肃也有。","下一站，我想去重庆或者云南。听说重庆的轻轨会从楼里穿过去，这是真的吗？"],
    paras_en:[`First stop: ${nm}, my Travel Buddy, took me to Chengdu, Sichuan.`,`I used to think every Sichuan dish was spicy, but ${nm} told me: “Actually, Sichuan food has lots of flavor types, like fish-fragrant and sweet-and-sour—and boiled-water cabbage isn’t spicy at all.”`,"In the afternoon I went to Dujiangyan—it turns out it has no dam: the Fish Mouth splits the water, the Flying Sand Weir drains the sand, and the Bottle-Neck Channel brings the water in. My buddy said it’s like splitting a stream with stones to water a vegetable patch.","Finally I met the giant pandas: wild pandas live mainly in Sichuan, and also in the Qinling Mountains of Shaanxi and in Gansu.","Next stop, I want to go to Chongqing or Yunnan. I heard Chongqing’s monorail goes right through a building—is that true?"]},
   {no:2,prov:"云南",img:"yunnan",title:"云南｜一山分四季",title_en:"Yunnan | One mountain, four seasons",date:dayStr(Date.now()-2*DAY),
    paras:[`这一站，${nm}旅伴带我来到了云南。`,"我原来以为云南在最南边，全省都热得像夏天。旅伴说：“云南海拔高低差很大，昆明四季如春，玉龙雪山上还有雪。”","我还学会了：不认识的野生菌千万不能采，炒熟了也可能有毒！","下一站去哪里呢？听说贵州有一只“中国天眼”……"],
    paras_en:[`On this stop, ${nm}, my Travel Buddy, took me to Yunnan.`,"I used to think Yunnan, being so far south, was hot like summer everywhere. My buddy said: “Yunnan’s altitude changes a lot—Kunming is like spring all year, and there’s still snow on Jade Dragon Snow Mountain.”","I also learned: never pick wild mushrooms you don’t recognise—even cooked, they can still be poisonous!","Where to next? I heard Guizhou has a “China Sky Eye”…"]}],
  refl:[{date:dayStr(Date.now()-3*DAY),prov:"四川",gi:1,bi:1,ni:0,goal:"❓ 每次讲解都说出“为什么”",met:true,conf:3,perf:4,best:"都江堰怎么治水",next:"少用一点提示",stats:{deep:3,hint:1,probed:1,why:1}}]});save()}

/* ---------- 绑定 ---------- */
$$("#nav button").forEach(b=>b.onclick=()=>go(b.dataset.s));
$("#send").onclick=()=>{const v=$("#inp").value.trim();if(!v)return;$("#inp").value="";submit("text",v)};
$("#inp").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#send").click()}});
$("#inp").addEventListener("focus",()=>{if(running)setXD("listen")});
$$("#quick button").forEach(b=>b.onclick=()=>submit("cmd",b.dataset.c));
$("#startSC").onclick=runSichuan;$("#demoTalk").onclick=demoTalk;
$("#hSkip").onclick=()=>{S.offset++;save();renderAll();toast(tr("⏩ 时间前进了 1 天（演示用）","⏩ Time moved forward 1 day (demo)"))};
$("#hReset").onclick=()=>{if(confirm(tr("确定清空所有进度吗？","Clear all progress?"))){localStorage.removeItem(KEY);S=fresh();go("onb")}};
$("#langBtn").onclick=()=>setLang(isEN()?"zh":"en");
$$("#onbLang [data-lang]").forEach(c=>c.onclick=()=>setLang(c.dataset.lang,true));
if(!URLP.get("lang")&&S.lang&&S.lang!==LANG&&!localStorage.getItem(LKEY))LANG=S.lang;
applyStatic();
setupOnb();
if(URLP.has("demo"))seedDemo();
drawHead();setXD("idle");
const scr=URLP.get("screen");
if(!S.onb&&!S.name&&!scr)go("onb");else go(scr||"home");
if(scr==="play"&&URLP.has("talk"))demoTalk();
if(URLP.get("ov")==="stamp")showStamp("四川");
if(URLP.get("ov")==="box")showBlindBox(URLP.get("card")||"shuxiu");
if(URLP.get("ov")==="poem")showPoem(URLP.get("p")||"四川",+(URLP.get("i")||0),true);
if(URLP.get("arch"))openArchive(URLP.get("arch"));
if(URLP.get("ov")==="level")queueOverlay(()=>showLevelUp("初级导游","中级导游"));
window.__geo={S:()=>S,runSichuan,submit,go,openArchive,showPoem,line,setLang,lang:()=>LANG};
})();
