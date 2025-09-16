/* global confetti */
/* eslint-disable no-unused-vars */

// --- 参数 ---
const SIZE = 10;
const TYPES = ["🍎","🥦","🥕","🥛","🍞","🧃","🍌","🍇"];  // 只保留 8 种
const CELL = 48; // 每格像素大小
const tips = [
  "Drink more water and less sugary drinks~",
  "Vegetables and fruits provide dietary fiber!",
  "Whole grains are more filling.",
  "Replace beverages with water and you can reduce a lot of sugar in a week!",
  "Protein should be balanced: beans, eggs, milk",
  "Look at the nutrition label: less sugar, less salt, less saturated fat!"
];

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const tipEl   = document.getElementById("tip");
const resetBtn= document.getElementById("reset");
const movesEl = document.getElementById("moves");
const goalEl  = document.getElementById("goal");
const levelEl = document.getElementById("level"); // 建议在 HTML 加一个 level 显示

// --- 状态 ---
let grid = [];
let selected = null;
let animating = false;
let score = 0;
let moves = 20;
let level = 1;
const levelGoals = [200, 500, 800]; // 每关目标分数
const movesPerLevel = 20;

// --- 工具 ---
const rnd = (n)=> (Math.random()*n)|0;
const randomType = ()=> TYPES[rnd(TYPES.length)];
const idx = (r,c)=> r*SIZE + c;
const rc  = (i)=> [ (i/ SIZE)|0, i%SIZE ];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

// --- 初始化 ---
function init(){
  grid = new Array(SIZE*SIZE).fill(null).map(randomType);
  selected=null; score=0; moves=movesPerLevel; level=1;
  updateHUD();
  render();
}
function updateHUD(){
  scoreEl.textContent=score;
  tipEl.textContent="——";
  movesEl.textContent=moves;
  goalEl.textContent=levelGoals[level-1];
  if(levelEl) levelEl.textContent=level;
}
function render(){
  boardEl.style.position = "relative";
  boardEl.style.width = `${SIZE*CELL}px`;
  boardEl.style.height= `${SIZE*CELL}px`;
  boardEl.innerHTML="";
  for(let i=0;i<grid.length;i++){
    const [r,c]=rc(i);
    const div=document.createElement("div");
    div.className="tile";
    div.textContent=grid[i] ?? "";
    div.style.position="absolute";
    div.style.width=div.style.height=CELL+"px";
    div.style.display="flex";
    div.style.alignItems="center";
    div.style.justifyContent="center";
    div.style.fontSize="22px";
    div.style.transition="transform 0.25s ease";
    div.style.transform=`translate(${c*CELL}px,${r*CELL}px) scale(1)`;
    div.onclick=()=>onTileClick(i, div);
    boardEl.appendChild(div);
  }
}

// --- 点击逻辑 ---
function onTileClick(i, el){
  if(animating) return;

  // === 特殊方块：单击立即触发 ===
  if(grid[i]==="💥"){
    animateSpecial(el).then(()=> triggerBomb(i));
    return;
  }
  if(grid[i]==="🌈"){
    animateSpecial(el).then(()=> triggerRainbow(i));
    return;
  }

  // === 普通逻辑 ===
  if(selected===null){ selected=i; highlight(i); return; }
  if(i===selected){ unhighlight(); selected=null; return; }
  if(!adjacent(i,selected)){ unhighlight(); selected=i; highlight(i); return; }

  swapWithAnimation(i,selected).then(()=>{
    const m=findMatches();
    if(m.size===0){
      swapWithAnimation(i,selected,true);
    } else {
      moves--; 
      movesEl.textContent=moves;
      cascade(m).then(checkWinLose);
    }
    unhighlight(); selected=null;
  });
}
function highlight(i){
  const el = boardEl.children[i];
  el.style.outline = "3px solid #4f46e5";
  el.style.zIndex = "10";
}
function unhighlight(){
  [...boardEl.children].forEach(el=>{
    el.style.outline = "";
    el.style.zIndex = "1";
  });
}
function adjacent(a,b){
  const [ar,ac]=rc(a),[br,bc]=rc(b);
  return Math.abs(ar-br)+Math.abs(ac-bc)===1;
}

