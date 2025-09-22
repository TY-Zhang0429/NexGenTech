<template>

  <div class="home">
    <video autoplay loop muted playsinline class="background-video">
      <source src="../assets/backsample.mp4" type="video/mp4">
    </video>
    <h1 class="main-title">NexGen Levels You Up with Smarter Food Choices</h1>
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-avatar">
        <img src="/assets/back2.png" alt="Sol Avatar" class="avatar-image" />
        <div class="glow-effect"></div>
      </div>
      <div class="hero-content">
        <p class="hero-subtitle">“Play, Learn and make smarter food choices while the avatar evolves with your progress.”</p>
        <h2 class="hero-tagline">Smarter choices! Stronger you! More fun!</h2>
        <button class="avatar-btn" @click="navigateToAvatar">Create Your Avatar</button>
      </div>
      <div class="hero-avatar">
        <img src="../assets/homefruit.png" alt="Sol Avatar" class="avatar-image" />
        <div class="glow-effect"></div>
      </div>
      <div class="hero-bg-animation"></div>
    </section>

    <!-- Highlights Section -->
    <section class="highlights">
      <h2 class="highlights-title">Highlights</h2>
      <div class="highlights-grid">
        <div class="highlight-card" @click="navigateToAvatar">
          <div class="highlight-image-container">
            <img src="/assets/avatarhighlight.png" alt="Your Avatar" class="highlight-image" />
            <div class="highlight-overlay">
              <h3>Your Avatar</h3>
              <p>Create and customize your own health avatar. Watch it grow and evolve as you make healthier food choices!</p>
            </div>
          </div>
        </div>
        <div class="highlight-card" @click="navigateToGames">
          <div class="highlight-image-container">
            <img src="../assets/wheel.png" alt="Spin Wheel" class="highlight-image" />
            <div class="highlight-overlay">
              <h3>Discover Games</h3>
              <p>Spin the Wheel to try fun challenges like food Wordle or Speed Scramble — test your knowledge and level up while you play.</p>
            </div>
          </div>
        </div>
        <div class="highlight-card" @click="navigateToFoodSwap">
          <div class="highlight-image-container">
            <img src="../assets/highlight2.png" alt="Healthier Swaps" class="highlight-image" />
            <div class="highlight-overlay">
              <h3>Healthier Swaps</h3>
              <p>Give us food (like chips) and get smarter, healthier swap options (like popcorn) — plus fun facts and nutrition insights.</p>
            </div>
          </div>
        </div>
        <div class="highlight-card" @click="navigateToCalculator">
          <div class="highlight-image-container">
            <img src="../assets/calculator.png" alt="Nutrient Calculator" class="highlight-image" />
            <div class="highlight-overlay">
              <h3 class="calculator-title">Nutrient Calculator</h3>
              <p>Track your daily nutrients and get personalized recommendations for a balanced diet.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AvatarView from './AvatarView.vue'
import CalculatorView from './CalculatorView.vue'
import Footer from '../components/Footer.vue'

const router = useRouter()

const navigateToGames = () => {
  router.push('/game')
}

const navigateToFoodSwap = () => {
  router.push('/food-swap')
}

const navigateToAvatar = () => {
  router.push('/avatar')
}

const navigateToCalculator = () => {
  router.push('/calculator')
}
</script>

<style scoped>
.home {
  width: 100%;
  font-family: 'Merriweather', serif;
  overflow-x: hidden;  /* prevent horizontal scrolling */
}

/* Hero Section */
.hero {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 16px;
}

.home h1, .home h2, .home h3, .home p, .home button {
  font-family: 'Merriweather', serif;
}

/* Hero Section */
.hero {
  position: relative;
  min-height: 80vh;
  display: flex;
  align-items: center;
  padding: 0px 0;
  overflow: hidden;
}

.hero-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
}

.hero-left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.hero-image {
  width: 100%;
  max-width: 450px;
  height: auto;
  z-index: 1;
}

