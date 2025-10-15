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

      <div class="footer-section sources-section">
        <h3 class="footer-title">Source</h3>
        <ul class="footer-list">
          <li>
            <a href="https://www.eatforhealth.gov.au/sites/default/files/2022-09/n55_australian_dietary_guidelines.pdf" target="_blank">Health tips: Australian Dietary Guidelines</a>
          </li>
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
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 20px;
  padding-left: 150px;
  display: grid;
  grid-template-columns: 1.2fr 1fr 1.2fr 1fr;
  gap: 20px;
  justify-items: start;
}

.footer-section {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.nexgen-section,
.features-section,
.sources-section,
.support-section {
  justify-self: unset;
}

.footer-title {
  color: #E9967A;
  font-size: 1.25rem;
  margin-bottom: 1.2rem;
  font-weight: bold;
  text-align: left;
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