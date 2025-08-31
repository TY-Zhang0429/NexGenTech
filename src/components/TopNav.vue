<template>
  <header class="nav">
    <div class="nav__left">
      <img class="logo" src="@/assets/logo.png" alt="Logo" />
    </div>

    <nav class="nav__right">
      <RouterLink to="/" class="link">Home</RouterLink>
      <RouterLink to="/blank1" class="link">Game List</RouterLink>
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
  opacity:0.9;
  background: linear-gradient(180deg, 
    rgba(29, 53, 43, 0.85), 
    rgba(21, 39, 32, 0.82)
  );
  border-bottom: 1px solid rgba(255,255,255,.08);
  backdrop-filter: saturate(1.1) blur(8px);
}


.logo {
  width: 60px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,.25));
}

.nav__right {
  display: flex;
  gap: 26px;
}

.link {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-weight: 600;
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
