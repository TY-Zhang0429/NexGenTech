<template>
  <div v-if="isVisible" 
       class="draggable-avatar" 
       ref="avatarElement"
       :style="{ left: position.x + 'px', top: position.y + 'px' }"
       @mousedown="startDrag"
       @touchstart="startDrag"
       @mouseenter="showTooltip"
       @mouseleave="hideTooltip">
    <img :src="currentAvatarSrc" alt="Avatar" />
    
    <!-- Avatar name tooltip -->
    <div v-if="showName" class="avatar-name-tooltip">
      {{ avatarDisplayName }}
    </div>
    
    <!-- Chat bubble with game progress -->
    <div v-if="showProgress" 
         class="progress-bubble" 
         :class="{ 'bubble-left': bubblePosition === 'left' }"
         :style="bubbleStyles">
      <div class="bubble-header">
        <span class="greeting">Hello! I'm {{ avatarDisplayName }}</span>
        <div class="level-badge">Level {{ currentLevel }}</div>
      </div>
      
      <div class="progress-section">
        <div class="progress-title">Game Progress</div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: gameProgress.progressPercentage + '%' }"></div>
          </div>
          <span class="progress-text">{{ gameProgress.completedCount }}/{{ gameProgress.totalGames }} completed</span>
        </div>
      </div>
      
      <!-- Completed games -->
      <div v-if="gameProgress.completed.length > 0" class="completed-games">
        <div class="section-title">✅ Completed Games:</div>
        <div class="game-list">
          <div v-for="game in formattedCompletedGames" :key="game" class="game-item completed">
            {{ game }}
          </div>
        </div>
      </div>
      
      <!-- Incomplete games -->
      <div v-if="gameProgress.incomplete.length > 0" class="incomplete-games">
        <div class="section-title">🎮 Available Games:</div>
        <div class="game-list">
          <div v-for="game in formattedIncompleteGames" :key="game" class="game-item incomplete">
            {{ game }}
          </div>
        </div>
      </div>
      
      <!-- Max level message -->
      <div v-if="currentLevel >= 4" class="max-level-message">
        🌟 Maximum level reached! Great job!
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { 
  getAvatarImageByTypeAndLevel, 
  getAvatarDisplayName, 
  getCurrentEvolutionLevel,
  getGameProgress,
  getFormattedGameNames
} from '@/utils/avatarUtils';

const props = defineProps({
  avatarSrc: {
    type: String,
    default: '/assets/avatara.png'
  }
});

// avatar state
const isVisible = ref(false);
const position = ref({ x: 80, y: window.innerHeight / 2 - 75 }); // left 80px, vertically centered
const avatarElement = ref(null);
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// tooltip state
const showName = ref(false);
const showProgress = ref(false);
let hoverTimer = null;

// according to sessionStorage avatarType and evolutionLevel dynamically calculate avatar image path
const currentAvatarSrc = computed(() => {
  // trigger reactive update
  storageWatcher.value;
  
  const avatarType = sessionStorage.getItem('avatarType');
  const evolutionLevel = parseInt(sessionStorage.getItem('avatarEvolutionLevel') || '1');
  
  return getAvatarImageByTypeAndLevel(avatarType, evolutionLevel);
});

// get current avatar display name
const avatarDisplayName = computed(() => {
  storageWatcher.value; // trigger reactive update
  const avatarType = sessionStorage.getItem('avatarType');
  return getAvatarDisplayName(avatarType);
});

// get current level
const currentLevel = computed(() => {
  storageWatcher.value; // trigger reactive update
  return getCurrentEvolutionLevel();
});

// get game progress
const gameProgress = computed(() => {
  storageWatcher.value; // trigger reactive update
  return getGameProgress();
});

// get formatted game names
const formattedCompletedGames = computed(() => {
  return getFormattedGameNames(gameProgress.value.completed);
});

const formattedIncompleteGames = computed(() => {
  return getFormattedGameNames(gameProgress.value.incomplete);
});

// bubble positioning logic
const bubblePosition = computed(() => {
  const screenWidth = window.innerWidth;
  const avatarRight = position.value.x + 170; // avatar width
  const bubbleWidth = 320;
  
  // If there's not enough space on the right, position on the left
  return (avatarRight + bubbleWidth + 20 > screenWidth) ? 'left' : 'right';
});

const bubbleStyles = computed(() => {
  if (bubblePosition.value === 'left') {
    return {
      left: '-340px', // position to the left
      right: 'auto'
    };
  } else {
    return {
      left: '180px', // position to the right
      right: 'auto'
    };
  }
});

// watch localStorage changes
const storageWatcher = ref(0);

// check sessionStorage status
onMounted(() => {
  // check if avatar is selected
  checkAvatarSelected();

  // load saved position from sessionStorage
  const savedPosition = sessionStorage.getItem('avatarPosition');
  if (savedPosition) {
    try {
      position.value = JSON.parse(savedPosition);
    } catch (e) {
      console.error('Error parsing saved avatar position:', e);
    }
  }

  // listen for custom avatar update events
  window.addEventListener('avatarStateChange', handleAvatarStateChange);
});

onUnmounted(() => {
  window.removeEventListener('avatarStateChange', handleAvatarStateChange);
});

// check if avatar is selected in sessionStorage
function checkAvatarSelected() {
  const selected = sessionStorage.getItem('avatarSelected') === 'true';
  isVisible.value = selected;
  // trigger avatar image update
  storageWatcher.value++;
}

// trigger avatar image update
function triggerAvatarUpdate() {
  storageWatcher.value++;
}

