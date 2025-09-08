// --- 参数 ---
const SIZE = 6;
const TYPES = ["🍎","🥦","🥕","🥛","🍞","🧃"];
const CELL = 64; // 每格像素大小
const tips = [
  "Drink more water and less sugary drinks~",
  "Vegetables and fruits provide dietary fiber!",
  "Whole grains are more filling.",
  "Replace beverages with water and you can reduce a lot of sugar in a week!",
  "Protein should be balanced: beans, eggs, milk",
  "Look at the nutrition label: less sugar, less salt, less saturated fat!",
];

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const tipEl   = document.getElementById("tip");
const resetBtn= document.getElementById("reset");

// --- 状态 ---
let grid = [];
let selected = null;
let animating = false;
let score = 0;

// --- 工具 ---
const rnd = (n)=> (Math.random()*n)|0;
const randomType = ()=> TYPES[rnd(TYPES.length)];
const idx = (r,c)=> r*SIZE + c;
const rc  = (i)=> [ (i/ SIZE)|0, i%SIZE ];

// --- 初始化 ---
function init(){
  grid = new Array(SIZE*SIZE).fill(null).map(randomType);
  selected=null; score=0;
  scoreEl.textContent="0"; tipEl.textContent="——";
  render();
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
    div.textContent=grid[i];
    div.style.position="absolute";
    div.style.width=div.style.height=CELL+"px";
    div.style.left=0; div.style.top=0;
    div.style.display="flex";
    div.style.alignItems="center";
    div.style.justifyContent="center";
    div.style.fontSize="28px";
    div.style.transition="transform 0.25s ease";
    div.style.transform=`translate(${c*CELL}px,${r*CELL}px) scale(1)`;
    div.onclick=()=>onTileClick(i);
    boardEl.appendChild(div);
  }
}

// --- 点击逻辑 ---
function onTileClick(i){
  if(animating) return;
  if(selected===null){ selected=i; highlight(i); return; }
  if(i===selected){ unhighlight(); selected=null; return; }
  if(!adjacent(i,selected)){ unhighlight(); selected=i; highlight(i); return; }

  swapWithAnimation(i,selected).then(()=>{
    const m=findMatches();
    if(m.size===0){
      // 不成三消 → 交换回去
      swapWithAnimation(i,selected,true);
    } else {
      cascade(m);
    }
    unhighlight(); selected=null;
  });
}
function highlight(i){
  const el = boardEl.children[i];
  el.style.outline = "3px solid #4f46e5";
  el.style.zIndex = "10";   // 提高层级
}

function unhighlight(){
  [...boardEl.children].forEach(el=>{
    el.style.outline = "";
    el.style.zIndex = "1";   // 恢复默认层级
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

  // 更新数组
  if(!reverse) [grid[a],grid[b]]=[grid[b],grid[a]];
  else [grid[a],grid[b]]=[grid[b],grid[a]];

  // 设置位置
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
      else { if(run>=3) for(let k=1;k<=run;k++) matched.add(idx(r,c-k)); run=1; }
    }
  }
  // 列
  for(let c=0;c<SIZE;c++){
    let run=1;
    for(let r=1;r<=SIZE;r++){
      const cur=r<SIZE?grid[idx(r,c)]:null, prev=grid[idx(r-1,c)];
      if(cur && prev && cur===prev) run++;
      else { if(run>=3) for(let k=1;k<=run;k++) matched.add(idx(r-k,c)); run=1; }
    }
  }
  return matched;
}

// --- 消除/下落 ---
async function cascade(first){
  animating=true;
  await removeMatches(first);
  while(true){
    applyGravity();
    fillNew();
    render(); // 重新渲染后让元素下落
    await sleep(250);
    const m=findMatches();
    if(m.size===0) break;
    await removeMatches(m);
  }
  animating=false;
}
function removeMatches(matches){
  for(const i of matches){
    const el=boardEl.children[i];
    el.style.transform += " scale(1.3)";
    el.style.opacity="0";
  }
  score+=matches.size*10;
  scoreEl.textContent=score;
  tipEl.textContent=tips[rnd(tips.length)];
  return new Promise(res=>{
    setTimeout(()=>{
      for(const i of matches) grid[i]=null;
      render(); res();
    },250);
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
const sleep=ms=>new Promise(r=>setTimeout(r,ms));


// --- 启动 ---
resetBtn.addEventListener("click",init);
init();