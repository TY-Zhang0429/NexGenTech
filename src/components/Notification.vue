<template>
  <transition name="fade">
    <div v-if="open" :class="['toast', klass]" role="status" aria-live="assertive">
      {{ message }}
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'
const open = ref(false), message = ref(''), klass = ref('toast--info')
function show (msg, variant = 'info', duration = 4000) {
  message.value = msg
  klass.value = variant === 'error' ? 'toast--error' : 'toast--info'
  open.value = true
  clearTimeout(window.__toastTimer)
  window.__toastTimer = setTimeout(() => (open.value = false), duration)
}
defineExpose({ show })
</script>

<style scoped>
.toast{position:fixed;right:16px;top:16px;z-index:50;min-width:260px;border-radius:12px;padding:12px 14px;color:#fff;box-shadow:var(--shadow)}
.toast--error{background:#ef4444}
.toast--info{background:var(--blue)}
</style>
