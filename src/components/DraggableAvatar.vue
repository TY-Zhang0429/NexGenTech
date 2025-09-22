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

// according to localStorage avatarType and evolutionLevel dynamically calculate avatar image path
const currentAvatarSrc = computed(() => {
  // trigger reactive update
  storageWatcher.value;
  
  const avatarType = localStorage.getItem('avatarType');
  const evolutionLevel = parseInt(localStorage.getItem('avatarEvolutionLevel') || '1');
  
  switch (avatarType) {
    case 'avatara':
      // use different Sol avatars: 1=avatara, 2=avatara2, 3=avatara3
      if (evolutionLevel >= 3) {
        return '/assets/avatara3.png';
      } else if (evolutionLevel >= 2) {
        return '/assets/avatara2.png';
      } else {
        return '/assets/avatara.png';
      }
    case 'avatarb':
      return '/assets/avatarb.png';
    case 'avatarc':
      return '/assets/avatarc.png';
    default:
      return props.avatarSrc;
  }
});

// watch localStorage changes
const storageWatcher = ref(0);

// check localStorage status
onMounted(() => {
  // check if avatar is selected
  checkAvatarSelected();

  // load saved position from localStorage
  const savedPosition = localStorage.getItem('avatarPosition');
  if (savedPosition) {
    try {
      position.value = JSON.parse(savedPosition);
    } catch (e) {
      console.error('Error parsing saved avatar position:', e);
    }
  }

  // listen for storage events to keep in sync across pages
  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});

// check if avatar is selected in localStorage
function checkAvatarSelected() {
  const selected = localStorage.getItem('avatarSelected') === 'true';
  isVisible.value = selected;
  // trigger avatar image update
  storageWatcher.value++;
}

// trigger avatar image update
function triggerAvatarUpdate() {
  storageWatcher.value++;
}

// handle storage change events
function handleStorageChange(event) {
  if (event.key === 'avatarSelected') {
    isVisible.value = event.newValue === 'true';
  } else if (event.key === 'avatarPosition' && event.newValue) {
    try {
      position.value = JSON.parse(event.newValue);
    } catch (e) {
      console.error('Error parsing updated avatar position:', e);
    }
  } else if (event.key === 'avatarType' || event.key === 'avatarEvolutionLevel') {
    // when avatar type or evolution level changes, trigger re-render
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

  // save position to localStorage
  localStorage.setItem('avatarPosition', JSON.stringify(position.value));
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
  height: 170px; 
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