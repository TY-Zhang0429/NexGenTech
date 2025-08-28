<template>
  <footer class="site">
    <div class="container">© {{ year }} NexGenTech – UI prototype</div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
