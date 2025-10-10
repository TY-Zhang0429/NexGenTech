<template>
  <!-- root carries CSS vars like --topnav-h -->
  <div ref="pageRoot" class="catcher-game game-wrapper">
    <!-- import draggable avatar component -->
    <DraggableAvatar ref="avatarComponent" />

    <!-- game complete overlay -->
    <div v-if="showGameCompleteMessage" class="overlay-blur"></div>
    <div v-if="showGameCompleteMessage" class="game-complete-message">
      {{ gameCompleteMessage }}
    </div>

    <!-- ===== Topbar: Back ===== -->
    <div class="catcher-topbar">
      <button class="back-btn" @click="goBack">← Back</button>
    </div>
    
    <!-- Top Navigation -->
    <div class="top-nav">
      <h1>Healthier Catcher</h1>
    </div>

    <!-- Main Game Container -->
    <div class="game-container">
      <!-- Left Panel: Game Controls -->
      <div class="left-panel">
        <div class="control-section">
          <h3>Game Difficulty</h3>
          <select v-model="selectedDifficulty" :disabled="gameState === 'playing'" class="difficulty-selector">
            <option value="easy">Easy</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        <div class="control-section">
          <button 
            class="start-btn" 
            @click="startGame"
            :disabled="gameState === 'playing'"
          >
            {{ gameState === 'playing' ? 'Game Running...' : 'Start Game' }}
          </button>
          
          <button 
            class="reset-btn" 
            @click="resetGame"
            :disabled="gameState !== 'playing'"
          >
            Reset Game
          </button>
        </div>

        <div class="rules-section">
          <h3>How to Play</h3>
          <div class="rules-content">
            <p><strong>Controls:</strong> Use A/D keys or ← → arrow keys to move the bowl</p>
            <p><strong>Goal:</strong> Catch healthy foods, avoid unhealthy ones!</p>
            <p><strong>Difficulty:</strong> You can change difficulty even during gameplay</p>
            <p><strong>Scoring:</strong></p>
            <ul>
              <li>🍎 Fruits: +2 points</li>
              <li>🥕 Vegetables: +1 point</li>
              <li>🍟 French Fries: -1 point</li>
              <li>🍔 Burgers: -2 points</li>
            </ul>
            <p><strong>Win Condition:</strong> Reach 20 points to win!</p>
            <div v-if="selectedDifficulty === 'easy'">
              <p><strong>Easy Mode:</strong> No time limit, slower falling speed</p>
            </div>
            <div v-else>
              <p><strong>Hard Mode:</strong> 60 seconds time limit, faster falling, more unhealthy foods</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Game Area -->
      <div class="game-area">
        <div class="game-info">
          <div class="score-display">Score: <strong>{{ score }}</strong></div>
          <div v-if="selectedDifficulty === 'hard'" class="time-display">
            Time: <strong>{{ timeRemaining }}s</strong>
          </div>
        </div>

        <!-- Game Canvas -->
        <div class="game-canvas" ref="gameCanvas">
          <div class="game-background"></div>
          <!-- Player Bowl -->
          <div 
            class="player-bowl" 
            :style="{ left: playerPosition + 'px' }"
            ref="playerBowl"
          >
            <img src="/assets/bowl.png" alt="Player Bowl" class="bowl-image" />
          </div>

          <!-- Falling Foods -->
          <div 
            v-for="food in fallingFoods" 
            :key="food.id"
            class="falling-food"
            :style="{ 
              left: food.x + 'px', 
              top: food.y + 'px',
              fontSize: food.size + 'px'
            }"
          >
            {{ food.emoji }}
          </div>
        </div>

        <!-- Game Status Messages -->
        <div v-if="gameState === 'idle'" class="game-message">
          Select difficulty and click "Start Game" to begin!
        </div>
        <div v-if="gameState === 'won'" class="game-message success">
          🎉 Congratulations! You reached 20 points! 🎉
        </div>
        <div v-if="gameState === 'lost'" class="game-message failure">
          😞 Game Over! {{ selectedDifficulty === 'hard' ? 'Time\'s up!' : 'Try again!' }}
        </div>
      </div>

      <!-- Right Panel: Food Education -->
      <div class="right-panel">
        <h3>Object Introduction</h3>
        <div class="food-info">
          <div class="food-category">
            <h4>Healthy Foods (+Points)</h4>
            <div class="food-items">
              <div class="food-item">
                <span class="food-icon">🍎</span>
                <div class="food-details">
                  <strong>Fruits</strong>
                  <p>Rich in vitamins, fiber, and antioxidants. Great for energy and immune support.</p>
                  <span class="score-value">+2 points</span>
                </div>
              </div>
              <div class="food-item">
                <span class="food-icon">🥕</span>
                <div class="food-details">
                  <strong>Vegetables</strong>
                  <p>Packed with nutrients, minerals, and fiber. Essential for overall health.</p>
                  <span class="score-value">+1 point</span>
                </div>
              </div>
            </div>
          </div>

          <div class="food-category">
            <h4>Unhealthy Foods (-Points)</h4>
            <div class="food-items">
              <div class="food-item">
                <span class="food-icon">🍟</span>
                <div class="food-details">
                  <strong>French Fries</strong>
                  <p>High in unhealthy fats and calories. Best enjoyed in moderation.</p>
                  <span class="score-value negative">-1 point</span>
                </div>
              </div>
              <div class="food-item">
                <span class="food-icon">🍔</span>
                <div class="food-details">
                  <strong>Burgers</strong>
                  <p>High in saturated fats and calories. Choose healthier alternatives when possible.</p>
                  <span class="score-value negative">-2 points</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile drawer for tips (similar to other games) -->
    <button
      v-if="isNarrow"
      class="tips-fab"
      @click="tipsOpen = true"
      aria-label="Open Food Info"
    >
      💡
    </button>

    <div
      v-if="isNarrow"
      class="tips-drawer"
      :class="{ open: tipsOpen }"
    >
      <header class="drawer-header">
        <strong>Food Information</strong>
        <button class="close-btn" @click="tipsOpen = false">✕</button>
      </header>
      <div class="drawer-content">
        <!-- Mobile version of food info -->
        <div class="food-info mobile">
          <div class="food-category">
            <h4>Healthy Foods (+Points)</h4>
            <div class="food-items">
              <div class="food-item">
                <span class="food-icon">🍎</span>
                <div class="food-details">
                  <strong>Fruits (+2)</strong>
                  <p>Rich in vitamins and antioxidants</p>
                </div>
              </div>
              <div class="food-item">
                <span class="food-icon">🥕</span>
                <div class="food-details">
                  <strong>Vegetables (+1)</strong>
                  <p>Packed with nutrients and fiber</p>
                </div>
              </div>
            </div>
          </div>
          <div class="food-category">
            <h4>Unhealthy Foods (-Points)</h4>
            <div class="food-items">
              <div class="food-item">
                <span class="food-icon">🍟</span>
                <div class="food-details">
                  <strong>French Fries (-1)</strong>
                  <p>High in unhealthy fats</p>
                </div>
              </div>
              <div class="food-item">
                <span class="food-icon">🍔</span>
                <div class="food-details">
                  <strong>Burgers (-2)</strong>
                  <p>High in saturated fats</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile drawer mask -->
    <div class="drawer-mask" :class="{ show: tipsOpen }" @click="tipsOpen = false"></div>
  </div>
