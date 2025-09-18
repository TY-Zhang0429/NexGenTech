<template>
  <div class="calculator-page">
    <!-- Background Image -->
    <img src="/assets/howitworkback.png" alt="background" class="background-image" />
    
    <div class="content-container">
      <h1 class="main-title">Nutrient Panel Calculator</h1>
      
      <!-- Filter Section -->
      <div class="filters-section">
        <div class="white-overlay"></div>
        <div class="filters-container">
          <!-- Prep Time Filter -->
          <div class="filter-group">
            <label class="filter-label">Prep Time</label>
            <div class="time-range-container">
              <div class="time-options">
                <button 
                  v-for="timeRange in timeRanges" 
                  :key="timeRange.value"
                  class="time-option"
                  :class="{ active: selectedTimeRange === timeRange.value }"
                  @click="selectTimeRange(timeRange.value)"
                >
                  {{ timeRange.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Category Filter -->
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <div class="category-pills">
              <button 
                v-for="category in categories" 
                :key="category.name"
                class="category-pill"
                :class="{ active: selectedCategories.includes(category.name) }"
                @click="toggleCategory(category.name)"
              >
                <span class="category-emoji">{{ category.emoji }}</span>
                {{ category.name }}
                <span class="category-count">({{ category.count }})</span>
              </button>
            </div>
          </div>

          <!-- Ingredients Filter -->
          <div class="filter-group">
            <label class="filter-label">Ingredients</label>
            <div class="ingredients-search">
              <input 
                v-model="ingredientSearch"
                type="text" 
                placeholder="Search ingredients..."
                class="ingredients-input"
                @input="onIngredientSearch"
              />
              <div v-if="filteredIngredients.length > 0" class="ingredients-dropdown">
                <button 
                  v-for="ingredient in filteredIngredients.slice(0, 8)" 
                  :key="ingredient"
                  class="ingredient-option"
                  @click="addIngredient(ingredient)"
                >
                  {{ ingredient }}
                </button>
              </div>
            </div>
            <div v-if="selectedIngredients.length > 0" class="selected-ingredients">
              <span 
                v-for="ingredient in selectedIngredients" 
                :key="ingredient"
                class="selected-ingredient"
              >
                {{ ingredient }}
                <button @click="removeIngredient(ingredient)" class="remove-ingredient">×</button>
              </span>
            </div>
          </div>

          <!-- Results Counter -->
          <div class="results-counter">
            <span class="counter-text">{{ filteredRecipes.length }} recipes found</span>
            <button v-if="hasActiveFilters" @click="clearFilters" class="clear-filters-btn">
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Recipe Grid Section -->
      <div class="recipes-section">
        <div class="white-overlay"></div>
        <div class="recipes-container">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading delicious recipes...</p>
          </div>
          
          <div v-else-if="filteredRecipes.length === 0" class="no-results">
            <div class="no-results-icon">🍽️</div>
            <h3>No recipes found</h3>
            <p>Try adjusting your filters to discover more delicious options!</p>
            <button @click="clearFilters" class="clear-filters-btn">Clear All Filters</button>
          </div>

          <div v-else class="recipes-grid">
            <div 
              v-for="recipe in filteredRecipes" 
              :key="recipe.unique_id"
              class="recipe-card"
              @click="selectRecipe(recipe)"
            >
              <div class="recipe-image-container">
                <img 
                  :src="`/food_icons/${recipe.image_filename}`" 
                  :alt="recipe.recipe_name"
                  class="recipe-image"
                  @error="handleImageError"
                />
                <div class="recipe-overlay">
                  <button class="favorite-btn" @click.stop="toggleFavorite(recipe)">
                    <span class="heart-icon">♡</span>
                  </button>
                </div>
              </div>
              
              <div class="recipe-info">
                <h3 class="recipe-title">{{ recipe.recipe_name }}</h3>
                <div class="recipe-meta">
                  <span class="recipe-category">{{ getCategoryEmoji(recipe.category) }} {{ recipe.category }}</span>
                  <span v-if="recipe.time_display" class="recipe-time">{{ recipe.time_display }}</span>
                </div>
                <div class="recipe-nutrition">
                  <span class="nutrition-item">{{ recipe.calories }} cal</span>
                  <span class="nutrition-item">{{ recipe.protein_g }}g protein</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recipe Detail Modal -->
    <div v-if="selectedRecipe" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <button class="close-modal" @click="closeModal">×</button>
        
        <!-- Measurements Flash Card -->
        <div class="measurements-card">
          <h2 class="measurements-title">Recipe Details</h2>
          <div class="measurements-grid">
            <div class="measurement-item">
              <span class="measurement-label">Serving Size</span>
              <span class="measurement-value">{{ selectedRecipe.serving_size || 'Varies' }}</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">Prep Time</span>
              <span class="measurement-value">{{ selectedRecipe.time_display || 'Quick prep' }}</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">Calories</span>
              <span class="measurement-value">{{ selectedRecipe.calories }} per serving</span>
            </div>
            <div class="measurement-item">
              <span class="measurement-label">Category</span>
              <span class="measurement-value">{{ selectedRecipe.category }}</span>
            </div>
          </div>
        </div>

        <!-- Ingredients List -->
        <div v-if="selectedRecipe.ingredients" class="ingredients-section">
          <h3 class="section-title">Ingredients</h3>
          <ul class="ingredients-list">
            <li v-for="(ingredient, index) in selectedRecipe.ingredients" :key="index" class="ingredient-item">
              {{ ingredient.name || ingredient }} {{ ingredient.amount ? `- ${ingredient.amount}` : '' }}
            </li>
          </ul>
        </div>

        <!-- Directions -->
        <div v-if="selectedRecipe.directions" class="directions-section">
          <h3 class="section-title">Cooking Directions</h3>
          <ol class="directions-list">
            <li v-for="(direction, index) in selectedRecipe.directions" :key="index" class="direction-item">
              {{ direction }}
            </li>
          </ol>
        </div>

        <!-- Nutrition Summary -->
        <div class="nutrition-summary">
          <h3 class="section-title">Nutrition Summary</h3>
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <span class="nutrition-label">Calories</span>
              <span class="nutrition-value">{{ selectedRecipe.calories }}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Protein</span>
              <span class="nutrition-value">{{ selectedRecipe.protein_g }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Carbs</span>
              <span class="nutrition-value">{{ selectedRecipe.carbs_g }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fat</span>
              <span class="nutrition-value">{{ selectedRecipe.fat_g }}g</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fiber</span>
              <span class="nutrition-value">{{ selectedRecipe.fiber_g }}g</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

// Reactive data
const loading = ref(false);
const recipes = ref([]);
const selectedRecipe = ref(null);
const ingredientSearch = ref('');
const filteredIngredients = ref([]);

// Filter state
const selectedTimeRange = ref('');
const selectedCategories = ref([]);
const selectedIngredients = ref([]);

// Filter options
const timeRanges = ref([
  { value: '0-5', label: 'Super Quick (0-5 min)' },
  { value: '5-15', label: 'Quick Prep (5-15 min)' },
  { value: '15-30', label: 'Some Time (15-30 min)' },
  { value: '30+', label: 'Weekend Project (30+ min)' }
]);

const categories = ref([]);
const allIngredients = ref([]);

// Computed properties
const filteredRecipes = computed(() => {
  return recipes.value.filter(recipe => {
    // Time filter
    if (selectedTimeRange.value) {
      const totalTime = recipe.total_time || 0;
      const timeRange = selectedTimeRange.value;
      
      switch (timeRange) {
        case '0-5':
          if (totalTime > 5) return false;
          break;
        case '5-15':
          if (totalTime <= 5 || totalTime > 15) return false;
          break;
        case '15-30':
          if (totalTime <= 15 || totalTime > 30) return false;
          break;
        case '30+':
          if (totalTime <= 30) return false;
          break;
      }
    }

    // Category filter
    if (selectedCategories.value.length > 0) {
      if (!selectedCategories.value.includes(recipe.category)) return false;
    }

    // Ingredients filter
    if (selectedIngredients.value.length > 0) {
      if (!recipe.ingredients) return false;
      const recipeIngredients = Array.isArray(recipe.ingredients) 
        ? recipe.ingredients.map(ing => ing.name || ing).map(name => name.toLowerCase())
        : [];
      
      const hasMatchingIngredient = selectedIngredients.value.some(selectedIng => 
        recipeIngredients.some(recipeIng => 
          recipeIng.includes(selectedIng.toLowerCase())
        )
      );
      if (!hasMatchingIngredient) return false;
    }

    return true;
  });
});

const hasActiveFilters = computed(() => {
  return selectedTimeRange.value || 
         selectedCategories.value.length > 0 || 
         selectedIngredients.value.length > 0;
});

// Methods
const selectTimeRange = (range) => {
  selectedTimeRange.value = selectedTimeRange.value === range ? '' : range;
};

const toggleCategory = (category) => {
  const index = selectedCategories.value.indexOf(category);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(category);
  }
};

const onIngredientSearch = () => {
  if (ingredientSearch.value.length < 2) {
    filteredIngredients.value = [];
    return;
  }
  
  filteredIngredients.value = allIngredients.value.filter(ingredient =>
    ingredient.toLowerCase().includes(ingredientSearch.value.toLowerCase())
  );
};

const addIngredient = (ingredient) => {
  if (!selectedIngredients.value.includes(ingredient)) {
    selectedIngredients.value.push(ingredient);
  }
  ingredientSearch.value = '';
  filteredIngredients.value = [];
};

const removeIngredient = (ingredient) => {
  const index = selectedIngredients.value.indexOf(ingredient);
  if (index > -1) {
    selectedIngredients.value.splice(index, 1);
  }
};

const clearFilters = () => {
  selectedTimeRange.value = '';
  selectedCategories.value = [];
  selectedIngredients.value = [];
  ingredientSearch.value = '';
  filteredIngredients.value = [];
};

const selectRecipe = (recipe) => {
  selectedRecipe.value = recipe;
};

const closeModal = () => {
  selectedRecipe.value = null;
};

const toggleFavorite = (recipe) => {
  // TODO: Implement favorite functionality
  console.log('Toggle favorite for:', recipe.recipe_name);
};

const handleImageError = (event) => {
  event.target.src = '/assets/placeholder-food.png';
};

const getCategoryEmoji = (category) => {
  const emojiMap = {
    'breakfast': '🌅',
    'snack': '🍿',
    'lunch': '🥙',
    'dinner': '🍽️',
    'dessert': '🍰',
    'beverage': '🥤',
    'drink': '🥤'
  };
  return emojiMap[category?.toLowerCase()] || '🍽️';
};

// API calls
const API_BASE = ''; // Use relative paths for local development (Vite proxy will handle it)

const fetchRecipes = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE}/api/recipes/search?limit=50`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    recipes.value = data.recipes || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    recipes.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchFilterOptions = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/recipes/filters`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    categories.value = data.categories || [];
    allIngredients.value = data.ingredients || [];
  } catch (error) {
    console.error('Error fetching filter options:', error);
    // Set some default data for development
    categories.value = [
      { name: 'breakfast', count: 0, emoji: '🌅' },
      { name: 'lunch', count: 0, emoji: '🥙' },
      { name: 'dinner', count: 0, emoji: '🍽️' },
      { name: 'snack', count: 0, emoji: '🍿' },
      { name: 'dessert', count: 0, emoji: '🍰' }
    ];
    allIngredients.value = [];
  }
};

