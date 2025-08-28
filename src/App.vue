<template>
  <div class="app">
    <header class="site">
      <div class="inner container">
        <h1 class="brand">NexGenTech</h1>
        <Navbar/>
      </div>
    </header>

    <main class="container" style="min-height:60vh">
      <router-view/>
    </main>

    <Footer/>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
</script>

<style scoped>
.brand{margin:0;font-size:18px;font-weight:900;letter-spacing:.3px}
</style>
