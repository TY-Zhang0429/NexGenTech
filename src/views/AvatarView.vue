<template>
  <section class="avatar-page">
    <!-- 引入可拖动头像组件 -->
    <DraggableAvatar ref="avatarComponent" />
    
    <!-- 选择头像成功提示框和模糊遮罩 -->
    <div v-if="showSuccessMessage" class="overlay-blur"></div>
    <div v-if="showSuccessMessage" class="success-message">
      {{ successMessage }}
    </div>
    
    <div class="content-container">
      <h1 class="page-title">Choose Your Avatar</h1>
      
      <div class="info-banner">
        <p>Select Sol or create your own personalized companion for your health journey</p>
        <p>Every activity you complete makes your avatar evolve</p>
        <button class="get-avatar-button" @click="showAvatarSelection = true" v-if="!showAvatarSelection">
          Get Avatar
        </button>
      </div>

      <div v-if="showAvatarSelection" class="tab-navigation">
        <div class="tab-item" 
             :class="{ active: activeTab === 'default' }" 
             @click="activeTab = 'default'">Default Sol</div>
        <div class="tab-item" 
             :class="{ active: activeTab === 'create' }" 
             @click="activeTab = 'create'">Create Avatar</div>
      </div>

      <div v-if="showAvatarSelection" class="content-card">
        <div v-if="activeTab === 'default'" class="default-sol-content">
          <div class="avatar-container">
            <div class="sol-card">
              <img src="/assets/sol.png" alt="Sol Avatar" class="avatar-image" />
              <button 
                class="select-button" 
                :class="{ 'already-selected': isAvatarAlreadySelected }"
                @click="selectSol"
                :disabled="isAvatarAlreadySelected">
                {{ isAvatarAlreadySelected ? 'Already Selected' : 'Select Sol' }}
              </button>
              <button 
                v-if="isAvatarAlreadySelected"
                class="reset-button" 
                @click="resetAvatar">
                Reset Avatar
              </button>
            </div>

            <div class="sol-description">
              <h2 class="meet-title">Meet Sol</h2>
              
              <p class="greeting">Hey! I'm Sol 👋, your friendly guide. If you don't want to create a custom avatar, you can team up with me instead.</p>
              
              <hr class="divider" />
              
              <ul class="feature-list">
                <li>Pick me as your avatar by clicking Select Sol.</li>
                <li>Then choose any game or activity (Wordle, Match-3, etc.).</li>
                <li>Every time you complete something, I'll evolve!</li>
                <li>Click Select Sol to lock me in as your buddy for this session.</li>
              </ul>
            </div>
          </div>
        </div>

        <div v-else class="create-avatar-content">
          <!-- 问卷前的介绍卡片 -->
          <div v-if="!showQuestionnaire" class="avatar-intro-card">
            <h2 class="create-title">Create Your Own</h2>
            
            <div class="create-description">
              <p>Want a representative that feels more you?</p>
              <p>Create your own personalized avatar based on a quick 10-question quiz.</p>
            </div>
            
            <hr class="card-divider" />
            
            <div class="instructions-section">
              <h3>Instructions</h3>
              <ul class="instructions-list">
                <li>The questions are simple — about your food habits and lifestyle.</li>
                <li>Your new avatar will be generated just for you after you click submit.</li>
                <li>You'll see a badge → click and unlock your full avatar.</li>
                <li>Your avatar evolves with activities and games you engage in.</li>
              </ul>
            </div>
            
            <button class="questionnaire-button" @click="openQuestionnaire">
              Fill Questionnaire
            </button>
          </div>
          
          <!-- 问卷界面 -->
          <div v-else class="questionnaire-container">
            <div class="questionnaire-card">
              <div class="questionnaire-header">
                <h2 class="create-title">Create Your Own</h2>
                <div class="create-description">
                  <p>Want a representative that feels more you?</p>
                  <p>Create your own personalized avatar based on a quick 10-question quiz.</p>
                </div>
              </div>
              
              <div class="questions-container">
                <h2 class="questions-title">Your Questions</h2>
                
                <div class="progress-indicator">
                  <span class="progress-text">Step {{ currentQuestion }} of {{ totalQuestions }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: (currentQuestion / totalQuestions * 100) + '%' }"></div>
                  </div>
                </div>
                
                <div class="question-content">
                  <h3 class="question-text">{{ currentQuestion }}. {{ questions[currentQuestion-1].question }}</h3>
                  
                  <ul class="options-list">
                    <li v-for="(option, index) in questions[currentQuestion-1].options" :key="index">
                      <label class="option-label">
                        <input 
                          type="radio" 
                          :name="'question'+currentQuestion" 
                          :value="option"
                          :checked="userAnswers[currentQuestion-1] === option"
                          @change="userAnswers[currentQuestion-1] = option" 
                        />
                        <span class="option-text">{{ option }}</span>
                      </label>
                    </li>
                  </ul>
                </div>
                
                <button 
                  class="next-button" 
                  @click="answerAndNext(userAnswers[currentQuestion-1])"
                  :disabled="!userAnswers[currentQuestion-1]">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DraggableAvatar from '../components/DraggableAvatar.vue';

