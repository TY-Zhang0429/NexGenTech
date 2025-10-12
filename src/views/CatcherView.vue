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
    
    <!-- Top Navigation -->
    <div class="top-nav">
      <h1>Healthier Catcher</h1>
    </div>

    <!-- Main Game Container -->
    <div class="game-container">
      <!-- Left Panel: Game Controls -->
      <div class="left-panel">
        <!-- Back Button Section -->
        <div class="back-section">
          <button class="back-btn" @click="goBack">Back To Discover Games</button>
        </div>
        
        <div class="control-section">
          <h3>Game Difficulty</h3>
          <select v-model="selectedDifficulty" :disabled="gameState === 'playing'" class="difficulty-selector">
            <option value="easy">Easy</option>
            <option value="hard">Hard</option>
            <option value="test">Test (Auto Win)</option>
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
            <p><strong>Controls:</strong> Use A/D keys or arrow keys to move the bowl</p>
            <p><strong>Goal:</strong> Catch healthy foods, avoid unhealthy ones!</p>
            <p><strong>Difficulty:</strong> You can change difficulty even during gameplay</p>
            <p><strong>Scoring:</strong></p>
            <ul>
              <li> Fruits: +1 point</li>
              <li> Vegetables: +2 points</li>
              <li> Fried Foods: -1 point</li>
              <li> Desserts: -2 points</li>
            </ul>
            <p><strong>Win Condition:</strong> Reach 20 points to win!</p>
            <div v-if="selectedDifficulty === 'easy'">
              <p><strong>Easy Mode:</strong> No time limit, slower falling speed</p>
            </div>
            <div v-else-if="selectedDifficulty === 'hard'">
              <p><strong>Hard Mode:</strong> 60 seconds time limit, faster falling, more unhealthy foods</p>
            </div>
            <div v-else-if="selectedDifficulty === 'test'">
              <p><strong>Test Mode:</strong> Instant win for testing purposes</p>
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
            :class="{ 
              'bowl-glow': showBowlGlow, 
              'bowl-scale': showBowlScale 
            }"
            ref="playerBowl"
          >
            <img src="/assets/bowl.png" alt="Player Bowl" class="bowl-image" />
            <!-- Score Animation -->
            <div 
              v-if="showScoreAnimation" 
              class="score-animation"
              :class="{ 'positive': lastScoreChange > 0, 'negative': lastScoreChange < 0 }"
            >
              {{ lastScoreChange > 0 ? '+' + lastScoreChange : lastScoreChange }}
            </div>
          </div>

          <!-- Falling Foods -->
          <div 
            v-for="food in fallingFoods" 
            :key="food.id"
            class="falling-food"
            :style="{ 
              left: food.x + 'px', 
              top: food.y + 'px',
              width: food.size + 'px',
              height: food.size + 'px'
            }"
          >
            <img :src="`/assets/${food.image}`" :alt="food.image" class="food-image" />
          </div>
        </div>

        <!-- Game Status Messages -->
        <div v-if="gameState === 'idle'" class="game-message">
          Select difficulty and click "Start Game" to begin!
        </div>
        <div v-if="gameState === 'won'" class="game-message success">
           Congratulations! You reached 20 points! 
        </div>
        <div v-if="gameState === 'lost'" class="game-message failure">
           Game Over! {{ selectedDifficulty === 'hard' ? 'Time\'s up!' : 'Try again!' }}
        </div>
      </div>

      <!-- Right Panel: Food Education -->
      <div class="right-panel">
        <h3>Object Introduction</h3>
        
        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'healthy' }"
            @click="activeTab = 'healthy'"
          >
            Healthy Foods
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'unhealthy' }"
            @click="activeTab = 'unhealthy'"
          >
            Unhealthy Foods
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Healthy Foods Tab -->
          <div v-if="activeTab === 'healthy'" class="tab-panel">
            <!-- 1-Point Foods Page -->
            <div v-if="healthyFoodPage === 0" class="food-page">
              <h4 class="page-title">Fruits (+1 Point Each)</h4>
              <div class="food-grid">
                <div 
                  v-for="food in foodDisplayData.healthy.onePoint" 
                  :key="food.image"
                  class="food-card"
                >
                  <div class="food-image-container">
                    <img :src="`/assets/${food.image}`" :alt="food.name" class="food-image" />
                  </div>
                  <div class="food-name">{{ food.name }}</div>
                  <div class="food-desc">{{ food.description }}</div>
                  <span class="score-badge positive">+1</span>
                </div>
              </div>
            </div>
            
            <!-- 2-Point Foods Page -->
            <div v-if="healthyFoodPage === 1" class="food-page">
              <h4 class="page-title">Vegetables (+2 Points Each)</h4>
              <div class="food-grid">
                <div 
                  v-for="food in foodDisplayData.healthy.twoPoints" 
                  :key="food.image"
                  class="food-card"
                >
                  <div class="food-image-container">
                    <img :src="`/assets/${food.image}`" :alt="food.name" class="food-image" />
                  </div>
                  <div class="food-name">{{ food.name }}</div>
                  <div class="food-desc">{{ food.description }}</div>
                  <span class="score-badge positive">+2</span>
                </div>
              </div>
            </div>
            
            <!-- Pagination Controls for Healthy Foods -->
            <div class="pagination-controls">
              <button @click="prevHealthyPage" class="nav-btn" :disabled="healthyFoodPage === 0">
                <
              </button>
              <button @click="nextHealthyPage" class="nav-btn" :disabled="healthyFoodPage === 1">
                >
              </button>
            </div>
          </div>

          <!-- Unhealthy Foods Tab -->
          <div v-if="activeTab === 'unhealthy'" class="tab-panel">
            <!-- -1-Point Foods Page -->
            <div v-if="unhealthyFoodPage === 0" class="food-page">
              <h4 class="page-title">Fried Foods (-1 Point Each)</h4>
              <div class="food-grid">
                <div 
                  v-for="food in foodDisplayData.unhealthy.onePointLoss" 
                  :key="food.image"
                  class="food-card"
                >
                  <div class="food-image-container">
                    <img :src="`/assets/${food.image}`" :alt="food.name" class="food-image" />
                  </div>
                  <div class="food-name">{{ food.name }}</div>
                  <div class="food-desc">{{ food.description }}</div>
                  <span class="score-badge negative">-1</span>
                </div>
              </div>
            </div>
            
            <!-- -2-Point Foods Page -->
            <div v-if="unhealthyFoodPage === 1" class="food-page">
              <h4 class="page-title">Desserts (-2 Points Each)</h4>
              <div class="food-grid">
                <div 
                  v-for="food in foodDisplayData.unhealthy.twoPointsLoss" 
                  :key="food.image"
                  class="food-card"
                >
                  <div class="food-image-container">
                    <img :src="`/assets/${food.image}`" :alt="food.name" class="food-image" />
                  </div>
                  <div class="food-name">{{ food.name }}</div>
                  <div class="food-desc">{{ food.description }}</div>
                  <span class="score-badge negative">-2</span>
                </div>
              </div>
            </div>
            
            <!-- Pagination Controls for Unhealthy Foods -->
            <div class="pagination-controls">
              <button @click="prevUnhealthyPage" class="nav-btn" :disabled="unhealthyFoodPage === 0">
                <
              </button>
              <button @click="nextUnhealthyPage" class="nav-btn" :disabled="unhealthyFoodPage === 1">
                >
              </button>
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
                <span class="food-icon"></span>
                <div class="food-details">
                  <strong>Fruits (+1)</strong>
                  <p>Rich in vitamins and antioxidants</p>
                </div>
              </div>
              <div class="food-item">
                <span class="food-icon"></span>
                <div class="food-details">
                  <strong>Vegetables (+2)</strong>
                  <p>Packed with nutrients and fiber</p>
                </div>
              </div>
            </div>
          </div>
          <div class="food-category">
            <h4>Unhealthy Foods (-Points)</h4>
            <div class="food-items">
              <div class="food-item">
                <span class="food-icon"></span>
                <div class="food-details">
                  <strong>Fried Foods (-1)</strong>
                  <p>High in unhealthy fats</p>
                </div>
              </div>
              <div class="food-item">
                <span class="food-icon"></span>
                <div class="food-details">
                  <strong>Desserts (-2)</strong>
                  <p>High in sugar and calories</p>
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
          images: ['fruit1.png', 'fruit2.png', 'fruit3.png'],
          score: 1,
          probability: 0.3 // 30% chance in easy mode
        },
        vegetables: {
          images: ['veg1.png', 'veg2.png', 'veg3.png'],
          score: 2,
          probability: 0.3 // 30% chance in easy mode
        },
        friedFoods: {
          images: ['fried1.png', 'fried2.png', 'fried3.png'],
          score: -1,
          probability: 0.2 // 20% chance in easy mode
        },
        desserts: {
          images: ['dess1.png', 'dess2.png', 'dess3.png'],
          score: -2,
          probability: 0.2 // 20% chance in easy mode
        }
      },
      
      // Food display data with game assets
      foodDisplayData: {
        healthy: {
          onePoint: [
            { name: 'Fruit 1', image: 'fruit1.png', description: 'Nutritious and energizing fruit.' },
            { name: 'Fruit 2', image: 'fruit2.png', description: 'Sweet and vitamin-rich.' },
            { name: 'Fruit 3', image: 'fruit3.png', description: 'Fresh and healthy snack.' }
          ],
          twoPoints: [
            { name: 'Vegetable 1', image: 'veg1.png', description: 'Packed with essential nutrients.' },
            { name: 'Vegetable 2', image: 'veg2.png', description: 'High in vitamins and minerals.' },
            { name: 'Vegetable 3', image: 'veg3.png', description: 'Great for overall health.' }
          ]
        },
        unhealthy: {
          onePointLoss: [
            { name: 'Fried Food 1', image: 'fried1.png', description: 'High in unhealthy fats.' },
            { name: 'Fried Food 2', image: 'fried2.png', description: 'Deep fried and greasy.' },
            { name: 'Fried Food 3', image: 'fried3.png', description: 'Contains excess oil.' }
          ],
          twoPointsLoss: [
            { name: 'Dessert 1', image: 'dess1.png', description: 'High in sugar and calories.' },
            { name: 'Dessert 2', image: 'dess2.png', description: 'Sweet but unhealthy treat.' },
            { name: 'Dessert 3', image: 'dess3.png', description: 'Rich dessert with lots of sugar.' }
          ]
        }
      },
      
      // Mobile state
      isNarrow: false,
      tipsOpen: false,
      
      // Tab state for right panel
      activeTab: 'healthy',
      healthyFoodPage: 0, // 0 for 1-point foods, 1 for 2-point foods
      unhealthyFoodPage: 0, // 0 for -1-point foods, 1 for -2-point foods
      
      // Game complete state
      showGameCompleteMessage: false,
      gameCompleteMessage: '',
      
      // Key states
      keys: {
        left: false,
        right: false,
        a: false,
        d: false
      },
      
      // Visual effects
      showBowlGlow: false,
      showBowlScale: false,
      showScoreAnimation: false,
      lastScoreChange: 0
    };
  },
  
  watch: {
    // Allow difficulty changes during gameplay
    selectedDifficulty(newDifficulty, oldDifficulty) {
      if (this.gameState === 'playing' && newDifficulty !== oldDifficulty) {
        // Show difficulty change message
        this.showScoreChange(`Difficulty changed to ${newDifficulty.toUpperCase()}!`);
        
        // Handle test mode instant win
        if (newDifficulty === 'test') {
          this.score = 20;
          setTimeout(() => {
            this.endGame('won');
          }, 500);
          return;
        }
        
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
            friedFoods: 0.15,
            desserts: 0.15
          }
        };
      } else if (this.selectedDifficulty === 'test') {
        return {
          fallSpeed: 1,
          spawnRate: 999, // Very slow spawn rate for test mode
          timeLimit: null,
          probabilities: {
            fruits: 1.0, // Only spawn fruits for instant win
            vegetables: 0,
            friedFoods: 0,
            desserts: 0
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
            friedFoods: 0.25,
            desserts: 0.25
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
      // Always go to games page (wheel page)
      this.$router.push('/game');
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
      
      // Check for test mode - instant win
      if (this.selectedDifficulty === 'test') {
        // Set score to winning amount and end game immediately
        this.score = 20;
        setTimeout(() => {
          this.endGame('won');
        }, 500); // Small delay to show the score change
        return;
      }
      
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
        this.gameCompleteMessage = ' Congratulations! You reached 20 points! ';
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
      const imageName = typeData.images[Math.floor(Math.random() * typeData.images.length)];
      
      const food = {
        id: this.nextFoodId++,
        x: Math.random() * (this.canvasWidth - 60),
        y: -60,
        image: imageName,
        score: typeData.score,
        size: 50 + Math.random() * 15 // Random size between 50-65px
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
      this.lastScoreChange = scoreChange;
      this.showScoreAnimation = true;
      this.showBowlScale = true;
      
      // Show glow effect only for positive scores
      if (scoreChange > 0) {
        this.showBowlGlow = true;
        // Remove glow after animation
        setTimeout(() => {
          this.showBowlGlow = false;
        }, 800);
      }
      
      // Remove scale effect after short duration
      setTimeout(() => {
        this.showBowlScale = false;
      }, 300);
      
      // Remove score animation after it completes
      setTimeout(() => {
        this.showScoreAnimation = false;
      }, 800);
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
    
    // Pagination methods
    nextHealthyPage() {
      this.healthyFoodPage = (this.healthyFoodPage + 1) % 2;
    },
    
    prevHealthyPage() {
      this.healthyFoodPage = (this.healthyFoodPage - 1 + 2) % 2;
    },
    
    nextUnhealthyPage() {
      this.unhealthyFoodPage = (this.unhealthyFoodPage + 1) % 2;
    },
    
    prevUnhealthyPage() {
      this.unhealthyFoodPage = (this.unhealthyFoodPage - 1 + 2) % 2;
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

/* Navigation styles */
.top-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
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

.back-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.back-section .back-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #2d5016;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'Merriweather', serif;
  font-size: 1rem;
  font-weight: 600;
  color: #2d5016;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-section .back-btn:hover {
  background: #2d5016;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(45, 80, 22, 0.3);
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

/* Glow effect for positive scores */
.player-bowl.bowl-glow .bowl-image {
  animation: glowEffect 0.6s ease-out;
}

@keyframes glowEffect {
  0% {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 8px rgba(254, 250, 11, 0.6));
  }
  50% {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 30px rgba(255, 234, 0, 0.6));
  }
  100% {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 8px rgba(116, 105, 42, 0.6));
  }
}

/* Scale effect for both positive and negative scores */
.player-bowl.bowl-scale {
  animation: scaleEffect 0.3s ease-out;
}

@keyframes scaleEffect {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.bowl-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

/* Score animation */
.score-animation {
  position: absolute;
  top: -15px;
  left: -5px;
  font-size: 18px;
  font-weight: bold;
  pointer-events: none;
  z-index: 20;
  animation: scoreFloat 0.8s ease-out forwards;
}

.score-animation.positive {
  color: #ffffff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.score-animation.negative {
  color: #f44336;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

@keyframes scoreFloat {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-20px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(1);
  }
}

.falling-food {
  position: absolute;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: top 0.05s linear;
}

.food-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
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
  display: flex;
  flex-direction: column;
}

.right-panel h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.3rem;
  text-align: center;
}

/* Tab Navigation Styles */
.tab-navigation {
  display: flex;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: rgba(248, 249, 250, 0.9);
  border: none;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:first-child {
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.tab-btn:hover {
  background: rgba(103, 126, 234, 0.1);
  color: #333;
}

.tab-btn.active {
  background: #4CAF50;
  color: white;
  font-weight: bold;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.8);
}

/* Tab Content Styles */
.tab-content {
  flex: 1;
  max-height: 450px;
  overflow-y: auto;
  min-height: 300px;
}

.tab-panel {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* New food grid and card styles */
.food-page {
  min-height: 320px;
}

.page-title {
  margin: 0 0 20px 0;
  color: #555;
  font-size: 1.2rem;
  text-align: center;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.food-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.food-card {
  background: rgba(248, 249, 250, 0.9);
  border-radius: 12px;
  padding: 15px;
  text-align: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.food-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #4CAF50;
}

.food-image-container {
  width: 60px;
  height: 60px;
  margin: 0 auto 10px;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.food-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.food-name {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.food-desc {
  font-size: 0.8rem;
  color: #666;
  line-height: 1.3;
  margin-bottom: 10px;
}

.score-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: bold;
  position: absolute;
  top: 10px;
  right: 10px;
}

.score-badge.positive {
  background: #4CAF50;
  color: white;
}

.score-badge.negative {
  background: #f44336;
  color: white;
}

/* Pagination controls */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #eee;
}

.nav-btn {
  width: 40px;
  height: 40px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.nav-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
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
  background: #4CAF50;
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

/* Mobile Tab Navigation */
.tab-navigation.mobile {
  margin-bottom: 15px;
}

.tab-navigation.mobile .tab-btn {
  font-size: 0.85rem;
  padding: 10px 12px;
}

.mobile-tabs .food-item {
  margin-bottom: 12px;
  padding: 8px;
}

.mobile-tabs .food-details p {
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
@media (max-width: 768px) {
  .food-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .food-card {
    padding: 12px;
  }
  
  .food-image-container {
    width: 50px;
    height: 50px;
  }
  
  .pagination-controls {
    gap: 15px;
  }
  
  .nav-btn {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .food-grid {
    grid-template-columns: 1fr;
  }
}

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
  .top-nav {
    padding: 15px;
  }
  
  .top-nav .back-btn {
    left: 15px;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
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
    width: 45px;
    height: 45px;
  }
  
  .falling-food {
    width: 50px;
    height: 50px;
  }
}
</style>

