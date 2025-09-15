<template>
  <div class="support-page">
    <img src="/assets/howitworkback.png" alt="background" class="background-image" />
    <div class="content-container">
      <h1 class="main-title">How It Works</h1>
      <div class="features-wrapper">
        <div class="white-overlay"></div>
        <div class="features-grid">
          <!-- Avatar Section -->
          <div class="feature-section">
            <div class="feature-card">
              <h2 class="feature-title">Avatar</h2>
              <p class="feature-description">
                Kick off your journey with Sol the Turtle, your default buddy or make it personal by creating your own avatar through a simple questionnaire. Your avatar isn't just a character—it's you in this adventure. It grows alongside your progress. Think of it like your game character powered by your own learning and choices. The better you play and explore, the more your avatar evolves.
              </p>
            </div>
            <div class="feature-image-wrapper right">
              <img src="../assets/howitwork1.png" alt="Avatar feature" class="feature-image" />
            </div>
          </div>

          <!-- Explore Features Section -->
          <div class="feature-section">
            <div class="feature-image-wrapper left">
              <img src="../assets/howitwork2.png" alt="Explore features" class="feature-image" />
            </div>
            <div class="feature-card">
              <h2 class="feature-title">Explore Features</h2>
              <p class="feature-description">
                Dive into the Features Hub for fun, interactive challenges. Play food-themed games like Food Wordle, Match 3 game. Try Healthier Swaps to make smarter snack and meal choices. Explore how the Calculator to understand nutritional composition in your food. Discover hidden fun facts along the way. It's all designed like mini-games—so you're learning without it feeling like studying.
              </p>
            </div>
          </div>

          <!-- Track Progress Section -->
          <div class="feature-section">
            <div class="feature-card">
              <h2 class="feature-title">Track Your Session Progress</h2>
              <p class="feature-description">
                Every time you finish a game or activity, you're not just learning—you're helping your avatar grow stronger and cooler. Complete more challenges, and watch your avatar evolve. It's like leveling up in your favorite game—but this time, you're leveling up your real-life food smarts.
              </p>
            </div>
            <div class="feature-image-wrapper right">
              <img src="../assets/howitwork3.png" alt="Track progress" class="feature-image" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import Footer from '@/components/Footer.vue';
</script>

<style scoped>
.support-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  padding-top: 40px;
  display: flex;
  flex-direction: column;
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
  filter: brightness(0.4) blur(4px); /* 降低亮度到0.4，添加4px的模糊效果 */
  transform: scale(1); /* 稍微放大以避免模糊边缘 */
}

.main-title {
  text-align: center;
  color: white;
  font-size: 3rem;
  margin-bottom: 3rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.features-wrapper {
  position: relative;
  padding: 10px;
}

.features-grid {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

.feature-section {
  display: flex;
  margin-bottom: 1.5rem;
  gap: 4rem;
  align-items: center;
}

.feature-card {
  padding: 1.5rem;
  flex: 1;
}

.feature-title {
  color: #1a73e8;
  margin-bottom: 1rem;
  font-size: 1.8rem;
  font-weight: bold;
}

.feature-description {
  color: #ffffff;
  line-height: 1.7;
  font-size: 1.05rem;
  margin-bottom: 1rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.feature-image-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.feature-image-wrapper.left {
  order: -1;
}

.feature-image-wrapper.right {
  order: 2;
}

.feature-image {
  max-width: 300px;
  height: auto;
  border-radius: 15px;
  transition: transform 0.3s ease;
}

.feature-image:hover {
  transform: scale(1.05);
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

  .feature-section {
    flex-direction: column;
  }

  .feature-image-wrapper.left,
  .feature-image-wrapper.right {
    order: 0;
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
  gap: 60px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.feature-section {
  display: flex;
  align-items: center;
  gap: 100px; /* 增加间距从40px到100px */
  position: relative;
  margin-bottom: 40px;
  z-index: 1;
  padding: 0 40px; /* 添加左右内边距 */
}

.feature-card {
  flex: 1;
  background: rgba(253, 235, 208, 0.9);
  border-radius: 15px;
  padding: 30px;
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 600px;
}

.feature-image-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 400px;
}

.feature-image-wrapper.left {
  justify-content: flex-end;
}

.feature-image-wrapper.right {
  justify-content: flex-start;
}

.feature-title {
  color: #8b7765;
  font-size: 2rem;
  margin-bottom: 20px;
  font-family: 'Merriweather', serif;
}

.feature-description {
  color: #2A4D3E;
  line-height: 1.8;
  font-size: 1.1rem;
}

.feature-image {
  max-width: 100%;
  height: auto;
  transition: transform 0.3s ease;
}

@media (max-width: 1024px) {
  .feature-section {
    gap: 60px; /* 在中等屏幕上保持较大间距 */
    padding: 0 30px; /* 适当减小左右内边距 */
  }

  .feature-card {
    padding: 25px;
  }

  .feature-title {
    font-size: 1.8rem;
  }
}

@media (max-width: 768px) {
  .feature-section {
    flex-direction: column;
    text-align: center;
    gap: 2.5rem;
    margin-bottom: 1.5rem;
  }

  .feature-image-wrapper {
    max-width: 300px;
  }

  .feature-image-wrapper.left,
  .feature-image-wrapper.right {
    justify-content: center;
  }

  .feature-card {
    max-width: 100%;
  }

  .feature-title {
    font-size: 1.5rem;
  }

  .feature-description {
    font-size: 1rem;
  }

  .main-title {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }
}

/* 特别处理小屏幕设备 */
@media (max-width: 400px) {
  .feature-section:nth-child(odd) {
    flex-direction: column;
  }

  .feature-section:nth-child(even) {
    flex-direction: column-reverse;
  }

  .feature-section {
    gap: 2rem;
    margin-bottom: 1rem;
  }

  .feature-image-wrapper {
    max-width: 200px;
  }

  .feature-title {
    font-size: 1.3rem;
    margin-bottom: 0.8rem;
  }

  .feature-description {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .main-title {
    font-size: 1.8rem;
    margin-bottom: 1.2rem;
  }

  .features-grid {
    padding: 10px;
  }
}
</style>