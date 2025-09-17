<template>
  <div class="match3 game-wrapper">
    <h1>Healthy Match-3</h1>

    <div class="hud">
      <div class="hud-left">
        <div class="pill">Level <strong>{{ level }}</strong></div>
        <div class="pill">Moves <strong>{{ moves }}</strong></div>
        <div class="pill">Score <strong>{{ score }}</strong></div>
      </div>
      <div class="hud-right">
        <div class="goal-row">
          <span>Goal {{ levelGoals[level - 1] }}</span>
          <div class="bar">
            <div class="bar-fill" :style="{ width: Math.min(100, Math.round(score / levelGoals[level-1] * 100)) + '%' }"></div>
          </div>
        </div>
        <div class="tip">Reminder：{{ tip }}</div>
        <button class="btn" @click="init">Restart</button>
      </div>
    </div>

    <div ref="board" class="board" aria-label="game board">
      <div ref="tiles" class="tiles-layer"></div>
      <div ref="fx" class="fx-layer"></div>
    </div>

    <div class="legend">
      <h3>Special Blocks</h3>
      <ul>
        <li>💥 (4 in a row) → Clears an entire row (Click to trigger)</li>
        <li>🌈 (5 in a row) → Clears all tiles of one type (Click to trigger)</li>
      </ul>
    </div>
  </div>
</template>

<script>
import confetti from "canvas-confetti";

