<template>
  <!-- root carries CSS vars like --topnav-h -->
  <div ref="pageRoot" class="match3 game-wrapper">
    <!-- import draggable avatar component -->
    <DraggableAvatar ref="avatarComponent" />

    <!-- game complete overlay -->
    <div v-if="showGameCompleteMessage" class="overlay-blur"></div>
    <div v-if="showGameCompleteMessage" class="game-complete-message">
      {{ gameCompleteMessage }}
    </div>
    
    <h1>Healthy Match-3</h1>

    <!-- HUD -->
    <div class="hud">
      <div class="hud-left">
        <div class="pill">Level <strong>{{ level }}</strong></div>
        <div class="pill">Moves <strong>{{ moves }}</strong></div>
        <div class="pill">Score <strong>{{ score }}</strong></div>
      </div>

      <!-- Right HUD block with brown rounded background for contrast -->
      <div class="hud-right">
        <div class="goal-row">
          <span>Goal {{ levelGoals[level - 1] }}</span>
          <div class="bar">
            <div
              class="bar-fill"
              :style="{ width: Math.min(100, Math.round((score / levelGoals[level-1]) * 100)) + '%' }"
            ></div>
          </div>
        </div>
        <div class="tip">Reminder: {{ tip }}</div>
        <button class="btn" @click="init">Restart</button>



         <!-- Debugging use, delete after use -->
        <!-- Debug cheat button: One-click win -->
        <button class="btn cheat" @click="cheatWin">Cheat: Win Level</button>



      </div>
    </div>

    <!-- Main area: Left legend | Center board | Right tips (desktop only) -->
    <div class="board-row">
      <!-- Left: Legend card (brown background for higher readability) -->
      <div class="legend">
        <h3>Special Blocks</h3>
        <ul>
          <li>💥 (4 in a row) → Clears an entire row (Click to trigger)</li>
          <li>🌈 (5 in a row) → Clears all tiles of one type (Click to trigger)</li>
        </ul>
      </div>

      <!-- Center: Board -->
      <div ref="board" class="board" aria-label="game board">
        <div ref="tiles" class="tiles-layer"></div>
        <div ref="fx" class="fx-layer"></div>
      </div>

      <!-- Right: Health tips (desktop only) -->
      <aside class="side-tips">
        <RightTips mode="desktop" />
      </aside>
    </div>

    <!-- Mobile: floating action button to open tips drawer -->
    <button class="tips-fab" @click="tipsOpen = true" aria-label="Open Health Tips">💡</button>

    <!-- Mobile: right slide-out drawer (positioned below TopNav) -->
    <div class="tips-drawer" :class="{ open: tipsOpen }" aria-hidden="!tipsOpen">
      <div class="drawer-header">
        <strong>Health Tips</strong>
        <button class="close-btn" @click="tipsOpen = false" aria-label="Close">✕</button>
      </div>
      <div class="drawer-body">
        <RightTips mode="mobile" />
      </div>
    </div>

    <!-- Mobile: dimmed mask (starts below TopNav too) -->
    <div class="drawer-mask" :class="{ show: tipsOpen }" @click="tipsOpen = false"></div>
  </div>
</template>

<script>
/**
 * Full SFC for the Match-3 page.
 * - Does NOT modify your global TopNav. We only read its height.
 * - Measures TopNav height and writes CSS vars on this page root:
 *   --topnav-h and --topnav-h-safe (with safe-area inset).
 * - Mobile drawer & mask are offset from the TopNav height, so they won't be covered.
 */
// import confetti from "canvas-confetti";
import RightTips from "@/components/RightTips.vue";
import DraggableAvatar from "@/components/DraggableAvatar.vue";

