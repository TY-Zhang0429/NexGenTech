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
  padding: 8px 20px; /* 减小上下内边距 */
  background: linear-gradient(180deg, #0e1a2e, #0c1526);
  border-bottom: 1px solid rgba(255,255,255,.06);
  backdrop-filter: saturate(1.1) blur(8px);
}
.logo { 
  width: 60px; /* 稍微缩小 logo */
  height: auto; 
  object-fit: contain;
  filter: drop-shadow(0 4px 14px rgba(0,0,0,.25));
}
.nav__right{ display:flex; gap:26px; }
.link{
  color: var(--text); text-decoration:none; font-weight:600; opacity:.9; position:relative;
}
.link:hover{ opacity:1; }
.link::after{
  content:""; position:absolute; left:0; right:0; bottom:-6px; height:2px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  transform:scaleX(0); transform-origin:left; transition:transform .22s var(--ease);
}
.link:hover::after{ transform:scaleX(1); }
</style>
