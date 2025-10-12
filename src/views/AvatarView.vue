<template>
  <section class="avatar-page">
    <!-- import draggable avatar component -->
    <DraggableAvatar ref="avatarComponent" />

    <!-- selection success message -->
    <div v-if="showSuccessMessage" class="overlay-blur"></div>
    <div v-if="showSuccessMessage" class="success-message">
      {{ successMessage }}
    </div>
    
    <div class="content-container">
      <h1 class="page-title">Choose Your Avatar</h1>
      
      <div class="info-banner">
        <p>Select Sol or create your own personalized companion for your health journey</p>
        <button class="get-avatar-button" @click="showAvatarSelection = true" v-if="!showAvatarSelection">
          Get Avatar
        </button>
      </div>

      <!-- Guide Section -->
      <div v-if="!showAvatarSelection" class="guide-section">
        <div class="guide-steps">
          <div class="guide-step">
            <div class="step-image">
              <img src="/assets/avapage1.png" alt="Get Avatar" class="step-icon" />
            </div>
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Get Your Avatar</h3>
              <p>Click "Get Avatar" to choose Sol or create your personalized companion</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-image">
              <img src="/assets/avapage2.png" alt="Play Games" class="step-icon" />
            </div>
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Play & Grow Strong</h3>
              <p>Engage in health games and activities to make your avatar evolve</p>
            </div>
          </div>
          <div class="guide-step">
            <div class="step-image">
              <img src="/assets/avapage3.png" alt="Follow Guidance" class="step-icon" />
            </div>
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Follow the Guidance</h3>
              <p>Let your avatar guide you with personalized health advice and tips</p>
            </div>
          </div>
        </div>
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
              <img src="/assets/avatara.png" alt="Sol Avatar" class="avatar-image" />
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
          <!-- before questionnaire -->
          <div v-if="!showQuestionnaire && !showAvatarComplete" class="avatar-intro-card">
            <h2 class="create-title">Create Your Own</h2>
            
            <div class="create-description">
              <p>Want a representative that feels more you?</p>
              <p>Create your own personalized avatar based on a quick 5-question questionaire.</p>
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

          <!-- avatar completion -->
          <div v-else-if="showAvatarComplete" class="avatar-complete-container">
            <div class="avatar-complete-card">
              <h2 class="avatar-complete-title">Your Avatar</h2>
              
              <div class="avatar-image-container">
                <img :src="getSelectedAvatar()" alt="Your Avatar" class="completed-avatar-image" />
              </div>
              
              <div class="avatar-name-section">
                <input 
                  v-model="customAvatarName" 
                  type="text" 
                  placeholder="input your avatar name here" 
                  class="avatar-name-input"
                  maxlength="20"
                />
              </div>
              
              <button class="select-avatar-button" @click="selectCreatedAvatar" :disabled="!customAvatarName.trim()">
                Select Avatar
              </button>
              
              <p class="completion-message">You can start any game or activity now.</p>
            </div>
          </div>
          
          <!-- questionnaire -->
          <div v-else class="questionnaire-container">
            <div class="questionnaire-card">
              <div class="questionnaire-header">
                <h2 class="create-title">Create Your Own</h2>
                <div class="create-description">
                  <p>Want a representative that feels more you?</p>
                  <p>Create your own personalized avatar based on a quick 5-question quiz.</p>
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
                
                <div class="navigation-buttons">
                  <button 
                    v-if="currentQuestion > 1"
                    class="previous-button" 
                    @click="goToPrevious">
                    Previous
                  </button>
                  
                  <button 
                    class="next-button" 
                    @click="answerAndNext(userAnswers[currentQuestion-1])"
                    :disabled="!userAnswers[currentQuestion-1]">
                    {{ currentQuestion === totalQuestions ? 'Submit' : 'Next' }}
                  </button>
                </div>
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

// default active tab
const activeTab = ref('default');

// control avatar selection display
const showAvatarSelection = ref(false);

// success message control
const showSuccessMessage = ref(false);
const successMessage = ref('Sol Selected!');

// control questionnaire display
const showQuestionnaire = ref(false);

// control avatar completion display
const showAvatarComplete = ref(false);

// current question index
const currentQuestion = ref(1);
const totalQuestions = ref(5);

