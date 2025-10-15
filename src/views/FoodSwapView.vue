<template>
  <div class="swaps-page">
    <!-- Background Image -->
    <img src="/assets/howitworkback.png" alt="background" class="background-image" />
    
    <div class="content-container">
      <h1 class="main-title">Want to try something new?</h1>
      <p class="subtitle">Welcome to the Food Lab – the place to explore engaging, interactive methods of nutrition and food learning. Find fun and easy ways to make healthy decisions here</p>
      <h2 class="section-title">Healthier Swaps</h2>
      <p class="section-subtitle">Tap a food and discover smarter swaps</p>

      <!-- Food Swaps Section -->
      <div class="recipes-section">
        <div class="white-overlay"></div>
        <div class="recipes-container">
          <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Loading healthy swaps...</p>
    </div>

          <div v-else-if="error" class="error-state">
            <div class="error-icon">⚠️</div>
            <h3>Error loading swaps</h3>
      <p>{{ error }}</p>
      <button @click="fetchSwaps" class="retry-btn">Try Again</button>
    </div>

          <div v-else class="recipes-grid">
      <div
        v-for="(food, idx) in foods"
        :key="food.from_code || idx"
              class="recipe-card"
        @click="openModal(food)"
        @keyup.enter="openModal(food)"
        tabindex="0"
        role="button"
        :aria-label="'Open swaps for ' + food.from_food"
      >
              <div class="recipe-image-container">
          <img 
            :src="getImageSrc(food.from_food)" 
            :alt="food.from_food"
                  class="recipe-image"
            @error="handleImageError($event, food.from_food)"
          />
                <div class="recipe-overlay">
          </div>
        </div>
              
              <div class="recipe-info">
                <h3 class="recipe-title">{{ food.from_food }}</h3>
                <div class="recipe-meta">
                  <span class="recipe-category">{{ getCategoryEmoji(food.category) }} {{ capitalizeFirst(food.category) }}</span>
                  <span class="quick-swap-btn">Quick Swap</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: alternatives carousel -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal" role="dialog" aria-modal="true">
      <div class="modal-content-large" ref="modalRef" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <button class="close-modal" @click="closeModal" aria-label="Close">×</button>
        
        <div class="modal-header">
        <h2 class="modal-title">{{ activeFood?.from_food }} — Healthier Options</h2>
        </div>

        <div class="modal-body">
          <div class="food-display-container">
          <transition name="slide-fade" mode="out-in">
              <div class="food-display-card" :key="currentAltIndex">
              <img 
                :src="getImageSrc(currentAlt.to_food)" 
                :alt="currentAlt.to_food"
                  class="display-food-image"
                @error="handleImageError($event, currentAlt.to_food)"
              />
            </div>
          </transition>
        </div>

          <div class="food-info">
            <p class="food-description">{{ currentAlt.to_food }} ({{ currentAlt.rationale_short }})</p>
          </div>

          <div class="modal-controls">
            <button class="control-button left-button" @click="prevAlt" aria-label="Previous">
              <span class="button-icon">‹</span>
              <span class="button-text">Swipe Left</span>
            </button>
            <button class="control-button right-button" @click="nextAlt" aria-label="Next">
              <span class="button-text">Swipe Right</span>
              <span class="button-icon">›</span>
            </button>
        </div>
      </div>
    </div>
    </div>
  



  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const foods = ref([])
const loading = ref(true)
const error = ref(null)
const isModalOpen = ref(false)
const activeFood = ref(null)
const currentAltIndex = ref(0)
const touchStartX = ref(0)
const modalRef = ref(null)
const API_BASE = '';

// Nutrition Summary Modal (matching CalculatorView structure)
// Recipe Detail Modal (EXACT COPY FROM CALCULATORVIEW)
const selectedRecipe = ref(null)
const servingMultiplier = ref(1)
const ingredientsWithMeasurements = ref([])

// Nutrition calculations (EXACT COPY FROM CALCULATORVIEW)
const calculatedNutrition = ref({
  Calories: '200',
  Protein: '10.0g',
  Carbs: '25.0g',
  Fat: '5.0g',
  Fiber: '3.0g'
})

// Food groups analysis (EXACT COPY FROM CALCULATORVIEW)
const foodGroups = ref([
  { name: 'snacks', label: 'Snacks', present: true },
  { name: 'missing', label: 'Other Groups', present: false }
])

// Australian guidelines (EXACT COPY FROM CALCULATORVIEW)
const australianGuidelines = ref({
  calories: 2200,
  protein: 50,
  carbs: 200,
  fat: 28,
  fiber: 25
})

// Nutrition percentages (EXACT COPY FROM CALCULATORVIEW)
const caloriesPercentage = ref(15)
const proteinPercentage = ref(20)
const carbsPercentage = ref(12)
const fatPercentage = ref(18)
const fiberPercentage = ref(12)

// Overall nutrition status
const overallStatus = ref('good')

// AI Chat Assistant (EXACT COPY FROM CALCULATORVIEW)
const showChatAssistant = ref(false)

