<template>
  <div class="app">
    <div v-if="!authenticated" class="auth-overlay">
      <div class="auth-card">
        <h2 class="auth-title">Enter Password</h2>
        <input
          type="password"
          v-model="inputPassword"
          placeholder="Password"
          @keyup.enter="checkPassword"
          class="auth-input"
        />
        <label class="remember">
          <input type="checkbox" v-model="remember" />
          Remember me
        </label>
        <button class="auth-btn" @click="checkPassword">Unlock</button>
        <p v-if="errorMsg" class="auth-error">{{ errorMsg }}</p>
      </div>
    </div>

    <template v-else>
      <div class="video-background" v-if="$route.path === '/game'">
        <video autoplay muted loop playsinline>
          <source src="@/assets/back.mp4" type="video/mp4">
        </video>
      </div>
      <TopNav />
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import TopNav from '@/components/TopNav.vue'

// only for demo purpose
const HARDCODED_PASSWORD = 'nexgen123' // password

const inputPassword = ref('')
const authenticated = ref(false)
const errorMsg = ref('')
const remember = ref(true)

function checkPassword() {
  if (inputPassword.value === HARDCODED_PASSWORD) {
    authenticated.value = true
    errorMsg.value = ''
    remember.value
      ? localStorage.setItem('auth_ok', '1')
      : localStorage.removeItem('auth_ok')
  } else {
    errorMsg.value = 'Wrong password'
  }
}

onMounted(() => {
  if (localStorage.getItem('auth_ok') === '1') {
    authenticated.value = true
  }
})
</script>

<style>
:root {
  --border: #1e1e1e33;
}

* { box-sizing: border-box; }

html, body, #app, .app { 
  height: 100%;
  position: relative;
}

body { 
  margin: 0; 
  font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
}

/* ====== video background ====== */
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
.video-background::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.2);
  backdrop-filter: blur(1px);
}

/* ====== login overlay ====== */
.auth-overlay {
  position: fixed; inset: 0;
  display: grid; place-items: center;
  background: rgba(0,0,0,0.45);
  z-index: 9999;
}
.auth-card {
  width: 320px;
  background: #fff;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.2);
  text-align: center;
  color: #111; /* default as black text */
}
.auth-title {
  margin: 6px 0 8px;
  font-size: 18px;
  color: #111;
}
.auth-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 10px;
  outline: none;
  margin: 10px 0 8px;
  color: #111;
}
.auth-input::placeholder {
  color: #666;
}
.remember {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #555;
  margin-bottom: 10px;
  user-select: none;
}
.auth-btn {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: #4f46e5;
  color: #fff;
  cursor: pointer;
}
.auth-btn:hover { opacity: 0.95; }
.auth-error { color: #d32f2f; font-size: 13px; margin-top: 8px; }

/* ====== dark mode support ====== */
@media (prefers-color-scheme: dark) {
  .auth-card {
    background: #1e1e1e;
    color: #eee;
  }
  .auth-title {
    color: #fff;
  }
  .auth-input {
    background: #2a2a2a;
    border: 1px solid #444;
    color: #eee;
  }
  .auth-input::placeholder {
    color: #aaa;
  }
  .remember {
    color: #aaa;
  }
}

</style>