// questionaire data
const questions = ref([
  {
    question: "Does your daily meal consist of fruits and vegetables?",
    options: ["Always", "Sometimes", "Rarely", "Never"]
  },
  {
    question: "How often do you consume sugary drinks or sugary snacks like donut, soft drinks in a week?",
    options: ["0 times", "1-2 times", "3-4 times", "5 or more times"]
  },
  {
    question: "When you are enjoying time with your friends, do their food choices affect yours?",
    options: ["Never", "Maybe", "Rarely", "Always"]
  },
  {
    question: "If you find a delicious but potentially unhealthy dish, how likely are you to try it?",
    options: ["Never", "Maybe", "Rarely", "Always"]
  },
  {
    question: "Which of the following foods would you prefer to eat for dinner?",
    options: ["Vegetables/salad", "Rice/pasta/noodles", "Meat/seafood", "Takeaway"]
  }
]);

// user answers
const userAnswers = ref([]);

// custom avatar name input by user
const customAvatarName = ref('');

// reference to avatar component
const avatarComponent = ref(null);

// check if avatar is already selected
const isAvatarAlreadySelected = ref(false);

// computed property to get selected avatar image
onMounted(() => {
  // check sessionStorage for avatar selection status
  checkAvatarSelectedState();
});

// check if avatar is already selected from sessionStorage
const checkAvatarSelectedState = () => {
  const selected = sessionStorage.getItem('avatarSelected') === 'true';
  isAvatarAlreadySelected.value = selected;
};

// select Sol as avatar
const selectSol = () => {
  // if user already selected, do nothing
  if (isAvatarAlreadySelected.value) return;

  // set sessionStorage
  sessionStorage.setItem('avatarSelected', 'true');
  sessionStorage.setItem('avatarType', 'avatara');
  sessionStorage.setItem('avatarEvolutionLevel', '1'); // initial level
  isAvatarAlreadySelected.value = true;

  // notify other components about avatar state change
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarSelected', value: 'true' }
  }));
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarType', value: 'avatara' }
  }));

  // set and show success message
  successMessage.value = 'Sol Selected!';
  showSuccessMessage.value = true;

  // set timeout to hide success message after 2 seconds
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 2000);

  // notify DraggableAvatar component to update status
  if (avatarComponent.value) {
    avatarComponent.value.checkAvatarSelected();
  }
};

// reset avatar
const resetAvatar = () => {
  // reset sessionStorage
  sessionStorage.removeItem('avatarSelected');
  sessionStorage.removeItem('avatarPosition');
  sessionStorage.removeItem('avatarType');
  sessionStorage.removeItem('avatarEvolved');
  sessionStorage.removeItem('avatarEvolutionLevel');
  sessionStorage.removeItem('avatarCustomName'); // also remove custom name
  sessionStorage.removeItem('completedGames'); // also remove completed games

  // notify other components about avatar reset
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarReset', value: 'true' }
  }));

  // update current state
  isAvatarAlreadySelected.value = false;
  customAvatarName.value = ''; // clear custom name input

  // notify DraggableAvatar component to update status
  if (avatarComponent.value) {
    avatarComponent.value.checkAvatarSelected();
  }

  // set and show reset success message
  successMessage.value = 'Avatar Reset!';
  showSuccessMessage.value = true;
  setTimeout(() => {
    showSuccessMessage.value = false;
  }, 2000);
};

// open questionnaire
const openQuestionnaire = () => {
  showQuestionnaire.value = true;
  showAvatarComplete.value = false;
  currentQuestion.value = 1;
  userAnswers.value = [];
};

// answer question and go to next
const answerAndNext = (answer) => {
  // save answer for current question
  userAnswers.value[currentQuestion.value - 1] = answer;

  // if there is a next question, go to it, otherwise submit questionnaire
  if (currentQuestion.value < totalQuestions.value) {
    currentQuestion.value++;
  } else {
    submitQuestionnaire();
  }
};

// back to previous question
const goToPrevious = () => {
  if (currentQuestion.value > 1) {
    currentQuestion.value--;
  }
};

