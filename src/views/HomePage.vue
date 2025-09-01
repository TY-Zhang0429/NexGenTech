<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">NexGen: Fun, Interactive Nutrition for the Next Generation</h1>
        <p class="hero-subtitle">Because the next generation deserves to be healthy, confident, and informed. 
          NexGen makes nutrition fun and interactive — no boring lectures, just games, challenges, 
          and your own evolving avatar that grows with your progress.</p>
        <h2 class="hero-tagline">Because being healthy doesn't need to be boring.</h2>
      </div>
      <div class="hero-avatar">
        <img src="../assets/avatar.png" alt="Sol Avatar" class="avatar-image" />
        <div class="glow-effect"></div>
      </div>
      <div class="hero-bg-animation"></div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works">
      <h2>How It Works</h2>
      <div class="steps-container">
        <div class="step-card">
          <div class="step-icon">🐢</div>
          <h3>Create or choose your avatar</h3>
          <div class="card-glow"></div>
        </div>
        <div class="step-card">
          <div class="step-icon">🎮</div>
          <h3>Play challenges & make swaps</h3>
          <div class="card-glow"></div>
        </div>
        <div class="step-card">
          <div class="step-icon">📈</div>
          <h3>Watch your avatar evolve</h3>
          <div class="card-glow"></div>
        </div>
      </div>
    </section>

    <!-- Highlights Section -->
    <section class="highlights">
      <div class="highlights-grid">
        <div class="highlight-card" @click="navigateToGames">
          <img src="../assets/wheel.png" alt="Spin Wheel" class="highlight-image" />
          <h3>Discover Games</h3>
          <p>Spin the Wheel to try fun challenges like food Wordle or Speed Scramble — test your knowledge and level up while you play.</p>
        </div>
        <div class="highlight-card">
          <div class="highlight-icon">🥑</div>
          <h3>Healthier Swaps</h3>
          <p>Give us food (like chips) and get smarter, healthier swap options (like popcorn) — plus fun facts and nutrition insights.</p>
        </div>
        <div class="highlight-card">
          <img src="../assets/avatar.png" alt="Sol Avatar" class="highlight-image" />
          <h3>Your Avatar</h3>
          <p>Meet your avatar! It represents you during every activity, and it changes as you progress. Watch it evolve as you complete challenges and build healthier habits.</p>
        </div>
      </div>
    </section>

    <!-- Q&A Section -->
    <section class="qa-section">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-container">
        <div class="faq-item" v-for="(faq, index) in faqs" :key="index" :class="{ active: activeFaq === index }">
          <div class="faq-question" @click="toggleFaq(index)">
            <span class="faq-icon">{{ faq.icon }}</span>
            <h3>{{ faq.question }}</h3>
            <span class="arrow">›</span>
          </div>
          <div class="faq-answer" v-show="activeFaq === index">
            <p>{{ faq.answer }}</p>
          </div>
        </div>
        <button class="btn btn-primary" @click="showMoreFaqs">See More Questions →</button>
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
    icon: '🎮',
    question: 'How do the games work?',
    answer: 'Our games are designed to be fun and educational. From spinning the wheel to playing food-themed word games, each activity helps you learn about nutrition in an engaging way.'
  },
  {
    icon: '🔄',
    question: 'What are food swaps?',
    answer: 'Food swaps are healthier alternatives to common snacks and meals. We suggest tasty options that maintain the enjoyment while improving nutritional value.'
  },
  {
    icon: '🐢',
    question: 'How does my avatar evolve?',
    answer: 'Your avatar grows and changes as you complete challenges and learn new things about nutrition. The more you engage, the more your avatar transforms!'
  }
])

const toggleFaq = (index) => {
  activeFaq.value = activeFaq.value === index ? null : index
}

const showMoreFaqs = () => {
  // TODO: Implement full FAQ page navigation
}

const navigateToGames = () => {
  router.push('/game')
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
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
}

.hero-subtitle {
  font-size: 1.2rem;
  color: var(--muted);
  margin-bottom: 2rem;
  line-height: 1.6;
}

.hero-tagline {
  font-size: 1.5rem;
  color: var(--text);
  font-weight: 600;
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
  padding: 80px 0;
  text-align: center;
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
  padding: 32px;
  background: var(--panel);
  border-radius: var(--radius);
  transition: transform 0.3s var(--ease);
  cursor: pointer;
  overflow: hidden;
}

.step-card:hover {
  transform: translateY(-5px);
}

.step-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
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

/* Highlights Section */
.highlights {
  padding: 80px 0;
}

.highlights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.highlight-card {
  background: var(--panel);
  border-radius: var(--radius);
  padding: 32px;
  text-align: center;
  transition: transform 0.3s var(--ease);
  cursor: pointer;
}

.highlight-card:hover {
  transform: translateY(-5px);
}

.highlight-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: 1.5rem;
}

.highlight-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

/* Q&A Section */
.qa-section {
  padding: 80px 0;
  background: linear-gradient(180deg, 
    color-mix(in oklab, var(--panel), transparent 80%) 0%,
    transparent 100%
  );
  border-radius: var(--radius);
  margin-bottom: 40px;
}

.faq-container {
  max-width: 800px;
  margin: 40px auto;
}

.faq-item {
  margin-bottom: 16px;
}

.faq-question {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--panel);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background-color 0.2s var(--ease);
}

.faq-question:hover {
  background: color-mix(in oklab, var(--panel), #fff 5%);
}

.faq-icon {
  font-size: 1.5rem;
}

.arrow {
  margin-left: auto;
  font-size: 1.5rem;
  transition: transform 0.2s var(--ease);
}

.faq-item.active .arrow {
  transform: rotate(90deg);
}

.faq-answer {
  padding: 16px;
  color: var(--muted);
}

.tagline {
  text-align: center;
  color: var(--muted);
  margin-top: 40px;
}

@keyframes pulse {
  0% { opacity: 0.2; }
  50% { opacity: 0.4; }
  100% { opacity: 0.2; }
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
