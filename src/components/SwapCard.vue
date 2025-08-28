<template>
  <article class="card">
    <header class="row">
      <div class="col left">
        <img :src="data?.images?.original || fallback" @error="onErr" alt="" />
        <div class="label dark">{{ data?.original }}</div>
      </div>

      <div class="divider" role="separator" aria-hidden="true"></div>

      <div class="col right">
        <img :src="data?.images?.alternative || fallback" @error="onErr" alt="" />
        <div class="label green">{{ data?.alternative }}</div>
      </div>
    </header>

    <footer class="foot">
      <div class="arrows">
        <button class="nav" :disabled="index===0" aria-label="Previous Swap" @click="$emit('prev')">‹ Prev</button>
        <button class="nav" :disabled="index===total-1" aria-label="Next Swap" @click="$emit('next')">Next ›</button>
      </div>
      <slot name="actions"></slot>
    </footer>
  </article>
</template>

<script setup>
const props = defineProps({
  data: { type: Object, default: null },
  index: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})
const fallback =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="100%" height="100%" fill="%23f3f4f6"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-family="Arial" font-size="12">No Image</text></svg>'
function onErr (e) { e.target.src = fallback }
</script>

<style scoped>
.card{background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);padding:16px}
.row{display:grid;grid-template-columns:1fr 1px 1fr;gap:12px;align-items:center}
.col{display:grid;justify-items:center;gap:8px}
.col img{width:160px;height:120px;object-fit:cover;border-radius:12px;background:#fff}
.label{font-weight:800}
.label.dark{color:var(--gray-700)}
.label.green{color:var(--green)}
.divider{width:1px;height:100%;background:var(--gray-100)}
.foot{display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:8px;flex-wrap:wrap}
.nav{background:transparent;border:2px solid var(--blue);color:var(--blue);padding:8px 12px;border-radius:12px;font-weight:700;cursor:pointer}
.nav:disabled{opacity:.5;cursor:not-allowed}
</style>
