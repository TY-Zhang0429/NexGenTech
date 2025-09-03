<template>
  <section class="smoke">
    <h1>Wordly Smoke Test</h1>
    <p class="ok">✅ 页面已挂载（Vue 3 组件正常）</p>

    <div class="card">
      <button @click="check" :disabled="loading">
        {{ loading ? 'Checking…' : 'Check API' }}
      </button>
      <div v-if="err" class="err">❌ {{ err }}</div>
      <ul v-if="!err && checked">
        <li>health.ok: <strong>{{ healthOk }}</strong></li>
        <li>words count: <strong>{{ wordsCount }}</strong></li>
        <li>sample word: <code>{{ sample }}</code></li>
      </ul>
      <small>API_BASE: <code>{{ API_BASE || '(same origin)' }}</code></small>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

// 如果生产已配置 CloudFront 代理，保持空字符串即可。
// 如果你想直接打 Render，改成：'https://nexgentech-api.onrender.com'
const API_BASE = '';

const loading = ref(false);
const checked = ref(false);
const err = ref('');
const healthOk = ref(false);
const wordsCount = ref(0);
const sample = ref('');

async function check() {
  loading.value = true; err.value = ''; checked.value = false;
  try {
    const h = await fetch(`${API_BASE}/api/health`).then(r => r.json());
    healthOk.value = !!h?.ok;

    const w = await fetch(`${API_BASE}/api/words`).then(r => r.json());
    wordsCount.value = Array.isArray(w) ? w.length : 0;
    sample.value = Array.isArray(w) && w[0] ? JSON.stringify(w[0]) : '';
    checked.value = true;
  } catch (e) {
    err.value = String(e?.message || e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.smoke { max-width: 720px; margin: 40px auto; padding: 0 16px; color: #e6e6eb; }
.ok { color: #10b981; }
.card { margin-top: 16px; background: #1b1c22; border: 1px solid #343644; border-radius: 10px; padding: 12px; }
.err { color: #fecaca; }
button { background: #4f46e5; color: #fff; border: 0; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
button[disabled] { opacity: .6; cursor: not-allowed; }
code { background: #0f1115; padding: 2px 6px; border-radius: 6px; }
</style>
