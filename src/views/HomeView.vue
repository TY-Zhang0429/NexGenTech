<template>
  <main class="home">
    <!-- 顶部随机标题 -->
    <div class="title-banner" :class="{ visible: selectedTitle }">
      <span>{{ selectedTitle || 'Spin the wheel to pick: Try a game now! / Five boss / Create avatar' }}</span>
    </div>

    <section class="content">
      <!-- 左侧：提示文字和Avatar & Door -->
      <div class="left-section">
        <div class="start-hint">Start: hover the wheel to reveal <b>spin</b></div>
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
        <div class="box-inner img">
          <img src="@/assets/avatar.png" alt="avatar preview" />
        </div>
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

.start-hint {
  color: var(--text);
  font-size: 1.05rem;
  opacity: 0.85;
  font-weight: 500;
  margin: 20px 0;
  text-align: center;
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

.box-inner.img { 
  padding: 10px;
  width: 100%;
  max-width: 280px;
  min-height: 180px;
  text-align: center;
  border-radius: var(--radius);
  box-shadow: var(--shadow-2);
  background: color-mix(in oklab, var(--panel), #fff 4%);
  border: 1px solid color-mix(in oklab, var(--panel), #fff 8%);
}

.box-inner.img img { 
  width: 120px;
  height: auto;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,.3));
}

.btn-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 14px;
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

/* 修改 AvatarDoor 组件中的场景尺寸和布局 */
:deep(.scene) {
  width: 140%;
  height: clamp(180px, 32vh, 300px);
  margin-top: 90px;
  position: relative;
  overflow: hidden;
  margin-left: -20%;
}

/* 调整人物和门的位置 */
:deep(.avatar) {
  left: -15% !important;
  bottom: 10px !important;
}

:deep(.door) {
  right: 5% !important;
  bottom: 0px !important;
}

/* 响应式布局 */
@media (max-width: 980px) {
  .content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .left-section {
    order: 2;
  }
  
  .start-hint {
    margin-top: 10px;
  }
  
  .center-section {
    order: 1;
  }
  
  .side-box:last-child {
    order: 3;
  }

  :deep(.scene) {
    height: clamp(160px, 28vh, 260px);
  }
  
  :deep(.avatar) {
    left: 8% !important;
  }
  
  :deep(.door) {
    right: 8% !important;
  }
}

.title-banner.visible .options {
  display: none;
}
</style>