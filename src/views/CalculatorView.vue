<template>
  <div class="calculator-page">
    <!-- Background Image -->
    <img src="/assets/howitworkback.png" alt="background" class="background-image" />
    
    <div class="content-container">
      <h1 class="main-title">Mix, Match, Make It Yours</h1>
      <p class="subtitle">Use the filters below to discover recipes that fit your vibe. Pick your prep time, choose your category, search ingredients - Find exactly what you're craving.</p>

      <!-- ============ NEW: Image → Recipe/Nutrition Analyzer (Front-end only) ============ -->
      <div class="filters-section" style="margin-bottom: 28px;">
        <div class="white-overlay"></div>
        <div class="filters-container">
          <label class="filter-label">Image Recognition (Beta)</label>

          <div class="image-analyze-row">
            <input
              class="image-input"
              type="file"
              accept="image/png,image/jpeg"
              @change="onImagePicked"
            />
            <button
              class="analyze-btn"
              :disabled="!pickedFile || analyzing"
              @click="analyzePickedImage"
            >
              {{ analyzing ? 'Analyzing…' : 'Analyze Image → Recipe & Nutrition' }}
            </button>
          </div>

          <div class="image-preview-wrap" v-if="previewUrl || analyzeError || analyzeTips.length">
            <div v-if="previewUrl" class="image-preview">
              <img :src="previewUrl" alt="preview"/>
            </div>

            <div v-if="analyzeError" class="analyze-error">⚠️ {{ analyzeError }}</div>

            <ul v-if="analyzeTips.length" class="analyze-tips">
              <li v-for="(t,i) in analyzeTips" :key="i">💡 {{ t }}</li>
            </ul>

            <p class="disclaimer" style="margin-top:8px">
              For learning purposes only, not medical advice.
            </p>
          </div>
        </div>
      </div>
      <!-- ========================== /NEW block ========================== -->

      <!-- Filter Section (original) -->
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
                <span class="category-emoji">{{ getCategoryEmoji(category.name) }}</span>
                {{ capitalizeFirst(category.name) }}
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
                  v-for="ingredient in filteredIngredients.slice(0, 3)" 
                  :key="ingredient"
                  class="ingredient-option"
                  @click="addIngredient(ingredient)"
                >
                  {{ ingredient }}
                </button>
                <div v-if="filteredIngredients.length > 3" class="ingredient-more">
                  +{{ filteredIngredients.length - 3 }} more...
                </div>
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

      <!-- Pagination Controls (Top) -->
      <div v-if="totalPages > 1" class="pagination-container-top">
        <div class="pagination">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="pagination-btn prev-btn"
          >
            ← Previous
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in totalPages" 
              :key="page"
              @click="goToPage(page)"
              :class="['page-btn', { active: currentPage === page }]"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="pagination-btn next-btn"
          >
            Next →
          </button>
        </div>
        
          <div class="pagination-info">
            Showing {{ ((currentPage - 1) * recipesPerPage) + 1 }} - {{ Math.min(currentPage * recipesPerPage, filteredRecipes.length) }} of {{ filteredRecipes.length }} recipes
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
              v-for="recipe in paginatedRecipes" 
              :key="recipe.unique_id"
              class="recipe-card"
              @click="selectRecipe(recipe)"
            >
              <div class="recipe-image-container">
                <img 
                  :src="`/food_icons/${recipe.image_filename}.png`" 
                  :alt="recipe.recipe_name"
                  class="recipe-image"
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
                  <span class="recipe-category">{{ getCategoryEmoji(recipe.category) }} {{ capitalizeFirst(recipe.category) }}</span>
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
              <span class="measurement-value">{{ capitalizeFirst(selectedRecipe.category) }}</span>
            </div>
          </div>
        </div>

        <!-- Nutrition Summary -->
        <div class="nutrition-summary">
          <h3 class="section-title">Nutrition Summary</h3>
          <div class="nutrition-grid">
            <div class="nutrition-item">
              <span class="nutrition-label">Calories</span>
              <span class="nutrition-value">{{ calculatedNutrition.Calories }}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Protein</span>
              <span class="nutrition-value">{{ calculatedNutrition.Protein }}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Carbs</span>
              <span class="nutrition-value">{{ calculatedNutrition.Carbs }}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fat</span>
              <span class="nutrition-value">{{ calculatedNutrition.Fat }}</span>
            </div>
            <div class="nutrition-item">
              <span class="nutrition-label">Fiber</span>
              <span class="nutrition-value">{{ calculatedNutrition.Fiber }}</span>
            </div>
          </div>
        </div>

        <!-- Ingredients List -->
        <div v-if="selectedRecipe.ingredients" class="ingredients-section">
          <h3 class="section-title">Ingredients</h3>
          <div class="ingredients-list">
            <div 
              v-for="(ingredient, index) in ingredientsWithMeasurements" 
              :key="index" 
              class="ingredient-item"
            >
              <div class="ingredient-info">
                <span class="ingredient-name">{{ capitalizeFirst(ingredient.name || ingredient) }}</span>
                <div class="measurement-controls">
                  <select 
                    v-model="ingredient.unit" 
                    @change="updateNutrition(ingredient)"
                    class="unit-dropdown"
                  >
                    <option value="cup">Cup</option>
                    <option value="grams">Grams</option>
                    <option value="oz">Oz</option>
                    <option value="tbsp">Tablespoon</option>
                    <option value="tsp">Teaspoon</option>
                    <option value="piece">Piece</option>
                  </select>
                  <input 
                    v-model.number="ingredient.quantity" 
                    @input="updateNutrition"
                    type="number" 
                    min="0" 
                    step="0.1"
                    class="quantity-input"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </div>
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

        <!-- Combined Visualizations -->
        <div class="combined-visualizations">
          <h3 class="section-title">Nutrition Analysis</h3>
          <p class="analysis-description">Comprehensive view of food groups and health benefits in your recipe.</p>
          
          <div class="visualizations-container">
            <!-- Food Groups Analysis -->
            <div class="food-groups-analysis">
              <h4 class="subsection-title">Food Groups in This Recipe</h4>
              <div class="food-groups-list">
                <div class="legend-item" v-for="group in foodGroups" :key="group.name">
                  <div class="legend-color" :class="group.name"></div>
                  <span class="legend-label">{{ group.label }}</span>
                  <span class="legend-status" :class="{ present: group.present, missing: !group.present }">
                    {{ group.present ? '✓ Present' : '✗ Missing' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Nutrition Radar Chart -->
            <div class="nutrition-radar">
              <h4 class="subsection-title">Health Benefits Radar</h4>
              <div class="radar-chart">
                <svg viewBox="0 0 300 300" class="radar-svg">
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <circle cx="150" cy="150" r="90" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <circle cx="150" cy="150" r="60" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <circle cx="150" cy="150" r="30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="150" y1="30" x2="150" y2="270" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="30" y1="150" x2="270" y2="150" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="60" y1="60" x2="240" y2="240" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="240" y1="60" x2="60" y2="240" stroke="#e0e0e0" stroke-width="1"/>
                  <polygon 
                    :points="radarPoints" 
                    fill="rgba(26, 85, 54, 0.3)" 
                    stroke="#1a5536" 
                    stroke-width="2"
                    class="radar-polygon"
                  />
                  <circle 
                    v-for="(point, index) in radarDataPoints" 
                    :key="index"
                    :cx="point.x" 
                    :cy="point.y" 
                    r="6" 
                    fill="#1a5536"
                    class="radar-point"
                    @mouseenter="showTooltip($event, radarCategories[index])"
                    @mouseleave="hideTooltip"
                  />
                  <text x="150" y="20" text-anchor="middle" class="radar-label">Energy</text>
                  <text x="220" y="80" text-anchor="middle" class="radar-label">Heart</text>
                  <text x="280" y="150" text-anchor="middle" class="radar-label">Muscle</text>
                  <text x="280" y="160" text-anchor="middle" class="radar-label">Power</text>
                  <text x="220" y="220" text-anchor="middle" class="radar-label">Skin</text>
                  <text x="150" y="280" text-anchor="middle" class="radar-label">Brain</text>
                  <text x="80" y="220" text-anchor="middle" class="radar-label">Immune</text>
                  <text x="20" y="150" text-anchor="middle" class="radar-label">Gut</text>
                  <text x="20" y="160" text-anchor="middle" class="radar-label">Health</text>
                  <text x="80" y="80" text-anchor="middle" class="radar-label">Bone</text>
                </svg>
                <div v-if="tooltip.visible" class="radar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
                  <div class="tooltip-content">
                    <strong>{{ tooltip.category }}</strong>
                    <div class="tooltip-score">{{ Math.round(tooltip.score) }}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Nutrition Comparison Visualization -->
        <div class="nutrition-comparison">
          <h3 class="section-title">Nutrition vs Australian Guidelines (15-19 years)</h3>
          <div class="comparison-container">
            <div class="comparison-chart">
              <div class="chart-header">
                <h4>Daily Intake Comparison</h4>
                <p class="chart-subtitle">How this meal contributes to your daily needs</p>
              </div>
              
              <!-- Calories Comparison -->
              <div class="nutrient-comparison">
                <div class="nutrient-label">
                  <span class="nutrient-name">Calories</span>
                  <span class="current-value">{{ calculatedNutrition.Calories }}</span>
                </div>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill calories" 
                      :style="{ width: caloriesPercentage + '%' }"
                    ></div>
                  </div>
                  <div class="progress-labels">
                    <span class="current">{{ Math.round(caloriesPercentage) }}%</span>
                    <span class="recommended">Recommended: {{ australianGuidelines.calories }} cal</span>
                  </div>
                </div>
              </div>

              <!-- Protein Comparison -->
              <div class="nutrient-comparison">
                <div class="nutrient-label">
                  <span class="nutrient-name">Protein</span>
                  <span class="current-value">{{ calculatedNutrition.Protein }}</span>
                </div>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill protein" 
                      :style="{ width: proteinPercentage + '%' }"
                    ></div>
                  </div>
                  <div class="progress-labels">
                    <span class="current">{{ Math.round(proteinPercentage) }}%</span>
                    <span class="recommended">Recommended: {{ australianGuidelines.protein }}g</span>
                  </div>
                </div>
              </div>

              <!-- Carbs Comparison -->
              <div class="nutrient-comparison">
                <div class="nutrient-label">
                  <span class="nutrient-name">Carbs</span>
                  <span class="current-value">{{ calculatedNutrition.Carbs }}</span>
                </div>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill carbs" 
                      :style="{ width: carbsPercentage + '%' }"
                    ></div>
                  </div>
                  <div class="progress-labels">
                    <span class="current">{{ Math.round(carbsPercentage) }}%</span>
                    <span class="recommended">Recommended: {{ australianGuidelines.carbs }}g</span>
                  </div>
                </div>
              </div>

              <!-- Fat Comparison -->
              <div class="nutrient-comparison">
                <div class="nutrient-label">
                  <span class="nutrient-name">Fat</span>
                  <span class="current-value">{{ calculatedNutrition.Fat }}</span>
                </div>
                <div class="progress-container">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill fat" 
                      :style="{ width: fatPercentage + '%' }"
                    ></div>
                  </div>
                  <div class="progress-labels">
                    <span class="current">{{ Math.round(fatPercentage) }}%</span>
                    <span class="recommended">Recommended: {{ australianGuidelines.fat }}g</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Card -->
            <div class="summary-card">
              <h4>Nutrition Summary</h4>
              <div class="summary-stats">
                <div class="stat-item" :class="getNutritionStatus('calories')">
                  <span class="stat-icon">🔥</span>
                  <span class="stat-text">Calories</span>
                  <span class="stat-value">{{ Math.round(caloriesPercentage) }}%</span>
                </div>
                <div class="stat-item" :class="getNutritionStatus('protein')">
                  <span class="stat-icon">💪</span>
                  <span class="stat-text">Protein</span>
                  <span class="stat-value">{{ Math.round(proteinPercentage) }}%</span>
                </div>
                <div class="stat-item" :class="getNutritionStatus('carbs')">
                  <span class="stat-icon">⚡</span>
                  <span class="stat-text">Carbs</span>
                  <span class="stat-value">{{ Math.round(carbsPercentage) }}%</span>
                </div>
                <div class="stat-item" :class="getNutritionStatus('fat')">
                  <span class="stat-icon">🥑</span>
                  <span class="stat-text">Fat</span>
                  <span class="stat-value">{{ Math.round(fatPercentage) }}%</span>
                </div>
              </div>
              <div class="recommendation">
                <p v-if="overallStatus === 'excellent'">🌟 Excellent! This meal provides great nutrition for your age group.</p>
                <p v-else-if="overallStatus === 'good'">👍 Good choice! This meal contributes well to your daily nutrition needs.</p>
                <p v-else-if="overallStatus === 'moderate'">⚠️ Moderate nutrition. Consider adding more variety to your meal.</p>
                <p v-else>💡 Consider balancing this meal with other nutritious foods throughout the day.</p>
              </div>
            </div>
          </div>
        </div>
      </div> <!-- /modal-content -->
    </div> <!-- /modal-overlay -->
    <!-- Candidate Picker Modal (outside of the existing Recipe Detail Modal) -->
    <div v-if="showCandidateModal" class="candidate-overlay" @click="showCandidateModal=false">
      <div class="candidate-panel" @click.stop>
        <h3 class="section-title">Pick a recipe</h3>
        <div class="candidate-grid">
          <div class="candidate-card" v-for="c in candidateRecipes" :key="c.id"
              @click="() => { selectRecipe(c); showCandidateModal=false; }">
            <img :src="c.image_url || (`/food_icons/${encodeURIComponent(c.image_filename || '')}.png`)" alt="">
            <div class="title">{{ c.recipe_name }}</div>
            <div class="meta">{{ c.calories }} cal · {{ c.protein_g }}g protein</div>
          </div>
        </div>
        <button class="close-btn" @click="showCandidateModal=false">Cancel</button>
      </div>
    </div>

  </div> <!-- /calculator-page -->
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';

const candidateRecipes = ref([]);
const showCandidateModal = ref(false);



const pickedFile = ref(null);
const previewUrl = ref('');
const analyzing = ref(false);
const analyzeError = ref('');
const analyzeTips = ref([]);

// label → canonical dish → ingredients (expandable)
const LABEL_TO_ING = {
  burger: ['bun','beef patty','cheddar','lettuce','tomato','ketchup'],
  cheeseburger: ['bun','beef patty','cheddar','lettuce','tomato'],
  pizza: ['pizza base','tomato sauce','mozzarella','olive oil'],
  salad: ['lettuce','tomato','cucumber','olive oil'],
  pasta: ['spaghetti','olive oil','garlic','parmesan'],
  sushi: ['rice','nori','salmon','soy sauce'],
  sandwich: ['bread','ham','cheddar','lettuce'],
  cereal: ['cereal','milk'],
  oatmeal: ['oats','milk'],
  pancake: ['flour','milk','egg','butter']
};

// very small per-100g nutrition DB (kcal/protein/carbs/fat/fiber)
const NUTRITION_100G = {
  'bun': {kcal: 260, p:9, c:49, f:3, fi:2.5},
  'beef patty': {kcal: 250, p:26, c:0, f:17, fi:0},
  'cheddar': {kcal: 402, p:25, c:1.3, f:33, fi:0},
  'lettuce': {kcal: 15, p:1.4, c:2.9, f:0.2, fi:1.3},
  'tomato': {kcal: 18, p:0.9, c:3.9, f:0.2, fi:1.2},
  'ketchup': {kcal: 112, p:1.3, c:26, f:0.2, fi:0.3},
  'pizza base': {kcal: 265, p:9, c:52, f:3.2, fi:2.7},
  'tomato sauce': {kcal: 80, p:2, c:14, f:1, fi:2},
  'mozzarella': {kcal: 280, p:28, c:3, f:17, fi:0},
  'olive oil': {kcal: 884, p:0, c:0, f:100, fi:0},
  'cucumber': {kcal: 16, p:0.7, c:3.6, f:0.1, fi:0.5},
  'spaghetti': {kcal: 158, p:5.8, c:30, f:0.9, fi:1.8},
  'garlic': {kcal: 149, p:6.4, c:33, f:0.5, fi:2.1},
  'parmesan': {kcal: 431, p:38, c:4.1, f:29, fi:0},
  'rice': {kcal: 130, p:2.4, c:28, f:0.3, fi:0.4},
  'nori': {kcal: 35, p:5.8, c:5.1, f:0.3, fi:0.3},
  'salmon': {kcal: 208, p:20, c:0, f:13, fi:0},
  'soy sauce': {kcal: 53, p:8, c:4.9, f:0.6, fi:0.8},
  'bread': {kcal: 265, p:9, c:49, f:3.2, fi:2.7},
  'ham': {kcal: 145, p:20, c:1.5, f:6, fi:0},
  'cereal': {kcal: 380, p:7, c:84, f:2, fi:9},
  'milk': {kcal: 64, p:3.4, c:5, f:3.6, fi:0},
  'oats': {kcal: 389, p:17, c:66, f:7, fi:10},
  'flour': {kcal: 364, p:10, c:76, f:1, fi:2.7},
  'egg': {kcal: 155, p:13, c:1.1, f:11, fi:0},
  'butter': {kcal: 717, p:0.9, c:0.1, f:81, fi:0}
};

// default grams per ingredient (simple assumptions)
const DEFAULT_QTY = {
  grams: 100, cup: 240, oz: 28.35, tbsp: 15, tsp: 5, piece: 50
};
// ================= /NEW =================

// --------- existing states ---------
const loading = ref(false);
const recipes = ref([]);
const selectedRecipe = ref(null);
const ingredientSearch = ref('');
const filteredIngredients = ref([]);
const ingredientsWithMeasurements = ref([]);
const baseNutrition = ref({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

// Australian Dietary Guidelines
const australianGuidelines = ref({
  calories: 2200, protein: 65, carbs: 300, fat: 73, fiber: 25
});

// Filters
const selectedTimeRange = ref('');
const selectedCategories = ref([]);
const selectedIngredients = ref([]);

// Pagination
const currentPage = ref(1);
const recipesPerPage = 9;

// Filter options
const timeRanges = ref([
  { value: '0-5', label: 'Super Quick (0-5 min)' },
  { value: '5-15', label: 'Quick Prep (5-15 min)' },
  { value: '15-30', label: 'Half-Hour Hero (15-30 min)' },
  { value: '30+', label: 'Weekend Project (30+ min)' }
]);

const categories = ref([]);
const allIngredients = ref([]);

// -------------- NEW: image handlers --------------
function onImagePicked(e) {
  analyzeError.value = '';
  analyzeTips.value = [];
  const f = e.target.files?.[0];
  pickedFile.value = f || null;
  previewUrl.value = f ? URL.createObjectURL(f) : '';
}

async function analyzePickedImage() {
  const LAMBDA_URL = 'https://ujfitbo3467ezuajq4ahqlup2u0iaasm.lambda-url.us-east-1.on.aws/';
  if (!pickedFile.value) return;

  analyzeError.value = '';
  analyzeTips.value = [];
  analyzing.value = true;

  try {
    const resp = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': pickedFile.value.type || 'application/octet-stream' },
      body: pickedFile.value
    });

    // Debug output
    console.log('[vision] status:', resp.status, resp.statusText);
    const text = await resp.text();
    console.log('[vision] raw body:', text);

    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!resp.ok) { analyzeError.value = data?.error || `${resp.status} ${resp.statusText}`; return; }

    analyzeTips.value.push(`Detected: ${data.label} (${data.score}%)`);

    if (Array.isArray(data.candidates) && data.candidates.length) {
      candidateRecipes.value = data.candidates;
      showCandidateModal.value = true;          // pop up 3 candidates
    } else {
      // use synthetic recipe
      const key = data.label;
      const ings = LABEL_TO_ING[key] || [key];
      const s = buildSyntheticRecipe(key, ings);
      const n = computeNutritionFromIngredients(ings);
      Object.assign(s, {
        calories: Math.round(n.kcal),
        protein_g: round1(n.p), carbs_g: round1(n.c),
        fat_g: round1(n.f), fiber_g: round1(n.fi)
      });
      selectRecipe(s);
    }
  } catch (err) {
    console.error('[vision] fetch error:', err);
    analyzeError.value = err.message || 'Network error';
  } finally {
    analyzing.value = false;
  }
}

function buildSyntheticRecipe(title, ingredients) {
  const stepsMap = {
    burger: ['Toast bun','Pan-fry patty','Layer cheese & veg','Assemble'],
    pizza: ['Preheat oven','Spread sauce','Add cheese','Bake 10–12 min'],
    salad: ['Chop veggies','Toss with oil & salt','Serve']
  };
  const lower = title.toLowerCase();
  const timeText = (lower.includes('salad') ? '5-15 min' :
                   lower.includes('pizza') ? '15-30 min' : '5-15 min');
  return {
    unique_id: `ai_${Date.now()}`,
    source_table: 'ai_generated',
    id: 0,
    recipe_name: title[0].toUpperCase() + title.slice(1),
    category: 'lunch',
    serving_size: '1 serving',
    prep_time_minutes: null,
    cook_time_minutes: null,
    total_time: null,
    time_display: timeText,
    // nutrition will be filled after compute
    calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0,
    // these fields will be parsed in your UI
    ingredients: ingredients,
    measurements: null,
    directions: stepsMap[lower] || ['Prepare ingredients','Assemble and serve'],
    image_filename: title.toLowerCase().replace(/\s+/g,'-')
  };
}

function computeNutritionFromIngredients(ings) {
  // assume each ingredient ~100g as default
  let kcal=0, p=0, c=0, f=0, fi=0;
  ings.forEach(name=>{
    const row = NUTRITION_100G[name];
    if (row) { kcal+=row.kcal; p+=row.p; c+=row.c; f+=row.f; fi+=row.fi; }
  });
  // prevent zero nutrition
  if ((kcal+p+c+f+fi)===0 && ings.length>0) {
    // 80kcal for unknown item
    kcal = 80*ings.length;
  }
  return {kcal, p, c, f, fi};
}

function round1(n){ return Math.round(n*10)/10; }
// -------------- /NEW --------------

// ----------------- filters & list -----------------
const filteredRecipes = computed(() => {
  const filtered = recipes.value.filter(recipe => {
    if (selectedTimeRange.value) {
      const totalTime = recipe.total_time || 0;
      const timeRange = selectedTimeRange.value;
      switch (timeRange) {
        case '0-5': if (totalTime > 5) return false; break;
        case '5-15': if (totalTime <= 5 || totalTime > 15) return false; break;
        case '15-30': if (totalTime <= 15 || totalTime > 30) return false; break;
        case '30+': if (totalTime <= 30) return false; break;
      }
    }
    if (selectedCategories.value.length > 0) {
      if (!selectedCategories.value.includes(recipe.category)) return false;
    }
    if (selectedIngredients.value.length > 0) {
      if (!recipe.ingredients) return false;
      let recipeIngredients = [];
      try {
        if (typeof recipe.ingredients === 'string') {
          recipeIngredients = JSON.parse(recipe.ingredients);
        } else if (Array.isArray(recipe.ingredients)) {
          recipeIngredients = recipe.ingredients;
        }
      } catch { return false; }
      const ingredientNames = recipeIngredients.map(ing => {
        if (typeof ing === 'string') return ing.toLowerCase();
        if (ing && ing.name) return ing.name.toLowerCase();
        return '';
      }).filter(Boolean);
      const hasMatch = selectedIngredients.value.some(sel =>
        ingredientNames.some(r => new RegExp(`\\b${sel.toLowerCase()}\\b`).test(r))
      );
      if (!hasMatch) return false;
    }
    return true;
  });
  return filtered;
});

const hasActiveFilters = computed(() => {
  return selectedTimeRange.value || selectedCategories.value.length > 0 || selectedIngredients.value.length > 0;
});

const totalPages = computed(() => Math.ceil(filteredRecipes.value.length / recipesPerPage));
const paginatedRecipes = computed(() => {
  const start = (currentPage.value - 1) * recipesPerPage;
  return filteredRecipes.value.slice(start, start + recipesPerPage);
});

// ----------------- nutrition & modal -----------------
const calculatedNutrition = computed(() => {
  const multiplier = calculateTotalMultiplier();
  return {
    'Calories': Math.round(baseNutrition.value.calories * multiplier),
    'Protein': (baseNutrition.value.protein * multiplier).toFixed(1) + 'g',
    'Carbs': (baseNutrition.value.carbs * multiplier).toFixed(1) + 'g',
    'Fat': (baseNutrition.value.fat * multiplier).toFixed(1) + 'g',
    'Fiber': (baseNutrition.value.fiber * multiplier).toFixed(1) + 'g'
  }
});

const caloriesPercentage = computed(() => Math.min((parseInt(calculatedNutrition.value.Calories) / australianGuidelines.value.calories) * 100, 100));
const proteinPercentage = computed(() => Math.min((parseFloat(calculatedNutrition.value.Protein) / australianGuidelines.value.protein) * 100, 100));
const carbsPercentage = computed(() => Math.min((parseFloat(calculatedNutrition.value.Carbs) / australianGuidelines.value.carbs) * 100, 100));
const fatPercentage = computed(() => Math.min((parseFloat(calculatedNutrition.value.Fat) / australianGuidelines.value.fat) * 100, 100));

const overallStatus = computed(() => {
  const avg = (caloriesPercentage.value + proteinPercentage.value + carbsPercentage.value + fatPercentage.value) / 4;
  if (avg >= 80) return 'excellent';
  if (avg >= 60) return 'good';
  if (avg >= 40) return 'moderate';
  return 'needs-improvement';
});

// Food group analysis (reuses your logic)
const foodGroups = computed(() => {
  if (!selectedRecipe.value?.ingredients) return [];
  const ingredients = (Array.isArray(selectedRecipe.value.ingredients) ? selectedRecipe.value.ingredients : []).map(ing => ing.toLowerCase());
  return [
    { name:'vegetables', label:'Veggies',
      present: ingredients.some(ing=>/vegetable|broccoli|carrot|spinach|lettuce|tomato|onion|pepper|cucumber/.test(ing)) },
    { name:'fruits', label:'Fruits',
      present: ingredients.some(ing=>/fruit|apple|banana|berry|orange|grape|strawberry|blueberry/.test(ing)) },
    { name:'grains', label:'Grains',
      present: ingredients.some(ing=>/bread|rice|pasta|wheat|oats|quinoa|cereal|flour/.test(ing)) },
    { name:'protein', label:'Protein',
      present: ingredients.some(ing=>/meat|chicken|beef|fish|egg|bean|lentil|tofu|cheese/.test(ing)) },
    { name:'dairy', label:'Dairy',
      present: ingredients.some(ing=>/milk|cheese|yogurt|butter|cream|dairy/.test(ing)) }
  ];
});

// Radar data (reuses your logic)
const tooltip = ref({ visible:false, x:0, y:0, category:'', score:0 });
const radarCategories = computed(() => [
  { name: 'Energy Boost', score: Math.min(caloriesPercentage.value * 0.8, 100) },
  { name: 'Heart Health', score: Math.min(fatPercentage.value * 0.8, 100) },
  { name: 'Muscle Power', score: Math.min(proteinPercentage.value * 1.2, 100) },
  { name: 'Skin Glow', score: Math.min(proteinPercentage.value * 0.4, 100) },
  { name: 'Brain Fuel', score: Math.min(carbsPercentage.value * 0.9, 100) },
  { name: 'Immune Boost', score: Math.min(caloriesPercentage.value * 0.5, 100) },
  { name: 'Gut Health', score: Math.min(fatPercentage.value * 0.7, 100) },
  { name: 'Bone Strength', score: Math.min(proteinPercentage.value * 0.6, 100) }
]);
const radarDataPoints = computed(() => {
  const centerX = 150, centerY = 150, maxRadius = 120;
  return radarCategories.value.map((category, i) => {
    const angle = (i * Math.PI * 2) / radarCategories.value.length - Math.PI / 2;
    const radius = (category.score / 100) * maxRadius;
    return { x: centerX + Math.cos(angle)*radius, y: centerY + Math.sin(angle)*radius };
  });
});
const radarPoints = computed(() => radarDataPoints.value.map(p => `${p.x},${p.y}`).join(' '));

// ------------ methods reused/kept ------------
const selectTimeRange = (range) => { selectedTimeRange.value = selectedTimeRange.value === range ? '' : range; };
const toggleCategory = (category) => {
  const i = selectedCategories.value.indexOf(category);
  if (i > -1) selectedCategories.value.splice(i, 1);
  else selectedCategories.value.push(category);
};
const onIngredientSearch = () => {
  if (ingredientSearch.value.length < 2) { filteredIngredients.value = []; return; }
  filteredIngredients.value = allIngredients.value.filter(ing =>
    ing.toLowerCase().includes(ingredientSearch.value.toLowerCase())
  );
};
const addIngredient = (ingredient) => { if (!selectedIngredients.value.includes(ingredient)) selectedIngredients.value.push(ingredient); ingredientSearch.value=''; filteredIngredients.value=[]; };
const removeIngredient = (ingredient) => { const i = selectedIngredients.value.indexOf(ingredient); if (i>-1) selectedIngredients.value.splice(i,1); };
const clearFilters = () => { selectedTimeRange.value=''; selectedCategories.value=[]; selectedIngredients.value=[]; ingredientSearch.value=''; filteredIngredients.value=[]; currentPage.value=1; };
const goToPage = (p) => { if (p>=1 && p<=totalPages.value) currentPage.value=p; };
const nextPage = () => { if (currentPage.value<totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value>1) currentPage.value--; };

const selectRecipe = (recipe) => {
  selectedRecipe.value = recipe;
  setupIngredientsWithMeasurements();
  setBaseNutrition();
};
const setupIngredientsWithMeasurements = () => {
  if (!selectedRecipe.value?.ingredients) return;
  let ingredients = [];
  try {
    if (typeof selectedRecipe.value.ingredients === 'string') {
      ingredients = JSON.parse(selectedRecipe.value.ingredients);
    } else if (Array.isArray(selectedRecipe.value.ingredients)) {
      ingredients = selectedRecipe.value.ingredients;
    }
  } catch { return; }
  ingredientsWithMeasurements.value = ingredients.map(ing => ({
    name: typeof ing === 'string' ? ing : ing.name,
    unit: 'grams',
    quantity: 100,
    originalQuantity: 100,
    originalUnit: 'grams'
  }));
};
const getDefaultQuantity = (unit) => DEFAULT_QTY[unit] || 1;
const setBaseNutrition = () => {
  if (selectedRecipe.value) {
    baseNutrition.value = {
      calories: selectedRecipe.value.calories || 0,
      protein: selectedRecipe.value.protein_g || 0,
      carbs: selectedRecipe.value.carbs_g || 0,
      fat: selectedRecipe.value.fat_g || 0,
      fiber: selectedRecipe.value.fiber_g || 0
    };
  }
};
const calculateTotalMultiplier = () => {
  let totalMultiplier = 0;
  ingredientsWithMeasurements.value.forEach(ing => {
    const quantity = ing.quantity || 0;
    const unitMultiplier = getUnitMultiplier(ing.unit);
    totalMultiplier += (quantity * unitMultiplier) / 100; // normalize to 100g
  });
  return Math.max(totalMultiplier, 0.1);
};
const getUnitMultiplier = (unit) => {
  const multipliers = { cup:240, grams:1, oz:28.35, tbsp:15, tsp:5, piece:50 };
  return multipliers[unit] || 1;
};
const updateNutrition = (ingredient) => {
  if (ingredient) ingredient.quantity = getDefaultQuantity(ingredient.unit);
};

const getNutritionStatus = (nutrient) => {
  let percentage = 0;
  if (nutrient==='calories') percentage = caloriesPercentage.value;
  else if (nutrient==='protein') percentage = proteinPercentage.value;
  else if (nutrient==='carbs') percentage = carbsPercentage.value;
  else if (nutrient==='fat') percentage = fatPercentage.value;
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'moderate';
  return 'needs-improvement';
};

const showTooltip = (event, category) => {
  const rect = event.target.getBoundingClientRect();
  tooltip.value = { visible:true, x: rect.left + rect.width/2, y: rect.top - 10, category: category.name, score: category.score };
};
const hideTooltip = () => { tooltip.value.visible = false; };
const closeModal = () => { selectedRecipe.value = null; };
const toggleFavorite = (_r) => { /* demo only */ };

const getCategoryEmoji = (category) => {
  const emoji = { breakfast:'🌅', snacks:'🍿', snack:'🍿', lunch:'🥙', 'main-meals':'🍽️', dinner:'🍽️', desserts:'🍰', dessert:'🍰', beverages:'🥤', beverage:'🥤', drink:'🥤' };
  return emoji[category?.toLowerCase()] || '🍽️';
};
const capitalizeFirst = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';

// API calls
const API_BASE = 'https://nexgentech-api.onrender.com';

const fetchRecipes = async () => {
  loading.value = true;
  try {
    const res = await fetch(`${API_BASE}/api/recipes/search?limit=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    recipes.value = data.recipes || [];
  } catch (e) {
    console.error('Error fetching recipes:', e);
    recipes.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchFilterOptions = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/recipes/filters`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    categories.value = data.categories || [];
    allIngredients.value = data.ingredients || [];
  } catch (e) {
    console.error('Error fetching filter options:', e);
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

onMounted(() => {
  fetchFilterOptions();
  fetchRecipes();
});
</script>

<style scoped>
/* --- keep your original styles, plus tiny additions for the new uploader --- */
.calculator-page { position: relative; min-height: 100vh; width: 100%; overflow-x: hidden; padding-top: 40px; display: flex; flex-direction: column; }
.background-image { position: fixed; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; z-index: -2; filter: brightness(0.6) blur(4px); transform: scale(1.05); }
.calculator-page::before { content: ''; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.3); z-index: -1; }
.content-container { max-width: 1400px; margin: 0 auto; padding: 20px; font-family: 'Merriweather', serif; position: relative; z-index: 1; }
.main-title { text-align: center; color: white; font-size: 3rem; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); position: relative; z-index: 1; }
.subtitle { text-align: center; color: white; font-size: 1.2rem; margin-bottom: 3rem; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3); position: relative; z-index: 1; max-width: 800px; margin-left: auto; margin-right: auto; line-height: 1.6; }

.filters-section { position: relative; padding: 10px; margin-bottom: 2rem; }
.white-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(253, 235, 208, 0.9); border-radius: 15px; backdrop-filter: blur(4px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
.filters-container { position: relative; padding: 30px; z-index: 1; }
.filter-label { display: block; color: #8b7765; font-size: 1.2rem; font-weight: 600; margin-bottom: 15px; font-family: 'Merriweather', serif; }

/* new uploader */
.image-analyze-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom: 10px; }
.image-input { padding: 10px 12px; border: 2px solid #d4c4a8; border-radius: 12px; background: white; color: #8b7765; font-family: 'Merriweather', serif; }
.analyze-btn { padding: 10px 16px; background:#1a5536; color:#fff; border:none; border-radius: 12px; cursor:pointer; font-family:'Merriweather', serif; transition:.2s; }
.analyze-btn:disabled { background:#999; cursor:not-allowed; }
.analyze-btn:hover:not(:disabled){ background:#2d7a4a; transform: translateY(-1px); }
.image-preview-wrap { margin-top: 10px; }
.image-preview img { max-width: 220px; border-radius: 12px; border:1px solid rgba(0,0,0,.1); }
.analyze-error { color:#b00020; margin-top: 6px; }
.analyze-tips { margin:8px 0 0; padding-left: 1.1rem; color:#8b7765; }

.time-options { display: flex; gap: 10px; flex-wrap: wrap; }
.time-option { padding: 10px 20px; border: 2px solid #d4c4a8; background: white; border-radius: 25px; cursor: pointer; transition: all 0.3s ease; font-family: 'Merriweather', serif; font-size: 0.9rem; color: #8b7765; }
.time-option:hover { border-color: #1a5536; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
.time-option.active { background: #1a5536; color: white; border-color: #1a5536; }

.category-pills { display: flex; gap: 10px; flex-wrap: wrap; }
.category-pill { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: 2px solid #d4c4a8; background: white; border-radius: 25px; cursor: pointer; transition: all 0.3s ease; font-family: 'Merriweather', serif; font-size: 0.9rem; color: #8b7765; }
.category-pill:hover { border-color: #1a5536; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
.category-pill.active { background: #1a5536; color: white; border-color: #1a5536; }
.category-emoji { font-size: 1.1rem; }

.ingredients-search { position: relative; }
.ingredients-input { width: 100%; padding: 12px 20px; border: 2px solid #d4c4a8; border-radius: 25px; font-family: 'Merriweather', serif; font-size: 1rem; color: #8b7765; background: white; transition: border-color 0.3s ease; }
.ingredients-input:focus { outline: none; border-color: #1a5536; }
.ingredients-dropdown { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 2px solid #d4c4a8; border-top: none; border-radius: 0 0 15px 15px; max-height: 200px; overflow-y: auto; z-index: 10; }
.ingredient-option { width: 100%; padding: 10px 20px; text-align: left; border: none; background: white; cursor: pointer; transition: background-color 0.2s ease; font-family: 'Merriweather', serif; color: #8b7765; }
.ingredient-option:hover { background: #f0f0f0; }
.ingredient-more { padding: 8px 12px; font-size: 0.8rem; color: #666; text-align: center; font-style: italic; background: #f8f9fa; border-top: 1px solid #e0e0e0; }

.selected-ingredients { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.selected-ingredient { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: #1a5536; color: white; border-radius: 15px; font-size: 0.9rem; font-family: 'Merriweather', serif; }
.remove-ingredient { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; padding: 0; margin-left: 5px; }

.results-counter { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #d4c4a8; }
.counter-text { color: #8b7765; font-weight: 600; font-size: 1.1rem; }
.clear-filters-btn { padding: 8px 16px; background: #d32f2f; color: white; border: none; border-radius: 20px; cursor: pointer; font-family: 'Merriweather', serif; font-size: 0.9rem; transition: all 0.3s ease; }
.clear-filters-btn:hover { background: #f44336; transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }

.recipes-section { position: relative; padding: 30px 10px 10px 10px; }
.recipes-container { position: relative; z-index: 1; }
.loading-state { text-align: center; padding: 60px 20px; color: white; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.no-results { text-align: center; padding: 60px 20px; color: white; }
.no-results-icon { font-size: 4rem; margin-bottom: 20px; }
.no-results h3 { font-size: 1.8rem; margin-bottom: 10px; }
.no-results p { font-size: 1.1rem; margin-bottom: 30px; opacity: 0.9; }

.recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 25px; padding: 20px 0; }
.recipe-card { background: rgba(253, 235, 208, 0.9); border-radius: 15px; overflow: hidden; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(4px); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
.recipe-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2); }
.recipe-image-container { position: relative; height: 200px; overflow: hidden; }
.recipe-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.recipe-card:hover .recipe-image { transform: scale(1.05); }
.recipe-overlay { position: absolute; top: 10px; right: 10px; }
.favorite-btn { width: 40px; height: 40px; border-radius: 50%; background: rgba(255, 255, 255, 0.9); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; backdrop-filter: blur(4px); }
.favorite-btn:hover { background: #ff6b6b; transform: scale(1.1); }
.heart-icon { font-size: 1.2rem; color: #ff6b6b; }
.recipe-info { padding: 20px; }
.recipe-title { font-size: 1.3rem; font-weight: 600; color: #8b7765; margin-bottom: 10px; font-family: 'Merriweather', serif; line-height: 1.3; }
.recipe-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 0.9rem; color: #8b7765; }
.recipe-category { font-weight: 500; }
.recipe-time { opacity: 0.8; }
.recipe-nutrition { display: flex; gap: 15px; font-size: 0.9rem; color: #8b7765; }
.nutrition-item { font-weight: 500; }

/* Modal & rest of your original styles kept as-is… (truncated for brevity above) */
.candidate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;}
.candidate-panel{background:#fff;max-width:760px;width:92%;border-radius:16px;padding:20px;}
.candidate-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:12px;}
.candidate-card{border:1px solid #eee;border-radius:12px;overflow:hidden;cursor:pointer;transition:.2s;background:#fff;}
.candidate-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.08);}
.candidate-card img{width:100%;height:120px;object-fit:cover;}
.candidate-card .title{font-weight:600;padding:8px 10px;}
.candidate-card .meta{font-size:.9rem;color:#666;padding:0 10px 12px;}
.close-btn{margin-top:10px}

</style>