// Radar chart data (EXACT COPY FROM CALCULATORVIEW)
const radarCategories = ref(['Energy', 'Heart', 'Muscle Power', 'Skin', 'Brain', 'Immune', 'Gut Health', 'Bone'])
const radarPoints = ref('150,30 220,80 280,150 220,220 150,280 80,220 20,150 80,80')
const radarDataPoints = ref([
  { x: 150, y: 30 },
  { x: 220, y: 80 },
  { x: 280, y: 150 },
  { x: 220, y: 220 },
  { x: 150, y: 280 },
  { x: 80, y: 220 },
  { x: 20, y: 150 },
  { x: 80, y: 80 }
])

// Tooltip for radar chart (EXACT COPY FROM CALCULATORVIEW)
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  category: '',
  score: 0
})

const currentAlt = computed(() => {
  if (!activeFood.value || !activeFood.value.swaps) return { to_food: '', rationale_short: '' }
  return activeFood.value.swaps[currentAltIndex.value]
})

async function fetchSwaps() {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('https://nexgentech-api.onrender.com/api/swaps-pics-teen')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    foods.value = data
  } catch (err) {
    console.error('Failed to fetch swaps:', err)
    error.value = 'Failed to load healthy swaps. Please try again.'
  } finally {
    loading.value = false
  }
}

