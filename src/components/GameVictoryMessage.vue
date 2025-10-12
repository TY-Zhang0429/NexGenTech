<template>
  <div v-if="isVisible" class="victory-overlay">
    <div class="overlay-blur"></div>
    <div class="victory-content">
      <!-- Avatar image display -->
      <div v-if="showAvatarImage" class="avatar-display" :class="{ 'evolution-glow': avatarEvolved }">
        <img :src="currentAvatarImage" alt="Avatar" class="avatar-image" :class="{ 'evolving': avatarEvolved }" />
        <div class="avatar-glow" :class="{ 'evolution-glow-ring': avatarEvolved }"></div>
        <div v-if="avatarEvolved" class="evolution-sparkles">
          <div class="sparkle" v-for="i in 8" :key="i" :style="{ animationDelay: (i * 0.2) + 's' }"></div>
        </div>
      </div>
      
      <!-- Victory text -->
      <div class="victory-text-section">
        <h2 class="victory-title">{{ gameTitle }}</h2>
        <p class="victory-message">{{ victoryMessage }}</p>
        
        <!-- Evolution text -->
        <div v-if="avatarEvolved" class="evolution-text">
          <p class="evolution-message">{{ evolutionMessage }}</p>
          <div class="level-badge">Level {{ newLevel }}</div>
        </div>
        
        <!-- Simple victory text -->
        <div v-else-if="showSimpleVictory" class="simple-victory-text">
          <p>{{ simpleVictoryMessage }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Props
const props = defineProps({
  gameType: {
    type: String,
    required: true,
    validator: value => ['wordle', 'match3', 'catcher'].includes(value)
  },
  customVictoryMessage: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 3000
  }
});

// Reactive data
const isVisible = ref(false);
const avatarEvolved = ref(false);
const newLevel = ref(1);
const showSimpleVictory = ref(false);
const showAvatarImage = ref(false);
const currentAvatarImage = ref('');

// Computed messages
const gameTitle = ref('');
const victoryMessage = ref('');
const evolutionMessage = ref('');
const simpleVictoryMessage = ref('');

// Game type configurations
const gameConfigs = {
  wordle: {
    title: 'Wordle Victory!',
    victoryMsg: 'Congratulations! You guessed the word correctly!',
    simpleMsg: 'Well done! You solved the puzzle!'
  },
  match3: {
    title: 'Match-3 Complete!',
    victoryMsg: 'Amazing! You completed all levels!',
    simpleMsg: 'Great job! All levels cleared!'
  },
  catcher: {
    title: 'Catcher Victory!',
    victoryMsg: 'Fantastic! You reached the target score!',
    simpleMsg: 'Excellent! Mission accomplished!'
  }
};

// Methods
const showVictory = () => {
  const config = gameConfigs[props.gameType];
  gameTitle.value = config.title;
  
  // Use custom message if provided, otherwise use default
  if (props.customVictoryMessage) {
    victoryMessage.value = props.customVictoryMessage;
  } else {
    victoryMessage.value = config.victoryMsg;
  }

  // Check avatar evolution
  const avatarType = sessionStorage.getItem('avatarType');
  if (avatarType === 'avatara') {
    const completedGames = JSON.parse(sessionStorage.getItem('completedGames') || '[]');
    
    if (!completedGames.includes(props.gameType)) {
      const currentLevel = parseInt(sessionStorage.getItem('avatarEvolutionLevel') || '1');
      if (currentLevel < 4) {
        // This game will trigger evolution
        const nextLevel = currentLevel + 1;
        newLevel.value = nextLevel;
        avatarEvolved.value = true;
        evolutionMessage.value = `Your avatar Sol has evolved to level ${nextLevel}!`;
        
        // Set avatar image for the new level
        showAvatarImage.value = true;
        currentAvatarImage.value = getAvatarImageByLevel(nextLevel);
        
        // Handle the actual evolution
        handleAvatarEvolution();
      } else {
        // Max level reached
        showSimpleVictory.value = true;
        simpleVictoryMessage.value = config.simpleMsg + ' (Avatar at max level)';
        
        // Show current max level avatar
        showAvatarImage.value = true;
        currentAvatarImage.value = getAvatarImageByLevel(4);
      }
    } else {
      // Game already completed
      showSimpleVictory.value = true;
      simpleVictoryMessage.value = config.simpleMsg + ' (Already completed)';
      
      // Show current avatar level
      const currentLevel = parseInt(sessionStorage.getItem('avatarEvolutionLevel') || '1');
      showAvatarImage.value = true;
      currentAvatarImage.value = getAvatarImageByLevel(currentLevel);
    }
  } else {
    // No Sol avatar or custom avatar
    showSimpleVictory.value = true;
    simpleVictoryMessage.value = config.simpleMsg;
    showAvatarImage.value = false;
  }

  // Show the victory message
  isVisible.value = true;

  // Auto hide after duration
  setTimeout(() => {
    hideVictory();
  }, props.duration);
};

