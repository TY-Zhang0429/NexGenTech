<template>
  <main class="home">
    <!-- 顶部随机标题 -->
    <div class="title-banner" :class="{ visible: selectedTitle }">
      <span>{{ selectedTitle || 'Spin the wheel to pick: Try a game now! / Five boss / Create avatar' }}</span>
    </div>

    <section class="content">
      <!-- 左侧：指引图片和Avatar & Door -->
      <div class="left-section">
        <img class="guide-img" src="@/assets/guide.png" alt="guide" />
        <AvatarDoor ref="avatarDoorRef" />
      </div>

      <!-- 中央转盘区域 -->
      <div class="center-section">
        <WheelArea ref="wheelRef" :titles="titles" @spun="handleSpun" />
        <div class="btn-row">
          <button class="btn btn-primary" :disabled="!selectedTitle" @click="goBegin">Begin</button>
          <button class="btn btn-ghost" @click="doReset">Reset</button>
        </div>
      </div>

      <!-- 右侧头像预览 -->
      <aside class="side-box">
        <img class="avatar-preview" src="@/assets/avatar.png" alt="avatar preview" />
      </aside>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import WheelArea from '@/components/WheelArea.vue'
import AvatarDoor from '@/components/AvatarDoor.vue'

const router = useRouter()
const titles = ['Try a game now!','Five boss','Create avatar']
const selectedTitle = ref("")
const wheelRef = ref(null)
const avatarDoorRef = ref(null)

onMounted(() => { 
  selectedTitle.value = ''
  document.body.classList.add('home-bg')
})

onBeforeUnmount(() => {
  document.body.classList.remove('home-bg')
})

function handleSpun(pickedTitle){
  selectedTitle.value = pickedTitle
  if (avatarDoorRef.value?.runToDoor) avatarDoorRef.value.runToDoor()
}

function goBegin(){
  const map = {
    'Try a game now!': '/blank1',
    'Five boss': '/blank2',
    'Create avatar': '/blank3',
  }
  router.push(map[selectedTitle.value] || '/blank1')
}

function doReset(){
  selectedTitle.value = ''
  wheelRef.value?.reset?.()
  avatarDoorRef.value?.reset?.()
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(16px, 3vw, 24px);
}

.title-banner {
  width: min(640px, 92%);
  margin: 8px auto 10px;
  padding: 12px 16px;
  text-align: center;
  color: var(--text);
  transition: opacity .2s ease;
  opacity: .85;
  background: none;
  border: none;
  backdrop-filter: none;
}

.content {
  display: grid;
  grid-template-columns: minmax(300px, 1fr) minmax(400px, 480px) minmax(200px, 1fr);
  gap: clamp(18px, 3vw, 28px);
  align-items: start;
  margin-top: 6px;
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.guide-img {
  width: 120%;
  max-width: 460px;
  height: auto;
  margin: 0px 0 0px auto;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
  transition: transform 0.3s ease, filter 0.3s ease;
  cursor: pointer;
}

.guide-img:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 8px 24px rgba(0,0,0,0.3));
}

.center-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.side-box { 
  display: flex; 
  align-items: center; 
  justify-content: center;
}


.btn-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: -20px;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #1a472a, #2d5a40);
  color: white;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25);
  filter: brightness(1.1);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn {
  composes: btn from global;
}

.btn.btn-ghost {
  composes: btn-ghost from global;
}

.btn.btn-primary {
  composes: btn-primary from global;
}

.avatar-preview {
  width: 120px;
  height: auto;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
}


/* 修改 AvatarDoor 组件中的场景尺寸和布局 */
:deep(.scene) {
  width: 140%;
  height: clamp(180px, 32vh, 300px);
  margin-top: -30px;  /* 减小上边距 */
  position: relative;
  overflow: hidden;
  margin-left: -20%;
}

/* 调整人物和门的位置 */
:deep(.avatar) {
  left: -15% !important;
  bottom: 30px !important;  /* 提高位置 */
  transform-origin: bottom center;
}

:deep(.door) {
  right: 5% !important;
  bottom: 20px !important;  /* 提高位置 */
  transform-origin: bottom center;
}

/* 响应式布局 */
@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 0 16px;
  }
  
  .left-section {
    order: 2;
    align-items: center;
  }

  .guide-img {
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
  }
  
  .center-section {
    order: 1;
  }
  
  .side-box:last-child {
    order: 3;
  }

  :deep(.scene) {
    width: 100%;
    height: clamp(160px, 28vh, 260px);
    margin: 0 auto;
  }
  
  :deep(.avatar) {
    left: 0% !important;
    transform: scale(0.9);
  }
  
  :deep(.door) {
    right: 0% !important;
    transform: scale(0.9);
  }

  .title-banner {
    font-size: 0.9rem;
    padding: 10px;
    margin: 4px auto 8px;
  }
}

@media (max-width: 480px) {
  .guide-img {
    max-width: 280px;
  }

  :deep(.scene) {
    height: clamp(140px, 25vh, 220px);
  }

  .btn-row {
    margin-top: -10px;
  }

  .btn {
    padding: 8px 20px;
    font-size: 0.9rem;
  }

  .avatar-preview {
    width: 100px;
  }
}

.title-banner.visible .options {
  display: none;
}
</style>