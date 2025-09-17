<template>
  <div class="game-wrapper">
    <h1>Healthy Match-3</h1>

    <div class="hud">
      <div>Level：{{ level }}</div>
      <div>Score：{{ score }}</div>
      <div>Moves：{{ moves }}</div>
      <div>Goal：{{ levelGoals[level - 1] }}</div>
      <div>Reminder：{{ tip }}</div>
      <button @click="init">Restart</button>

      <!-- Goal Progress Bar -->
      <div class="goalbar">
        <div
          class="goalbar-fill"
          :style="{ width: Math.min(100, Math.floor(score / levelGoals[level-1] * 100)) + '%' }"
        ></div>
        <span class="goalbar-text">
          {{ Math.min(score, levelGoals[level-1]) }} / {{ levelGoals[level-1] }}
        </span>
      </div>
    </div>

    <div ref="board" class="board" aria-label="game board"></div>

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
      TYPES: ["🍎", "🥦", "🥕", "🥛", "🍞", "🧃", "🍌", "🍇"],
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
  mounted() {
    this.init();
  },
  methods: {
    // --- tools ---
    rnd(n) { return Math.floor(Math.random() * n); },
    randomType() { return this.TYPES[this.rnd(this.TYPES.length)]; },
    idx(r, c) { return r * this.SIZE + c; },
    rc(i) { return [Math.floor(i / this.SIZE), i % this.SIZE]; },
    sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

    // --- init ---
    init() {
      this.grid = Array(this.SIZE * this.SIZE).fill(null).map(() => this.randomType());
      this.score = 0;
      this.moves = 15;
      this.level = 1;
      this.tip = "——";
      this.selected = null;
      this.animating = false;
      this.render();
    },

    // --- render ---
    render() {
      const boardEl = this.$refs.board;
      boardEl.style.width = `${this.SIZE * this.CELL}px`;
      boardEl.style.height = `${this.SIZE * this.CELL}px`;
      boardEl.innerHTML = "";
      this.grid.forEach((tile, i) => {
        const [r, c] = this.rc(i);
        const div = document.createElement("div");
        div.className = "tile";
        div.textContent = tile ?? "";
        div.style.position = "absolute";
        div.style.width = div.style.height = this.CELL + "px";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.fontSize = "22px";
        div.style.transition = "transform 0.25s ease";
        div.style.transform = `translate(${c * this.CELL}px,${r * this.CELL}px) scale(1)`;
        div.onclick = () => this.onTileClick(i, div);
        boardEl.appendChild(div);
        div.style.cursor = "pointer";
      });
    },

    // --- click logic ---
    onTileClick(i, el) {
      if (this.animating) return;

      // special：💥 and 🌈
      if (this.grid[i] === "💥") {
        this.animateSpecial(el).then(() => this.triggerBomb(i));
        return;
      }
      if (this.grid[i] === "🌈") {
        this.animateSpecial(el).then(() => this.triggerRainbow(i));
        return;
      }

      // normal click logic
      if (this.selected === null) {
        this.selected = i;
        this.highlight(i);
        return;
      }
      if (i === this.selected) {
        this.unhighlight();
        this.selected = null;
        return;
      }
      if (!this.adjacent(i, this.selected)) {
        this.unhighlight();
        this.selected = i;
        this.highlight(i);
        return;
      }

      // two adjacent tiles selected → swap and check
      if (this.moves > 0) this.moves--;
      this.swapWithAnimation(i, this.selected).then(() => {
        const m = this.findMatches();

        if (m.size === 0) {
          // no matches → wiggle + swap back
          this.wiggleTiles(i, this.selected);
          this.swapWithAnimation(i, this.selected, true).then(() => {
            this.checkWinLose();
          });
        } else {
          // matches found → cascade
          this.cascade(m).then(this.checkWinLose);
        }

        this.unhighlight();
        this.selected = null;
      });
    },

    highlight(i) {
      const el = this.$refs.board.children[i];
      if (el) {
        el.style.outline = "3px solid #4f46e5";
        el.style.zIndex = "10";
      }
    },
    unhighlight() {
      [...this.$refs.board.children].forEach(el => {
        el.style.outline = "";
        el.style.zIndex = "1";
      });
    },
    adjacent(a, b) {
      const [ar, ac] = this.rc(a), [br, bc] = this.rc(b);
      return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
    },

    // --- animation swap ---
    swapWithAnimation(a, b, reverse = false) {
      this.animating = true;
      const elA = this.$refs.board.children[a], elB = this.$refs.board.children[b];
      const [ar, ac] = this.rc(a), [br, bc] = this.rc(b);

      // wether reverse or not to swap back
      [this.grid[a], this.grid[b]] = [this.grid[b], this.grid[a]];

      if (elA && elB) {
        elA.style.transform = `translate(${bc * this.CELL}px,${br * this.CELL}px)`;
        elB.style.transform = `translate(${ac * this.CELL}px,${ar * this.CELL}px)`;
      }

      return new Promise(res => {
        setTimeout(() => { this.render(); this.animating = false; res(); }, 250);
      });
    },

    // --- extra feedback: invalid swap wiggle ---
    wiggleTiles(a, b) {
      const els = [this.$refs.board.children[a], this.$refs.board.children[b]].filter(Boolean);
      els.forEach(el => el.classList.add('wiggle', 'flash'));
      setTimeout(() => els.forEach(el => el && el.classList.remove('wiggle', 'flash')), 260);
    },

    // --- matching ---
    findMatches() {
      const matched = new Set();
      // line
      for (let r = 0; r < this.SIZE; r++) {
        let run = 1;
        for (let c = 1; c <= this.SIZE; c++) {
          const cur = c < this.SIZE ? this.grid[this.idx(r, c)] : null;
          const prev = this.grid[this.idx(r, c - 1)];
          if (cur && prev && cur === prev) run++;
          else {
            if (run >= 3) {
              for (let k = 1; k <= run; k++) matched.add(this.idx(r, c - k));
              if (run === 4) this.grid[this.idx(r, c - 2)] = "💥";
              if (run >= 5) this.grid[this.idx(r, c - 3)] = "🌈";
            }
            run = 1;
          }
        }
      }
      // column
      for (let c = 0; c < this.SIZE; c++) {
        let run = 1;
        for (let r = 1; r <= this.SIZE; r++) {
          const cur = r < this.SIZE ? this.grid[this.idx(r, c)] : null;
          const prev = this.grid[this.idx(r - 1, c)];
          if (cur && prev && cur === prev) run++;
          else {
            if (run >= 3) {
              for (let k = 1; k <= run; k++) matched.add(this.idx(r - k, c));
              if (run === 4) this.grid[this.idx(r - 2, c)] = "💥";
              if (run >= 5) this.grid[this.idx(r - 3, c)] = "🌈";
            }
            run = 1;
          }
        }
      }
      return matched;
    },

    // --- cascade / fall ---
    async cascade(first) {
      this.animating = true;
      await this.removeMatches(first);
      while (true) {
        this.applyGravity(); this.fillNew(); this.render();
        await this.sleep(250);
        const m = this.findMatches();
        if (m.size === 0) break;
        await this.removeMatches(m);
      }
      this.animating = false;
    },
    removeMatches(matches) {
      this.score += matches.size * 10;
      this.tip = [
        "Drink more water and less sugary drinks~",
        "Vegetables and fruits provide dietary fiber!",
        "Whole grains are more filling.",
        "Replace beverages with water and you can reduce a lot of sugar in a week!",
        "Protein should be balanced: beans, eggs, milk",
        "Look at the nutrition label: less sugar, less salt, less saturated fat!"
      ][this.rnd(6)];

      return new Promise(res => {
        for (const i of matches) {
          const el = this.$refs.board.children[i];
          if (el) {
            el.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            el.style.transform += " scale(1.5)";
            el.style.opacity = "0.2";
          }
          // --- floating score animation ---
          this.spawnFloatingScore(i, 10);
        }
        setTimeout(() => {
          for (const i of matches) {
            if (this.grid[i] !== "💥" && this.grid[i] !== "🌈") this.grid[i] = null;
          }
          this.render(); res();
        }, 300);
      });
    },
    applyGravity() {
      for (let c = 0; c < this.SIZE; c++) {
        let write = this.SIZE - 1;
        for (let r = this.SIZE - 1; r >= 0; r--) {
          const i = this.idx(r, c);
          if (this.grid[i] !== null) {
            const w = this.idx(write, c);
            if (i !== w) { this.grid[w] = this.grid[i]; this.grid[i] = null; }
            write--;
          }
        }
      }
    },
    fillNew() {
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] === null) this.grid[i] = this.randomType();
      }
    },

    // --- floating score animation ---
    spawnFloatingScore(i, points = 10) {
      const board = this.$refs.board;
      const [r, c] = this.rc(i);
      const x = c * this.CELL + this.CELL / 2;
      const y = r * this.CELL + this.CELL / 2;
      const el = document.createElement('div');
      el.className = 'floating-score';
      el.textContent = `+${points}`;
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.position = 'absolute';
      board.appendChild(el);
      setTimeout(() => el.remove(), 650);
    },

    // --- special ---
    triggerBomb(index) {
      const [r] = this.rc(index);

      // 1) row sweep effect
      const board = this.$refs.board;
      const sweep = document.createElement('div');
      sweep.className = 'row-sweep';
      sweep.style.top = (r * this.CELL) + 'px';
      sweep.style.width = (this.SIZE * this.CELL) + 'px';
      sweep.style.height = this.CELL + 'px';
      board.appendChild(sweep);
      setTimeout(() => sweep.remove(), 360);

      // 2) slight board jolt
      board.style.transition = "transform .08s";
      board.style.transform = "translateY(2px)";
      setTimeout(() => (board.style.transform = "translateY(0)"), 90);

      // 3) wipe out row
      setTimeout(() => {
        for (let c = 0; c < this.SIZE; c++) this.grid[this.idx(r, c)] = null;
        this.render();
        this.cascade(this.findMatches()).then(this.checkWinLose);
      }, 180);
    },
    triggerRainbow(index) {
      const type = this.TYPES[this.rnd(this.TYPES.length)];
      for (let j = 0; j < this.grid.length; j++) {
        if (this.grid[j] === type) this.grid[j] = null;
      }
      this.render();
      this.cascade(this.findMatches()).then(this.checkWinLose);
    },
    animateSpecial(el) {
      return new Promise(res => {
        el.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        el.style.transform += " scale(1.5)";
        el.style.opacity = "0.3";
        setTimeout(res, 300);
      });
    },

    // --- win/lose check ---
    checkWinLose() {
      if (this.score >= this.levelGoals[this.level - 1]) {
        // victory confetti
        confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
        setTimeout(() => {
          alert("🎉 Level " + this.level + " Clear!");
          this.level++;
          if (this.level > this.levelGoals.length) {
            alert("🏆 All Levels Complete!");
            this.init();
          } else {
            this.moves = 15;
            this.render();
          }
        }, 500);
      } else if (this.moves <= 0) {
        // failure effect: gray confetti + board flash red
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#555', '#888', '#aaa']
        });

        const board = this.$refs.board;
        board.style.transition = "background 0.5s";
        board.style.background = "#662222";
        setTimeout(() => board.style.background = "#2c2f48", 600);

        setTimeout(() => {
          alert("❌ Game Over. Final Score: " + this.score);
          this.init();
        }, 800);
      }
    }
  }
};
</script>