const hideVictory = () => {
  isVisible.value = false;
  // Reset states
  avatarEvolved.value = false;
  showSimpleVictory.value = false;
  showAvatarImage.value = false;
  newLevel.value = 1;
  currentAvatarImage.value = '';
};

// Get avatar image path by level
const getAvatarImageByLevel = (level) => {
  switch (level) {
    case 1:
      return '/assets/avatara.png';
    case 2:
      return '/assets/avatara2.png';
    case 3:
      return '/assets/avatara3.png';
    case 4:
      return '/assets/avatara4.png';
    default:
      return '/assets/avatara.png';
  }
};

const handleAvatarEvolution = () => {
  const currentLevel = parseInt(sessionStorage.getItem('avatarEvolutionLevel') || '1');
  const nextLevel = currentLevel + 1;
  
  // Update evolution level
  sessionStorage.setItem('avatarEvolutionLevel', nextLevel.toString());
  
  // Mark game as completed
  const completedGames = JSON.parse(sessionStorage.getItem('completedGames') || '[]');
  completedGames.push(props.gameType);
  sessionStorage.setItem('completedGames', JSON.stringify(completedGames));
  
  // Notify other components about evolution
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarEvolutionLevel', value: nextLevel.toString() }
  }));
};

// Expose methods to parent
defineExpose({
  showVictory,
  hideVictory
});
</script>

<style scoped>
.victory-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay-blur {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

.victory-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  text-align: center;
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Avatar display section */
.avatar-display {
  position: relative;
  margin-bottom: 30px;
  animation: avatarAppear 0.8s ease-out 0.3s both;
}

@keyframes avatarAppear {
  from {
    opacity: 0;
    transform: scale(0.5) rotateY(180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotateY(0deg);
  }
}

.avatar-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  animation: avatarPulse 2s ease-in-out infinite;
  transition: all 0.5s ease;
}

.avatar-image.evolving {
  border: 6px solid rgba(255, 215, 0, 0.9);
  box-shadow: 
    0 0 40px rgba(255, 215, 0, 0.6),
    0 0 80px rgba(255, 215, 0, 0.4),
    0 0 120px rgba(255, 215, 0, 0.2);
  animation: evolutionRotateGlow 3s ease-in-out infinite;
}

@keyframes evolutionRotateGlow {
  0% {
    transform: scale(1) rotate(0deg);
    box-shadow: 
      0 0 40px rgba(255, 215, 0, 0.6),
      0 0 80px rgba(255, 215, 0, 0.4),
      0 0 120px rgba(255, 215, 0, 0.2);
  }
  25% {
    transform: scale(1.1) rotate(90deg);
    box-shadow: 
      0 0 60px rgba(255, 165, 0, 0.8),
      0 0 100px rgba(255, 165, 0, 0.6),
      0 0 140px rgba(255, 165, 0, 0.3);
  }
  50% {
    transform: scale(1.15) rotate(180deg);
    box-shadow: 
      0 0 80px rgba(255, 69, 0, 0.9),
      0 0 120px rgba(255, 69, 0, 0.7),
      0 0 160px rgba(255, 69, 0, 0.4);
  }
  75% {
    transform: scale(1.1) rotate(270deg);
    box-shadow: 
      0 0 60px rgba(255, 165, 0, 0.8),
      0 0 100px rgba(255, 165, 0, 0.6),
      0 0 140px rgba(255, 165, 0, 0.3);
  }
  100% {
    transform: scale(1) rotate(360deg);
    box-shadow: 
      0 0 40px rgba(255, 215, 0, 0.6),
      0 0 80px rgba(255, 215, 0, 0.4),
      0 0 120px rgba(255, 215, 0, 0.2);
  }
}

@keyframes avatarPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
  }
}

.avatar-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
  animation: glowPulse 2s ease-in-out infinite;
  pointer-events: none;
}