</template>

<script>
import confetti from "canvas-confetti";
import DraggableAvatar from "@/components/DraggableAvatar.vue";
import { useRouter } from 'vue-router';

export default {
  name: "CatcherView",
  components: { DraggableAvatar },
  data() {
    return {
      // Game state
      gameState: 'idle', // 'idle', 'playing', 'won', 'lost'
      selectedDifficulty: 'easy',
      score: 0,
      timeRemaining: 60,
      
      // Player
      playerPosition: 300, // x position of the bowl
      playerSpeed: 8,
      
      // Falling foods
      fallingFoods: [],
      nextFoodId: 1,
      
      // Game mechanics
      gameLoop: null,
      spawnTimer: 0,
      gameTimer: null,
      
      // Food types with their properties
      foodTypes: {
        fruits: {
          emojis: ['🍎', '🍌', '🍊', '🍇', '🥝', '🍓'],
          score: 2,
          probability: 0.3 // 30% chance in easy mode
        },
        vegetables: {
          emojis: ['🥕', '🥦', '🌽', '🥬', '🫑', '🍅'],
          score: 1,
          probability: 0.3 // 30% chance in easy mode
        },
        fries: {
          emojis: ['🍟'],
          score: -1,
          probability: 0.2 // 20% chance in easy mode
        },
        burgers: {
          emojis: ['🍔', '🍕', '🌭', '🥪'],
          score: -2,
          probability: 0.2 // 20% chance in easy mode
        }
      },
      
      // Mobile state
      isNarrow: false,
      tipsOpen: false,
      
      // Game complete state
      showGameCompleteMessage: false,
      gameCompleteMessage: '',
      
      // Key states
      keys: {
        left: false,
        right: false,
        a: false,
        d: false
      }
    };
  },
  
  watch: {
    // Allow difficulty changes during gameplay
    selectedDifficulty(newDifficulty, oldDifficulty) {
      if (this.gameState === 'playing' && newDifficulty !== oldDifficulty) {
        // Show difficulty change message
        this.showScoreChange(`Difficulty changed to ${newDifficulty.toUpperCase()}!`);
        
        // Update timer logic when switching difficulty during gameplay
        if (newDifficulty === 'hard' && !this.gameTimer) {
          // Switching to hard mode - start timer
          this.timeRemaining = 60;
          this.startGameTimer();
        } else if (newDifficulty === 'easy' && this.gameTimer) {
          // Switching to easy mode - stop timer
          clearInterval(this.gameTimer);
          this.gameTimer = null;
        }
      }
    }
  },
  
  computed: {
    canvasWidth() {
      return 600; // Fixed canvas width
    },
    canvasHeight() {
      return 400; // Fixed canvas height
    },
    
    currentDifficultySettings() {
      if (this.selectedDifficulty === 'easy') {
        return {
          fallSpeed: 2,
          spawnRate: 40, // frames between spawns (reduced from 80 for more frequent drops)
          timeLimit: null,
          probabilities: {
            fruits: 0.35,
            vegetables: 0.35,
            fries: 0.15,
            burgers: 0.15
          }
        };
      } else {
        return {
          fallSpeed: 4,
          spawnRate: 25, // frames between spawns (reduced from 50 for more frequent drops)
          timeLimit: 60,
          probabilities: {
            fruits: 0.25,
            vegetables: 0.25,
            fries: 0.25,
            burgers: 0.25
          }
        };
      }
    }
  },
  
  mounted() {
    // Set up responsive design
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize);
    
    // Set up keyboard listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    
    // Set CSS vars for TopNav height
    this.setLocalTopnavVar();
    window.addEventListener("resize", this.setLocalTopnavVar);
  },
  
  beforeUnmount() {
    // Clean up
    window.removeEventListener('resize', this.checkScreenSize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener("resize", this.setLocalTopnavVar);
    
    this.stopGame();
  },
  
  methods: {
    // Navigation method
    goBack() {
      // If history exists → go back; otherwise go to games list route
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        this.$router.push('/game');
      }
    },
    
    // Game control methods
    startGame() {
      if (this.gameState === 'playing') return;
      
      // Reset game state
      this.gameState = 'playing';
      this.score = 0;
      this.fallingFoods = [];
      this.nextFoodId = 1;
      this.spawnTimer = 0;
      this.playerPosition = this.canvasWidth / 2 - 25; // Center the bowl
      
      // Set up difficulty-specific settings
      if (this.selectedDifficulty === 'hard') {
        this.timeRemaining = 60;
        this.startGameTimer();
      }
      
      // Start game loop
      this.gameLoop = setInterval(this.updateGame, 1000 / 60); // 60 FPS
    },
    
    resetGame() {
      // Stop current game
      this.stopGame();
      
      // Reset to idle state
      this.gameState = 'idle';
      this.score = 0;
      this.fallingFoods = [];
      this.nextFoodId = 1;
      this.spawnTimer = 0;
      this.timeRemaining = 60;
      this.playerPosition = this.canvasWidth / 2 - 25; // Center the bowl
    },
    
    stopGame() {
      if (this.gameLoop) {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
      }
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }
    },
    
    startGameTimer() {
      this.gameTimer = setInterval(() => {
        this.timeRemaining--;
        if (this.timeRemaining <= 0) {
          this.endGame('lost');
        }
      }, 1000);
    },
    
    endGame(result) {
      this.stopGame();
      this.gameState = result;
      
      if (result === 'won') {
        this.showGameCompleteMessage = true;
        this.gameCompleteMessage = '🎉 Congratulations! You reached 20 points! 🎉';
        this.triggerConfetti();
        setTimeout(() => {
          this.showGameCompleteMessage = false;
        }, 3000);
      }
    },
    
    // Game update loop
    updateGame() {
      this.updatePlayer();
      this.updateFallingFoods();
      this.spawnFoods();
      this.checkCollisions();
      this.checkWinCondition();
    },
    
    updatePlayer() {
      // Move player based on key states
      if ((this.keys.left || this.keys.a) && this.playerPosition > 0) {
        this.playerPosition -= this.playerSpeed;
      }
      if ((this.keys.right || this.keys.d) && this.playerPosition < this.canvasWidth - 50) {
        this.playerPosition += this.playerSpeed;
      }
    },
    
    updateFallingFoods() {
      const settings = this.currentDifficultySettings;
      
      // Update food positions
      for (let i = this.fallingFoods.length - 1; i >= 0; i--) {
        const food = this.fallingFoods[i];
        food.y += settings.fallSpeed;
        
        // Remove foods that have fallen off screen
        if (food.y > this.canvasHeight) {
          this.fallingFoods.splice(i, 1);
        }
      }
    },
    
    spawnFoods() {
      const settings = this.currentDifficultySettings;
      this.spawnTimer++;
      
      if (this.spawnTimer >= settings.spawnRate) {
        this.spawnTimer = 0;
        this.createRandomFood();
      }
    },
    
    createRandomFood() {
      const settings = this.currentDifficultySettings;
      const rand = Math.random();
      let foodType = '';
      let cumulativeProbability = 0;
      
      // Select food type based on probabilities
      for (const [type, probability] of Object.entries(settings.probabilities)) {
        cumulativeProbability += probability;
        if (rand <= cumulativeProbability) {
          foodType = type;
          break;
        }
      }
      
      if (!foodType) foodType = 'fruits'; // fallback
      
      const typeData = this.foodTypes[foodType];
      const emoji = typeData.emojis[Math.floor(Math.random() * typeData.emojis.length)];
      
      const food = {
        id: this.nextFoodId++,
        x: Math.random() * (this.canvasWidth - 40),
        y: -40,
        emoji: emoji,
        score: typeData.score,
        size: 30 + Math.random() * 10 // Random size between 30-40px
      };
      
      this.fallingFoods.push(food);
    },
    
    checkCollisions() {
      const bowlLeft = this.playerPosition;
      const bowlRight = this.playerPosition + 50;
      const bowlTop = this.canvasHeight - 80;
      const bowlBottom = this.canvasHeight - 30;
      
      for (let i = this.fallingFoods.length - 1; i >= 0; i--) {
        const food = this.fallingFoods[i];
        const foodLeft = food.x;
        const foodRight = food.x + food.size;
        const foodTop = food.y;
        const foodBottom = food.y + food.size;
        
        // Check if food intersects with bowl
        if (foodRight >= bowlLeft && foodLeft <= bowlRight &&
            foodBottom >= bowlTop && foodTop <= bowlBottom) {
          
          // Collision detected!
          this.score += food.score;
          this.fallingFoods.splice(i, 1);
          
          // Visual feedback for score change
          this.showScoreChange(food.score);
        }
      }
    },
    
    showScoreChange(scoreChange) {
      // This could be enhanced with visual effects
      console.log(`Score changed by: ${scoreChange}`);
    },
    
    checkWinCondition() {
      if (this.score >= 20) {
        this.endGame('won');
      }
    },
    
    // Input handling
    handleKeyDown(event) {
      if (this.gameState !== 'playing') return;
      
      switch (event.key.toLowerCase()) {
        case 'a':
          this.keys.a = true;
          break;
        case 'd':
          this.keys.d = true;
          break;
        case 'arrowleft':
          this.keys.left = true;
          break;
        case 'arrowright':
          this.keys.right = true;
          break;
      }
    },
    
    handleKeyUp(event) {
      switch (event.key.toLowerCase()) {
        case 'a':
          this.keys.a = false;
          break;
        case 'd':
          this.keys.d = false;
          break;
        case 'arrowleft':
          this.keys.left = false;
          break;
        case 'arrowright':
          this.keys.right = false;
          break;
      }
    },
    
    // Utility methods
    checkScreenSize() {
      this.isNarrow = window.matchMedia('(max-width: 980px)').matches;
      if (!this.isNarrow) {
        this.tipsOpen = false;
      }
    },
    
    setLocalTopnavVar() {
      const nav = document.querySelector('header.nav');
      const h = nav?.offsetHeight || 66;
      const el = this.$refs.pageRoot || document.documentElement;
      
      el.style.setProperty('--topnav-h', `${h}px`);
      
      if (window.CSS?.supports?.('top: env(safe-area-inset-top)')) {
        el.style.setProperty('--topnav-h-safe', `calc(${h}px + env(safe-area-inset-top))`);
      }
    },
    
    triggerConfetti() {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
};
</script>