export default {
  name: "Match3View",
  components: { RightTips, DraggableAvatar },
  data() {
    return {
      // Game constants/state
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

      // Mobile drawer state
      tipsOpen: false,

      // game complete state
      showGameCompleteMessage: false,
      gameCompleteMessage: '',

      // internal observer
      navRO: null,
    };
  },
  mounted() {
    // Init game
    this.init();

    // Set CSS vars for TopNav height on this page only
    this.setLocalTopnavVar();
    window.addEventListener("resize", this.setLocalTopnavVar);
    window.addEventListener("orientationchange", this.setLocalTopnavVar);

    // Recompute on TopNav size changes
    const nav = document.querySelector("header.nav");
    if (nav && "ResizeObserver" in window) {
      this.navRO = new ResizeObserver(this.setLocalTopnavVar);
      this.navRO.observe(nav);
    }
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.setLocalTopnavVar);
    window.removeEventListener("orientationchange", this.setLocalTopnavVar);
    this.navRO?.disconnect?.();
  },
  methods: {
    /** Measure TopNav height and write --topnav-h(, --topnav-h-safe) onto the page root */
    setLocalTopnavVar() {
      const nav = document.querySelector("header.nav");
      const h = nav?.offsetHeight || 66; // fallback if the nav isn't found
      const el = this.$refs.pageRoot;
      if (!el) return;
      el.style.setProperty("--topnav-h", `${h}px`);
      if (window.CSS?.supports?.("top: env(safe-area-inset-top)")) {
        el.style.setProperty("--topnav-h-safe", `calc(${h}px + env(safe-area-inset-top))`);
      } else {
        el.style.setProperty("--topnav-h-safe", `${h}px`);
      }
    },

    // ======== Game utilities ========
    rnd(n){ return Math.floor(Math.random()*n); },
    randomType(){ return this.TYPES[this.rnd(this.TYPES.length)]; },
    idx(r,c){ return r*this.SIZE+c; },
    rc(i){ return [Math.floor(i/this.SIZE), i%this.SIZE]; },
    tilesEl(){ return this.$refs.tiles; },
    fxEl(){ return this.$refs.fx; },

    /** Reset and render a fresh board */
    init(){
      this.grid = Array(this.SIZE*this.SIZE).fill(null).map(()=>this.randomType());
      this.score=0; this.moves=15; this.level=1; this.tip="——";
      this.selected=null;
      this.render();
      this.fxEl().innerHTML="";
      // check and remove any initial matches
      let matches = this.findMatches();
      while (matches.size > 0) {
        for (const i of matches) {
          // randomly replace with a different element
          let newType;
          do {
            newType = this.randomType();
          } while (newType === this.grid[i]); 
          this.grid[i] = newType;
        }
        matches = this.findMatches(); // check again until no initial matches
      }

      this.render();
    },

    /** Paint tiles into the layer */
    render(){
      const board=this.$refs.board;
      board.style.width  = `${this.SIZE*this.CELL}px`;
      board.style.height = `${this.SIZE*this.CELL}px`;

      const layer=this.tilesEl();
      layer.innerHTML="";

      this.grid.forEach((tile,i)=>{
        const [r,c]=this.rc(i);
        const el=document.createElement("div");
        el.className="tile"+(tile===null?" hole":"");
        el.style.position="absolute";
        el.style.width=el.style.height=this.CELL+"px";
        el.style.transform=`translate3d(${c*this.CELL}px, ${r*this.CELL}px, 0)`;
        el.style.userSelect="none";
        el.style.cursor = tile===null ? "default":"pointer";
        el.textContent = tile ?? "";

        if(tile!==null){
          el.onclick=()=>{ this.spawnClickRipple(i); this.onTileClick(i, el); };
        }else{
          el.style.pointerEvents="none";
        }
        layer.appendChild(el);
      });

      if(this.selected!==null){
        const sel = layer.children[this.selected];
        if(sel) sel.classList.add("tile-selected");
      }
    },

    /** Click FX */
    spawnClickRipple(i){
      const [r,c]=this.rc(i);
      const d=document.createElement("div");
      d.className="click-ripple";
      d.style.left = `${c*this.CELL + this.CELL/2}px`;
      d.style.top  = `${r*this.CELL + this.CELL/2}px`;
      this.fxEl().appendChild(d);
      setTimeout(()=>d.remove?.(), 450);
    },

    /** Tile click handler: select / swap / resolve */
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
      const isSpecial = v => v==="💥" || v==="🌈";

      // if no moves left, just check win/lose
      if (this.moves <= 0) {
        this.checkWinLose();
        return;
      }

      // Player attempts to swap, deduct a move
      this.moves--;

      if(!isSpecial(this.grid[a]) && !isSpecial(this.grid[b]) && !this.wouldCreateMatch(a,b)){
        this.invalidWiggle(a,b);
        this.unhighlight(); this.selected=null;
        return;
      }

      await this.swapWithAnimation(a,b);

      const m=this.findMatches();
      if(m.size===0){
        await this.swapWithAnimation(a,b,true);
      }else{
        await this.cascade(m);
      }

      this.checkWinLose();
      this.unhighlight(); this.selected=null;
    },

    /** Selection helpers */
    highlight(i){ const el=this.tilesEl().children[i]; el && el.classList.add("tile-selected"); },
    unhighlight(){ [...this.tilesEl().children].forEach(el=>el.classList.remove("tile-selected")); },
    adjacent(a,b){ const [ar,ac]=this.rc(a), [br,bc]=this.rc(b); return Math.abs(ar-br)+Math.abs(ac-bc)===1; },

    /** Swap with animation; reverse=true swaps back */
    swapWithAnimation(a,b,reverse=false){
      this.animating=true;
      const A=this.tilesEl().children[a], B=this.tilesEl().children[b];
      const [ar,ac]=this.rc(a), [br,bc]=this.rc(b);

      if(!reverse){
        [this.grid[a],this.grid[b]]=[this.grid[b],this.grid[a]];
        if(A) A.style.transform=`translate3d(${bc*this.CELL}px, ${br*this.CELL}px, 0)`;
        if(B) B.style.transform=`translate3d(${ac*this.CELL}px, ${ar*this.CELL}px, 0)`;
        return new Promise(res=>setTimeout(()=>{ this.render(); this.animating=false; res(); },250));
      }else{
        if(A) A.style.transform=`translate3d(${ac*this.CELL}px, ${ar*this.CELL}px, 0)`;
        if(B) B.style.transform=`translate3d(${bc*this.CELL}px, ${br*this.CELL}px, 0)`;
        return new Promise(res=>setTimeout(()=>{
          [this.grid[a],this.grid[b]]=[this.grid[b],this.grid[a]];
          this.render(); this.animating=false; res();
        },250));
      }
    },

    /** Pure pre-check if a swap would create any 3+ matches (no special spawns) */
    findMatchesPure(g){
      const matched=new Set();
      // rows
      for(let r=0;r<this.SIZE;r++){
        let run=1;
        for(let c=1;c<=this.SIZE;c++){
          const cur=c<this.SIZE ? g[this.idx(r,c)] : null;
          const prev= g[this.idx(r,c-1)];
          if(cur&&prev&&cur===prev) run++;
          else{ if(run>=3) for(let k=1;k<=run;k++) matched.add(this.idx(r,c-k)); run=1; }
        }
      }
      // cols
      for(let c=0;c<this.SIZE;c++){
        let run=1;
        for(let r=1;r<=this.SIZE;r++){
          const cur=r<this.SIZE ? g[this.idx(r,c)] : null;
          const prev= g[this.idx(r-1,c)];
          if(cur&&prev&&cur===prev) run++;
          else{ if(run>=3) for(let k=1;k<=run;k++) matched.add(this.idx(r-k,c)); run=1; }
        }
      }
      return matched;
    },
    wouldCreateMatch(a,b){ const g=this.grid.slice(); [g[a],g[b]]=[g[b],g[a]]; return this.findMatchesPure(g).size>0; },
    invalidWiggle(a,b){
      const A=this.tilesEl().children[a], B=this.tilesEl().children[b];
      const jiggle=(el)=>{ if(!el) return; const t=el.style.transform||""; el.style.transition="transform 110ms"; el.style.transform=t+" translateY(-6px)"; setTimeout(()=>{ el.style.transform=t; },110); };
      jiggle(A); jiggle(B);
    },

    /** Real match finder (also spawns 💥/🌈 for runs of 4/5+) */
    findMatches(){
      const matched=new Set();
      // rows
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
      // cols
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

    /** Plan vertical gravity moves after removals */
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

    /** Animate falling tiles with per-column stagger */
    async animateGravity(moves){
      const layer=this.tilesEl();
      const steps=[];
      for(const {from,to,rows} of moves){
        const el=layer.children[from]; if(!el) continue;
        const [tr,tc]=this.rc(to);
        const duration=Math.min(120+rows*90, 750);
        const delay=(tc*8)+Math.min(rows*10,120);
        el.style.transition="none";
        steps.push({ el, tx:tc*this.CELL, ty:tr*this.CELL, duration, delay });
      }
      if(!steps.length) return;
      // force reflow then play
      layer.offsetHeight; await new Promise(requestAnimationFrame);
      const promises=[];
      for(const s of steps){
        s.el.style.transition=`transform ${s.duration}ms cubic-bezier(.2,.75,.25,1)`;
        s.el.style.transitionDelay=`${s.delay}ms`;
        s.el.style.transform=`translate3d(${s.tx}px, ${s.ty}px, 0)`;
        promises.push(new Promise(res=>setTimeout(res, s.duration+s.delay)));
      }
      await Promise.all(promises);
    },

    /** Full cascade loop (remove → fall → refill → repeat) */
    async cascade(first){
      this.animating=true;
      await this.removeMatches(first);

      while(true){
        const { moves, nextGrid } = this.computeGravityPlan();
        await this.animateGravity(moves);
        this.grid=nextGrid;
        this.render();

        // Refill from top with slide-in
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

    /** Remove matched tiles with small FX and scoring */
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
            el.style.transform+=" scale(1.25)";
            el.style.filter="brightness(1.35)";
            setTimeout(()=>{ el.style.opacity="0"; el.style.transform=el.style.transform.replace("scale(1.25)","scale(0.7)"); },90);
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

    /** Specials */
    triggerBomb(index){
      const [r]=this.rc(index);
      const sweep=document.createElement("div");
      sweep.className="row-sweep";
      sweep.style.top=`${r*this.CELL}px`;
      sweep.style.height=`${this.CELL}px`;
      this.fxEl().appendChild(sweep);
      setTimeout(()=>sweep.remove?.(), 420);

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
      setTimeout(()=>wave.remove?.(), 600);

      this.grid[index] = null;

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


    /** Win/Lose check with confetti */
        //only for testing
        // Debugging use, delete after use
    cheatWin() {
      this.score = this.levelGoals[this.level - 1];
      this.checkWinLose();
    },

    checkWinLose(){
      if(this.score>=this.levelGoals[this.level-1]){
        // Show confetti effect regardless of avatar
        confetti({ particleCount:200, spread:120, origin:{ y:.6 } });
        setTimeout(()=>{
          alert("🎉 Level "+this.level+" Clear!");
          this.level++;
          if(this.level>this.levelGoals.length){ 
            this.handleGameComplete();
          }
          else{ this.moves=15; this.render(); }
        },500);
      }else if(this.moves<0 || (this.moves===0 && !this.animating)){
        confetti({ particleCount:150, spread:100, origin:{ y:.6 }, colors:['#555','#888','#aaa'] });
        const b=this.$refs.board; b.style.transition="background .5s"; b.style.background="#662222";
        setTimeout(()=>b.style.background="",600);
        setTimeout(()=>{ alert("❌ Game Over. Final Score: "+this.score); this.init(); },800);
      }
    },

    // handle game complete
    handleGameComplete() {
      const avatarType = localStorage.getItem('avatarType');
      
      if (avatarType === 'avatara') {
        // If user selected Sol avatar, check current evolution level and trigger evolution
        const currentLevel = parseInt(localStorage.getItem('avatarEvolutionLevel') || '1');
        
        if (currentLevel < 3) {
          // evolve to next level
          const newLevel = currentLevel + 1;
          localStorage.setItem('avatarEvolutionLevel', newLevel.toString());

          // immediately trigger avatar update
          if (this.$refs.avatarComponent) {
            this.$refs.avatarComponent.triggerAvatarUpdate();
          }
          
          this.gameCompleteMessage = `Congratulations! Your avatar evolved to level ${newLevel}`;
          this.showGameCompleteMessage = true;
          
          // after 2 seconds, hide message and reset game
          setTimeout(() => {
            this.showGameCompleteMessage = false;

            // Notify DraggableAvatar component to check status
            if (this.$refs.avatarComponent) {
              this.$refs.avatarComponent.checkAvatarSelected();
            }
            
            alert("🏆 All Levels Complete!");
            this.init();
          }, 2000);
        } else {
          // Already at max level, just show complete message
          alert("🏆 All Levels Complete!");
          this.init();
        }
      } else {
        // If user selected custom avatar, just show win effect
        alert("🏆 All Levels Complete!");
        this.init();
      }
    },
  }
};
</script>

<!-- DO NOT scope: background & drawer need to escape local scoping -->
<style>
/* ===== Full-page dark, food-themed background (fixed) ===== */
.match3.game-wrapper{
  position: relative;
}
.match3.game-wrapper::before{
  content:'';
  position: fixed;
  top:0; left:0;
  width:100%; height:100%;
  background-image: url('/assets/3match_bg.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  z-index: -1;
  pointer-events: none;
}

/* Layout & heading */
.match3.game-wrapper{ display:flex; flex-direction:column; align-items:center; justify-content:center; }
.match3 h1{ letter-spacing:.5px; margin:10px 0 6px; text-shadow:0 2px 12px rgba(108,99,255,.25); }

/* ===== HUD ===== */
.match3 .hud{
  display:flex; gap:20px; align-items:center; justify-content:space-between;
  width:min(980px,94vw); margin:10px auto 6px;
}
.match3 .hud-left{ display:flex; gap:12px; flex-wrap:wrap; }
.match3 .pill{ background:#1f2235; padding:8px 12px; border-radius:999px; border:1px solid #2f3350; color:#dfe6ff; font-size:14px; }
.match3 .pill strong{ color:#ffd369; margin-left:6px; }

/* Right HUD block (brown rounded) */
.match3 .hud-right{
  display:grid; gap:8px; align-items:center;
  background: rgba(60,40,20,.9);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 18px rgba(0,0,0,.35);
  border: 1px solid rgba(120,85,45,.55);
  backdrop-filter: blur(1.5px);
}
.match3 .goal-row{ display:grid; gap:6px; color:#f3efe9; font-size:14px; }
.match3 .bar{ width:min(320px,60vw); height:10px; background:#2a1c12; border-radius:999px; overflow:hidden; border:1px solid rgba(120,85,45,.6); }
.match3 .bar-fill{ height:100%; background:linear-gradient(90deg,#ffd369,#ffb347); transition:width .25s; }
.match3 .tip{ color:#f0e6d6; opacity:.92; font-size:13px; }
.match3 .btn{
  padding:8px 14px; border-radius:10px; border:1px solid rgba(120,85,45,.6);
  background:#3b2a1b; color:#fff; cursor:pointer;
  box-shadow:0 2px 6px rgba(0,0,0,.25); transition:transform .12s, background .2s;
}
.match3 .btn:hover{ transform:translateY(-1px); background:#4a3522; }

/* ===== Main Area: left legend | center board | right tips ===== */
.match3 .board-row{
  display:flex; justify-content:center; align-items:flex-start; gap:22px;
  width: 100%;
  margin-top: 14px;
}

/* Left: legend card */
.match3 .legend{
  flex:0 0 220px;
  padding:12px 14px;
  border:1px solid rgba(120,85,45,.55);
  border-radius:12px;
  background:rgba(60,40,20,.92);
  color:#f7efe4;
  box-shadow:0 6px 18px rgba(0,0,0,.35);
}
.match3 .legend h3{ margin:0 0 8px; font-size:16px; color:#ffd369; }
.match3 .legend ul{ margin:0; padding-left:18px; font-size:14px; }
.match3 .legend li{ margin-bottom:6px; }

/* Center: board shell (no clipping) */
.match3 .board{
  --bd-r: 16px; --gutter: 10px; --bd-bw: 1px;
  position:relative;
  margin:0;
  background:radial-gradient(120% 120% at 50% 0%, #2f3152 0%, #2b2e48 40%, #262943 100%);
  border: var(--bd-bw) solid #3a3e66;
  border-radius: var(--bd-r);
  box-shadow:0 12px 28px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.03);
  padding: var(--gutter);
  overflow: visible;
}
.match3 .tiles-layer,
.match3 .fx-layer{
  position:absolute; inset:0; background: transparent;
}
.match3 .fx-layer{ pointer-events:none; z-index:100; }

/* Right: sticky health tips (desktop only) */
.match3 .side-tips{
  flex:0 0 260px;
  position: sticky;
  top: 92px; /* clear HUD */
  align-self: flex-start;
  display: block;
}
@media (max-width: 1100px){ .match3 .side-tips{ flex-basis: 220px; } }

/* ===== Tiles ===== */
.match3 .tile{
  position:absolute;
  width:48px; height:48px; border-radius:10px; background:#3a3d5c; color:#fff;
  box-shadow:inset 0 1px 3px rgba(0,0,0,.3);
  display:flex; align-items:center; justify-content:center; font-size:22px;
  transition:transform .25s ease, background .25s ease, box-shadow .25s ease, opacity .25s ease;
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

/* ===== FX ===== */
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

/* ===== Mobile drawer & FAB (≤900px visible) ===== */
.tips-fab{
  position: fixed;
  right: 14px; bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  width: 48px; height: 48px; border-radius: 999px;
  border: 1px solid rgba(120,85,45,.6);
  background: rgba(60,40,20,.95);
  color:#ffd369; font-size:20px; font-weight:800;
  box-shadow: 0 6px 18px rgba(0,0,0,.35);
  cursor: pointer; display: none;
  z-index: 1000;
}
.tips-fab:active{ transform: translateY(1px); }

/* Drawer starts below TopNav using --topnav-h-safe */
.tips-drawer{
  position: fixed;
  top: var(--topnav-h-safe, var(--topnav-h, 66px));
  right: 0; bottom: 0;
  width: min(88vw, 360px);
  background: rgba(24,26,36,.98);
  border-left: 1px solid rgba(255,255,255,.06);
  transform: translateX(100%);
  transition: transform .28s ease;
  z-index: 999;
  display: none;
}
.tips-drawer.open{ transform: translateX(0); }
.drawer-header{
  display:flex; align-items:center; justify-content:space-between;
  padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.08);
  color:#fff;
}
.close-btn{ background: transparent; border:0; color:#fff; font-size:18px; cursor:pointer; }
.drawer-body{ padding: 12px 14px; color:#e8e9f3; overflow:auto; height: 100%; }

/* Mask also respects TopNav height */
.drawer-mask{
  position: fixed;
  top: var(--topnav-h-safe, var(--topnav-h, 66px));
  left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,.35);
  opacity: 0; pointer-events: none;
  transition: opacity .2s;
  z-index: 998; display: none;
}
.drawer-mask.show{ opacity: 1; pointer-events: auto; }

/* Responsive switch for mobile UI */
@media (max-width: 900px){
  .match3 .board-row{
    flex-direction:column-reverse;
    align-items:center;
    gap:14px;
  }
  .match3 .legend{
    width:min(520px,92vw);
    flex: 0 0 auto;
  }
  .match3 .side-tips{ display: none; }
  .tips-fab{ display: inline-flex; align-items:center; justify-content:center; }
  .tips-drawer{ display: block; }
  .drawer-mask{ display: block; }
  .match3 .bar{ width:min(260px,56vw); }
}

/* ===== game completion ===== */
.match3 .overlay-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 1000;
  animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
}

.match3 .game-complete-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ffffff; /* dark green */
  font-family: 'Merriweather', serif; /* Merriweather font */
  font-size: 36px;
  font-weight: bold;
  z-index: 1001;
  text-align: center;
  animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
</style>
