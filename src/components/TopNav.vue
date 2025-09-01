<template>
  <header class="nav">
    <div class="nav__left">
      <img class="logo" src="@/assets/logo.png" alt="Logo" />
    </div>

    <nav class="nav__right">
      <RouterLink to="/" class="link">Home</RouterLink>
      <RouterLink to="/game" class="link">Game List</RouterLink>
      <RouterLink to="/blank2" class="link">Avatar</RouterLink>
      <RouterLink to="/blank3" class="link">FAQ</RouterLink>
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
  opacity:0.97;
  background: linear-gradient(180deg, rgb(59, 65, 62), rgba(164, 181, 173, 1));
  backdrop-filter: saturate(1.1) blur(8px);
  box-shadow: 0 6px 24px 0 rgba(40, 40, 40, 0.18), 0 1.5px 0 rgba(0,0,0,0.08);
}


.logo {
  width: 100px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,.25));
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
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-weight: 600;
  font-family: 'Joti One', cursive;
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