<style scoped>
/* Root styles */
.catcher-game {
  font-family: 'Merriweather', serif;
  min-height: 100vh;
  background: url('/assets/catcherback1.png') center/cover no-repeat, linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #333;
  position: relative;
}

.catcher-game::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/assets/catcherback1.png') center/cover no-repeat;
  filter: blur(2px);
  z-index: -2;
}

.catcher-game::after {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: -1;
}

/* Topbar styles */
.catcher-topbar {
  position: relative;
  z-index: 10;
  padding: 15px 20px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px 16px;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Navigation styles */
.top-nav {
  text-align: center;
  padding: 20px;
  margin-bottom: 20px;
}

.top-nav h1 {
  color: white;
  font-size: 2.5rem;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
}

/* Main game container */
.game-container {
  display: grid;
  grid-template-columns: 280px 1fr 280px;
  gap: 20px;
  padding: 0 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* Left panel styles */
.left-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  height: fit-content;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.control-section {
  margin-bottom: 20px;
}

.control-section h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.difficulty-selector {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-family: 'Merriweather', serif;
  font-size: 1rem;
  background: white;
  transition: all 0.3s ease;
}

.difficulty-selector:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.difficulty-selector:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.start-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
}

.start-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
}

.start-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.reset-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(45deg, #f44336, #d32f2f);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
  margin-top: 10px;
}