export default {
  name: "Match3View",
  data() {
    return {
      SIZE: 10,
      TYPES: ["🍎","🥦","🥕","🥛","🍞","🧃","🍌","🍇"],
      CELL: 48,
      grid: [],
      score: 0,
      moves: 15,
      level: 1,
      levelGoals: [200, 500, 800],
      tip: "——",
      selected: null,
      animating: false,
    };
  },
  mounted() { this.init(); },
  methods: {
    rnd(n){ return Math.floor(Math.random()*n); },
    randomType(){ return this.TYPES[this.rnd(this.TYPES.length)]; },
    idx(r,c){ return r*this.SIZE+c; },
    rc(i){ return [Math.floor(i/this.SIZE), i%this.SIZE]; },
    tilesEl(){ return this.$refs.tiles; },
    fxEl(){ return this.$refs.fx; },

    init(){
      this.grid = Array(this.SIZE*this.SIZE).fill(null).map(()=>this.randomType());
      this.score=0; this.moves=15; this.level=1; this.tip="——";
      this.selected=null;
      this.render();
      this.fxEl().innerHTML="";
    },

    render(){
      const board=this.$refs.board;
      board.style.width = `${this.SIZE*this.CELL}px`;
      board.style.height= `${this.SIZE*this.CELL}px`;

      const layer=this.tilesEl();
      layer.innerHTML="";

      this.grid.forEach((tile,i)=>{
        const [r,c]=this.rc(i);
        const div=document.createElement("div");
        div.className="tile"+(tile===null?" hole":"");
        div.style.position="absolute";
        div.style.width=div.style.height=this.CELL+"px";
        div.style.transform=`translate3d(${c*this.CELL}px, ${r*this.CELL}px, 0)`;
        div.style.userSelect="none";
        div.style.cursor= tile===null ? "default":"pointer";
        div.textContent=tile ?? "";

        if(tile!==null){
          div.onclick=()=>{ this.spawnClickRipple(i); this.onTileClick(i,div); };
        }else{
          div.style.pointerEvents="none";
        }
        layer.appendChild(div);
      });

      if(this.selected!==null){
        const el=layer.children[this.selected];
        if(el) el.classList.add("tile-selected");
      }
    },

    spawnClickRipple(i){
      const [r,c]=this.rc(i);
      const d=document.createElement("div");
      d.className="click-ripple";
      d.style.left = `${c*this.CELL + this.CELL/2}px`;
      d.style.top  = `${r*this.CELL + this.CELL/2}px`;
      this.fxEl().appendChild(d);
      setTimeout(()=>d.remove?.(),450);
    },

    async onTileClick(i, el){
      if(this.animating) return;

      if(this.grid[i]==="💥"){ await this.animateSpecial(el); this.triggerBomb(i); return; }
      if(this.grid[i]==="🌈"){ await this.animateSpecial(el); this.triggerRainbow(i); return; }

      if(this.selected===null){ this.selected=i; this.highlight(i); return; }
      if(i===this.selected){ this.unhighlight(); this.selected=null; return; }

      if(!this.adjacent(i,this.selected)){
        this.unhighlight(); this.selected=i; this.highlight(i); return;
      }

      const a=i, b=this.selected;
      const isSpecial = v => v==="💥"||v==="🌈";
      if(!isSpecial(this.grid[a]) && !isSpecial(this.grid[b]) && !this.wouldCreateMatch(a,b)){
        this.invalidWiggle(a,b);
        this.unhighlight(); this.selected=null;
        return;
      }

      await this.swapWithAnimation(a,b);
      this.moves--;

      const m=this.findMatches();
      if(m.size===0){
        await this.swapWithAnimation(a,b,true); // 兜底
      }else{
        await this.cascade(m);
      }

      this.checkWinLose();
      this.unhighlight(); this.selected=null;
    },

    highlight(i){
      const el=this.tilesEl().children[i];
      if(el) el.classList.add("tile-selected");
    },
    unhighlight(){
      [...this.tilesEl().children].forEach(el=>el.classList.remove("tile-selected"));
    },
    adjacent(a,b){
      const [ar,ac]=this.rc(a), [br,bc]=this.rc(b);
      return Math.abs(ar-br)+Math.abs(ac-bc)===1;
    },

    swapWithAnimation(a,b,reverse=false){
      this.animating=true;
      const elA=this.tilesEl().children[a], elB=this.tilesEl().children[b];
      const [ar,ac]=this.rc(a), [br,bc]=this.rc(b);

      if(!reverse){
        [this.grid[a],this.grid[b]]=[this.grid[b],this.grid[a]];
        if(elA) elA.style.transform=`translate3d(${bc*this.CELL}px, ${br*this.CELL}px, 0)`;
        if(elB) elB.style.transform=`translate3d(${ac*this.CELL}px, ${ar*this.CELL}px, 0)`;
        return new Promise(res=>setTimeout(()=>{ this.render(); this.animating=false; res(); },250));
      }else{
        if(elA) elA.style.transform=`translate3d(${ac*this.CELL}px, ${ar*this.CELL}px, 0)`;
        if(elB) elB.style.transform=`translate3d(${bc*this.CELL}px, ${br*this.CELL}px, 0)`;
        return new Promise(res=>setTimeout(()=>{
          [this.grid[a],this.grid[b]]=[this.grid[b],this.grid[a]];
          this.render(); this.animating=false; res();
        },250));
      }
    },

    findMatchesPure(g){
      const matched=new Set();
      for(let r=0;r<this.SIZE;r++){
        let run=1;
        for(let c=1;c<=this.SIZE;c++){
          const cur=c<this.SIZE ? g[this.idx(r,c)] : null;
          const prev=g[this.idx(r,c-1)];
          if(cur&&prev&&cur===prev) run++;
          else{ if(run>=3) for(let k=1;k<=run;k++) matched.add(this.idx(r,c-k)); run=1; }
        }
      }
      for(let c=0;c<this.SIZE;c++){
        let run=1;
        for(let r=1;r<=this.SIZE;r++){
          const cur=r<this.SIZE ? g[this.idx(r,c)] : null;
          const prev=g[this.idx(r-1,c)];
          if(cur&&prev&&cur===prev) run++;
          else{ if(run>=3) for(let k=1;k<=run;k++) matched.add(this.idx(r-k,c)); run=1; }
        }
      }
      return matched;
    },
    wouldCreateMatch(a,b){
      const g=this.grid.slice();
      [g[a],g[b]]=[g[b],g[a]];
      return this.findMatchesPure(g).size>0;
    },
    invalidWiggle(a,b){
      const A=this.tilesEl().children[a], B=this.tilesEl().children[b];
      const jiggle=(el)=>{
        if(!el) return;
        const t=el.style.transform||"";
        el.style.transition="transform 110ms";
        el.style.transform=t+" translateY(-6px)";
        setTimeout(()=>{ el.style.transform=t; },110);
      };
      jiggle(A); jiggle(B);
    },

    findMatches(){
      const matched=new Set();
      // 行
      for(let r=0;r<this.SIZE;r++){
        let run=1;
        for(let c=1;c<=this.SIZE;c++){
          const cur=c<this.SIZE ? this.grid[this.idx(r,c)] : null;
          const prev=this.grid[this.idx(r,c-1)];
          if(cur&&prev&&cur===prev) run++;
          else{
            if(run>=3){
              for(let k=1;k<=run;k++) matched.add(this.idx(r,c-k));
              if(run===4) this.grid[this.idx(r,c-2)]="💥";
              if(run>=5) this.grid[this.idx(r,c-3)]="🌈";
            }
            run=1;
          }
        }
      }
      // 列
      for(let c=0;c<this.SIZE;c++){
        let run=1;
        for(let r=1;r<=this.SIZE;r++){
          const cur=r<this.SIZE ? this.grid[this.idx(r,c)] : null;
          const prev=this.grid[this.idx(r-1,c)];
          if(cur&&prev&&cur===prev) run++;
          else{
            if(run>=3){
              for(let k=1;k<=run;k++) matched.add(this.idx(r-k,c));
              if(run===4) this.grid[this.idx(r-2,c)]="💥";
              if(run>=5) this.grid[this.idx(r-3,c)]="🌈";
            }
            run=1;
          }
        }
      }
      return matched;
    },

    computeGravityPlan(){
      const temp=this.grid.slice();
      const moves=[];
      for(let c=0;c<this.SIZE;c++){
        let write=this.SIZE-1;
        for(let r=this.SIZE-1;r>=0;r--){
          const i=this.idx(r,c);
          if(temp[i]!==null){
            const w=this.idx(write,c);
            if(i!==w){
              moves.push({from:i,to:w,rows:write-r});
              temp[w]=temp[i]; temp[i]=null;
            }
            write--;
          }
        }
      }
      return { moves, nextGrid: temp };
    },

    async animateGravity(moves){
      const layer=this.tilesEl();
      const steps=[];
      for(const {from,to,rows} of moves){
        const el=layer.children[from];
        if(!el) continue;
        const [tr,tc]=this.rc(to);
        const duration=Math.min(120+rows*90,750);
        const delay=(tc*8)+Math.min(rows*10,120);
        el.style.transition="none";
        steps.push({ el, tx:tc*this.CELL, ty:tr*this.CELL, duration, delay });
      }
      if(!steps.length) return;
      // 强制重排
      // eslint-disable-next-line no-unused-expressions
      layer.offsetHeight;
      await new Promise(requestAnimationFrame);
      const promises=[];
      for(const s of steps){
        s.el.style.transition=`transform ${s.duration}ms cubic-bezier(.2,.75,.25,1)`;
        s.el.style.transitionDelay=`${s.delay}ms`;
        s.el.style.transform=`translate3d(${s.tx}px, ${s.ty}px, 0)`;
        promises.push(new Promise(res=>setTimeout(res, s.duration+s.delay)));
      }
      await Promise.all(promises);
    },

    async cascade(first){
      this.animating=true;
      await this.removeMatches(first);

      while(true){
        const { moves, nextGrid } = this.computeGravityPlan();
        await this.animateGravity(moves);
        this.grid=nextGrid;
        this.render();

        // 顶部新块滑入
        const born=[];
        for(let i=0;i<this.grid.length;i++){
          if(this.grid[i]===null){ this.grid[i]=this.randomType(); born.push(i); }
        }
        this.render();
        await new Promise(res=>{
          for(const i of born){
            const el=this.tilesEl().children[i]; if(!el) continue;
            const [r,c]=this.rc(i);
            el.style.transition="none";
            el.style.transform=`translate3d(${c*this.CELL}px, ${(r-1.5)*this.CELL}px, 0)`;
            requestAnimationFrame(()=>{
              el.style.transition=`transform 260ms cubic-bezier(.2,.75,.25,1)`;
              el.style.transform=`translate3d(${c*this.CELL}px, ${r*this.CELL}px, 0)`;
            });
          }
          setTimeout(res,280);
        });

        const m=this.findMatches();
        if(m.size===0) break;
        await this.removeMatches(m);
      }
      this.animating=false;
    },

    removeMatches(matches){
      this.score += matches.size*10;
      this.tip = [
        "Drink more water and less sugary drinks~",
        "Vegetables and fruits provide dietary fiber!",
        "Whole grains are more filling.",
        "Replace beverages with water to cut a lot of sugar!",
        "Protein should be balanced: beans, eggs, milk",
        "Check labels: less sugar, salt, saturated fat!"
      ][this.rnd(6)];

      return new Promise(res=>{
        for(const i of matches){
          const el=this.tilesEl().children[i];
          if(el){
            el.style.transition="transform 180ms ease, opacity 220ms ease, filter 120ms";
            el.style.transform+= " scale(1.25)";
            el.style.filter="brightness(1.35)";
            setTimeout(()=>{
              el.style.opacity="0";
              el.style.transform=el.style.transform.replace("scale(1.25)","scale(0.7)");
            },90);
          }
          const [r,c]=this.rc(i);
          const float=document.createElement("div");
          float.className="float-score";
          float.textContent="+10";
          float.style.left = `${c*this.CELL + this.CELL/2}px`;
          float.style.top  = `${r*this.CELL + this.CELL/2}px`;
          this.fxEl().appendChild(float);
          setTimeout(()=>float.remove?.(),600);
        }

        setTimeout(()=>{
          for(const i of matches){
            if(this.grid[i]!=="💥" && this.grid[i]!=="🌈") this.grid[i]=null;
          }
          this.render(); res();
        },240);
      });
    },

    triggerBomb(index){
      const [r]=this.rc(index);
      const sweep=document.createElement("div");
      sweep.className="row-sweep";
      sweep.style.top=`${r*this.CELL}px`;
      sweep.style.height=`${this.CELL}px`;
      this.fxEl().appendChild(sweep);
      setTimeout(()=>sweep.remove?.(),420);

      for(let c=0;c<this.SIZE;c++) this.grid[this.idx(r,c)]=null;
      this.render();
      this.cascade(this.findMatches()).then(this.checkWinLose);
    },
    triggerRainbow(index){
      const [r,c]=this.rc(index);
      const wave=document.createElement("div");
      wave.className="shockwave";
      wave.style.left = `${c*this.CELL + this.CELL/2}px`;
      wave.style.top  = `${r*this.CELL + this.CELL/2}px`;
      this.fxEl().appendChild(wave);
      setTimeout(()=>wave.remove?.(),600);

      const type=this.TYPES[this.rnd(this.TYPES.length)];
      for(let j=0;j<this.grid.length;j++) if(this.grid[j]===type) this.grid[j]=null;
      this.render();
      this.cascade(this.findMatches()).then(this.checkWinLose);
    },
    animateSpecial(el){
      return new Promise(res=>{
        el.style.transition="transform .25s ease, opacity .25s ease";
        el.style.transform+=" scale(1.3)";
        el.style.opacity="0.5";
        setTimeout(res,250);
      });
    },

    checkWinLose(){
      if(this.score>=this.levelGoals[this.level-1]){
        confetti({ particleCount:200, spread:120, origin:{ y:.6 } });
        setTimeout(()=>{
          alert("🎉 Level "+this.level+" Clear!");
          this.level++;
          if(this.level>this.levelGoals.length){ alert("🏆 All Levels Complete!"); this.init(); }
          else{ this.moves=15; this.render(); }
        },500);
      }else if(this.moves<0 || (this.moves===0 && !this.animating)){
        confetti({ particleCount:150, spread:100, origin:{ y:.6 }, colors:['#555','#888','#aaa'] });
        const b=this.$refs.board; b.style.transition="background .5s"; b.style.background="#662222";
        setTimeout(()=>b.style.background="",600);
        setTimeout(()=>{ alert("❌ Game Over. Final Score: "+this.score); this.init(); },800);
      }
    },
  }
};
</script>

