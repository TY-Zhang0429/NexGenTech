<template>
  <form class="search" @submit.prevent="submit" role="search" aria-label="Search for your food">
    <input
      ref="inputEl"
      v-model="query"
      class="input"
      :placeholder="placeholder"
      :disabled="loading"
      @keydown.enter.prevent="submit"
    />
    <button class="btn" type="submit" :disabled="loading" aria-label="Search">
      <span class="sr-only">Search</span> 🔍
    </button>
    <div v-if="loading" class="spinner" aria-live="polite" aria-busy="true">Loading…</div>
  </form>
</template>

<script setup>
import { ref } from 'vue'
const props = defineProps({
  loading: Boolean,
  placeholder: { type: String, default: 'Search for your food' }
})
const emit = defineEmits(['search'])
const query = ref('')
const inputEl = ref(null)

function submit () {
  const v = query.value.trim()
  if (!v || props.loading) return
  emit('search', v)
}
function focusInput () {
  inputEl.value?.focus()
  query.value = ''
}
defineExpose({ focusInput })
</script>

<style scoped>
.search{display:flex;align-items:center;gap:8px;position:relative}
.input{flex:1;border:2px solid var(--indigo);border-radius:999px;padding:12px 16px;min-width:260px}
.input::placeholder{color:var(--gray-500)}
.btn{background:var(--indigo);color:#fff;border:0;border-radius:999px;padding:10px 14px;font-weight:800}
.spinner{position:absolute;right:90px;color:var(--gray-700);font-size:.9rem}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>