.hero-content {
  flex: 1.4; /* increase the proportion of the middle content area */
  z-index: 1;
  max-width: 700px; /* increase maximum width */
  text-align: center;
  padding: 0 2rem; /* add padding */
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 1.5rem;
  font-family: 'Joti One', cursive;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  line-height: 1.6;
  font-family: 'Joti One', cursive;
}

.hero-tagline {
  font-size: 1.5rem;
  color: #ffffff;
  font-weight: 600;
  font-family: 'Joti One', cursive;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

@media (max-width: 1024px) {
  .hero-container {
    flex-direction: column;
    text-align: center;
    gap: 30px;
  }

  .hero-image {
    max-width: 350px;
  }

  .hero-title {
    font-size: 2.8rem;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 60px 0;
  }

  .hero-title {
    font-size: 2.2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-image {
    max-width: 280px;
  }
}

.hero-avatar {
  position: relative;
  flex: 0.8;  /* reduce the space occupied by the avatars on both sides */
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-avatar:first-child {
  justify-content: flex-start; /* left avatar align left */
  margin-left: -2rem; /* move left */
}

.hero-avatar:last-child {
  justify-content: flex-end; /* right avatar align right */
  margin-right: -2rem; /* move right */
}

.avatar-image {
  width: 300px;
  height: auto;
  z-index: 1;
}

.glow-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, var(--brand) 0%, transparent 70%);
  opacity: 0.3;
  filter: blur(40px);
  animation: pulse 4s infinite;
}

/* How It Works Section */
.how-it-works {
  position: relative;
  text-align: center;
  margin: 80px calc(-50vw + 50%);
  padding: 80px calc(50vw - 50%);
  background: rgb(195, 158, 104);  /* Darker background color */
  backdrop-filter: blur(8px);
  border-top: 8px solid rgb(139, 119, 101);
  border-bottom: 8px solid rgb(139, 119, 101);
}

.how-it-works::before,
.how-it-works::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(139, 119, 101, 0.3);
}

.how-it-works::before {
  top: 4px;
}

.how-it-works::after {
  bottom: 4px;
}

.how-it-works h2,
.how-it-works h3 {
  font-family: 'Merriweather', serif;
}

.how-it-works h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #2A4D3E;
}

.steps-container {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-top: 40px;
}

.step-card {
  position: relative;
  flex: 1;
  padding: 20px;
  background: var(--panel);
  border-radius: var(--radius);
  border: 1.5px solid #5D4037;
  border: 2px solid #5D4037;
  transition: all 0.4s var(--ease);
  cursor: pointer;
  overflow: hidden;
  animation: fadeInUp 0.6s var(--ease) backwards;
}

.step-card:nth-child(1) { animation-delay: 0.2s; }
.step-card:nth-child(3) { animation-delay: 0.4s; }
.step-card:nth-child(5) { animation-delay: 0.6s; }

.step-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.step-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-radius: var(--radius);
}

.step-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s var(--ease);
}

.step-card:hover .step-image {
  transform: scale(1.05);
}

.step-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s var(--ease);
  padding: 20px;
  border: 1.5px solid #5D4037;
  text-align: center;
}

.step-card:hover .step-content {
  opacity: 1;
  transform: translateY(0);
}

.step-number {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-family: 'Merriweather', serif;
  font-size: 1.2rem;
  z-index: 2;
}

.step-icon {
  font-size: 3rem;
  margin: 1.5rem 0;
  transition: transform 0.3s var(--ease);
}

.step-card:hover .step-icon {
  transform: scale(1.1);
}

.step-description {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-top: 1rem;
  font-family: 'Merriweather', serif;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  opacity: 0;
  transition: opacity 0.3s var(--ease);
  z-index: -1;
}

.step-card:hover .card-glow {
  opacity: 0.1;
}

