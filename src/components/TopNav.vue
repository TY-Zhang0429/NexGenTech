<template>
  <header class="nav">
    <div class="nav__left">
      <img class="logo" src="@/assets/logo.png" alt="Logo" />
      <span class="brand-name">NexGen</span>
    </div>

    <nav class="nav__right">
      <RouterLink to="/" class="link">Home</RouterLink>
      <RouterLink to="/game" class="link">Discover Games</RouterLink>
      <RouterLink to="/food-swap" class="link">Food Lab</RouterLink>
    </nav>
  </header>
</template>

<script setup>
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 20px;
  opacity: 0.97;
  background: #D0E3D4;
  backdrop-filter: saturate(1.1) blur(8px);
  box-shadow: 0 6px 24px 0 rgba(40, 40, 40, 0.18), 0 1.5px 0 rgba(0,0,0,0.08);
}

.nav__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 50px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,.25));
}

.brand-name {
  color: #2A4D3E;
  font-family: 'Merriweather', serif;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav__right {
  display: flex;
  gap: clamp(14px, 4vw, 26px);
}

@media (max-width: 480px) {
  .nav {
    padding: 6px 12px;
  }
  
  .logo {
    width: 50px;
  }
  
  .nav__right {
    gap: 12px;
  }
  
  .link {
    font-size: 0.9rem;
  }
}

.link {
  color: #2A4D3E;
  text-decoration: none;
  font-weight: 600;
  font-family: 'Merriweather', serif;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  position: relative;
}

.link:hover {
  color: rgba(255,255,255,1);
}

.link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -6px;
  height: 2px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .22s var(--ease);
}

.link:hover::after {
  transform: scaleX(1);
}
</style>
