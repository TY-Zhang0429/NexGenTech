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
.nav{
  position:sticky; top:0; z-index:20;
  display:flex; align-items:center; justify-content:space-between;
  padding:12px 20px; border-bottom:1px solid var(--border);
  background:#fff;
}
.logo{ width:84px; height:auto; object-fit:contain; border:1px solid var(--border); padding:6px; }
.nav__right{ display:flex; gap:28px; }
.link{
  text-decoration:none; color:#111; font-weight:500; position:relative;
}
.link:hover{ font-weight:700; }
.link::after{
  content:""; position:absolute; left:0; right:0; bottom:-6px; height:2px;
  background:#111; transform:scaleX(0); transform-origin:left; transition:transform .2s ease;
}
.link:hover::after{ transform:scaleX(1); }
</style>
