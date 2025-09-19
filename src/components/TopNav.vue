<template>
  <header class="nav">
    <div class="nav__left">
      <img class="logo" src="@/assets/logo.png" alt="Logo" />
      <span class="brand-name">NexGenTech</span>
    </div>

    <!-- 汉堡菜单按钮 -->
    <button class="menu-toggle" @click="toggleMenu" :aria-expanded="isMenuOpen">
      <span class="menu-icon" :class="{ 'open': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <!-- 导航菜单 -->
    <nav class="nav__right" :class="{ 'show': isMenuOpen }">
      <RouterLink to="/" class="link" @click="closeMenu">Home</RouterLink>
      <RouterLink to="/avatar" class="link" @click="closeMenu">Avatar</RouterLink>
      <RouterLink to="/game" class="link" @click="closeMenu">Discover Games</RouterLink>
      <RouterLink to="/calculator" class="link" @click="closeMenu">Nutrient Calculator</RouterLink>
      <RouterLink to="/food-swap" class="link" @click="closeMenu">Healthier Swaps</RouterLink>
      <RouterLink to="/support" class="link" @click="closeMenu">How it Works</RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
}

const closeMenu = () => {
  isMenuOpen.value = false
  document.body.style.overflow = ''
}
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 1000;
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

/* 菜单按钮样式 */
.menu-toggle {
  display: none;
  background: none;
  border: none;
  padding: 10px;
  cursor: pointer;
  z-index: 1001;
}

.menu-icon {
  width: 30px;
  height: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu-icon span {
  display: block;
  height: 3px;
  width: 100%;
  background-color: #2A4D3E;
  border-radius: 3px;
  transition: all 0.3s ease;
}

/* 菜单打开时的动画效果 */
.menu-icon.open span:first-child {
  transform: translateY(8.5px) rotate(45deg);
}

.menu-icon.open span:nth-child(2) {
  opacity: 0;
}

.menu-icon.open span:last-child {
  transform: translateY(-8.5px) rotate(-45deg);
}

@media (min-width: 1001px) {
  .nav {
    padding: 8px 20px;
  }

  .nav__right {
    gap: clamp(14px, 2vw, 26px);
  }

  .link {
    font-size: 1.1rem;
  }
}

@media (max-width: 1000px) {
  .nav {
    padding: 8px 15px;
  }

  .logo {
    width: 45px;
  }

  .brand-name {
    font-size: 1.5rem;
  }

  .menu-toggle {
    display: block;
  }

  .nav__right {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(208, 227, 212, 0.98);
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 60px 20px;
    backdrop-filter: blur(10px);
  }

  .nav__right.show {
    display: flex;
  }

  .link {
    font-size: 1.2rem;
    padding: 12px 20px;
    width: min(300px, 80%);
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
}

/* 额外的小屏幕优化 */
@media (max-width: 480px) {
  .nav {
    padding: 8px 12px;
  }

  .logo {
    width: 40px;
  }

  .brand-name {
    font-size: 1.3rem;
  }

  .link {
    font-size: 1.1rem;
    padding: 10px 16px;
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
