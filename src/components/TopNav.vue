<template>
  <header class="nav">
    <div class="nav__left">
      <img class="logo" src="@/assets/logo.png" alt="Logo" />
      <span class="brand-name">NexGenTech</span>
    </div>

    <!-- hamburger menu -->
    <button class="menu-toggle" @click="toggleMenu" :aria-expanded="isMenuOpen">
      <span class="menu-icon" :class="{ 'open': isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <!-- navigation menu -->
    <nav class="nav__right" :class="{ 'show': isMenuOpen }">
      <RouterLink to="/" class="link" @click="closeMenu">Home</RouterLink>
      <RouterLink to="/avatar" class="link" @click="closeMenu">Avatar</RouterLink>
      <div class="menu-group" @mouseenter="openGames(true)" @mouseleave="openGames(false)">
        <!-- parent item: clickable, goes to /game -->
        <RouterLink
          to="/game"
          class="link link-parent"
          @click="closeAllMenus"
          :aria-expanded="isGamesOpen"
        >
          Discover Games
          <span class="caret" :class="{ open: isGamesOpen }">▾</span>
        </RouterLink>

        <!-- submenu -->
        <div class="submenu" :class="{ show: isGamesOpen }">
          <RouterLink to="/wordle-game" class="sub-link" @click="closeAllMenus">
            Wordle Game
          </RouterLink>
          <RouterLink to="/match3" class="sub-link" @click="closeAllMenus">
            Match-3
          </RouterLink>
        </div>
      </div>
      <RouterLink to="/calculator" class="link" @click="closeMenu">Nutrient Calculator</RouterLink>
      <RouterLink to="/food-swap" class="link" @click="closeMenu">Healthier Swaps</RouterLink>
      <RouterLink to="/support" class="link" @click="closeMenu">How it Works</RouterLink>
    </nav>
  </header>
</template>

<script setup>
import { ref } from 'vue'

const isMenuOpen = ref(false)
const isGamesOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  document.body.style.overflow = isMenuOpen.value ? 'hidden' : ''
  if (!isMenuOpen.value) isGamesOpen.value = false
}

const closeMenu = () => {
  isMenuOpen.value = false
  document.body.style.overflow = ''
  isGamesOpen.value = false
}

// destop hover；mobile click
const openGames = (val) => {
  // only use hover
  if (window.matchMedia('(min-width: 1001px)').matches) {
    isGamesOpen.value = val
  }
}
const toggleGames = (e) => {
  // mobile folder click
  e?.preventDefault?.()
  isGamesOpen.value = !isGamesOpen.value
}

const closeAllMenus = () => {
  isGamesOpen.value = false
  closeMenu()
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

/* menu button styles */
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

/* menu open animation */
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

/* extra small screen styles */
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

/* parent container */
.menu-group {
  position: relative;
  display: flex;
  align-items: center;
}

/* make parent look like link */
.link-parent {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 0;
  cursor: pointer;
  /* reuse .link font and transition */
  color: #2A4D3E;
  font-weight: 600;
  font-family: 'Merriweather', serif;
  font-size: 1.2rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.link-parent:hover { color: rgba(255,255,255,1); }

.caret {
  display: inline-block;
  transition: transform .2s;
}
.caret.open { transform: rotate(180deg); }

/* dragdown */
.submenu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 180px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  padding: 8px;
  display: none;
  z-index: 1002;
}
.submenu.show { display: block; }

.sub-link {
  display: block;
  padding: 10px 12px;
  color: #2A4D3E;
  text-decoration: none;
  border-radius: 8px;
  transition: background .2s, transform .15s;
  font-weight: 600;
}
.sub-link:hover {
  background: rgba(208, 227, 212, 0.35);
  transform: translateY(-1px);
}

/* —— mobile vision —— */
@media (max-width: 1000px) {
  .menu-group {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  .link-parent {
    width: min(300px, 80%);
    margin: 0 auto;
    justify-content: center;
    padding: 12px 20px;
    border-radius: 8px;
    background: rgba(255,255,255,0.1);
  }
  .submenu {
    position: static;
    display: none;
    background: transparent;
    border: 0;
    box-shadow: none;
    padding: 8px 0 0;
    width: 100%;
  }
  .submenu.show { display: block; }
  .sub-link {
    width: min(300px, 80%);
    margin: 6px auto 0;
    text-align: center;
    background: rgba(255,255,255,0.08);
  }
  .sub-link:hover { background: rgba(255,255,255,0.18); }
}

</style>
