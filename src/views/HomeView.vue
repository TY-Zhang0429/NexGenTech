<template>
  <main class="home">
    <!-- 顶部随机标题 -->
    <div class="title-banner" :class="{ visible: selectedTitle }">
      <span>{{ selectedTitle || 'Spin the wheel to pick: Try a game now! / Five boss / Create avatar' }}</span>
    </div>

    <section class="content">
      <!-- 左侧文案 -->
      <aside class="side-box">
        <div class="box-inner">Start: hover the wheel to reveal <b>spin</b></div>
      </aside>

      <!-- 中央转盘区域 -->
      <WheelArea ref="wheelRef" :titles="titles" @spun="handleSpun" />

      <!-- 右侧：用 avatar 图片替换 animation1 -->
      <aside class="side-box">
        <div class="box-inner img">
          <img src="@/assets/avatar.png" alt="avatar preview" />
        </div>
      </aside>
    </section>

    <!-- Begin + Reset -->
    <div class="btn-row">
      <button class="btn" :disabled="!selectedTitle" @click="goBegin">begin</button>
      <button class="btn secondary" @click="doReset">reset</button>
    </div>

    <!-- 上移后的 avatar & door 场景 -->
    <AvatarDoor ref="avatarDoorRef" />
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WheelArea from '@/components/WheelArea.vue'
import AvatarDoor from '@/components/AvatarDoor.vue'

const router = useRouter()
const titles = ['Try a game now!','Five boss','Create avatar']
const selectedTitle = ref("")
const wheelRef = ref(null)
const avatarDoorRef = ref(null)

onMounted(() => { selectedTitle.value = '' })

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
.home{ max-width:1160px; margin:0 auto; padding:18px 16px 36px; }
.title-banner{
  width:520px; margin:6px auto 8px; border:2px solid #111; padding:10px 14px; text-align:center;
  opacity:.55; transition:opacity .2s ease;
}
.title-banner.visible{ opacity:1; }

/* 更紧凑的三列布局，中央 440px 轮盘 */
.content{
  display:grid; grid-template-columns: 1fr 480px 1fr; align-items:center; gap:28px; margin-top:4px;
}
.side-box{ display:flex; align-items:center; justify-content:center; }
.box-inner{
  width:230px; min-height:200px; border:2px solid #111; display:flex; align-items:center; justify-content:center;
  text-align:center; padding:10px;
}
.box-inner.img{ padding:0; }
.box-inner.img img{ width:120px; height:auto; display:block; }

.btn-row{ display:flex; gap:12px; justify-content:center; margin-top:10px; }
.btn{
  border:2px solid #111; background:#fff; padding:10px 22px; font-size:16px; cursor:pointer;
}
.btn.secondary{ background:#f6f6f6; }
.btn:disabled{ opacity:.45; cursor:not-allowed; }

@media (max-width: 980px){
  .content{ grid-template-columns:1fr; gap:18px; }
  .box-inner{ width:100%; }
}
</style>