.step-arrow {
  display: flex;
  align-items: center;
  padding: 0 20px;
  animation: fadeIn 0.6s var(--ease) backwards;
  animation-delay: 0.8s;
}

.arrow-line {
  height: 10px;
  width: 50px;
  background: linear-gradient(90deg, var(--brand), var(--brand-2));
  position: relative;
  animation: expandWidth 1.5s var(--ease) infinite;
}

.arrow-head {
  width: 30px;
  height: 30px;
  border-top: 10px solid var(--brand-2);
  border-right: 10px solid var(--brand-2);
  transform: rotate(45deg);
  margin-left: -5px;
  animation: bounce 1.5s var(--ease) infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes expandWidth {
  0% { transform: scaleX(0.7); }
  50% { transform: scaleX(1); }
  100% { transform: scaleX(0.7); }
}

@keyframes bounce {
  0%, 100% { transform: rotate(45deg) translate(-2px, -2px); }
  50% { transform: rotate(45deg) translate(2px, 2px); }
}

/* Highlights Section */
.highlights {
  position: relative;
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  margin-right: calc(-50vw + 50%);
  margin-bottom: 0;
  padding: 40px 0;
  background-color: #FFF8DC;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.highlights-grid {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  justify-content: center;
}

.highlights-grid {
  max-width: 100%;  /* allow full use of screen width */
  padding: 0 40px;  /* increase left and right padding */
}

.highlight-card {
  flex: 1;  /* allow cards to evenly distribute space */
  min-width: 240px;  /* slightly increase minimum width */
  max-width: 360px;  /* increase maximum width */
  height: 320px;  /* slightly increase height */
  background: var(--panel);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s var(--ease);
  margin: 0 12px;  /* add horizontal spacing */
}

.highlight-image-container {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.calculator-title {
  text-align: center;
  width: 100%;
  margin-bottom: 10px;
}

@media (max-width: 1400px) {
  .highlight-card {
    min-width: 260px;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .highlights-grid {
    flex-direction: column;
    align-items: center;
  }
  
  .highlight-card {
    flex: 0 1 auto;
    width: 100%;
    max-width: 300px;
    height: 280px;  /* mobile is slightly shorter */
  }
}

.highlights-title {
  font-family: 'Joti One', cursive;
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #2C4F3E;  /* dark green, consistent with top navigation bar color */
}

.highlight-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.highlight-image {
  width: 100%;
  height: 100%;
  object-fit: cover;  /* change to cover for better space filling */
  transition: transform 0.4s var(--ease);
  padding: 10px;  /* reduce padding */
  background: rgba(255, 255, 255, 0.05);
}

.highlight-card:hover .highlight-image {
  transform: scale(1.05);
}

.highlight-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s var(--ease);
}

.highlight-card:hover .highlight-overlay {
  opacity: 1;
  transform: translateY(0);
}

.highlight-overlay h3 {
  font-family: 'Merriweather', serif;
  font-size: 1.3rem;  /* slightly reduce title size */
  color: white;
  margin-bottom: 0.8rem;  /* reduce bottom margin */
}

.highlight-overlay p {
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;  /* slightly reduce text size */
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  padding: 0 10px;  /* add some horizontal padding */
}

/* Responsive design for highlights */
@media (max-width: 1024px) {
  .highlights-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    max-width: 800px;
  }
  .highlight-card {
    height: 400px;
  }
}

@media (max-width: 768px) {
  .highlights-grid {
    grid-template-columns: 1fr;
    padding: 0 15px;
  }
  .highlight-card {
    height: 350px;
  }
  .highlights-title {
    font-size: 2rem;
  }
}

/* Q&A Section */
.qa-section {
  position: relative;
  text-align: center;
  margin: 80px calc(-50vw + 50%);
  padding: 80px calc(50vw - 50%);
  background: #FDEBD0;
  backdrop-filter: blur(8px);
  border-top: 8px solid rgb(139, 119, 101);
  border-bottom: 8px solid rgb(139, 119, 101);
}

.qa-section::before,
.qa-section::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(139, 119, 101, 0.3);
}

