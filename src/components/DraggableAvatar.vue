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

// 头像状态和位置
const isVisible = ref(false);
const position = ref({ x: 20, y: window.innerHeight - 120 }); // 左下角初始位置
const avatarElement = ref(null);
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// 根据localStorage中的avatarType动态计算头像图片路径
const currentAvatarSrc = computed(() => {
  // 触发响应式更新
  storageWatcher.value;
  
  const avatarType = localStorage.getItem('avatarType');
  switch (avatarType) {
    case 'avatara':
      return '/assets/avatara.png';
    case 'avatarb':
      return '/assets/avatarb.png';
    case 'avatarc':
      return '/assets/avatarc.png';
    default:
      return props.avatarSrc;
  }
});

// 监听localStorage变化的响应式变量
const storageWatcher = ref(0);

// 检查localStorage中的状态
onMounted(() => {
  // 检查是否已选择头像
  checkAvatarSelected();
  
  // 从localStorage加载保存的位置
  const savedPosition = localStorage.getItem('avatarPosition');
  if (savedPosition) {
    try {
      position.value = JSON.parse(savedPosition);
    } catch (e) {
      console.error('Error parsing saved avatar position:', e);
    }
  }
  
  // 监听存储事件，以便在不同页面间保持同步
  window.addEventListener('storage', handleStorageChange);
});

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange);
});

// 检查是否已选择头像
function checkAvatarSelected() {
  const selected = localStorage.getItem('avatarSelected') === 'true';
  isVisible.value = selected;
  // 触发头像图片更新
  storageWatcher.value++;
}

// 处理storage变化事件
function handleStorageChange(event) {
  if (event.key === 'avatarSelected') {
    isVisible.value = event.newValue === 'true';
  } else if (event.key === 'avatarPosition' && event.newValue) {
    try {
      position.value = JSON.parse(event.newValue);
    } catch (e) {
      console.error('Error parsing updated avatar position:', e);
    }
  } else if (event.key === 'avatarType') {
    // 当头像类型改变时，触发重新渲染
    storageWatcher.value++;
  }
}

// 开始拖动
const startDrag = (event) => {
  // 只有鼠标左键点击才能拖动
  if (event.touches || (event.button === 0)) {
    isDragging = true;
    
    // 阻止默认行为和事件冒泡
    event.preventDefault();
    event.stopPropagation();
    
    // 判断是鼠标事件还是触摸事件
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    dragOffset.x = clientX - position.value.x;
    dragOffset.y = clientY - position.value.y;
    
    // 添加移动和结束拖动的事件监听器
    if (event.touches) {
      document.addEventListener('touchmove', onDrag);
      document.addEventListener('touchend', stopDrag);
    } else {
      document.addEventListener('mousemove', onDrag);
      document.addEventListener('mouseup', stopDrag);
    }
  }
};

// 拖动中
const onDrag = (event) => {
  if (!isDragging) return;
  
  // 阻止默认行为和事件冒泡
  event.preventDefault();
  
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const clientY = event.touches ? event.touches[0].clientY : event.clientY;
  
  position.value.x = clientX - dragOffset.x;
  position.value.y = clientY - dragOffset.y;
  
  // 保存位置到localStorage
  localStorage.setItem('avatarPosition', JSON.stringify(position.value));
};

// 停止拖动
const stopDrag = () => {
  if (!isDragging) return;
  
  isDragging = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', onDrag);
  document.removeEventListener('touchend', stopDrag);
};

// 导出方法，使其可以被父组件调用
defineExpose({
  checkAvatarSelected
});
</script>

<style scoped>
.draggable-avatar {
  position: fixed;
  z-index: 1000;
  cursor: grab;
  width: 100px; /* 放大尺寸 */
  height: 100px; /* 放大尺寸 */
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