<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section nexgen-section">
        <h3 class="footer-title">NexGen</h3>
        <p class="footer-desc">Making healthy eating an adventure through gamification and smart learning</p>
      </div>

      <div class="footer-section features-section">
        <h3 class="footer-title">Features</h3>
        <ul class="footer-list">
          <li><router-link to="/avatar">Avatar System</router-link></li>
          <li><router-link to="/game">Discover Games</router-link></li>
          <li><router-link to="/calculator">Nutrient Calculator</router-link></li>
          <li><router-link to="/food-swap">Healthier Swaps</router-link></li>
        </ul>
      </div>

      <div class="footer-section support-section">
        <h3 class="footer-title">Support</h3>
        <ul class="footer-list">
          <li><router-link to="/support">How it Works</router-link></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{ currentYear }} NexGen. All rights reserved</p>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background-color: rgb(90, 57, 31);
  color: white;
  padding: 40px 0 20px;
  width: 100%;
  font-family: 'Merriweather', serif;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 40px;
  justify-items: center;
}

.footer-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.nexgen-section {
  justify-self: start;
  padding-right: 40px;
}

.features-section {
  justify-self: center;
}

.support-section {
  justify-self: end;
}

.footer-title {
  color: #E9967A;
  font-size: 1.25rem;
  margin-bottom: 1.2rem;
  font-weight: bold;
}

.footer-desc {
  color: #ffffff;
  line-height: 1.6;
  margin-bottom: 1rem;
  max-width: 300px;
}

.footer-list {
  list-style: none;
  padding: 0;
}

.footer-list li {
  margin-bottom: 0.8rem;
}

.footer-list a {
  color: #ffffff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-list a:hover {
  color: #E9967A;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  margin-top: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }

  .footer-section {
    align-items: center;
  }

  .nexgen-section, .features-section, .support-section {
    justify-self: center;
    padding-right: 0;
  }

  .footer-desc {
    margin: 0 auto;
  }
}
</style>