// 默认显示Default Sol标签页
const activeTab = ref('default');

// 控制是否显示头像选择界面
const showAvatarSelection = ref(false);

// 成功消息提示控制
const showSuccessMessage = ref(false);
const successMessage = ref('Sol Selected!');

// 控制问卷界面显示
const showQuestionnaire = ref(false);

// 当前问题
const currentQuestion = ref(1);
const totalQuestions = ref(5);

// 问卷的问题和选项
const questions = ref([
  {
    question: "Does your daily meal consist of fruits and vegetables?",
    options: ["Always", "Sometimes", "Rarely", "Never"]
  },
  {
    question: "Does your daily meal consist of fruits and vegetables?",
    options: ["Always", "Sometimes", "Rarely", "Never"]
  },
  {
    question: "Does your daily meal consist of fruits and vegetables?",
    options: ["Always", "Sometimes", "Rarely", "Never"]
  },
  {
    question: "Does your daily meal consist of fruits and vegetables?",
    options: ["Always", "Sometimes", "Rarely", "Never"]
  },
  {
    question: "Does your daily meal consist of fruits and vegetables?",
    options: ["Always", "Sometimes", "Rarely", "Never"]
  }
]);

// 用户的回答
const userAnswers = ref([]);

// 引用头像组件
const avatarComponent = ref(null);

// 检查是否已经选择了头像
const isAvatarAlreadySelected = ref(false);

// 组件挂载时检查状态
onMounted(() => {
  // 检查localStorage中是否已经选择了头像
  checkAvatarSelectedState();
});

// 检查头像选择状态
const checkAvatarSelectedState = () => {
  const selected = localStorage.getItem('avatarSelected') === 'true';
  isAvatarAlreadySelected.value = selected;
};

// 选择Sol的处理函数
const selectSol = () => {
  // 如果已经选择了头像，则不执行任何操作
  if (isAvatarAlreadySelected.value) return;
  
  // 设置选择状态并存储到localStorage
  localStorage.setItem('avatarSelected', 'true');
  isAvatarAlreadySelected.value = true;
  
  // 设置并显示成功消息
  successMessage.value = 'Sol Selected!';
  showSuccessMessage.value = true;
  
  // 设置提示消息2秒后消失
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 2000);
  
  // 通知DraggableAvatar组件更新状态
  if (avatarComponent.value) {
    avatarComponent.value.checkAvatarSelected();
  }
};

// 重置头像的处理函数
const resetAvatar = () => {
  // 重置localStorage中的状态
  localStorage.removeItem('avatarSelected');
  localStorage.removeItem('avatarPosition');
  
  // 更新当前状态
  isAvatarAlreadySelected.value = false;
  
  // 通知DraggableAvatar组件更新状态
  if (avatarComponent.value) {
    avatarComponent.value.checkAvatarSelected();
  }
  
  // 设置并显示重置成功消息
  successMessage.value = 'Avatar Reset!';
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 2000);
};

// 打开问卷
const openQuestionnaire = () => {
  showQuestionnaire.value = true;
  currentQuestion.value = 1;
  userAnswers.value = [];
};

// 回答问题并前往下一题
const answerAndNext = (answer) => {
  // 保存当前问题的答案
  userAnswers.value[currentQuestion.value - 1] = answer;
  
  // 如果有下一题，前进到下一题，否则提交问卷
  if (currentQuestion.value < totalQuestions.value) {
    currentQuestion.value++;
  } else {
    submitQuestionnaire();
  }
};

// 提交问卷
const submitQuestionnaire = () => {
  // 在这里处理用户的所有回答
  console.log('问卷已提交', userAnswers.value);
  
  // 展示成功消息
  successMessage.value = 'Avatar Created!';
  showSuccessMessage.value = true;
  
  // 设置提示消息2秒后消失
  setTimeout(() => {
    showSuccessMessage.value = false;
    
    // 重置问卷状态
    showQuestionnaire.value = false;
    
    // 设置已选择头像状态
    localStorage.setItem('avatarSelected', 'true');
    isAvatarAlreadySelected.value = true;
    
    // 通知DraggableAvatar组件更新状态
    if (avatarComponent.value) {
      avatarComponent.value.checkAvatarSelected();
    }
  }, 2000);
};
</script>

<style scoped>
.avatar-page {
  width: 100%;
  min-height: 100vh;
  font-family: 'Merriweather', serif;
  position: relative;
  padding: 20px;
  box-sizing: border-box;
}

/* 添加一个全屏背景覆盖层 */
.avatar-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/assets/avatarback.png');
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  z-index: -1;
}

.page-title {
  text-align: center;
  color: #1a5536; /* 更深的绿色 */
  font-size: 28px;
  margin-bottom: 20px;
  font-weight: 600;
}

.info-banner {
  background-color: #e8f1e9;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  margin-bottom: 30px;
  color: #5a3e0b;
}