// handle custom avatar state change events
function handleAvatarStateChange(event) {
  if (event.detail.type === 'avatarSelected') {
    isVisible.value = event.detail.value === 'true';
  } else if (event.detail.type === 'avatarPosition' && event.detail.value) {
    try {
      position.value = JSON.parse(event.detail.value);
    } catch (e) {
      console.error('Error parsing updated avatar position:', e);
    }
  } else if (event.detail.type === 'avatarType' || event.detail.type === 'avatarEvolutionLevel') {
    // when avatar type or evolution level changes, trigger re-render
    storageWatcher.value++;
  } else if (event.detail.type === 'avatarReset') {
    // handle avatar reset
    isVisible.value = false;
    storageWatcher.value++;
  }
}

// dragging logic
const startDrag = (event) => {
  // only left mouse button or touch events can drag
  if (event.touches || (event.button === 0)) {
    isDragging = true;
    
    // hide tooltips when dragging starts
    hideTooltip();
    
    // prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // check if touch event or mouse event
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    dragOffset.x = clientX - position.value.x;
    dragOffset.y = clientY - position.value.y;
    
    // add event listeners for move and end
    if (event.touches) {
      document.addEventListener('touchmove', onDrag);
      document.addEventListener('touchend', stopDrag);
    } else {
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
    }
  }
};

// hover logic
const showTooltip = () => {
  if (isDragging) return;
  
  // show name immediately
  showName.value = true;
  
  // show progress bubble after a delay
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => {
    if (!isDragging) {
      showProgress.value = true;
    }
  }, 500); // 500ms delay for progress bubble
};

const hideTooltip = () => {
  clearTimeout(hoverTimer);
  showName.value = false;
  showProgress.value = false;
};

// dragging
const onDrag = (event) => {
  if (!isDragging) return;

  // prevent default behavior and stop propagation
  event.preventDefault();
  
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  
  position.value.x = clientX - dragOffset.x;
  position.value.y = clientY - dragOffset.y;

  // save position to sessionStorage
  sessionStorage.setItem('avatarPosition', JSON.stringify(position.value));
  
  // notify other components about position change
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarPosition', value: JSON.stringify(position.value) }
  }));
};

// stop dragging
const stopDrag = () => {
  if (!isDragging) return;
  
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDrag);
};

// expose methods to parent components
defineExpose({
  checkAvatarSelected,
  triggerAvatarUpdate
});
</script>

<style scoped>
.draggable-avatar {
  position: fixed;
  z-index: 1000;
  cursor: grab;
  width: 170px; 
  height: 200px; 
  overflow: visible;
  user-select: none;
  touch-action: none;
}

.draggable-avatar:active {
  cursor: grabbing;
}

.draggable-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  transition: all 0.3s ease;
  /* 默认状态的柔和光晕 */
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.3));
}

.draggable-avatar:hover img {
  transform: scale(1.05);
  /* Hover时增强的白色光晕效果，从图片中心向外发散 */
  filter: 
    drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))
    drop-shadow(0 0 25px rgba(255, 255, 255, 0.6))
    drop-shadow(0 0 35px rgba(255, 255, 255, 0.4))
    drop-shadow(0 0 45px rgba(255, 255, 255, 0.2));
}

/* Avatar name tooltip */
.avatar-name-tooltip {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #064e3b, #065f46);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  animation: fadeInUp 0.3s ease;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 4px 12px rgba(6, 78, 59, 0.4);
}

.avatar-name-tooltip::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-bottom: 6px solid #064e3b;
}

/* Progress bubble */
.progress-bubble {
  position: absolute;
  top: -20px;
  left: 180px;
  width: 320px;
  background: linear-gradient(135deg, rgba(245, 245, 220, 0.95), rgba(255, 248, 220, 0.95));
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(101, 67, 33, 0.25);
  border: 2px solid rgba(133, 77, 14, 0.3);
  animation: slideInRight 0.4s ease;
  font-size: 13px;
  color: #654321;
  z-index: 1001;
}

.progress-bubble::before {
  content: '';
  position: absolute;
  top: 50px;
  left: -12px;
  width: 0;
  height: 0;
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-right: 12px solid rgba(245, 245, 220, 0.95);
}

.progress-bubble.bubble-left::before {
  left: auto;
  right: -12px;
  border-right: none;
  border-left: 12px solid rgba(245, 245, 220, 0.95);
}

.bubble-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(101, 67, 33, 0.2);
}

.greeting {
  font-weight: 600;
  color: #064e3b;
  font-size: 14px;
}

.level-badge {
  background: linear-gradient(135deg, #064e3b, #065f46);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(6, 78, 59, 0.3);
}

.progress-section {
  margin-bottom: 12px;
}

.progress-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #654321;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(101, 67, 33, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #064e3b, #065f46);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px rgba(6, 78, 59, 0.4);
}

.progress-text {
  font-size: 11px;
  color: #654321;
  font-weight: 500;
  white-space: nowrap;
}

.section-title {
  font-weight: 600;
  margin-bottom: 6px;
  color: #654321;
  font-size: 12px;
}

.game-list {
  margin-bottom: 10px;
}

.game-item {
  padding: 4px 8px;
  margin-bottom: 3px;
  border-radius: 8px;
  font-size: 12px;
}

.game-item.completed {
  background: rgba(6, 78, 59, 0.15);
  color: #064e3b;
  border: 1px solid rgba(6, 78, 59, 0.3);
}

.game-item.incomplete {
  background: rgba(101, 67, 33, 0.15);
  color: #654321;
  border: 1px solid rgba(101, 67, 33, 0.3);
}

.max-level-message {
  background: linear-gradient(135deg, #064e3b, #065f46);
  color: white;
  padding: 8px 12px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
  margin-top: 8px;
  box-shadow: 0 4px 8px rgba(6, 78, 59, 0.3);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .progress-bubble {
    width: 280px;
  }
}
</style>