// get selected avatar based on answers
const getSelectedAvatar = () => {
  // Count how many times each option position is selected
  const optionCounts = [0, 0, 0, 0]; // For options a, b, c, d
  
  userAnswers.value.forEach((answer, index) => {
    const optionIndex = questions.value[index].options.indexOf(answer);
    if (optionIndex >= 0 && optionIndex < 4) {
      optionCounts[optionIndex]++;
    }
  });
  
  // Check which option has more than 2 selections
  if (optionCounts[0] > 2) {
    return '/assets/avatarb.png'; // First option (a)
  } else if (optionCounts[1] > 2) {
    return '/assets/avatarc.png'; // Second option (b)
  } else if (optionCounts[2] > 2) {
    return '/assets/avatard.png'; // Third option (c)
  } else if (optionCounts[3] > 2) {
    return '/assets/avatare.png'; // Fourth option (d)
  } else {
    // Default case if no option has more than 2 selections
    return '/assets/avatarb.png';
  }
};

// get avatar name based on type
const getAvatarName = () => {
  const avatarSrc = getSelectedAvatar();
  if (avatarSrc.includes('avatarb')) {
    return 'Harry';
  } else if (avatarSrc.includes('avatarc')) {
    return 'David';
  } else if (avatarSrc.includes('avatard')) {
    return 'Emma';
  } else if (avatarSrc.includes('avatare')) {
    return 'Lily';
  }
  return 'Sol';
};

// get avatar type (for saving to localStorage)
const getAvatarType = () => {
  const avatarSrc = getSelectedAvatar();
  if (avatarSrc.includes('avatarb')) {
    return 'avatarb';
  } else if (avatarSrc.includes('avatarc')) {
    return 'avatarc';
  } else if (avatarSrc.includes('avatard')) {
    return 'avatard';
  } else if (avatarSrc.includes('avatare')) {
    return 'avatare';
  }
  return 'avatara';
};

// submit questionnaire
const submitQuestionnaire = () => {
  // handle submission logic here (e.g., send to backend if needed)
  console.log('问卷已提交', userAnswers.value);
  
  // clear previous custom name input for new avatar
  customAvatarName.value = '';
  
  // update display states
  showAvatarComplete.value = true;
};

// select created avatar
const selectCreatedAvatar = () => {
  // check if user entered a name
  if (!customAvatarName.value.trim()) {
    alert('Please input your avatar name here!');
    return;
  }

  // set selection state and store to sessionStorage
  sessionStorage.setItem('avatarSelected', 'true');
  sessionStorage.setItem('avatarType', getAvatarType());
  sessionStorage.setItem('avatarEvolutionLevel', '1'); // initial level for all avatar types
  sessionStorage.setItem('avatarCustomName', customAvatarName.value.trim()); // save custom name
  console.log('保存的自定义avatar名字:', customAvatarName.value.trim()); // debug log
  isAvatarAlreadySelected.value = true;

  // notify other components about avatar state change
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarSelected', value: 'true' }
  }));
  window.dispatchEvent(new CustomEvent('avatarStateChange', {
    detail: { type: 'avatarType', value: getAvatarType() }
  }));

  // set and show success message
  successMessage.value = 'Avatar Selected!';
  showSuccessMessage.value = true;

  // set timeout to hide success message after 2 seconds
  setTimeout(() => {
    showSuccessMessage.value = false;

    // reset questionnaire state
    showQuestionnaire.value = false;
    showAvatarComplete.value = false;
    
  }, 2000);

  // notify DraggableAvatar component to update status
  if (avatarComponent.value) {
    avatarComponent.value.checkAvatarSelected();
  }
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

/* add fullscreen blur overlay */
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
  color: #1a5536; /* darker green */
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

/* Guide Section Styles */
.guide-section {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 30px 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e8f1e9;
}

.guide-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  align-items: start;
}

.guide-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 15px;
  background-color: #f8fdf9;
  border-radius: 12px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
  position: relative;
}

.guide-step:hover {
  transform: translateY(-5px);
  border-color: #1a5536;
  box-shadow: 0 8px 20px rgba(26, 85, 54, 0.15);
}

.step-image {
  margin-bottom: 15px;
  position: relative;
}

.step-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #1a5536;
  background-color: white;
  padding: 5px;
}