// Lifecycle
onMounted(() => {
  fetchFilterOptions();
  fetchRecipes();
});
</script>

<style scoped>
.calculator-page {
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
  filter: brightness(0.6) blur(4px);
  transform: scale(1.05);
}

.calculator-page::before {
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Merriweather', serif;
  position: relative;
  z-index: 1;
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

.filters-section {
  position: relative;
  padding: 10px;
  margin-bottom: 2rem;
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

.filters-container {
  position: relative;
  padding: 30px;
  z-index: 1;
}

.filter-group {
  margin-bottom: 25px;
}

.filter-label {
  display: block;
  color: #8b7765;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 15px;
  font-family: 'Merriweather', serif;
}

.time-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.time-option {
  padding: 10px 20px;
  border: 2px solid #d4c4a8;
  background: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  color: #8b7765;
}

.time-option:hover {
  border-color: #1a5536;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.time-option.active {
  background: #1a5536;
  color: white;
  border-color: #1a5536;
}

.category-pills {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.category-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: 2px solid #d4c4a8;
  background: white;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  color: #8b7765;
}

.category-pill:hover {
  border-color: #1a5536;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.category-pill.active {
  background: #1a5536;
  color: white;
  border-color: #1a5536;
}

.category-emoji {
  font-size: 1.1rem;
}

.category-count {
  font-size: 0.8rem;
  opacity: 0.8;
}

.ingredients-search {
  position: relative;
}

.ingredients-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #d4c4a8;
  border-radius: 25px;
  font-family: 'Merriweather', serif;
  font-size: 1rem;
  color: #8b7765;
  background: white;
  transition: border-color 0.3s ease;
}

.ingredients-input:focus {
  outline: none;
  border-color: #1a5536;
}

.ingredients-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #d4c4a8;
  border-top: none;
  border-radius: 0 0 15px 15px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
}