.qa-section::before {
  top: 4px;
}

.qa-section::after {
  bottom: 4px;
}

.qa-section h2 {
  font-family: 'Merriweather', serif;
  font-size: 2.5rem;
  margin-bottom: 2rem;
  color: #2A4D3E;
}

.faq-container {
  max-width: 800px;
  margin: 40px auto;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  font-family: 'Merriweather', serif;
  background: #2A4D3E;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s var(--ease);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s var(--ease);
}

.faq-question h3 {
  font-size: 1.1rem;
  color: #ffffff;
  margin: 0;
}

.arrow {
  font-size: 1.5rem;
  color: #ffffff;
  transition: transform 0.3s var(--ease);
}

.faq-item.active .arrow {
  transform: rotate(90deg);
}

.faq-answer {
  padding: 0 20px 20px;
  color: #ffffff;
  line-height: 1.6;
}

.btn-primary {
  margin-top: 30px;
  padding: 12px 24px;
  background: #2A4D3E;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s var(--ease);
}

.btn-primary:hover {
  background: #365d4b;
  transform: translateY(-2px);
}

.tagline {
  margin-top: 40px;
  color: rgba(0, 0, 0, 0.8);
  font-size: 1.1rem;
}

.tagline {
  text-align: center;
  color: black;
  margin-top: 40px;
}

.background-video {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: -1;
  filter: blur(3px) brightness(0.65);
  transform: scale(1.1); /* prevent blank space at edges */
}

.main-title {
  width: 100%;
  text-align: center;
  padding: 1rem;
  margin-top: 8rem; /* Move title upward by reducing top margin */
  margin-bottom: -7rem; /* Reduce negative margin to move content up */
  color: #ffffff;
  font-size: 3.5rem;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255,255,255,0.2);
  font-family: 'Merriweather', serif; /* Change font to Merriweather */
  position: relative;
  z-index: 2;
}

.avatar-btn {
  background-color: white; /* Match the green from the image */
  color: #3e8754;
  font-family: 'Merriweather', serif;
  font-size: 1.1rem;
  padding: 12px 30px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.avatar-btn:hover {
  background-color: #2c6a40;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.avatar-btn:active {
  transform: translateY(1px);
}

@media (max-width: 768px) {
  .main-title {
    font-size: 2.5rem;
    margin-top: 4rem;
    margin-bottom: 1.5rem;
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 2rem;
    margin-top: 3rem;
    margin-bottom: 1rem;
    padding: 0.5rem 1rem;
  }
}

@keyframes pulse {
  0% { opacity: 0.2; }
  50% { opacity: 0.4; }
  100% { opacity: 0.2; }
}

/* enhance text visibility */
.hero-title, .hero-subtitle, .hero-tagline {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  font-family: 'Joti One', cursive;
}

.hero-content {
  padding: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    text-align: center;
    padding: 20px 0;
    min-height: auto;
  }

  .hero-content {
    padding: 1rem;
    order: 2;
  }

  .hero-avatar {
    margin: 0;
    padding: 0 1rem;
  }

  .hero-avatar:first-child {
    margin: 0;
    padding-top: 1rem;
    order: 1;
  }

  .hero-avatar:last-child {
    margin: 0;
    padding-bottom: 1rem;
    order: 3;
  }

  .avatar-image {
    width: 180px;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .hero-tagline {
    font-size: 1.2rem;
  }

  .steps-container {
    flex-direction: column;
  }

  .highlights-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 20px 0;
  }

  .hero-content {
    padding: 0.5rem;
  }

  .avatar-image {
    width: 150px;
  }

  .hero-subtitle {
    font-size: 0.9rem;
    line-height: 1.4;
    margin-bottom: 0.8rem;
  }

  .hero-tagline {
    font-size: 1.1rem;
  }
}
</style>