.reset-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
}

.reset-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.rules-section {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.rules-section h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.rules-content p {
  margin: 8px 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

.rules-content ul {
  margin: 10px 0;
  padding-left: 20px;
}

.rules-content li {
  margin: 5px 0;
  font-size: 0.9rem;
}

/* Game area styles */
.game-area {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  min-height: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px 20px;
  background: rgba(103, 126, 234, 0.1);
  border-radius: 10px;
}

.score-display, .time-display {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.game-canvas {
  position: relative;
  width: 100%;
  height: 400px;
  border: 3px solid #333;
  border-radius: 10px;
  overflow: hidden;
}

.game-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('/assets/catcherback.png') center/cover no-repeat, linear-gradient(to bottom, #87CEEB, #98FB98);
  filter: blur(1px);
  z-index: 1;
}

.game-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.player-bowl {
  position: absolute;
  bottom: 30px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.1s ease;
  z-index: 15;
}

.bowl-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.falling-food {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: top 0.05s linear;
}

.game-message {
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-top: 20px;
  padding: 15px;
  border-radius: 10px;
}

.game-message.success {
  background: rgba(76, 175, 80, 0.2);
  color: #2e7d32;
  border: 2px solid #4CAF50;
}

.game-message.failure {
  background: rgba(244, 67, 54, 0.2);
  color: #c62828;
  border: 2px solid #f44336;
}

/* Right panel styles */
.right-panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 15px;
  padding: 20px;
  height: fit-content;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.right-panel h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3rem;
  text-align: center;
}

.food-category {
  margin-bottom: 25px;
}

.food-category h4 {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 1.1rem;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
}

.food-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 8px;
}

.food-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.food-details {
  flex: 1;
}

.food-details strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.food-details p {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  line-height: 1.3;
  color: #666;
}

.score-value {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
  background: #4CAF50;
  color: white;
}

.score-value.negative {
  background: #f44336;
}

/* Game complete overlay */
.overlay-blur {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  z-index: 1000;
}

.game-complete-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 30px 40px;
  border-radius: 20px;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  z-index: 1001;
  color: #333;
}