.avatar-glow.evolution-glow-ring {
  background: 
    radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 165, 0, 0.4) 30%, rgba(255, 69, 0, 0.2) 60%, transparent 80%);
  animation: evolutionGlowPulse 2s ease-in-out infinite;
}

@keyframes evolutionGlowPulse {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
    background: 
      radial-gradient(circle, rgba(255, 215, 0, 0.6) 0%, rgba(255, 165, 0, 0.4) 30%, rgba(255, 69, 0, 0.2) 60%, transparent 80%);
  }
  50% {
    opacity: 1;
    transform: scale(1.3);
    background: 
      radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, rgba(255, 165, 0, 0.6) 30%, rgba(255, 69, 0, 0.4) 60%, transparent 80%);
  }
}

@keyframes glowPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

/* Evolution sparkles effect */
.evolution-sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.sparkle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: radial-gradient(circle, #FFD700 0%, #FFA500 50%, transparent 70%);
  border-radius: 50%;
  animation: sparkleOrbit 4s linear infinite;
}

.sparkle:nth-child(1) { top: 0%; left: 50%; }
.sparkle:nth-child(2) { top: 15%; right: 15%; }
.sparkle:nth-child(3) { top: 50%; right: 0%; }
.sparkle:nth-child(4) { bottom: 15%; right: 15%; }
.sparkle:nth-child(5) { bottom: 0%; left: 50%; }
.sparkle:nth-child(6) { bottom: 15%; left: 15%; }
.sparkle:nth-child(7) { top: 50%; left: 0%; }
.sparkle:nth-child(8) { top: 15%; left: 15%; }

@keyframes sparkleOrbit {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  20% {
    transform: scale(1) rotate(72deg);
    opacity: 1;
  }
  80% {
    transform: scale(1) rotate(288deg);
    opacity: 1;
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}

/* Text section */
.victory-text-section {
  max-width: 600px;
  animation: textSlideIn 0.6s ease-out 0.5s both;
  font-family: 'Merriweather', serif;
}

@keyframes textSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.victory-title {
  font-size: 3rem;
  font-weight: bold;
  margin: 0 0 20px 0;
  text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  background: linear-gradient(45deg, #FFD700, #FFA500, #FF6B6B);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;
  font-family: 'Merriweather', serif;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.victory-message {
  font-size: 1.5rem;
  margin: 0 0 25px 0;
  line-height: 1.4;
  opacity: 0.95;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  font-family: 'Merriweather', serif;
}

/* Evolution text section */
.evolution-text {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  margin-top: 20px;
  border: 2px solid rgba(255, 215, 0, 0.5);
  animation: evolutionGlow 1s ease-in-out infinite alternate;
}

@keyframes evolutionGlow {
  from {
    border-color: rgba(255, 215, 0, 0.5);
    box-shadow: 0 0 20px rgba(255, 215, 0, 0.2);
  }
  to {
    border-color: rgba(255, 215, 0, 0.8);
    box-shadow: 0 0 30px rgba(255, 215, 0, 0.4);
  }
}

.evolution-message {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 15px 0;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  color: #FFD700;
  font-family: 'Merriweather', serif;
}

.level-badge {
  display: inline-block;
  background: linear-gradient(45deg, #FFD700, #FFA500);
  color: #000;
  padding: 10px 25px;
  border-radius: 25px;
  font-weight: bold;
  font-size: 1.2rem;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  animation: badgeBounce 0.6s ease-out;
  font-family: 'Merriweather', serif;
}

@keyframes badgeBounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Simple victory text */
.simple-victory-text {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  margin-top: 15px;
}

.simple-victory-text p {
  font-size: 1.3rem;
  margin: 0;
  opacity: 0.9;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
  font-family: 'Merriweather', serif;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .victory-content {
    padding: 20px;
    margin: 20px;
  }
  
  .avatar-image {
    width: 150px;
    height: 150px;
  }
  
  .victory-title {
    font-size: 2.5rem;
  }
  
  .victory-message {
    font-size: 1.3rem;
  }
  
  .evolution-message {
    font-size: 1.2rem;
  }
  
  .level-badge {
    font-size: 1.1rem;
    padding: 8px 20px;
  }
}

@media (max-width: 480px) {
  .avatar-image {
    width: 120px;
    height: 120px;
  }
  
  .victory-title {
    font-size: 2rem;
  }
  
  .victory-message {
    font-size: 1.1rem;
  }
}
</style>