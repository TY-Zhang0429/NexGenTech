<template>
  <div class="support-page">
    <img src="/assets/howitworkback.png" alt="background" class="background-image" />
    <div class="content-container">
      <h1 class="main-title">How It Works</h1>
      
      <div class="features-grid">
        <!-- Avatar Section -->
        <div class="feature-card">
          <div class="content-wrapper">
            <div class="text-content">
              <h2 class="feature-title">Avatar</h2>
              <p class="feature-description">
                Kick off your journey with Sol the Turtle, your default buddy or make it personal by creating your own avatar through a simple questionnaire. Your avatar isn't just a character—it's you in this adventure. It grows alongside your progress. Think of it like your game character powered by your own learning and choices. The better you play and explore, the more your avatar evolves.
              </p>
            </div>
            <div class="image-wrapper">
              <img src="/assets/boss1.png" alt="Avatar feature" class="feature-image" />
            </div>
          </div>
        </div>

        <!-- Explore Features Section -->
        <div class="feature-card">
          <div class="content-wrapper">
            <div class="text-content">
              <h2 class="feature-title">Explore Features</h2>
              <p class="feature-description">
                Dive into the Features Hub for fun, interactive challenges. Play food-themed games like Food Wordle, Match 3 game. Try Healthier Swaps to make smarter snack and meal choices. Explore how the Calculator to understand nutritional composition in your food. Discover hidden fun facts along the way. It's all designed like mini-games—so you're learning without it feeling like studying.
              </p>
            </div>
            <div class="image-wrapper">
              <img src="/assets/boss1.png" alt="Explore features" class="feature-image" />
            </div>
          </div>
        </div>

        <!-- Track Progress Section -->
        <div class="feature-card">
          <div class="content-wrapper">
            <div class="text-content">
              <h2 class="feature-title">Track Your Session Progress</h2>
              <p class="feature-description">
                Every time you finish a game or activity, you're not just learning—you're helping your avatar grow stronger and cooler. Complete more challenges, and watch your avatar evolve. It's like leveling up in your favorite game—but this time, you're leveling up your real-life food smarts.
              </p>
            </div>
            <div class="image-wrapper">
              <img src="/assets/boss1.png" alt="Track progress" class="feature-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Support page logic here if needed
</script>

<style scoped>
.support-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  z-index: -2;
  opacity: 1;
}

/* 添加一个渐变遮罩层来增强文字可读性 */
.support-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.7),
    rgba(255, 255, 255, 0.5)
  );
  z-index: -1;
}

.content-container {
  max-width: 1200px;
  margin: 40px auto;
  padding: 20px;
  font-family: 'Merriweather', serif;
  position: relative;
}

@media (max-width: 1024px) {
  .content-container {
    max-width: 90%;
    margin: 30px auto;
  }

  .feature-card {
    padding: 25px;
  }

  .feature-title {
    font-size: 1.6rem;
  }
}

@media (max-width: 768px) {
  .content-container {
    margin: 20px auto;
  }

  .content-wrapper {
    flex-direction: column;
    gap: 20px;
  }

  .text-content, .image-wrapper {
    width: 100%;
  }

  .feature-image {
    max-width: 180px;
  }

  .main-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 15px;
    margin: 15px auto;
  }

  .feature-card {
    padding: 20px;
  }

  .feature-title {
    font-size: 1.4rem;
  }

  .feature-description {
    font-size: 0.95rem;
  }

  .feature-image {
    max-width: 150px;
  }

  .main-title {
    font-size: 1.8rem;
    margin-bottom: 20px;
  }
}

.main-title {
  text-align: center;
  color: #2A4D3E;
  font-size: 2.5rem;
  margin-bottom: 40px;
  font-family: 'Merriweather', serif;
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.feature-card {
  background: rgba(253, 235, 208, 0.85);
  border-radius: 15px;
  padding: 30px;
  transition: transform 0.3s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.feature-card:hover {
  transform: translateY(-5px);
}

.content-wrapper {
  display: flex;
  align-items: center;
  gap: 30px;
}

.text-content {
  flex: 2;
}

.feature-title {
  color: #8b7765;
  font-size: 1.8rem;
  margin-bottom: 15px;
  font-family: 'Merriweather', serif;
}

.feature-description {
  color: #2A4D3E;
  line-height: 1.6;
  font-size: 1.1rem;
}

.image-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.feature-image {
  max-width: 200px;
  height: auto;
  border-radius: 10px;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-image {
  transform: scale(1.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column-reverse;
    text-align: center;
  }

  .image-wrapper {
    margin-bottom: 20px;
  }

  .feature-title {
    font-size: 1.5rem;
  }

  .feature-description {
    font-size: 1rem;
  }

  .main-title {
    font-size: 2rem;
  }
}
</style>