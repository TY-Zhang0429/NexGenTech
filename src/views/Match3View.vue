<template>
  <div class="game-page">
    <h1 class="title">Healthy Match-3</h1>

    <!-- HUD 卡片 -->
    <section class="hud-card">
      <div class="hud-row">
        <div class="hud-item">
          <span class="hud-label">Level</span>
          <span class="hud-value badge">{{ level }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">Score</span>
          <span class="hud-value">{{ score }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">Moves</span>
          <span class="hud-value">{{ moves }}</span>
        </div>
        <div class="hud-item">
          <span class="hud-label">Goal</span>
          <span class="hud-value">{{ levelGoals[level-1] }}</span>
        </div>
        <button class="btn ghost" @click="init">↻ Restart</button>
      </div>

      <div class="goalbar">
        <div class="goalbar-fill"
             :style="{ width: Math.min(100, Math.floor(score/levelGoals[level-1]*100)) + '%'}"></div>
        <span class="goalbar-text">
          {{ Math.min(score, levelGoals[level-1]) }} / {{ levelGoals[level-1] }}
        </span>
      </div>

      <div class="tip">
        <span class="tip-icon">💡</span>
        <span class="tip-text">{{ tip }}</span>
      </div>
    </section>

    <!-- 游戏棋盘 -->
    <div ref="board" class="board" aria-label="game board"></div>

    <!-- 说明 -->
    <div class="legend">
      <h3>Special Blocks</h3>
      <ul>
        <li>💥 (4 in a row) → Clears an entire row (Click to trigger)</li>
        <li>🌈 (5 in a row) → Clears all tiles of one type (Click to trigger)</li>
      </ul>
    </div>

    <!-- Toast -->
    <div class="toast-wrap">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">{{ t.text }}</div>
    </div>

    <!-- 专属礼花画布（置顶） -->
    <canvas ref="confettiCanvas" class="confetti-canvas"></canvas>
  </div>
</template>

<script>
import confetti from "canvas-confetti";

export default {
  name: "Match3View",
  data() {
    return {
      // config
      SIZE: 10,
      TYPES: ["🍎","🥦","🥕","🥛","🍞","🧃","🍌","🍇"],
      CELL: 48,
      // state
      grid: [],
      score: 0,
      moves: 15,
      level: 1,
      levelGoals: [200, 500, 800],
      tip: "——",
      selected: null,
      animating: false,
      // render cache
      tileEls: [],
      toasts: [],
      toastId: 1,
      // confetti
      cf: null,
    };
  },
  mounted() {
    const cvs = this.$refs.confettiCanvas;
    this.cf = confetti.create(cvs, { resize: true, useWorker: true });
    this.init();
  },
  methods: {
    // --- utils ---
    rnd(n){ return Math.floor(Math.random()*n); },
    randomType(){ return this.TYPES[this.rnd(this.TYPES.length)]; },
    idx(r,c){ return r*this.SIZE + c; },
    rc(i){ return [Math.floor(i/this.SIZE), i%this.SIZE]; },
    sleep(ms){ return new Promise(r=>setTimeout(r, ms)); },
    toast(text, type='info', ms=1400){
      const id = this.toastId++;
      this.toasts.push({ id, text, type });
      setTimeout(()=>{ this.toasts = this.toasts.filter(x=>x.id!==id) }, ms);
    },
    burst(opts){ if (this.cf) this.cf(opts); else confetti(opts); },

    // 新增：邻居索引 & 提示
    neighbors(i){
      const [r,c] = this.rc(i); const ns = [];
      if (r>0) ns.push(this.idx(r-1,c));
      if (r<this.SIZE-1) ns.push(this.idx(r+1,c));
      if (c>0) ns.push(this.idx(r,c-1));
      if (c<this.SIZE-1) ns.push(this.idx(r,c+1));
      return ns;
    },
    showAdjacents(i){
      this.clearAdjacents();
      for (const n of this.neighbors(i)) {
        const el = this.tileEls[n]; if (el) el.classList.add('adjacent-hint');
      }
    },
    clearAdjacents(){
      this.tileEls.forEach(el => el && el.classList.remove('adjacent-hint'));
    },

    // --- init ---
    init(){
      this.grid = Array(this.SIZE*this.SIZE).fill(null).map(()=>this.randomType());
      this.score = 0; this.moves = 15; this.level = 1;
      this.tip = "——"; this.selected = null; this.animating = false;

      const board = this.$refs.board;
      board.style.width = (this.SIZE*this.CELL) + "px";
      board.style.height = (this.SIZE*this.CELL) + "px";
      board.innerHTML = "";
      this.tileEls = [];

      for (let i=0;i<this.grid.length;i++){
        const el = document.createElement('div');
        el.className = 'tile';
        el.style.width = el.style.height = this.CELL + 'px';
        el.style.position = 'absolute';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.fontSize = '22px';
        el.style.transition = 'transform .28s cubic-bezier(.2,.8,.2,1), opacity .28s';
        el.style.willChange = 'transform, opacity';
        el.onclick = () => this.onTileClick(i, el);
        board.appendChild(el);
        this.tileEls.push(el);
      }
      this.render();
    },

    // --- render（持久节点 + transform 过渡） ---
    render(){
      for (let i=0;i<this.grid.length;i++){
        const el = this.tileEls[i];
        const tile = this.grid[i];
        const [r,c] = this.rc(i);
        el.textContent = tile ?? "";
        el.style.transform = `translate(${c*this.CELL}px, ${r*this.CELL}px)`;
        el.style.opacity = tile ? '1' : '0';
        el.style.cursor = 'pointer';
      }
    },

    // --- 点击主逻辑 + 即时反馈 ---
    onTileClick(i, el){
      if (this.animating) return;

      // 1) 立刻反馈：脉冲 & 按压回弹
      this.tapPulse(i);
      this.pressBounce(el);

      // 2) 特殊块
      if (this.grid[i] === "💥") { this.animateSpecial(el).then(()=>this.triggerBomb(i)); return; }
      if (this.grid[i] === "🌈") { this.animateSpecial(el).then(()=>this.triggerRainbow(i)); return; }

      // 3) 选择与交换
      if (this.selected === null){
        this.selected = i; this.highlight(i); this.showAdjacents(i); return;
      }
      if (i === this.selected){
        this.unhighlight(); this.clearAdjacents(); this.selected = null; return;
      }
      if (!this.adjacent(i, this.selected)){
        this.unhighlight(); this.clearAdjacents();
        this.selected = i; this.highlight(i); this.showAdjacents(i); return;
      }

      // 相邻 → 交换（先扣步）
      if (this.moves > 0) this.moves--;
      this.clearAdjacents();
      this.swapWithAnimation(i, this.selected).then(()=>{
        const m = this.findMatches();
        if (m.size === 0){
          this.wiggleTiles(i, this.selected);
          this.swapWithAnimation(i, this.selected, true).then(()=>this.checkWinLose());
        } else {
          this.cascade(m).then(this.checkWinLose);
        }
        this.unhighlight(); this.selected = null;
      });
    },

    // 即时反馈：脉冲圈
    tapPulse(i){
      const board = this.$refs.board;
      const [r,c] = this.rc(i);
      const x = c*this.CELL + this.CELL/2;
      const y = r*this.CELL + this.CELL/2;
      const ring = document.createElement('div');
      ring.className = 'click-ripple';
      ring.style.left = x + 'px';
      ring.style.top  = y + 'px';
      board.appendChild(ring);
      setTimeout(()=> ring.remove(), 500);
    },
    // 即时反馈：按压回弹（不覆盖原 transform）
    pressBounce(el){
      const old = el.style.transform;
      el.style.transform = old + " scale(0.94)";
      setTimeout(()=>{ el.style.transform = old; }, 120);
    },

    // 选中高亮
    highlight(i){
      const el = this.tileEls[i];
      if (el){ el.classList.add('selected'); el.style.zIndex='10'; }
    },
    unhighlight(){
      this.tileEls.forEach(el=>{ el.classList.remove('selected'); el.style.zIndex='1'; });
    },
    adjacent(a,b){
      const [ar,ac]=this.rc(a), [br,bc]=this.rc(b);
      return Math.abs(ar-br)+Math.abs(ac-bc)===1;
    },

    // 交换动画
    swapWithAnimation(a,b){
      this.animating = true;
      [this.grid[a], this.grid[b]] = [this.grid[b], this.grid[a]];
      const [ar,ac] = this.rc(a), [br,bc]=this.rc(b);
      const elA = this.tileEls[a], elB = this.tileEls[b];
      if (elA && elB){
        elA.style.transform = `translate(${bc*this.CELL}px,${br*this.CELL}px)`;
        elB.style.transform = `translate(${ac*this.CELL}px,${ar*this.CELL}px)`;
      }
      return new Promise(res=>{ setTimeout(()=>{ this.render(); this.animating=false; res(); }, 280); });
    },

    // 无效交换反馈
    wiggleTiles(a,b){
      [this.tileEls[a], this.tileEls[b]].forEach(el=>{
        if (!el) return;
        el.classList.add('wiggle','flash');
        setTimeout(()=>el.classList.remove('wiggle','flash'), 280);
      });
      this.toast("No match!", "warn", 900);
    },

    // 匹配检测
    findMatches(){
      const matched = new Set();
      // 行
      for (let r=0;r<this.SIZE;r++){
        let run=1;
        for (let c=1;c<=this.SIZE;c++){
          const cur = c<this.SIZE ? this.grid[this.idx(r,c)] : null;
          const prev = this.grid[this.idx(r,c-1)];
          if (cur && prev && cur===prev) run++;
          else {
            if (run>=3){
              for (let k=1;k<=run;k++) matched.add(this.idx(r,c-k));
              if (run===4) this.grid[this.idx(r,c-2)] = "💥";
              if (run>=5) this.grid[this.idx(r,c-3)] = "🌈";
            }
            run=1;
          }
        }
      }
      // 列
      for (let c=0;c<this.SIZE;c++){
        let run=1;
        for (let r=1;r<=this.SIZE;r++){
          const cur = r<this.SIZE ? this.grid[this.idx(r,c)] : null;
          const prev = this.grid[this.idx(r-1,c)];
          if (cur && prev && cur===prev) run++;
          else {
            if (run>=3){
              for (let k=1;k<=run;k++) matched.add(this.idx(r-k,c));
              if (run===4) this.grid[this.idx(r-2,c)] = "💥";
              if (run>=5) this.grid[this.idx(r-3,c)] = "🌈";
            }
            run=1;
          }
        }
      }
      return matched;
    },

    // 级联
    async cascade(first){
      this.animating = true;
      await this.removeMatches(first);
      while(true){
        this.applyGravity();
        this.fillNew();
        this.render();
        await this.sleep(280);
        const m = this.findMatches();
        if (m.size===0) break;
        await this.removeMatches(m);
      }
      this.animating = false;
    },

    removeMatches(matches){
      this.score += matches.size * 10;
      this.tip = [
        "Drink more water and less sugary drinks~",
        "Vegetables and fruits provide dietary fiber!",
        "Whole grains are more filling.",
        "Replace beverages with water and you can reduce a lot of sugar in a week!",
        "Protein should be balanced: beans, eggs, milk",
        "Check nutrition labels: less sugar, less salt, less saturated fat!"
      ][this.rnd(6)];

      return new Promise(res=>{
        for (const i of matches){
          const el = this.tileEls[i];
          if (el){
            el.style.transition = "transform .28s ease, opacity .28s ease";
            el.style.transform += " scale(1.35)";
            el.style.opacity = ".1";
          }
          this.spawnFloatingScore(i, 10);
        }
        setTimeout(()=>{
          for (const i of matches){
            if (this.grid[i] !== "💥" && this.grid[i] !== "🌈") this.grid[i] = null;
          }
          this.render();
          res();
        }, 280);
      });
    },

    applyGravity(){
      for (let c=0;c<this.SIZE;c++){
        let write = this.SIZE-1;
        for (let r=this.SIZE-1;r>=0;r--){
          const i = this.idx(r,c);
          if (this.grid[i] !== null){
            const w = this.idx(write,c);
            if (i!==w){ this.grid[w] = this.grid[i]; this.grid[i] = null; }
            write--;
          }
        }
      }
    },
    fillNew(){
      for (let i=0;i<this.grid.length;i++){
        if (this.grid[i] === null) this.grid[i] = this.randomType();
      }
    },

    // 飘分
    spawnFloatingScore(i, points=10){
      const board = this.$refs.board;
      const [r,c] = this.rc(i);
      const x = c*this.CELL + this.CELL/2;
      const y = r*this.CELL + this.CELL/2;
      const el = document.createElement('div');
      el.className = 'floating-score';
      el.textContent = `+${points}`;
      el.style.left = x+'px';
      el.style.top  = y+'px';
      el.style.position = 'absolute';
      board.appendChild(el);
      setTimeout(()=>el.remove(), 650);
    },

    // 💥 清行 + 扫光
    triggerBomb(index){
      const [r] = this.rc(index);
      const board = this.$refs.board;

      const sweep = document.createElement('div');
      sweep.className = 'row-sweep';
      sweep.style.top = (r*this.CELL)+'px';
      sweep.style.width = (this.SIZE*this.CELL)+'px';
      sweep.style.height = this.CELL+'px';
      board.appendChild(sweep);
      setTimeout(()=>sweep.remove(), 360);

      board.style.transition = "transform .08s";
      board.style.transform = "translateY(2px)";
      setTimeout(()=>board.style.transform="translateY(0)", 90);

      setTimeout(()=>{
        for (let c=0;c<this.SIZE;c++) this.grid[this.idx(r,c)] = null;
        this.render();
        this.cascade(this.findMatches()).then(this.checkWinLose);
      }, 160);
    },

    // 🌈 清随机一种（可升级为：点击选择目标类型）
    triggerRainbow(){
      const type = this.TYPES[this.rnd(this.TYPES.length)];
      for (let j=0;j<this.grid.length;j++){
        if (this.grid[j] === type) this.grid[j] = null;
      }
      this.render();
      this.cascade(this.findMatches()).then(this.checkWinLose);
    },

    animateSpecial(el){
      return new Promise(res=>{
        el.style.transition = "transform .28s ease, opacity .28s ease";
        el.style.transform += " scale(1.4)";
        el.style.opacity = ".35";
        setTimeout(res, 280);
      });
    },

    // 胜负（toast + 专属礼花）
    checkWinLose(){
      if (this.score >= this.levelGoals[this.level-1]){
        this.burst({ particleCount: 220, spread: 120, origin:{ y:.6 } });
        this.toast(`🎉 Level ${this.level} Clear!`, "ok", 1400);
        setTimeout(()=>{
          this.level++;
          if (this.level > this.levelGoals.length){
            this.burst({ particleCount: 320, spread: 160, origin:{ y:.5 } });
            this.toast("🏆 All Levels Complete!", "ok", 1600);
            setTimeout(()=>this.init(), 900);
          } else {
            this.moves = 15;
            this.render();
          }
        }, 500);
      } else if (this.moves <= 0){
        this.burst({ particleCount: 180, spread: 100, origin:{ y:.6 }, colors:['#555','#888','#aaa'] });
        const board = this.$refs.board;
        board.style.transition = "background .5s";
        board.style.background = "#662222";
        setTimeout(()=>board.style.background="#2c2f48", 600);
        this.toast(`❌ Game Over • Final: ${this.score}`, "err", 1600);
        setTimeout(()=>this.init(), 900);
      }
    },
  }
};
</script>

<style scoped>
/* ===== 背景 / 标题 ===== */
.game-page{
  min-height: 100vh;
  display: grid;
  justify-items: center;
  gap: 14px;
  padding: 24px 16px 60px;
  background: radial-gradient(1200px 700px at 50% -200px, #1f2941, #0f172a);
}
.title{ margin: 0; color:#eef2ff; letter-spacing:.5px; font-weight:800; text-shadow:0 6px 24px #0006; }

/* ===== HUD ===== */
.hud-card{
  width: min(880px, 92vw);
  padding: 14px 16px 12px;
  background: rgba(20,25,45,.72);
  border: 1px solid #334155; border-radius: 14px; backdrop-filter: blur(6px);
  box-shadow: 0 12px 30px #0005;
}
.hud-row{ display:grid; grid-template-columns: repeat(4,1fr) auto; align-items:center; gap:12px; }
.hud-item{ display:flex; flex-direction:column; gap:4px; }
.hud-label{ font-size:12px; color:#93c5fd; opacity:.9; }
.hud-value{ font-weight:700; color:#e5e7eb; }
.badge{ background:#0ea5e9; color:#04223a; border-radius:999px; padding:2px 10px; display:inline-block; }
.btn{ height:32px; padding:0 12px; border-radius:10px; border:1px solid #3b425a; color:#e5e7eb; background:#1f2438; }
.btn.ghost:hover{ background:#2a3150; }

.goalbar{ position:relative; margin:10px 4px 6px; width:100%; height:12px; background:#12172a; border:1px solid #2a3351; border-radius:999px; overflow:hidden; }
.goalbar-fill{ height:100%; background:linear-gradient(90deg, #34d399, #22d3ee); transition: width .35s ease; }
.goalbar-text{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#dbeafe; font-size:12px; text-shadow:0 1px 2px #0008; pointer-events:none; }

.tip{ margin-top:8px; display:flex; align-items:center; gap:8px; color:#e2e8f0; font-size:14px; }
.tip-icon{ filter: drop-shadow(0 2px 6px #0007); }
.tip-text{ opacity:.95; }

/* ===== 棋盘 ===== */
.board{
  position: relative; margin:16px auto;
  background:#2c2f48; border:2px solid #444; border-radius:14px; box-shadow: 0 12px 40px rgba(0,0,0,.45);
}
.tile{
  border-radius:8px; background:#3a3d5c; color:#fff; box-shadow: inset 0 1px 3px rgba(0,0,0,.3);
  display:flex; align-items:center; justify-content:center; user-select:none; cursor:pointer; font-size:22px;
  transition: transform .28s cubic-bezier(.2,.8,.2,1), background .28s, opacity .28s; will-change: transform, opacity;
}
.tile:hover{ background:#50557c; transform: scale(1.05); }

/* 选中高亮：霓虹脉冲环 */
.tile.selected{ position: relative; }
.tile.selected::after{
  content:''; position:absolute; inset:4px; border:2px solid #22d3ee; border-radius:10px;
  box-shadow: 0 0 10px #22d3eeaa, inset 0 0 8px #22d3ee55; pointer-events:none; animation: selPulse 1s ease-in-out infinite;
}
@keyframes selPulse{ 0%,100%{ opacity:.95 } 50%{ opacity:.45 } }

/* 可交换邻格提示（虚线框 + 轻微呼吸） */
.tile.adjacent-hint{ position:relative; }
.tile.adjacent-hint::after{
  content:''; position:absolute; inset:8px; border:2px dashed #a78bfa; border-radius:10px; opacity:.85; pointer-events:none;
  animation: hintPulse 1.2s ease-in-out infinite;
}
@keyframes hintPulse{ 0%,100%{ transform: scale(.98) } 50%{ transform: scale(1.02) } }

/* 无效交换反馈 */
@keyframes wiggle { 0%,100%{ transform: translateX(0)} 25%{ transform: translateX(-6px)} 75%{ transform: translateX(6px)} }
.tile.wiggle{ animation: wiggle .28s ease; }
@keyframes flash { from{ background:#8b3a3a } to{ background:#3a3d5c } }
.tile.flash{ animation: flash .28s ease; }

/* 点击脉冲 Ripple（追加到 board 内） */
.click-ripple{
  position:absolute; width:10px; height:10px; left:0; top:0; transform: translate(-50%,-50%); pointer-events:none;
  border:2px solid rgba(173,216,255,.95); border-radius:999px; box-shadow: 0 0 12px rgba(173,216,255,.9), 0 0 24px rgba(173,216,255,.4);
  animation: ripple .45s ease-out forwards;
}
@keyframes ripple{ from{ opacity:.9; transform: translate(-50%,-50%) scale(.6) } to{ opacity:0; transform: translate(-50%,-50%) scale(2.2) } }

/* 飘分 */
.floating-score{
  position:absolute; color:#ffec99; font-weight:800; text-shadow:0 2px 6px #0009; transform:translate(-50%,-50%);
  pointer-events:none; opacity:0; animation: floatUp .6s ease forwards;
}
@keyframes floatUp{ from{ transform:translate(-50%,-20%); opacity:.1 } to{ transform:translate(-50%,-80%); opacity:1 } }

/* 💥 扫光 */
.row-sweep{
  position:absolute; left:0; background:linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0));
  filter:blur(2px); border-radius:8px; pointer-events:none; opacity:.9; animation: sweep .35s ease forwards;
}
@keyframes sweep{ from{ transform:translateX(-20%); opacity:.6 } to{ transform:translateX(100%); opacity:0 } }

/* 说明卡片 */
.legend{
  width:min(880px, 92vw); margin-top:6px; padding:12px; border:1px solid #3a405c; border-radius:12px; background:#1b2037; color:#f0f0f0;
}
.legend h3{ margin:0 0 6px; color:#ffd369; }
.legend ul{ margin:0; padding-left:18px; }

/* Toast */
.toast-wrap{
  position: fixed; top: 14px; left: 50%; transform: translateX(-50%); display: grid; gap: 8px; z-index: 10010;
}
.toast{
  padding: 8px 12px; border-radius: 10px; color:#eaf2ff; background:#1f2a44cc; border:1px solid #3a4a72; box-shadow:0 6px 20px #0006; backdrop-filter: blur(6px);
  animation: toastIn .2s ease, toastOut .2s ease 1.2s forwards;
}
.toast.ok{ background:#0e4b2dcc; border-color:#1d774c; }
.toast.err{ background:#4b1b1bcc; border-color:#7a2d2d; }
.toast.warn{ background:#4b3b1bcc; border-color:#7a5f2d; }
@keyframes toastIn{ from{ transform: translate(-50%, -8px); opacity:0 } to{ transform: translate(-50%, 0); opacity:1 } }
@keyframes toastOut{ to{ transform: translate(-50%, -8px); opacity:0 } }

/* 专属 confetti 画布 */
.confetti-canvas{ position: fixed; inset: 0; pointer-events: none; z-index: 10020; }

/* 响应式 */
@media (max-width: 720px){ .hud-row{ grid-template-columns: repeat(2,1fr) auto; } }
</style>