<style scoped>
/* make game centered */
.game-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* board + soft background */
.board {
  position: relative;
  margin: 20px auto;
  background: #2c2f48; /* dark background for better integration */
  border: 2px solid #444;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

/* tile */
.tile {
  border-radius: 6px;
  background: #3a3d5c; /* dark gray-blue background */
  color: #fff;         /* make emoji clearer */
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  transition: transform 0.25s ease, background 0.3s ease;
}
.tile:hover {
  background: #50557c;
  transform: scale(1.05);
}

/* HUD progress bar */
.goalbar {
  position: relative;
  width: 260px;
  height: 12px;
  background: #1f2235;
  border: 1px solid #444;
  border-radius: 999px;
  overflow: hidden;
  margin: 8px auto 0;
}
.goalbar-fill {
  height: 100%;
  background: linear-gradient(90deg, #34d399, #22d3ee);
  transition: width .35s ease;
}
.goalbar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #e5e7eb;
  pointer-events: none;
  text-shadow: 0 1px 2px #0008;
}

/* legend */
.legend {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #666;
  border-radius: 8px;
  background: #1f2235;  /* dark background */
  max-width: 360px;
  color: #f0f0f0;       /* make text brighter */
}
.legend h3 {
  margin: 0 0 8px;
  font-size: 16px;
  color: #ffd369;       /* bright yellow */
}
.legend ul {
  margin: 0;
  padding-left: 20px;
  font-size: 14px;
}
.legend li {
  margin-bottom: 6px;
}

/* invalid-swap feedback */
@keyframes wiggle {
  0%,100%{ transform: translateX(0) }
  25%{ transform: translateX(-6px) }
  75%{ transform: translateX(6px) }
}
.tile.wiggle { animation: wiggle .25s ease; }
.tile.flash  { animation: flash .3s ease; }
@keyframes flash { from{ background:#8b3a3a } to{ background:#3a3d5c } }

/* floating score */
.floating-score {
  position: absolute;
  color: #ffec99;
  font-weight: 700;
  text-shadow: 0 2px 6px #0009;
  transform: translate(-50%, -50%);
  pointer-events: none;
  opacity: 0;
  animation: floatUp .6s ease forwards;
}
@keyframes floatUp {
  from { transform: translate(-50%,-20%); opacity:.1 }
  to   { transform: translate(-50%,-80%); opacity:1 }
}

/* row sweep for 💥 */
.row-sweep {
  position: absolute; left: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0));
  filter: blur(2px); pointer-events: none; border-radius: 8px; opacity: .9;
  animation: sweep .35s ease forwards;
}
@keyframes sweep {
  from { transform: translateX(-20%); opacity: .6 }
  to   { transform: translateX(100%); opacity: 0 }
}
</style>
