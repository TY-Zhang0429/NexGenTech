<template>
  <div class="app">
    <div class="video-background" v-if="$route.name === 'home'">
      <video autoplay muted loop playsinline>
        <source src="@/assets/back.mp4" type="video/mp4">
      </video>
    </div>
    <TopNav />
    <router-view />
  </div>
</template>

<script setup>
import TopNav from '@/components/TopNav.vue'
</script>

<style>
:root{
  --border:#1e1e1e33;
}
*{ box-sizing:border-box }
html,body,#app,.app{ 
  height:100%;
  position: relative;
}
body{ 
  margin:0; 
  font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
}

.video-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -1;
  overflow: hidden;
}

.video-background video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 可选：添加遮罩层让视频更柔和 */
.video-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(1px);
}
</style>

