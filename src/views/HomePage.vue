<template>
  <div class="home">
    <video autoplay loop muted playsinline class="background-video">
      <source src="../assets/backsample.mp4" type="video/mp4">
    </video>
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title" style="color: #ffffff; text-shadow: 0 0 10px rgba(255,255,255,0.2);">NexGen Levels You Up with Smarter Food Choices</h1>
        <p class="hero-subtitle">“Every choice matters — swap junk for power-ups, fuel your body with the right foods, and watch your health (and your avatar) level up. With NexGen, healthy eating is no longer boring, it's your new adventure.”</p>
        <h2 class="hero-tagline">Smarter choices! Stronger you! More fun!</h2>
      </div>
      <div class="hero-avatar">
        <img src="../assets/avatardef.png" alt="Sol Avatar" class="avatar-image" />
        <div class="glow-effect"></div>
      </div>
      <div class="hero-bg-animation"></div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works">
      <h2>How It Works</h2>
      <div class="steps-container">
        <div class="step-card" data-step="1">
          <div class="step-number">1</div>
          <div class="step-image-container">
            <img src="../assets/howwork1.png" alt="Create Avatar" class="step-image" />
            <div class="step-content">
              <h3>Create or choose your avatar</h3>
              <p class="step-description">Start your journey by creating your unique avatar companion</p>
            </div>
          </div>
          <div class="card-glow"></div>
        </div>
        <div class="step-arrow">
          <div class="arrow-line"></div>
          <div class="arrow-head"></div>
        </div>
        <div class="step-card" data-step="2">
          <div class="step-number">2</div>
          <div class="step-image-container">
            <img src="../assets/howwork2.png" alt="Play Challenges" class="step-image" />
            <div class="step-content">
              <h3>Play challenges & make swaps</h3>
              <p class="step-description">Complete fun challenges and learn about healthy food choices</p>
            </div>
          </div>
          <div class="card-glow"></div>
        </div>
        <div class="step-arrow">
          <div class="arrow-line"></div>
          <div class="arrow-head"></div>
        </div>
        <div class="step-card" data-step="3">
          <div class="step-number">3</div>
          <div class="step-image-container">
            <img src="../assets/howwork3.png" alt="Avatar Evolution" class="step-image" />
            <div class="step-content">
              <h3>Watch your avatar evolve</h3>
              <p class="step-description">See your avatar grow stronger as you make healthier choices</p>
            </div>
          </div>
          <div class="card-glow"></div>
        </div>
      </div>
    </section>

    <!-- Highlights Section -->
    <section class="highlights">
      <h2 class="highlights-title">Highlights</h2>
      <div class="highlights-grid">
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
        
      </div>
    </section>

    <!-- Q&A Section -->
    <section class="qa-section">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-container">
        <div class="faq-list">
          <div class="faq-item" v-for="(faq, index) in faqs" :key="index" :class="{ active: activeFaq === index }">
            <div class="faq-question" @click="toggleFaq(index)">
              <h3>{{ faq.question }}</h3>
              <span class="arrow">›</span>
            </div>
            <div class="faq-answer" v-show="activeFaq === index">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
        <button class="btn btn-primary">See More Questions →</button>
      </div>
      <p class="tagline">Built for the next generation 💡 Healthy minds, healthy bodies.</p>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeFaq = ref(null)

const faqs = ref([
  {
    question: 'How do the games work?',
    answer: 'Our games are designed to be fun and educational. From spinning the wheel to playing food-themed word games, each activity helps you learn about nutrition in an engaging way.'
  },
  {
    question: 'What are food swaps?',
    answer: 'Food swaps are healthier alternatives to common snacks and meals. We suggest tasty options that maintain the enjoyment while improving nutritional value.'
  },
  {
    question: 'How does my avatar evolve?',
    answer: 'Your avatar grows and changes as you complete challenges and learn new things about nutrition. The more you engage, the more your avatar transforms!'
  }
])

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}


const navigateToGames = () => {
  router.push('/game')
}

const navigateToFoodSwap = () => {
  router.push('/food-swap')
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
  font-family: 'Merriweather', serif;
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
  padding: 60px 0;
  overflow: hidden;
}

.hero-content {
  flex: 1;
  z-index: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--brand), var(--brand-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  margin-bottom: 1.5rem;
  font-family: 'Joti One', cursive;
}

.hero-subtitle {
  font-size: 1.2rem;
  color: black;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-family: 'Joti One', cursive;
}

.hero-tagline {
  font-size: 1.5rem;
  color: var(--text);
  font-weight: 600;
  font-family: 'Joti One', cursive;
}

.hero-avatar {
  position: relative;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-image {
  width: 400px;
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
  background: #FDEBD0;
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
  padding: 80px 0;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
  justify-items: center;
}

.highlights-title {
  font-family: 'Joti One', cursive;
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2rem;
  color: #ffffff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.highlight-card {
  background: var(--panel);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  height: 450px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.4s var(--ease);
}

.highlight-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
}

.highlight-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.highlight-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.4s var(--ease);
  padding: 20px;
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
  font-size: 1.5rem;
  color: white;
  margin-bottom: 1rem;
}

.highlight-overlay p {
  font-family: 'Merriweather', serif;
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
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
  filter: blur(3px) brightness(0.55);
  transform: scale(1.1); /* prevent blank space at edges */
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
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .steps-container {
    flex-direction: column;
  }

  .highlights-grid {
    grid-template-columns: 1fr;
  }
}
</style>