.ingredient-option {
  width: 100%;
  padding: 10px 20px;
  text-align: left;
  border: none;
  background: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: 'Merriweather', serif;
  color: #8b7765;
}

.ingredient-option:hover {
  background: #f0f0f0;
}

.selected-ingredients {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.selected-ingredient {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #1a5536;
  color: white;
  border-radius: 15px;
  font-size: 0.9rem;
  font-family: 'Merriweather', serif;
}

.remove-ingredient {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  margin-left: 5px;
}

.results-counter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #d4c4a8;
}

.counter-text {
  color: #8b7765;
  font-weight: 600;
  font-size: 1.1rem;
}

.clear-filters-btn {
  padding: 8px 16px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.clear-filters-btn:hover {
  background: #f44336;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.recipes-section {
  position: relative;
  padding: 10px;
}

.recipes-container {
  position: relative;
  z-index: 1;
}

.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.no-results-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.no-results h3 {
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.no-results p {
  font-size: 1.1rem;
  margin-bottom: 30px;
  opacity: 0.9;
}

.recipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  padding: 20px 0;
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

.recipe-nutrition {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #8b7765;
}

.nutrition-item {
  font-weight: 500;
}

/* Modal Styles */
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

.modal-content {
  background: white;
  border-radius: 15px;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  width: 100%;
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 20px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #8b7765;
  z-index: 10;
}

.measurements-card {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 15px 15px 0 0;
  margin-bottom: 0;
}

.measurements-title {
  color: #8b7765;
  font-size: 1.8rem;
  margin-bottom: 20px;
  text-align: center;
  font-family: 'Merriweather', serif;
}

.measurements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.measurement-item {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.measurement-label {
  display: block;
  color: #8b7765;
  font-size: 0.9rem;
  margin-bottom: 5px;
  font-weight: 500;
}

.measurement-value {
  display: block;
  color: #1a5536;
  font-size: 1.1rem;
  font-weight: 600;
}

.ingredients-section,
.directions-section,
.nutrition-summary {
  padding: 30px;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  color: #8b7765;
  font-size: 1.5rem;
  margin-bottom: 20px;
  font-family: 'Merriweather', serif;
}

.ingredients-list,
.directions-list {
  list-style: none;
  padding: 0;
}

.ingredient-item,
.direction-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  color: #8b7765;
  line-height: 1.6;
}

.direction-item {
  counter-increment: step-counter;
  position: relative;
  padding-left: 30px;
}

.directions-list {
  counter-reset: step-counter;
}

.direction-item::before {
  content: counter(step-counter);
  position: absolute;
  left: 0;
  top: 10px;
  background: #1a5536;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.nutrition-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
}

.nutrition-label {
  display: block;
  color: #8b7765;
  font-size: 0.9rem;
  margin-bottom: 5px;
  font-weight: 500;
}

.nutrition-value {
  display: block;
  color: #1a5536;
  font-size: 1.2rem;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .recipes-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
  }
  
  .filters-container {
    padding: 25px;
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 2rem;
    margin-bottom: 2rem;
  }
  
  .recipes-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
  }
  
  .time-options,
  .category-pills {
    gap: 8px;
  }
  
  .time-option,
  .category-pill {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
  
  .filters-container {
    padding: 20px;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .measurements-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
  .content-container {
    padding: 10px;
  }
  
  .main-title {
    font-size: 1.8rem;
  }
  
  .recipes-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .time-options {
    flex-direction: column;
  }
  
  .category-pills {
    flex-direction: column;
  }
  
  .time-option,
  .category-pill {
    text-align: center;
  }
  
  .results-counter {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
</style>