.get-avatar-button {
  font-family: 'Merriweather', serif;
  background-color: #1a5536;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 25px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s ease;
}

.get-avatar-button:hover {
  background-color: #2c8a56;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tab-navigation {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 30px;
  position: relative;
}

.tab-item {
  padding: 12px 0;
  flex: 1;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  position: relative;
  transition: color 0.3s;
}

.tab-item.active {
  color: #1a5536; /* 更深的绿色 */
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #1a5536; /* 更深的绿色 */
  transition: left 0.3s ease;
}

/* 全屏模糊遮罩 */
.overlay-blur {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 1000;
  animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
}

/* 成功消息提示框 */
.success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #1a5536; /* 深绿色 */
  font-size: 36px;
  font-weight: bold;
  z-index: 1001;
  text-align: center;
  animation: fadeIn 0.3s, fadeOut 0.3s 1.7s;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.content-container {
  max-width: 1000px;
  margin: 0 auto;
}

.content-card {
  background-color: #e8f1e9;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin-bottom: 30px;
}

.default-sol-content,
.create-avatar-content {
  display: flex;
  flex-direction: column;
}

.avatar-container {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.sol-card {
  flex: 0 0 300px;
  background-color: #beb5a3;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.avatar-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 15px;
}

.select-button {
  font-family: 'Merriweather', serif;
  background-color: #1d5737;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 25px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.select-button:hover:not(.already-selected) {
  background-color: #2c8a56;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.reset-button {
  font-family: 'Merriweather', serif;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 10px;
  transition: all 0.3s ease;
}

.reset-button:hover {
  background-color: #f44336;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.select-button.already-selected {
  background-color: #888888;
  cursor: not-allowed;
  opacity: 0.7;
}

.sol-description {
  flex: 1;
}

.meet-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333333; /* 统一深色 */
}

.greeting {
  color: #333333; /* 统一深色 */
  line-height: 1.6;
  margin-bottom: 20px;
}

.divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 20px 0;
}

.feature-list {
  padding-left: 20px;
  color: #333333; /* 统一深色 */
}

.feature-list li {
  margin-bottom: 15px;
  line-height: 1.5;
}

/* Create Avatar 样式 */
.avatar-intro-card {
  background-color: #fffaeb;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.create-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 25px;
}

.create-description {
  color: #5a3e0b;
  line-height: 1.6;
  margin-bottom: 20px;
  font-size: 18px;
}

.create-description p {
  margin-bottom: 10px;
}

.card-divider {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 20px 0;
}

.instructions-section {
  margin-bottom: 30px;
}

.instructions-section h3 {
  font-size: 22px;
  margin-bottom: 15px;
  color: #333333;
}

.instructions-list {
  list-style-type: disc;
  padding-left: 20px;
  color: #333333;
}

.instructions-list li {
  margin-bottom: 12px;
  line-height: 1.5;
  position: relative;
  padding-left: 10px;
}

.instructions-list li::before {
  content: "•";
  position: absolute;
  left: -15px;
  color: #1a5536;
}

.questionnaire-button {
  font-family: 'Merriweather', serif;
  background-color: #d9d9d9;
  color: #333333;
  border: none;
  border-radius: 10px;
  padding: 14px 30px;
  font-size: 18px;
  cursor: pointer;
  margin: 10px auto;
  display: block;
  transition: all 0.3s ease;
}

.questionnaire-button:hover {
  background-color: #c9c9c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* 问卷部分的样式 */
.questionnaire-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
}

.questionnaire-card {
  display: flex;
  width: 100%;
  gap: 20px;
}

.questionnaire-header {
  flex: 0 0 45%;
  background-color: #fffaeb;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.questions-container {
  flex: 1;
  background-color: #fffaeb;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.questions-title {
  font-size: 28px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 20px;
}

.progress-indicator {
  margin-bottom: 25px;
}

.progress-text {
  color: #1a5536;
  font-weight: 600;
  display: block;
  margin-bottom: 10px;
  font-size: 16px;
}

.progress-bar {
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #1a5536;
  transition: width 0.3s ease;
}

.question-content {
  margin-bottom: 30px;
}

.question-text {
  font-size: 20px;
  color: #333333;
  margin-bottom: 20px;
}

.options-list {
  list-style-type: none;
  padding: 0;
}

.option-label {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

.option-label input[type="radio"] {
  margin-right: 10px;
}

.option-text {
  font-size: 16px;
  color: #333333;
}

.next-button {
  font-family: 'Merriweather', serif;
  background-color: #1a5536;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 40px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  float: right;
  transition: all 0.3s ease;
}

.next-button:hover:not(:disabled) {
  background-color: #2c8a56;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.next-button:disabled {
  background-color: #888888;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .questionnaire-card {
    flex-direction: column;
  }
  
  .questionnaire-header {
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .avatar-container {
    flex-direction: column;
  }
  
  .sol-card {
    margin: 0 auto;
  }
}
</style>