// --- 动画交换 ---
function swapWithAnimation(a,b,reverse=false){
  animating=true;
  const elA=boardEl.children[a], elB=boardEl.children[b];
  const [ar,ac]=rc(a),[br,bc]=rc(b);

  if(!reverse) [grid[a],grid[b]]=[grid[b],grid[a]];
  else [grid[a],grid[b]]=[grid[b],grid[a]];

  elA.style.transform=`translate(${bc*CELL}px,${br*CELL}px)`;
  elB.style.transform=`translate(${ac*CELL}px,${ar*CELL}px)`;

  return new Promise(res=>{
    setTimeout(()=>{ render(); animating=false; res(); },250);
  });
}

// --- 匹配 ---
function findMatches(){
  const matched=new Set();
  // 行
  for(let r=0;r<SIZE;r++){
    let run=1;
    for(let c=1;c<=SIZE;c++){
      const cur=c<SIZE?grid[idx(r,c)]:null, prev=grid[idx(r,c-1)];
      if(cur && prev && cur===prev) run++;
      else { 
        if(run>=3){
          for(let k=1;k<=run;k++) matched.add(idx(r,c-k));
          if(run===4) grid[idx(r,c-2)]="💥";
          if(run>=5) grid[idx(r,c-3)]="🌈";
        }
        run=1;
      }
    }
  }
  // 列
  for(let c=0;c<SIZE;c++){
    let run=1;
    for(let r=1;r<=SIZE;r++){
      const cur=r<SIZE?grid[idx(r,c)]:null, prev=grid[idx(r-1,c)];
      if(cur && prev && cur===prev) run++;
      else { 
        if(run>=3){
          for(let k=1;k<=run;k++) matched.add(idx(r-k,c));
          if(run===4) grid[idx(r-2,c)]="💥";
          if(run>=5) grid[idx(r-3,c)]="🌈";
        }
        run=1;
      }
    }
  }
  return matched;
}

// --- 消除/下落 ---
async function cascade(first){
  animating=true;
  await removeMatches(first);
  while(true){
    applyGravity(); fillNew(); render();
    await sleep(250);
    const m=findMatches();
    if(m.size===0) break;
    await removeMatches(m);
  }
  animating=false;
}
function removeMatches(matches){
  score += matches.size * 10;
  scoreEl.textContent = score;
  tipEl.textContent = tips[rnd(tips.length)];
  return new Promise(res=>{
    // 动画：让被消除的格子放大/闪烁
    for(const i of matches){
      const el = boardEl.children[i];
      if(el){
        el.style.transition="transform 0.3s ease, opacity 0.3s ease";
        el.style.transform+=" scale(1.5)";
        el.style.opacity="0.2";
      }
    }
    setTimeout(()=>{
      for(const i of matches) if(grid[i]!=="💥" && grid[i]!=="🌈") grid[i]=null;
      render(); res();
    },300);
  });
}
function applyGravity(){
  for(let c=0;c<SIZE;c++){
    let write=SIZE-1;
    for(let r=SIZE-1;r>=0;r--){
      const i=idx(r,c);
      if(grid[i]!==null){
        const w=idx(write,c);
        if(i!==w){ grid[w]=grid[i]; grid[i]=null; }
        write--;
      }
    }
  }
}
function fillNew(){
  for(let i=0;i<grid.length;i++){
    if(grid[i]===null) grid[i]=randomType();
  }
}

// --- 特殊块触发 ---
function triggerBomb(index){
  const pos = rc(index);
  const r = pos[0];
  for(let c=0; c<SIZE; c++) {
    grid[idx(r,c)] = null;
  }
  render();
  cascade(findMatches()).then(checkWinLose);
}
function triggerRainbow(index){
  const type = TYPES[rnd(TYPES.length)];
  for(let j=0; j<grid.length; j++) {
    if(grid[j] === type) grid[j] = null;
  }
  render();
  cascade(findMatches()).then(checkWinLose);
}

// --- 特殊块点击动画 ---
function animateSpecial(el){
  return new Promise(res=>{
    el.style.transition="transform 0.3s ease, opacity 0.3s ease";
    el.style.transform += " scale(1.5)";
    el.style.opacity="0.3";
    setTimeout(res,300);
  });
}

// --- 胜负判定 ---
function checkWinLose(){
  if(score >= levelGoals[level-1]){
    if(typeof confetti!=="undefined"){
      confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
    }
    setTimeout(()=>{
      alert("🎉 Level "+level+" Clear!");
      level++;
      if(level > levelGoals.length){
        alert("🏆 All Levels Complete!");
        init();
      } else {
        moves = movesPerLevel;
        updateHUD();
        render();
      }
    },500);
  } else if(moves <= 0){
    alert("❌ Game Over. Final Score: "+score);
    init();
  }
}

// --- 启动 ---
resetBtn.addEventListener("click",init);
init();