/* Mobile styles */
.tips-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 998;
  transition: transform 0.3s ease;
}

.tips-fab:hover {
  transform: scale(1.1);
}

.tips-drawer {
  position: fixed;
  top: var(--topnav-h-safe, var(--topnav-h, 66px));
  right: 0;
  bottom: 0;
  width: min(88vw, 360px);
  background: rgba(255, 255, 255, 0.98);
  border-left: 1px solid rgba(0, 0, 0, 0.1);
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 999;
  overflow-y: auto;
}

.tips-drawer.open {
  transform: translateX(0);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(103, 126, 234, 0.1);
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #333;
}

.drawer-content {
  padding: 20px;
}

.food-info.mobile .food-item {
  margin-bottom: 12px;
  padding: 8px;
}

.food-info.mobile .food-details p {
  font-size: 0.8rem;
}

.drawer-mask {
  position: fixed;
  top: var(--topnav-h-safe, var(--topnav-h, 66px));
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.drawer-mask.show {
  opacity: 1;
  visibility: visible;
}

/* Responsive design */
@media (max-width: 980px) {
  .game-container {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 0 15px;
  }
  
  .right-panel {
    display: none; /* Hidden on mobile, accessible via drawer */
  }
  
  .left-panel {
    order: 2;
  }
  
  .game-area {
    order: 1;
  }
  
  .tips-drawer {
    display: block;
  }
  
  /* Ensure background images scale properly on mobile */
  .catcher-game {
    background-size: cover;
    background-attachment: fixed;
  }
  
  .game-background {
    background-size: cover;
  }
}

@media (max-width: 640px) {
  .top-nav h1 {
    font-size: 2rem;
  }
  
  .game-canvas {
    height: 300px;
  }
  
  .game-info {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .player-bowl {
    width: 40px;
    height: 40px;
  }
  
  .falling-food {
    width: 35px;
    height: 35px;
  }
}
</style>
