<template>
  <div v-if="isVisible" 
       class="draggable-avatar" 
       ref="avatarElement"
       :style="{ left: position.x + 'px', top: position.y + 'px' }"
       @mousedown="startDrag"
       @touchstart="startDrag">
    <img :src="currentAvatarSrc" alt="Avatar" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { getAvatarImageByTypeAndLevel } from '@/utils/avatarUtils';

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

// according to sessionStorage avatarType and evolutionLevel dynamically calculate avatar image path
const currentAvatarSrc = computed(() => {
  // trigger reactive update
  storageWatcher.value;
  
  const avatarType = sessionStorage.getItem('avatarType');
  const evolutionLevel = parseInt(sessionStorage.getItem('avatarEvolutionLevel') || '1');
  
  return getAvatarImageByTypeAndLevel(avatarType, evolutionLevel);
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
  overflow: hidden;
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
}
</style>