<!-- 注意：不要加 scoped！ -->
<style>
.match3.game-wrapper{ display:flex; flex-direction:column; align-items:center; justify-content:center; }
.match3 h1{ letter-spacing:.5px; margin:10px 0 6px; text-shadow:0 2px 12px rgba(108,99,255,.25); }

/* HUD */
.match3 .hud{ display:flex; gap:20px; align-items:center; justify-content:space-between; width:min(900px,92vw); margin:10px auto 6px; }
.match3 .hud-left{ display:flex; gap:12px; flex-wrap:wrap; }
.match3 .pill{ background:#1f2235; padding:8px 12px; border-radius:999px; border:1px solid #2f3350; color:#dfe6ff; font-size:14px; }
.match3 .pill strong{ color:#ffd369; margin-left:6px; }
.match3 .hud-right{ display:grid; gap:8px; align-items:center; }
.match3 .goal-row{ display:grid; gap:6px; color:#cfd3ff; font-size:14px; }
.match3 .bar{ width:280px; height:10px; background:#1b1e31; border-radius:999px; overflow:hidden; border:1px solid #2f3350; }
.match3 .bar-fill{ height:100%; background:linear-gradient(90deg,#6c63ff,#ffd369); transition:width .25s; }
.match3 .tip{ color:#aab0e8; font-size:13px; }
.match3 .btn{ padding:8px 14px; border-radius:10px; border:1px solid #2f3350; background:#2b2f49; color:#f2f3ff; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,.25); transition:transform .12s, background .2s; }
.match3 .btn:hover{ transform:translateY(-1px); background:#343a5a; }

/* 棋盘与两层（变量让圆角与内边距精确匹配） */
.match3 .board{
  --bd-r: 16px;      /* 外层圆角 */
  --gap:  6px;       /* 内边距 */
  --bd-bw: 1px;      /* 边框宽度 */

  position:relative;
  margin:18px auto;
  background:radial-gradient(120% 120% at 50% 0%, #2f3152 0%, #2b2e48 40%, #262943 100%);
  border: var(--bd-bw) solid #3a3e66;
  border-radius: var(--bd-r);
  box-shadow:0 12px 28px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.03);
  padding: var(--gap);
  overflow:hidden; /* 裁剪内部，避免圆角细线 */
}
.match3 .tiles-layer,
.match3 .fx-layer{
  position:absolute;
  inset: var(--gap);
  border-radius: calc(var(--bd-r) - var(--gap) - var(--bd-bw)); /* 关键：避免“缺角” */
  background:transparent;
}
.match3 .fx-layer{
  pointer-events:none;
  z-index:100; /* 特效永远在最上 */
}

/* tile 层级：选中抬高，避免被遮挡 */
.match3 .tile{
  position:absolute;
  width:48px; height:48px; border-radius:10px; background:#3a3d5c; color:#fff;
  box-shadow: inset 0 1px 3px rgba(0,0,0,.3);
  display:flex; align-items:center; justify-content:center; font-size:22px;
  transition: transform .25s ease, background .25s ease, box-shadow .25s ease, opacity .25s ease;
  z-index:1;
}
.match3 .tile.hole{ background:transparent !important; box-shadow:none !important; opacity:0; }
.match3 .tile:hover{ background:#50557c; transform:scale(1.05); }
.match3 .tile:active{ transform:scale(.96); }
.match3 .tile-selected{
  z-index:50;
  box-shadow:0 0 0 3px #6c63ff, 0 0 18px rgba(108,99,255,.6);
  animation:pulse 1.2s ease-in-out infinite;
}
@keyframes pulse{
  0%{ box-shadow:0 0 0 2px #6c63ff, 0 0 8px rgba(108,99,255,.35) }
  50%{ box-shadow:0 0 0 4px #ffd369, 0 0 16px rgba(255,211,105,.55) }
  100%{ box-shadow:0 0 0 2px #6c63ff, 0 0 8px rgba(108,99,255,.35) }
}

/* fx 层 */
.match3 .click-ripple{
  position:absolute; width:10px; height:10px; border-radius:50%;
  transform:translate(-50%,-50%); opacity:.8;
  box-shadow:0 0 0 2px rgba(255,255,255,.45), 0 0 0 6px rgba(108,99,255,.35);
  animation:ripple .45s ease-out forwards;
}
@keyframes ripple{
  from{ transform:translate(-50%,-50%) scale(.4); opacity:.8 }
  to  { transform:translate(-50%,-50%) scale(2.2); opacity:0 }
}
.match3 .float-score{
  position:absolute; transform:translate(-50%,-50%);
  font-size:14px; font-weight:700; color:#ffd369; text-shadow:0 1px 2px rgba(0,0,0,.6);
  animation:floatUp .6s ease forwards;
}
@keyframes floatUp{
  0%{ opacity:0; transform:translate(-50%,-20%) scale(.9) }
  20%{ opacity:1 }
  100%{ opacity:0; transform:translate(-50%,-120%) scale(1.05) }
}
.match3 .row-sweep{
  position:absolute; left:-10px; right:-10px; border-radius:8px;
  background:linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
  filter:blur(1px); height:48px;
  animation:rowSweep .42s ease forwards;
}
@keyframes rowSweep{
  from{ transform:translateX(-30px); opacity:.5 }
  to  { transform:translateX(30px);  opacity:0 }
}
.match3 .shockwave{
  position:absolute; width:10px; height:10px; border-radius:50%;
  transform:translate(-50%,-50%);
  box-shadow:0 0 0 2px rgba(255,255,255,.55), 0 0 0 6px rgba(255,211,105,.35), 0 0 0 10px rgba(147,107,255,.25);
  animation:wave .6s ease-out forwards;
}
@keyframes wave{
  from{ opacity:.9; transform:translate(-50%,-50%) scale(.2) }
  to  { opacity:0;  transform:translate(-50%,-50%) scale(2.6) }
}

/* 说明卡片 */
.match3 .legend{ margin-top:16px; padding:12px; border:1px solid #666; border-radius:8px; background:#1f2235; max-width:360px; color:#f0f0f0; }
.match3 .legend h3{ margin:0 0 8px; font-size:16px; color:#ffd369; }
.match3 .legend ul{ margin:0; padding-left:20px; font-size:14px; }
.match3 .legend li{ margin-bottom:6px; }
</style>