async function openModal(food){
  try {
    // Make API call to get swaps for this specific category
    const response = await fetch(`https://nexgentech-api.onrender.com/api/swaps-pics-teen?category=${food.category}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    
    // Update the food object with the specific swaps
    activeFood.value = {
      ...food,
      swaps: data[0]?.swaps || []
    }
    currentAltIndex.value = 0
    isModalOpen.value = true
    // focus for accessibility
    requestAnimationFrame(() => modalRef.value?.focus?.())
  } catch (err) {
    console.error('Failed to fetch swaps for category:', err)
    // Fallback to using the swaps from the initial data
    activeFood.value = food
    currentAltIndex.value = 0
    isModalOpen.value = true
    requestAnimationFrame(() => modalRef.value?.focus?.())
  }
}

function closeModal(){
  isModalOpen.value = false
  activeFood.value = null
}

// Recipe Detail Modal Functions (EXACT COPY FROM CALCULATORVIEW)
const closeRecipeModal = () => {
  selectedRecipe.value = null;
};

const setupIngredientsWithMeasurements = () => {
  if (!selectedRecipe.value?.ingredients) return;
  
  let ingredients = [];
  let measurements = [];
  
  try {
    // Parse ingredients
    if (typeof selectedRecipe.value.ingredients === 'string') {
      ingredients = JSON.parse(selectedRecipe.value.ingredients);
    } else if (Array.isArray(selectedRecipe.value.ingredients)) {
      ingredients = selectedRecipe.value.ingredients;
    }
    
    // Parse measurements
    if (typeof selectedRecipe.value.measurements === 'string') {
      measurements = JSON.parse(selectedRecipe.value.measurements);
    } else if (Array.isArray(selectedRecipe.value.measurements)) {
      measurements = selectedRecipe.value.measurements;
    }
  } catch (e) {
    console.error('Error parsing ingredients/measurements:', e);
    return;
  }
  
  // Combine ingredients with their measurements
  ingredientsWithMeasurements.value = ingredients.map((ing, index) => {
    const measurement = measurements[index] || ing;
    const parsedMeasurement = parseMeasurement(measurement);
    
    return {
      name: typeof ing === 'string' ? ing : ing.name,
      unit: parsedMeasurement.unit,
      quantity: parsedMeasurement.quantity,
      originalQuantity: parsedMeasurement.quantity,
      originalUnit: parsedMeasurement.unit,
      originalMeasurement: measurement
    };
  });
};

const parseMeasurement = (measurement) => {
  if (typeof measurement !== 'string') {
    return { quantity: 1, unit: 'piece' };
  }
  
  // Regex to extract quantity and unit from measurements like "1/2 cup corn kernels", "2 tbsp fresh lemon juice", "12 fl oz sparkling water"
  const match = measurement.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*(cup|tbsp|tsp|gram|oz|piece|fl\s*oz|ml|lb|kg|inch|cm|slice|clove|bunch|head|can|bag|box|pack|serving)/i);
  
  if (match) {
    let quantity = parseFloat(match[1]);
    if (match[1].includes('/')) {
      const [numerator, denominator] = match[1].split('/');
      quantity = parseFloat(numerator) / parseFloat(denominator);
    }
    
    let unit = match[2].toLowerCase().trim();
    
    // Normalize fl oz to oz
    if (unit === 'fl oz' || unit === 'floz') {
      unit = 'oz';
    }
    
    return { quantity, unit };
  }
  
  // Fallback: try to extract just a number
  const numberMatch = measurement.match(/(\d+(?:\.\d+)?(?:\/\d+)?)/);
  if (numberMatch) {
    let quantity = parseFloat(numberMatch[1]);
    if (numberMatch[1].includes('/')) {
      const [numerator, denominator] = numberMatch[1].split('/');
      quantity = parseFloat(numerator) / parseFloat(denominator);
    }
    return { quantity, unit: 'piece' };
  }
  
  return { quantity: 1, unit: 'piece' };
};

const updateServings = () => {
  ingredientsWithMeasurements.value.forEach(ingredient => {
    ingredient.quantity = ingredient.originalQuantity * servingMultiplier.value;
  });
  updateNutrition();
};

const updateNutrition = () => {
  if (!selectedRecipe.value) return;
  
  const totalMultiplier = calculateTotalMultiplier();
  
  calculatedNutrition.value = {
    Calories: Math.round(parseFloat(selectedRecipe.value.calories || 0) * totalMultiplier),
    Protein: (parseFloat(selectedRecipe.value.protein_g || 0) * totalMultiplier).toFixed(1) + 'g',
    Carbs: (parseFloat(selectedRecipe.value.carbs_g || 0) * totalMultiplier).toFixed(1) + 'g',
    Fat: (parseFloat(selectedRecipe.value.fat_g || 0) * totalMultiplier).toFixed(1) + 'g',
    Fiber: (parseFloat(selectedRecipe.value.fiber_g || 0) * totalMultiplier).toFixed(1) + 'g'
  };
  
  // Update percentages
  caloriesPercentage.value = (calculatedNutrition.value.Calories / australianGuidelines.value.calories) * 100;
  proteinPercentage.value = (parseFloat(calculatedNutrition.value.Protein) / australianGuidelines.value.protein) * 100;
  carbsPercentage.value = (parseFloat(calculatedNutrition.value.Carbs) / australianGuidelines.value.carbs) * 100;
  fatPercentage.value = (parseFloat(calculatedNutrition.value.Fat) / australianGuidelines.value.fat) * 100;
  fiberPercentage.value = (parseFloat(calculatedNutrition.value.Fiber) / australianGuidelines.value.fiber) * 100;
  
  // Determine overall status
  const avgPercentage = (caloriesPercentage.value + proteinPercentage.value + carbsPercentage.value + fatPercentage.value) / 4;
  if (avgPercentage >= 80) overallStatus.value = 'excellent';
  else if (avgPercentage >= 60) overallStatus.value = 'good';
  else if (avgPercentage >= 40) overallStatus.value = 'moderate';
  else overallStatus.value = 'low';
};

const calculateTotalMultiplier = () => {
  let totalMultiplier = servingMultiplier.value;
  
  ingredientsWithMeasurements.value.forEach(ingredient => {
    const unitMultiplier = getUnitMultiplier(ingredient.unit);
    const quantityMultiplier = ingredient.quantity / ingredient.originalQuantity;
    totalMultiplier *= (quantityMultiplier * unitMultiplier);
  });
  
  return totalMultiplier;
};

const getUnitMultiplier = (unit) => {
  const multipliers = {
    'cup': 1,
    'grams': 0.01,
    'oz': 0.3,
    'tbsp': 0.06,
    'tsp': 0.02,
    'piece': 1
  };
  return multipliers[unit] || 1;
};

const getNutritionStatus = (nutrient) => {
  const percentages = {
    calories: caloriesPercentage.value,
    protein: proteinPercentage.value,
    carbs: carbsPercentage.value,
    fat: fatPercentage.value
  };
  
  const percentage = percentages[nutrient];
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'moderate';
  return 'low';
};

const toggleChatAssistant = () => {
  showChatAssistant.value = !showChatAssistant.value;
};

const showTooltip = (event, category) => {
  tooltip.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    category: category,
    score: 75 // Default score, could be calculated based on nutrition
  };
};

const hideTooltip = () => {
  tooltip.value.visible = false;
};

// Recipe Detail Modal Functions (EXACT COPY FROM CALCULATORVIEW)
function openRecipeModal(recipe) {
  selectedRecipe.value = recipe
  servingMultiplier.value = 1
  setupIngredientsWithMeasurements()
  updateNutrition()
}

async function openNutritionSummary() {
  // Fetch the actual recipe data from the same API as CalculatorView
  const currentSwap = currentAlt.value
  const swapName = currentSwap?.to_food || ''
  
  try {
    // Search for the recipe in the main recipes database
    const response = await fetch(`${API_BASE}/api/recipes/search?limit=200`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    const recipes = data.recipes || []
    
    // Find the recipe that matches the swap name
    const matchingRecipe = recipes.find(recipe => 
      recipe.recipe_name.toLowerCase().includes(swapName.toLowerCase()) ||
      swapName.toLowerCase().includes(recipe.recipe_name.toLowerCase())
    )
    
    if (matchingRecipe) {
      // Use the real recipe data
      selectedRecipe.value = matchingRecipe
      servingMultiplier.value = 1
      setupIngredientsWithMeasurements()
      updateNutrition()
    } else {
      // Fallback: create a basic recipe object
      selectedRecipe.value = {
        recipe_name: swapName,
        title: swapName,
        category: activeFood.value?.category || 'snacks',
        serving_size: '1 serving',
        time_display: 'Quick prep',
        calories: '200',
        protein_g: '10.0',
        carbs_g: '25.0',
        fat_g: '5.0',
        fiber_g: '3.0',
        directions: ['No cooking directions available for this swap option'],
        ingredients: [swapName],
        measurements: [`1 serving ${swapName}`]
      }
      servingMultiplier.value = 1
      setupIngredientsWithMeasurements()
      updateNutrition()
    }
  } catch (error) {
    console.error('Error fetching recipe data:', error)
    // Fallback: create a basic recipe object
    selectedRecipe.value = {
      recipe_name: swapName,
      title: swapName,
      category: activeFood.value?.category || 'snacks',
      serving_size: '1 serving',
      time_display: 'Quick prep',
      calories: '200',
      protein_g: '10.0',
      carbs_g: '25.0',
      fat_g: '5.0',
      fiber_g: '3.0',
      directions: ['No cooking directions available for this swap option'],
      ingredients: [swapName],
      measurements: [`1 serving ${swapName}`]
    }
    servingMultiplier.value = 1
    setupIngredientsWithMeasurements()
    updateNutrition()
  }
}





function prevAlt(){
  if (!activeFood.value || !activeFood.value.swaps) return
  const total = activeFood.value.swaps.length
  currentAltIndex.value = (currentAltIndex.value - 1 + total) % total
}

function nextAlt(){
  if (!activeFood.value || !activeFood.value.swaps) return
  const total = activeFood.value.swaps.length
  currentAltIndex.value = (currentAltIndex.value + 1) % total
}

function onTouchStart(e){
  touchStartX.value = e.changedTouches[0].clientX
}

function onTouchEnd(e){
  const dx = e.changedTouches[0].clientX - touchStartX.value
  if (Math.abs(dx) < 40) return
  if (dx > 0) prevAlt(); else nextAlt()
}

function onKeyDown(e){
  if (!isModalOpen.value) return
  if (e.key === 'ArrowLeft') prevAlt()
  if (e.key === 'ArrowRight') nextAlt()
}

// Helper functions
const getCategoryEmoji = (category) => {
  const emojiMap = {
    'breakfast': '🌅',
    'snacks': '🍿',
    'snack': '🍿',
    'lunch': '🥙',
    'main-meals': '🍽️',
    'dinner': '🍽️',
    'side-dishes': '🥗',
    'side-dish': '🥗',
    'desserts': '🍰',
    'dessert': '🍰',
    'beverages': '🥤',
    'beverage': '🥤',
    'drink': '🥤'
  };
  return emojiMap[category?.toLowerCase()] || '🍽️';
};

// Function to capitalize first letter
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Utility function to get image with fallback formats
const getImageSrc = (foodName) => {
  // Start with the most common format (png) and let error handler try others
  return `/food_icons/${foodName}.png`
}

// Image error handler with format fallback
const handleImageError = (event, foodName) => {
  const formats = ['png', 'webp', 'jpg', 'jpeg', 'avif']
  const currentSrc = event.target.src
  const basePath = 'food_icons/'
  
  // Extract current format from src
  const currentFormat = currentSrc.split('.').pop()
  const currentFormatIndex = formats.indexOf(currentFormat)
  
  // Try next format
  if (currentFormatIndex < formats.length - 1) {
    const nextFormat = formats[currentFormatIndex + 1]
    event.target.src = `${basePath}${foodName}.${nextFormat}`
  } else {
    // If all formats failed, show placeholder or hide image
    event.target.style.display = 'none'
  }
}


onMounted(() => {
  fetchSwaps()
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
</script>

<style scoped>
.food-swap-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Merriweather', serif;
}

/* EXACT COPY FROM CALCULATORVIEW - Recipe Detail Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content-large {
  background: white;
  border-radius: 15px;
  max-width: 95vw;
  max-height: 95vh;
  width: 1400px;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  z-index: 1001;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-modal:hover {
  background: #f0f0f0;
  color: #333;
}

.ai-chat-toggle {
  position: absolute;
  top: 15px;
  right: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1001;
}

.ai-chat-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.ai-chat-toggle.active {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
}

.ai-icon {
  font-size: 1rem;
}

.ai-text {
  font-size: 0.85rem;
}

.modal-three-columns {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  padding: 40px;
  min-height: 600px;
}

.modal-left-column,
.modal-center-column,
.modal-right-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.measurements-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.measurements-title {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 15px;
  text-align: center;
}

.measurements-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.measurement-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.measurement-label {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 4px;
}

.measurement-value {
  font-size: 0.9rem;
  font-weight: 600;
}

.nutrition-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.nutrition-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.nutrition-label {
  font-size: 0.9rem;
  color: #666;
}

.nutrition-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.ingredients-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.serving-portion-display {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 1px solid #e9ecef;
}

.serving-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.serving-label {
  font-size: 0.9rem;
  color: #666;
}

.serving-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.serving-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.serving-multiplier-label {
  font-size: 0.85rem;
  color: #666;
}

.serving-multiplier-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.85rem;
  text-align: center;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ingredient-item {
  background: white;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.ingredient-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ingredient-name {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.measurement-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.unit-dropdown {
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;
}

.quantity-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  text-align: center;
}

.directions-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.directions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.direction-item {
  background: white;
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  font-size: 0.9rem;
  line-height: 1.4;
}

.food-groups-analysis {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.food-groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-color.snacks {
  background: #ff6b6b;
}

.legend-color.missing {
  background: #ddd;
}

.legend-label {
  font-size: 0.85rem;
  color: #333;
  flex: 1;
}

.legend-status {
  font-size: 0.8rem;
  font-weight: 600;
}

.legend-status.present {
  color: #28a745;
}

.legend-status.missing {
  color: #dc3545;
}

.nutrition-radar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.radar-chart {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.radar-svg {
  width: 100%;
  height: 300px;
}

.radar-polygon {
  transition: all 0.3s ease;
}

.radar-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.radar-point:hover {
  r: 8;
  fill: #ff6b6b;
}

.radar-label {
  font-size: 12px;
  fill: #666;
  font-family: 'Merriweather', serif;
}

.radar-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  pointer-events: none;
  z-index: 1000;
}

.tooltip-content {
  text-align: center;
}

.tooltip-score {
  font-weight: 600;
  margin-top: 2px;
}

.nutrition-comparison {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.comparison-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
}

.chart-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 5px;
}

.chart-subtitle {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
}

.nutrient-comparison {
  margin-bottom: 20px;
}

.nutrient-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nutrient-name {
  font-size: 0.9rem;
  color: #333;
  font-weight: 500;
}

.current-value {
  font-size: 0.9rem;
  color: #666;
}

.progress-container {
  position: relative;
}

.progress-bar {
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-fill.calories {
  background: linear-gradient(90deg, #ff6b6b 0%, #ee5a24 100%);
}

.progress-fill.protein {
  background: linear-gradient(90deg, #4ecdc4 0%, #44a08d 100%);
}

.progress-fill.carbs {
  background: linear-gradient(90deg, #45b7d1 0%, #96c93d 100%);
}

.progress-fill.fat {
  background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
}

.progress-labels {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
}

.percentage-center {
  font-size: 0.9rem;
  font-weight: 700;
}

.recommended-text {
  font-size: 0.7rem;
  opacity: 0.9;
  margin-top: 2px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-top: 20px;
}

.summary-card h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  text-align: center;
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  font-size: 0.8rem;
}

.stat-item.excellent {
  background: #d4edda;
  color: #155724;
}

.stat-item.good {
  background: #d1ecf1;
  color: #0c5460;
}

.stat-item.moderate {
  background: #fff3cd;
  color: #856404;
}

.stat-item.low {
  background: #f8d7da;
  color: #721c24;
}

.stat-icon {
  font-size: 1rem;
}

.stat-text {
  flex: 1;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
}

.recommendation {
  text-align: center;
}

.recommendation p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .modal-three-columns {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .modal-content-large {
    width: 95vw;
    max-width: 800px;
  }
}

@media (max-width: 768px) {
  .modal-content-large {
    width: 95vw;
    max-height: 90vh;
  }
  
  .modal-three-columns {
    padding: 20px;
  }
  
  .measurements-grid {
    grid-template-columns: 1fr;
  }
  
  .nutrition-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
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
  filter: brightness(0.6) blur(4px);
  transform: scale(1.05);
}

.swaps-page::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: -1;
}

.content-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Merriweather', serif;
}

/* Typography - Matching CalculatorView */
.main-title {
  text-align: center;
  color: white;
  font-size: 3rem;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

/* Recipes Section - Matching CalculatorView */
.recipes-section {
  position: relative;
  padding: 30px 10px 10px 10px;
}

.white-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(253, 235, 208, 0.9);
  border-radius: 15px;
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.recipes-container {
  position: relative;
  z-index: 1;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #8b7765;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1a5536;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 60px 20px;
  color: #8b7765;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.retry-btn {
  background: #1a5536;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-weight: 600;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #2d7a4a;
  transform: translateY(-2px);
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.subtitle {
  font-size: 1.2rem;
  color: #ffffff;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-family: 'Merriweather', serif;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
  font-weight: 500;
  text-align: center;
}

.section-title {
  color: #ffffff;
  font-size: 2rem;
  margin-bottom: 1rem;
  font-family: 'Merriweather', serif;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  text-align: center;
}

.section-subtitle {
  color: #ffffff; 
  font-family: 'Merriweather', serif;
  font-size: 1.1rem;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
  font-weight: 500;
  text-align: center;
  margin-bottom: 2rem;
}

/* Loading and Error States */
.loading, .error {
  text-align: center;
  padding: 40px 20px;
  color: #ffffff;
  font-family: 'Merriweather', serif;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  margin: 20px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: linear-gradient(135deg, #1a5536 0%, #2d7a4a 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(26, 85, 54, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 85, 54, 0.4);
}

/* Food Grid - Matching CalculatorView Recipe Grid */
@media (max-width: 768px) {
  .recipes-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
  }
}

.recipe-card {
  background: rgba(253, 235, 208, 0.9);
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.recipe-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
}

.recipe-image-container {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.recipe-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.05);
}

.recipe-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
}

.favorite-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center; 
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.favorite-btn:hover {
  background: #ff6b6b;
  transform: scale(1.1);
}

.heart-icon {
  font-size: 1.2rem;
  color: #ff6b6b;
  transition: all 0.3s ease;
}

.heart-icon.liked {
  color: #ff1744;
  transform: scale(1.2);
}

.recipe-info {
  padding: 20px;
}

.recipe-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #8b7765;
  margin-bottom: 10px;
  font-family: 'Merriweather', serif;
  line-height: 1.3;
}

.recipe-meta {
  display: flex;
  justify-content: space-between;
  align-items: center; 
  margin-bottom: 10px;
  font-size: 0.9rem;
  color: #8b7765;
}

.recipe-category {
  font-weight: 500;
}

.recipe-time {
  opacity: 0.8;
}

.quick-swap-btn {
  text-align: center; 
  padding: 8px 12px;
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(139, 119, 101, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  font-weight: 600;
  color: white;
  font-size: 0.85rem;
}

.quick-swap-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.quick-swap-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 119, 101, 0.4);
}

.quick-swap-btn:hover::before {
  opacity: 1;
}

/* Modal - Matching CalculatorView Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content-large {
  background: rgba(253, 235, 208, 0.95);
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.close-modal {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(139, 119, 101, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-modal:hover {
  background: rgba(139, 119, 101, 0.4);
  color: white;
}

.modal-header {
  padding: 30px 30px 20px;
  text-align: center;
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nutrition-summary-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.nutrition-summary-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.modal-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  font-family: 'Merriweather', serif;
}

.modal-body {
  padding: 30px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.food-display-container {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 15px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.food-display-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.display-food-image {
  width: 100%;
  max-width: 400px;
  height: 250px;
  object-fit: contain;
}

.food-info {
  text-align: center; 
}

.food-description {
  margin: 0;
  color: #8b7765;
  background: rgba(139, 119, 101, 0.1);
  padding: 15px 20px;
  border-radius: 15px;
  font-family: 'Merriweather', serif;
  font-weight: 500;
  font-size: 1.1rem;
}

.modal-controls {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 20px;
}

.control-button {
  flex: 1;
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  color: white;
  border: none;
  padding: 15px 20px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
  font-weight: 600;
  font-size: 1rem; 
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 15px rgba(139, 119, 101, 0.3);
}

.control-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 119, 101, 0.4);
}

.button-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.button-text {
  font-size: 0.95rem;
}

.left-button {
  flex-direction: row;
}

.right-button {
  flex-direction: row-reverse;
}

/* Transitions */
.slide-fade-enter-active, .slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Nutrition Summary Modal Styles (from CalculatorView) */
.nutrition-modal {
  max-width: 1400px;
  max-height: 95vh;
}

.modal-three-columns {
  display: flex;
  gap: 20px;
  padding: 20px;
  height: 100%;
}

.modal-left-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-center-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
}

.modal-right-column {
  flex: 0.6;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section-title {
  color: #8b7765;
  font-size: 1.4rem;
  margin-bottom: 10px;
  font-family: 'Merriweather', serif;
  font-weight: 700;
}

.subsection-title {
  color: #8b7765;
  font-size: 1.1rem;
  margin-bottom: 8px;
  font-family: 'Merriweather', serif;
  font-weight: 600;
}

.measurements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.measurement-item {
  background: linear-gradient(135deg, #ff7f50 0%, #ffa07a 100%);
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.measurement-label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.9;
}

.measurement-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.nutrition-item {
  background: linear-gradient(135deg, #ff7f50 0%, #ffa07a 100%);
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.nutrition-label {
  display: block;
  font-size: 0.75rem;
  opacity: 0.9;
}

.nutrition-value {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
}

.serving-portion-display {
  background: rgba(139, 119, 101, 0.1);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid rgba(139, 119, 101, 0.2);
}

.serving-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.serving-multiplier-input {
  width: 60px;
  padding: 5px 8px;
  border: 1px solid #8b7765;
  border-radius: 5px;
  text-align: center;
  font-family: 'Merriweather', serif;
}

.ingredients-section {
  background: rgba(139, 119, 101, 0.05);
  padding: 15px;
  border-radius: 10px;
}

.ingredients-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  border-bottom: 1px solid rgba(139, 119, 101, 0.1);
}

.ingredient-quantity {
  font-weight: 600;
  color: #8b7765;
}

.ingredient-name {
  color: #666;
}

.directions-section {
  background: rgba(139, 119, 101, 0.05);
  padding: 20px;
  border-radius: 10px;
  height: fit-content;
}

.directions-list {
  padding-left: 20px;
}

.direction-item {
  margin-bottom: 10px;
  line-height: 1.5;
  color: #8b7765;
}

.food-groups-section {
  background: rgba(139, 119, 101, 0.05);
  padding: 15px;
  border-radius: 10px;
}

.food-groups-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.food-group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}

.food-group-icon {
  font-weight: bold;
}

.food-group-item.present .food-group-icon {
  color: #4caf50;
}

.food-group-item.missing .food-group-icon {
  color: #f44336;
}

.health-benefits-section,
.nutrition-guidelines-section {
  background: rgba(139, 119, 101, 0.05);
  padding: 15px;
  border-radius: 10px;
}

.radar-chart-container,
.guidelines-container {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  border: 1px solid rgba(139, 119, 101, 0.2);
}

.radar-placeholder,
.guidelines-placeholder {
  text-align: center;
  color: #8b7765;
  font-style: italic;
}

.nutrition-summary-section {
  margin-top: auto;
}

.nutrition-summary-btn-large {
  width: 100%;
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(139, 119, 101, 0.3);
}

.nutrition-summary-btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 119, 101, 0.4);
}

/* Nutrition Summary Modal Styles (exact copy from CalculatorView) */
.nutrition-modal-header {
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  color: white;
  padding: 25px 30px;
  text-align: center;
  border-radius: 15px 15px 0 0;
}

.nutrition-modal-title {
  margin: 0 0 8px 0;
  font-size: 1.6rem;
  font-weight: 700;
  font-family: 'Merriweather', serif;
}

.nutrition-modal-subtitle {
  margin: 0;
  font-size: 1rem;
  opacity: 0.9;
  font-family: 'Merriweather', serif;
}

/* AI Chat Assistant Toggle Button */
.ai-chat-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
}

.ai-chat-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 119, 101, 0.4);
}

.ai-chat-toggle.active {
  background: linear-gradient(135deg, #1a5536 0%, #2d7a4a 100%);
}

.ai-icon {
  font-size: 1.1rem;
}

.ai-text {
  font-weight: 600;
}

/* Radar Chart Styles */
.radar-polygon {
  transition: all 0.3s ease;
}

.radar-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.radar-point:hover {
  r: 8;
  fill: #2d7a4a;
}

.radar-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 1000;
  transform: translate(-50%, -100%);
}

.tooltip-content {
  text-align: center;
}

.tooltip-score {
  font-weight: bold;
  color: #4ade80;
  margin-top: 2px;
}

.modal-three-columns {
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 80vh;
}

.modal-left-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-center-column {
  flex: 1.2;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-right-column {
  flex: 0.6;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.measurements-card {
  background: white;
  padding: 15px;
  border-radius: 20px 20px 0 0;
  margin-bottom: 0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.measurements-title {
  color: #8b7765;
  font-size: 1.2rem;
  margin-bottom: 12px;
  text-align: center;
  font-family: 'Merriweather', serif;
}

.measurements-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.measurement-item {
  text-align: center;
  padding: 12px;
  background: linear-gradient(135deg, #ff9a56 0%, #ffad7a 100%);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(255, 154, 86, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.measurement-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.measurement-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(255, 154, 86, 0.4);
}

.measurement-item:hover::before {
  opacity: 1;
}

.measurement-label {
  display: block;
  color: white;
  font-size: 0.7rem;
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.measurement-value {
  display: block;
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ingredients-section,
.directions-section,
.nutrition-summary {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

/* Serving Portion Display */
.serving-portion-display {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.serving-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.serving-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.serving-value {
  font-size: 1.1rem;
  color: #495057;
  font-weight: 600;
}

.serving-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.serving-multiplier-label {
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

.serving-multiplier-input {
  width: 60px;
  padding: 8px 12px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
  background: white;
  transition: all 0.3s ease;
}

.serving-multiplier-input:focus {
  outline: none;
  border-color: #ff9a56;
  box-shadow: 0 0 0 3px rgba(255, 154, 86, 0.1);
}

.section-title {
  color: #8b7765;
  font-size: 1.4rem;
  margin-bottom: 15px;
  font-family: 'Merriweather', serif;
  font-weight: 700;
}

.subsection-title {
  color: #8b7765;
  font-size: 1.1rem;
  margin-bottom: 10px;
  font-family: 'Merriweather', serif;
  font-weight: 600;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.nutrition-item {
  text-align: center;
  padding: 12px;
  background: linear-gradient(135deg, #ff7f50 0%, #ffa07a 100%);
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(255, 127, 80, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.nutrition-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nutrition-item:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 8px 25px rgba(255, 127, 80, 0.4);
}

.nutrition-item:hover::before {
  opacity: 1;
}

.nutrition-label {
  display: block;
  color: white;
  font-size: 0.7rem;
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.nutrition-value {
  display: block;
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ingredient-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ingredient-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: #ff9a56;
}

.ingredient-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.ingredient-name {
  font-size: 1rem;
  color: #495057;
  font-weight: 600;
  flex: 1;
}

.measurement-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.unit-dropdown {
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  color: #495057;
  cursor: pointer;
  transition: all 0.3s ease;
}

.unit-dropdown:focus {
  outline: none;
  border-color: #ff9a56;
  box-shadow: 0 0 0 2px rgba(255, 154, 86, 0.1);
}

.quantity-input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
  color: #495057;
  background: white;
  transition: all 0.3s ease;
}

.quantity-input:focus {
  outline: none;
  border-color: #ff9a56;
  box-shadow: 0 0 0 2px rgba(255, 154, 86, 0.1);
}

.directions-list {
  padding-left: 20px;
}

.direction-item {
  margin-bottom: 12px;
  line-height: 1.6;
  color: #495057;
  font-size: 1rem;
}

.food-groups-analysis {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
}

.food-groups-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-color.snacks { background: linear-gradient(135deg, #ff9800, #ffb74d); }
.legend-color.breakfast { background: linear-gradient(135deg, #ff9800, #ffb74d); }
.legend-color.lunch { background: linear-gradient(135deg, #4caf50, #66bb6a); }
.legend-color.dinner { background: linear-gradient(135deg, #2196f3, #42a5f5); }
.legend-color.desserts { background: linear-gradient(135deg, #e91e63, #f06292); }
.legend-color.beverages { background: linear-gradient(135deg, #9c27b0, #ba68c8); }
.legend-color.missing { background: linear-gradient(135deg, #f44336, #ef5350); }

.legend-label {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
  flex: 1;
}

.legend-status {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
}

.legend-status.present {
  background: #d4edda;
  color: #155724;
}

.legend-status.missing {
  background: #f8d7da;
  color: #721c24;
}

.nutrition-radar {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
}

.radar-chart {
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.radar-svg {
  width: 100%;
  height: 100%;
}

.radar-label {
  font-size: 12px;
  fill: #8b7765;
  font-family: 'Merriweather', serif;
  font-weight: 600;
}

.nutrition-comparison {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e0e0e0;
}

.comparison-container {
  width: 100%;
}

.comparison-chart {
  width: 100%;
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
}

.chart-header h4 {
  color: #8b7765;
  font-size: 1.1rem;
  margin-bottom: 5px;
  font-family: 'Merriweather', serif;
}

.chart-subtitle {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.nutrient-comparison {
  margin-bottom: 20px;
}

.nutrient-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.nutrient-name {
  font-size: 0.9rem;
  color: #495057;
  font-weight: 600;
}

.current-value {
  font-size: 0.9rem;
  color: #8b7765;
  font-weight: 700;
}

.progress-container {
  position: relative;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-fill.calories { background: linear-gradient(90deg, #ff6b6b, #ff8e8e); }
.progress-fill.protein { background: linear-gradient(90deg, #4ecdc4, #44a08d); }
.progress-fill.carbs { background: linear-gradient(90deg, #f9ca24, #fbd54a); }
.progress-fill.fat { background: linear-gradient(90deg, #6c5ce7, #a29bfe); }
.progress-fill.fiber { background: linear-gradient(90deg, #00b894, #00cec9); }

.progress-labels {
  margin-top: 8px;
  font-size: 0.85rem;
}

.percentage-center {
  text-align: center;
  font-weight: 600;
  color: #1a5536;
  margin-bottom: 4px;
}

.recommended-text {
  text-align: center;
  color: #666;
  font-size: 0.8rem;
}

/* Summary Card Styles (from CalculatorView) */
.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 25px;
  border-radius: 15px;
  color: white;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.summary-card h4 {
  margin: 0 0 20px 0;
  font-size: 1.3rem;
  text-align: center;
  font-family: 'Merriweather', serif;
}

.summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.stat-item.excellent {
  background: rgba(76, 175, 80, 0.3);
  border: 2px solid rgba(76, 175, 80, 0.5);
}

.stat-item.good {
  background: rgba(33, 150, 243, 0.3);
  border: 2px solid rgba(33, 150, 243, 0.5);
}

.stat-item.moderate {
  background: rgba(255, 193, 7, 0.3);
  border: 2px solid rgba(255, 193, 7, 0.5);
}

.stat-item.needs-improvement {
  background: rgba(244, 67, 54, 0.3);
  border: 2px solid rgba(244, 67, 54, 0.5);
}

.stat-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 8px;
}

.stat-text {
  display: block;
  font-size: 0.8rem;
  opacity: 0.9;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 1.2rem;
  font-weight: 700;
}

.recommendation {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  text-align: center;
}

.recommendation p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Responsive adjustments for smaller screens */
@media (max-width: 1200px) {
  .modal-content-large {
    width: 95vw;
    max-width: 1200px;
  }
  
  .modal-three-columns {
    gap: 15px;
    padding: 15px;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
  
  .subsection-title {
    font-size: 1.1rem;
  }
}

@media (max-width: 768px) {
  .modal-content-large {
    width: 98vw;
    max-width: none;
    max-height: 98vh;
  }
  
  .modal-three-columns {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }
  
  .modal-left-column,
  .modal-center-column,
  .modal-right-column {
    flex: none;
  }
  
  .section-title {
    font-size: 1.2rem;
  }
  
  .subsection-title {
    font-size: 1rem;
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 2.5rem;
    padding: 15px 20px;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .modal-content-large {
    margin: 10px;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 20px 20px 15px;
  }
  
  .modal-title {
    font-size: 1.4rem;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .food-display-container {
    min-height: 200px;
    padding: 15px;
  }
  
  .display-food-image {
    height: 180px;
  }
  
  .control-button {
    padding: 12px 16px;
    font-size: 0.9rem;
  }
  
  .button-text {
    font-size: 0.85rem;
  }
}
</style>
