<template>
  <div class="app">
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
html,body,#app,.app{ height:100%; }
body{ margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial; }
</style>