.step-number {
  background-color: #1a5536;
  color: white;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 15px;
  position: absolute;
  top: -5px;
  right: -5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.step-content h3 {
  color: #1a5536;
  font-size: 18px;
  margin: 0 0 10px 0;
  font-weight: 600;
  line-height: 1.2;
}

.step-content p {
  color: #5a3e0b;
  margin: 0;
  line-height: 1.5;
  font-size: 14px;
}

@media (max-width: 768px) {
  .guide-steps {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .guide-section {
    padding: 20px 15px;
  }
  
  .guide-step {
    padding: 15px;
  }
  
  .step-icon {
    width: 65px;
    height: 65px;
  }
  
  .step-number {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }
  
  .step-content h3 {
    font-size: 16px;
  }
  
  .step-content p {
    font-size: 13px;
  }
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
  color: #1a5536; /* darker green */
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #1a5536; /* darker green */
  transition: left 0.3s ease;
}

/* add fullscreen blur overlay */
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

/* success message box */
.success-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #1a5536; /* darker green */
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
  color: #333333; /* darker gray */
}

.greeting {
  color: #333333; /* darker gray */
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
  color: #333333; /* darker gray */
}

.feature-list li {
  margin-bottom: 15px;
  line-height: 1.5;
}

/* Create Avatar style */
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
  background-color: #1d5737;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 14px 30px;
  font-size: 18px;
  cursor: pointer;
  margin: 10px auto;
  display: block;
  transition: all 0.3s ease;
}

.questionnaire-button:hover {
  background-color: #2c8a56;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* questionnaire section style */
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

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
}

.previous-button {
  font-family: 'Merriweather', serif;
  background-color: #e0e0e0;
  color: #333333;
  border: none;
  border-radius: 30px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.previous-button:hover {
  background-color: #d0d0d0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

/* avatar completion page style */
.avatar-complete-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 400px;
}

.avatar-complete-card {
  background-color: #fffaeb;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.avatar-complete-title {
  font-size: 32px;
  font-weight: 700;
  color: #333333;
  margin-bottom: 30px;
}

.avatar-image-container {
  margin-bottom: 30px;
}

.completed-avatar-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 15px;
  border-radius: 10px;
}

.avatar-image-label {
  font-size: 18px;
  color: #333333;
  margin: 0;
}

.avatar-name-section {
  margin-bottom: 30px;
}

.avatar-name-input {
  background-color: #a8c4a2;
  color: #333333;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  border: 2px solid #a8c4a2;
  outline: none;
  min-width: 200px;
  width: 100%;
  max-width: 300px;
  text-align: center;
  font-family: 'Merriweather', serif;
  transition: all 0.3s ease;
}

.avatar-name-input:focus {
  border-color: #1a5536;
  background-color: #b8d4b2;
  box-shadow: 0 0 8px rgba(26, 85, 54, 0.3);
}

.avatar-name-input::placeholder {
  color: #666666;
  font-style: italic;
}

.avatar-name-placeholder {
  background-color: #a8c4a2;
  color: #333333;
  padding: 15px 25px;
  border-radius: 10px;
  font-size: 18px;
  font-weight: 600;
  display: inline-block;
  min-width: 150px;
}

.select-avatar-button {
  font-family: 'Merriweather', serif;
  background-color: #1a5536;
  color: white;
  border: none;
  border-radius: 30px;
  padding: 15px 40px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.3s ease;
}

.select-avatar-button:hover:not(:disabled) {
  background-color: #2c8a56;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.select-avatar-button:disabled {
  background-color: #888888;
  cursor: not-allowed;
  opacity: 0.7;
}

.completion-message {
  font-size: 18px;
  color: #8b4513;
  margin: 0;
  font-style: italic;
}

/* responsive adjustments */
@media (max-width: 992px) {
  .questionnaire-card {
    flex-direction: column;
  }
  
  .questionnaire-header {
    margin-bottom: 20px;
  }
  
  .navigation-buttons {
    flex-direction: column;
    gap: 15px;
  }
  
  .previous-button {
    order: 2;
  }
  
  .next-button {
    order: 1;
  }
}

@media (max-width: 768px) {
  .avatar-container {
    flex-direction: column;
  }
  
  .sol-card {
    margin: 0 auto;
  }
  
  .avatar-complete-card {
    padding: 30px 20px;
  }
  
  .completed-avatar-image {
    width: 150px;
    height: 150px;
  }
}
</style>