<template>
  <div class="calculator-page">
    <!-- Background Image -->
    <img src="/assets/howitworkback.png" alt="background" class="background-image" />
    
    <div class="content-container">
      <h1 class="main-title">Mix, Match, Make It Yours</h1>
      <p class="subtitle">Use the filters below to discover recipes that fit your vibe. Pick your prep time, choose your category, search ingredients - Find exactly what you're craving.</p>

      <!-- Meal Type Selection -->
      <div class="meal-type-section" :class="{ 'has-selection': selectedMealType }">
        <div class="white-overlay"></div>
        <div class="meal-type-container">
          <h2 class="meal-type-title">Choose Your Cooking Style</h2>
          <div class="meal-type-buttons">
            <button 
              class="meal-type-btn"
              :class="{ active: selectedMealType === 'quick' }"
              @click="selectMealType('quick')"
            >
              <span class="meal-icon">⚡</span>
              <span class="meal-text">Quick Meals</span>
              <span class="meal-desc">Fast & Easy</span>
            </button>
            <button 
              class="meal-type-btn"
              :class="{ active: selectedMealType === 'smart' }"
              @click="selectMealType('smart')"
            >
              <span class="meal-icon">🧠</span>
              <span class="meal-text">Smart Meal Plan</span>
              <span class="meal-desc">Advanced & Detailed</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ NEW: Image → Recipe/Nutrition Analyzer (Front-end only) ============ -->
      
      <!-- Filter Section - Only show after meal type selection -->
      <div v-if="selectedMealType" class="filters-section">
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

          <!-- Plant-Based Filter (Only for Smart Meal Plan) -->
          <div v-if="selectedMealType === 'smart'" class="filter-group">
            <label class="filter-label">Dietary Preference</label>
            <div class="dietary-preference">
              <label class="radio-option">
                <input 
                  type="radio" 
                  :value="false" 
                  v-model="isPlantBased"
                  @change="fetchRecipes"
                />
                <span class="radio-label">All Foods</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  :value="true" 
                  v-model="isPlantBased"
                  @change="fetchRecipes"
                />
                <span class="radio-label">🌱 Plant-Based Only</span>
              </label>
            </div>
          </div>

          <!-- Ingredients Filter -->
          <div class="filter-group">
            <label class="filter-label">Ingredients</label>
            
            <!-- Quick Meals: Simple search -->
            <div v-if="selectedMealType === 'quick'" class="ingredients-search">
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

            <!-- Smart Meal Plan: 4-row expandable grid -->
            <div v-if="selectedMealType === 'smart'" class="smart-ingredients-grid">
              <div class="ingredient-category" v-for="(ingredients, category) in filteredSmartMealIngredients" :key="category">
                <div class="category-header">
                  <span class="category-icon">{{ getCategoryIcon(category) }}</span>
                  <span class="category-name">{{ capitalizeFirst(category) }}</span>
                </div>
                
                <!-- Search input for additional ingredients -->
                <div class="category-search">
                  <input 
                    v-model="categorySearch[category]"
                    type="text" 
                    :placeholder="`Add more ${category}...`"
                    class="category-search-input"
                    @input="searchCategoryIngredients(category)"
                  />
                </div>
                
                <div class="ingredient-pills">
                  <button 
                    v-for="ingredient in getDisplayedIngredients(category)" 
                    :key="ingredient"
                    class="ingredient-pill"
                    :class="{ selected: smartMealSelectedIngredients.includes(ingredient) }"
                    @click="toggleSmartMealIngredient(ingredient)"
                  >
                    <span class="ingredient-name">{{ ingredient }}</span>
                    <span class="ingredient-action">{{ smartMealSelectedIngredients.includes(ingredient) ? '×' : '+' }}</span>
                  </button>
                </div>
              </div>
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

      <!-- Pagination Controls (Top) - Only show for Quick Meals -->
      <div v-if="totalPages > 1 && selectedMealType !== 'smart'" class="pagination-container-top">
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
              v-for="page in visiblePages" 
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

      <!-- Recipe Grid Section - Only show after meal type selection -->
      <div v-if="selectedMealType" class="recipes-section">
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

          <!-- Smart Meal Plan: Grouped by Category -->
          <div v-if="selectedMealType === 'smart'" class="smart-meal-categories">
              <div 
                v-for="category in smartMealCategories" 
                :key="category.name"
                class="category-group"
              >
                <h3 class="category-title">{{ category.emoji }} {{ category.displayName }}</h3>
                <div class="category-recipe">
                  <div 
                    v-if="getCurrentRecipeForCategory(category.name)"
                    class="recipe-card"
                    @click="selectRecipe(getCurrentRecipeForCategory(category.name))"
                  >
                    <div class="recipe-image-container">
                      <img 
                        :src="getImageSrc(getCurrentRecipeForCategory(category.name).image_filename)" 
                        :alt="getCurrentRecipeForCategory(category.name).recipe_name"
                        class="recipe-image"
                        @click.stop="populateMeasurements(getCurrentRecipeForCategory(category.name))"
                        @error="handleImageError($event, getCurrentRecipeForCategory(category.name).image_filename)"
                        title="Click to auto-populate measurements"
                      />
                      <div class="recipe-overlay">
                        <button class="favorite-btn" @click.stop="toggleFavorite(getCurrentRecipeForCategory(category.name))">
                          <span class="heart-icon" :class="{ liked: favoriteRecipes.has(`${getCurrentRecipeForCategory(category.name).source}_${getCurrentRecipeForCategory(category.name).id}`) }">
                            {{ favoriteRecipes.has(`${getCurrentRecipeForCategory(category.name).source}_${getCurrentRecipeForCategory(category.name).id}`) ? '♥' : '♡' }}
                          </span>
                        </button>
                      </div>
                    </div>
                    
                    <div class="recipe-info">
                      <h3 class="recipe-title">{{ getCurrentRecipeForCategory(category.name).recipe_name }}</h3>
                      <div class="recipe-meta">
                        <span class="recipe-category">{{ getCategoryEmoji(getCurrentRecipeForCategory(category.name).category) }} {{ capitalizeFirst(getCurrentRecipeForCategory(category.name).category) }}</span>
                        <span v-if="getCurrentRecipeForCategory(category.name).time_display" class="recipe-time">{{ getCurrentRecipeForCategory(category.name).time_display }}</span>
                      </div>
                      <div class="recipe-stats">
                        <span class="cal-info">{{ getCurrentRecipeForCategory(category.name).calories }} cal</span>
                        <span class="protein-info">{{ getCurrentRecipeForCategory(category.name).protein_g }}g protein</span>
                        <button 
                          class="quick-swap-btn" 
                          @click.stop="quickSwapRecipe(category.name)"
                        >
                          Quick Swap
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>

          <!-- Quick Meals: Original Grid Layout -->
          <div v-else class="recipes-grid">
              <div 
                v-for="recipe in paginatedRecipes" 
                :key="recipe.unique_id"
                class="recipe-card"
                @click="selectRecipe(recipe)"
              >
                <div class="recipe-image-container">
                  <img 
                    :src="getImageSrc(recipe.image_filename)" 
                    :alt="recipe.recipe_name"
                    class="recipe-image"
                    @click.stop="populateMeasurements(recipe)"
                    @error="handleImageError($event, recipe.image_filename)"
                    title="Click to auto-populate measurements"
                  />
                  <div class="recipe-overlay">
                    <button class="favorite-btn" @click.stop="toggleFavorite(recipe)">
                      <span class="heart-icon" :class="{ liked: favoriteRecipes.has(`${recipe.source}_${recipe.id}`) }">
                        {{ favoriteRecipes.has(`${recipe.source}_${recipe.id}`) ? '♥' : '♡' }}
                      </span>
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
    </div>

    <!-- Recipe Detail Modal -->
    <div v-if="selectedRecipe" class="modal-overlay" @click="closeModal">
      <div class="modal-content-large" @click.stop>
        <button class="close-modal" @click="closeModal">×</button>
        
        <!-- AI Chat Assistant Toggle -->
        <button @click="toggleChatAssistant" class="ai-chat-toggle" :class="{ active: showChatAssistant }">
          <span class="ai-icon">🤖</span>
          <span class="ai-text">Ask AI</span>
        </button>
        
        <!-- Three Column Layout -->
        <div class="modal-three-columns">
          
          <!-- Left Column: Recipe Details, Nutrition Summary, Serving Size, Ingredients -->
          <div class="modal-left-column">
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
              <h2 class="section-title">Nutrition Summary</h2>
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

            <!-- Ingredients List with Interactive Measurements -->
            <div v-if="selectedRecipe.ingredients" class="ingredients-section">
              <!-- Serving Portion Display -->
              <div class="serving-portion-display">
                <div class="serving-info">
                  <span class="serving-label">Serving Size:</span>
                  <span class="serving-value">{{ selectedRecipe.serving_size || '1 serving' }}</span>
                </div>
                <div class="serving-controls">
                  <label class="serving-multiplier-label">Adjust Servings:</label>
                  <input 
                    v-model.number="servingMultiplier" 
                    @input="updateServings"
                    type="number" 
                    min="1" 
                    max="10" 
                    step="1"
                    class="serving-multiplier-input"
                  />
                </div>
              </div>
              
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
          </div>

          <!-- Center Column: Cooking Directions -->
          <div class="modal-center-column">
            <!-- Directions -->
            <div v-if="selectedRecipe.directions" class="directions-section">
          <h3 class="section-title">Cooking Directions</h3>
          <ol class="directions-list">
            <li v-for="(direction, index) in selectedRecipe.directions" :key="index" class="direction-item">
              {{ direction }}
            </li>
          </ol>
        </div>

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
          </div>

          <!-- Right Column: Nutrition Analysis -->
          <div class="modal-right-column">
            <!-- Nutrition Radar Chart -->
            <div class="nutrition-radar">
              <h4 class="subsection-title">Health Benefits Radar</h4>
              <div class="radar-chart">
                <svg viewBox="0 0 300 300" class="radar-svg">
                  <!-- Background circles -->
                  <circle cx="150" cy="150" r="120" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <circle cx="150" cy="150" r="90" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <circle cx="150" cy="150" r="60" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  <circle cx="150" cy="150" r="30" fill="none" stroke="#e0e0e0" stroke-width="1"/>
                  
                  <!-- Axis lines -->
                  <line x1="150" y1="30" x2="150" y2="270" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="30" y1="150" x2="270" y2="150" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="60" y1="60" x2="240" y2="240" stroke="#e0e0e0" stroke-width="1"/>
                  <line x1="240" y1="60" x2="60" y2="240" stroke="#e0e0e0" stroke-width="1"/>
                  
                  <!-- Data polygon -->
                  <polygon 
                    :points="radarPoints" 
                    fill="rgba(26, 85, 54, 0.3)" 
                    stroke="#1a5536" 
                    stroke-width="2"
                    class="radar-polygon"
                  />
                  
                  <!-- Data points with hover -->
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
                  
                  <!-- Labels - Order must match radarCategories array -->
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
                
                <!-- Tooltip -->
                <div v-if="tooltip.visible" class="radar-tooltip" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
                  <div class="tooltip-content">
                    <strong>{{ tooltip.category }}</strong>
                    <div class="tooltip-score">{{ Math.round(tooltip.score) }}%</div>
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
                    <div class="percentage-center">{{ Math.round(caloriesPercentage) }}%</div>
                    <div class="recommended-text">Recommended: {{ australianGuidelines.calories }} cal</div>
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
                    <div class="percentage-center">{{ Math.round(proteinPercentage) }}%</div>
                    <div class="recommended-text">Recommended: {{ australianGuidelines.protein }}g</div>
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
                    <div class="percentage-center">{{ Math.round(carbsPercentage) }}%</div>
                    <div class="recommended-text">Recommended: {{ australianGuidelines.carbs }}g</div>
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
                    <div class="percentage-center">{{ Math.round(fatPercentage) }}%</div>
                    <div class="recommended-text">Recommended: {{ australianGuidelines.fat }}g</div>
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
          </div>
        </div>
      </div>
    </div>

    <!-- AI Chat Assistant Modal -->
    <div v-if="showChatAssistant && selectedRecipe" class="chat-modal-overlay" @click="showChatAssistant = false">
      <div class="chat-modal-content" @click.stop>
        <div class="chat-header">
          <h3>🤖 AI Cooking Assistant</h3>
          <button @click="showChatAssistant = false" class="chat-close">×</button>
        </div>
        
        <div class="chat-messages">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index" 
            class="chat-message"
            :class="message.type"
          >
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              
              <!-- Suggestions -->
              <div v-if="message.suggestions" class="message-suggestions">
                <div class="suggestions-label">Quick questions:</div>
                <button 
                  v-for="suggestion in message.suggestions" 
                  :key="suggestion"
                  @click="useSuggestion(suggestion)"
                  class="suggestion-btn"
                >
                  {{ suggestion }}
                </button>
              </div>
              
              <!-- Additional Info -->
              <div v-if="message.tip" class="message-tip">
                💡 {{ message.tip }}
              </div>
              
              <div v-if="message.temperature" class="message-info">
                🌡️ {{ message.temperature }}
              </div>
              
              <div v-if="message.timing" class="message-info">
                ⏱️ {{ message.timing }}
              </div>
              
              <div v-if="message.nutrition" class="message-info">
                🥗 {{ message.nutrition }}
              </div>
              
              <div v-if="message.rating" class="message-rating">
                ⭐ {{ message.rating }}
              </div>
              
              <!-- Nutrition Breakdown -->
              <div v-if="message.breakdown" class="nutrition-breakdown">
                <div class="breakdown-title">Nutrition Breakdown:</div>
                <div class="breakdown-grid">
                  <div v-for="(value, key) in message.breakdown" :key="key" class="breakdown-item">
                    <span class="breakdown-label">{{ key }}:</span>
                    <span class="breakdown-value">{{ value }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <input 
            v-model="currentQuestion"
            @keyup.enter="askQuestion"
            placeholder="Ask me anything about this recipe..."
            class="chat-input-field"
          />
          <button @click="askQuestion" :disabled="!currentQuestion.trim()" class="chat-send-btn">
            Send
          </button>
        </div>
      </div>
    </div>
    <div v-if="showCandidateModal" class="candidate-overlay" @click="showCandidateModal=false">
      <div class="candidate-panel" @click.stop>
        <h3 class="section-title">Pick a recipe</h3>
        <div class="candidate-grid">
          <div class="candidate-card" v-for="c in candidateRecipes" :key="c.id"
              @click="() => { selectRecipe(c); showCandidateModal=false; }">
            <img :src="recipeImg(c)" alt="">
            <div class="title">{{ c.recipe_name }}</div>
            <div class="meta">{{ c.calories }} cal · {{ c.protein_g }}g protein</div>
          </div>
        </div>
        <button class="close-btn" @click="showCandidateModal=false">Cancel</button>
      </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

const candidateRecipes = ref([]);
const showCandidateModal = ref(false);



const pickedFile = ref(null);
const previewUrl = ref('');
const analyzing = ref(false);
const analyzeError = ref('');
const analyzeTips = ref([]);

// Reactive data
const loading = ref(false);
const recipes = ref([]);
const selectedRecipe = ref(null);
const selectedMealType = ref(null); // null = no selection yet, 'quick' or 'smart'
const isPlantBased = ref(false); // Plant-based dietary preference
const quickMealIngredients = ref([]); // Ingredients for Quick Meals
const smartMealSelectedIngredients = ref([]); // Selected ingredients for Smart Meal Plan
const ingredientSearch = ref('');
const categorySearch = ref({
  breakfast: '',
  protein: '',
  fruits: '',
  vegetables: ''
});
const categorySearchResults = ref({
  breakfast: [],
  protein: [],
  fruits: [],
  vegetables: []
});

// Smart Meal Plan categories and current recipe indices
const smartMealCategories = ref([
  { name: 'breakfast', displayName: 'Breakfast', emoji: '🍳' },
  { name: 'main-meals', displayName: 'Main Meal', emoji: '🍚' },
  { name: 'side-dishes', displayName: 'Side Dish', emoji: '🥗' },
  { name: 'desserts', displayName: 'Dessert', emoji: '🍰' }
]);

const currentRecipeIndices = ref({
  breakfast: 0,
  'main-meals': 0,
  'side-dishes': 0,
  desserts: 0
});

// Smart Meal Plan ingredient categories
const smartMealIngredientCategories = ref({
  breakfast: ['eggs', 'bread', 'butter', 'oats', 'Greek yogurt', 'milk', 'cereal', 'pancakes', 'waffles', 'toast'],
  protein: ['chicken', 'tofu', 'lentils', 'beef', 'chickpeas', 'fish', 'turkey', 'beans', 'quinoa', 'tempeh'],
  fruits: ['apple', 'banana', 'grapes', 'berries', 'dates', 'orange', 'strawberry', 'blueberry', 'avocado', 'lemon'],
  vegetables: ['spinach', 'broccoli', 'bell pepper', 'carrots', 'cauliflower', 'tomatoes', 'onions', 'garlic', 'zucchini', 'mushrooms']
});

const filteredIngredients = ref([]);
const ingredientsWithMeasurements = ref([]);
const baseNutrition = ref({
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0
});


// Australian Dietary Guidelines for teenagers (15-19 years)
const australianGuidelines = ref({
  calories: 2200, // Average for 15-19 years
  protein: 65,    // grams per day
  carbs: 300,     // grams per day (45-65% of calories)
  fat: 73,        // grams per day (25-35% of calories)
  fiber: 25       // grams per day
});

// Filter state
const selectedTimeRange = ref('');
const selectedCategories = ref([]);

// Pagination state
const currentPage = ref(1);
const recipesPerPage = 9;

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

const DEFAULT_QTY = {
  grams: 100, cup: 240, oz: 28.35, tbsp: 15, tsp: 5, piece: 50
};

// according to candidate card -> from loaded recipes list find“entire recipe”
function resolveFromDB(candidate) {
  if (!candidate) return null;

  const cid = candidate.id ?? candidate.recipe_id ?? candidate.unique_id;
  const csrc = candidate.source ?? candidate.source_table ?? candidate.sourceName;


  const isSameId = (a, b) => String(a ?? '') === String(b ?? '');

  // 1) use source + id to match first
  let match = recipes.value.find(r =>
    (isSameId(r.id, cid) || isSameId(r.recipe_id, cid) || isSameId(r.unique_id, cid)) &&
    ( (r.source && csrc && String(r.source) === String(csrc)) ||
      (r.source_table && csrc && String(r.source_table) === String(csrc)) ||
      (!csrc) // sometimes with no source, just rely on id
    )
  );

  // 2) fallback: use name fuzzy matching (if necessary)
  if (!match && candidate.recipe_name) {
    const name = String(candidate.recipe_name).trim().toLowerCase();
    match = recipes.value.find(r => String(r.recipe_name||'').trim().toLowerCase() === name);
  }

  return match || candidate; // if not found, return candidate (at least see basic info)
}


// Filter options
const timeRanges = ref([
  { value: '0-5', label: 'Super Quick (0-5 min)' },
  { value: '5-15', label: 'Quick Prep (5-15 min)' },
  { value: '15-30', label: 'Half-Hour Hero (15-30 min)' }
]);

const categories = ref([]);
const allIngredients = ref([]);

// Computed properties
const filteredRecipes = computed(() => {
  
  const filtered = recipes.value.filter(recipe => {
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

    // Ingredients filter - Only apply if ingredients are selected
    if (currentIngredients.value.length > 0) {
      if (!recipe.ingredients) return false;
      
      // Parse ingredients from JSON
      let recipeIngredients = [];
      try {
        if (typeof recipe.ingredients === 'string') {
          recipeIngredients = JSON.parse(recipe.ingredients);
        } else if (Array.isArray(recipe.ingredients)) {
          recipeIngredients = recipe.ingredients;
        }
      } catch (e) {
        return false;
      }
      
      // Extract ingredient names
      const ingredientNames = recipeIngredients.map(ing => {
        if (typeof ing === 'string') return ing.toLowerCase();
        if (ing && ing.name) return ing.name.toLowerCase();
        return '';
      }).filter(name => name.length > 0);
      
      
      // Check for ingredient matches - recipe must contain ANY selected ingredient (OR logic)
      // Use word boundary matching to avoid partial matches (e.g., "ice" matching "lime juice")
      const hasMatchingIngredient = currentIngredients.value.some(selectedIng => 
        ingredientNames.some(recipeIng => {
          // Create word boundary regex for exact word matching
          const regex = new RegExp(`\\b${selectedIng.toLowerCase()}\\b`);
          return regex.test(recipeIng);
        })
      );
      
      if (!hasMatchingIngredient) return false;
    }

    return true;
  });
  
  return filtered;
});

// Get current ingredient selection based on meal type
const currentIngredients = computed(() => {
  return selectedMealType.value === 'quick' ? quickMealIngredients.value : smartMealSelectedIngredients.value;
});

// Get filtered ingredients for Smart Meal Plan (Plant-Based filtering)
const filteredSmartMealIngredients = computed(() => {
  if (!isPlantBased.value) {
    return smartMealIngredientCategories.value;
  }
  
  const plantBasedIngredients = {
    breakfast: ['bread', 'oats', 'cereal', 'pancakes', 'waffles', 'toast'],
    protein: ['tofu', 'lentils', 'chickpeas', 'beans', 'quinoa', 'tempeh'],
    fruits: ['apple', 'banana', 'grapes', 'berries', 'dates', 'orange', 'strawberry', 'blueberry', 'avocado', 'lemon'],
    vegetables: ['spinach', 'broccoli', 'bell pepper', 'carrots', 'cauliflower', 'tomatoes', 'onions', 'garlic', 'zucchini', 'mushrooms']
  };
  
  return plantBasedIngredients;
});

// Get recipes grouped by category for Smart Meal Plan
const recipesByCategory = computed(() => {
  const grouped = {
    breakfast: [],
    'main-meals': [],
    'side-dishes': [],
    desserts: []
  };
  
  filteredRecipes.value.forEach(recipe => {
    if (grouped[recipe.category]) {
      grouped[recipe.category].push(recipe);
    }
  });
  
  return grouped;
});

// Get current recipe for a specific category
const getCurrentRecipeForCategory = (categoryName) => {
  const categoryRecipes = recipesByCategory.value[categoryName];
  if (!categoryRecipes || categoryRecipes.length === 0) return null;
  
  const currentIndex = currentRecipeIndices.value[categoryName];
  return categoryRecipes[currentIndex] || categoryRecipes[0];
};

// Quick swap function to cycle through recipes in a category
const quickSwapRecipe = (categoryName) => {
  const categoryRecipes = recipesByCategory.value[categoryName];
  if (!categoryRecipes || categoryRecipes.length <= 1) return;
  
  const currentIndex = currentRecipeIndices.value[categoryName];
  const nextIndex = (currentIndex + 1) % categoryRecipes.length;
  currentRecipeIndices.value[categoryName] = nextIndex;
};

// Watch for Plant-Based changes and update selected ingredients
watch(isPlantBased, (newValue) => {
  if (selectedMealType.value === 'smart') {
    const ingredientsToUse = newValue ? 
      Object.values(filteredSmartMealIngredients.value).flat() :
      Object.values(smartMealIngredientCategories.value).flat();
    
    // Keep only ingredients that are available in the current filter
    smartMealSelectedIngredients.value = smartMealSelectedIngredients.value.filter(ingredient => 
      ingredientsToUse.includes(ingredient)
    );
    
    // Add any new ingredients that weren't previously selected
    ingredientsToUse.forEach(ingredient => {
      if (!smartMealSelectedIngredients.value.includes(ingredient)) {
        smartMealSelectedIngredients.value.push(ingredient);
      }
    });
  }
});

const hasActiveFilters = computed(() => {
  return selectedTimeRange.value || 
         selectedCategories.value.length > 0 || 
         currentIngredients.value.length > 0;
});

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredRecipes.value.length / recipesPerPage);
});

const paginatedRecipes = computed(() => {
  const start = (currentPage.value - 1) * recipesPerPage;
  const end = start + recipesPerPage;
  return filteredRecipes.value.slice(start, end);
});

// Sliding pagination window - shows only 5 page numbers at a time
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const maxVisible = 5;
  
  if (total <= maxVisible) {
    // If total pages <= 5, show all pages
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = Math.min(total, start + maxVisible - 1);
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

// Computed nutrition that updates based on measurements
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

// Percentage calculations for Australian guidelines comparison
const caloriesPercentage = computed(() => {
  const current = parseInt(calculatedNutrition.value.Calories);
  return Math.min((current / australianGuidelines.value.calories) * 100, 100);
});

const proteinPercentage = computed(() => {
  const current = parseFloat(calculatedNutrition.value.Protein);
  return Math.min((current / australianGuidelines.value.protein) * 100, 100);
});

const carbsPercentage = computed(() => {
  const current = parseFloat(calculatedNutrition.value.Carbs);
  return Math.min((current / australianGuidelines.value.carbs) * 100, 100);
});

const fatPercentage = computed(() => {
  const current = parseFloat(calculatedNutrition.value.Fat);
  return Math.min((current / australianGuidelines.value.fat) * 100, 100);
});

// Overall nutrition status
const overallStatus = computed(() => {
  const avgPercentage = (caloriesPercentage.value + proteinPercentage.value + carbsPercentage.value + fatPercentage.value) / 4;
  if (avgPercentage >= 80) return 'excellent';
  if (avgPercentage >= 60) return 'good';
  if (avgPercentage >= 40) return 'moderate';
  return 'needs-improvement';
});

// My Plate Visual - Food Groups Analysis
const foodGroups = computed(() => {
  if (!selectedRecipe.value?.ingredients) return [];
  
  const ingredients = selectedRecipe.value.ingredients.map(ing => ing.toLowerCase());
  
  return [
    {
      name: 'vegetables',
      label: 'Veggies',
      present: ingredients.some(ing => 
        ing.includes('vegetable') || ing.includes('broccoli') || ing.includes('carrot') || 
        ing.includes('spinach') || ing.includes('lettuce') || ing.includes('tomato') ||
        ing.includes('onion') || ing.includes('pepper') || ing.includes('cucumber')
      )
    },
    {
      name: 'fruits',
      label: 'Fruits',
      present: ingredients.some(ing => 
        ing.includes('fruit') || ing.includes('apple') || ing.includes('banana') || 
        ing.includes('berry') || ing.includes('orange') || ing.includes('grape') ||
        ing.includes('strawberry') || ing.includes('blueberry')
      )
    },
    {
      name: 'grains',
      label: 'Grains',
      present: ingredients.some(ing => 
        ing.includes('bread') || ing.includes('rice') || ing.includes('pasta') || 
        ing.includes('wheat') || ing.includes('oats') || ing.includes('quinoa') ||
        ing.includes('cereal') || ing.includes('flour')
      )
    },
    {
      name: 'protein',
      label: 'Protein',
      present: ingredients.some(ing => 
        ing.includes('meat') || ing.includes('chicken') || ing.includes('beef') || 
        ing.includes('fish') || ing.includes('egg') || ing.includes('bean') ||
        ing.includes('lentil') || ing.includes('tofu') || ing.includes('cheese')
      )
    },
    {
      name: 'dairy',
      label: 'Dairy',
      present: ingredients.some(ing => 
        ing.includes('milk') || ing.includes('cheese') || ing.includes('yogurt') || 
        ing.includes('butter') || ing.includes('cream') || ing.includes('dairy')
      )
    }
  ];
});

// My Plate percentages (simplified calculation)
const vegetablesPercentage = computed(() => {
  const present = foodGroups.value.find(g => g.name === 'vegetables')?.present;
  return present ? Math.min(caloriesPercentage.value * 0.3, 100) : 0;
});

const fruitsPercentage = computed(() => {
  const present = foodGroups.value.find(g => g.name === 'fruits')?.present;
  return present ? Math.min(caloriesPercentage.value * 0.2, 100) : 0;
});

const grainsPercentage = computed(() => {
  const present = foodGroups.value.find(g => g.name === 'grains')?.present;
  return present ? Math.min(caloriesPercentage.value * 0.25, 100) : 0;
});

const proteinPlatePercentage = computed(() => {
  const present = foodGroups.value.find(g => g.name === 'protein')?.present;
  return present ? Math.min(caloriesPercentage.value * 0.15, 100) : 0;
});

const dairyPercentage = computed(() => {
  const present = foodGroups.value.find(g => g.name === 'dairy')?.present;
  return present ? Math.min(caloriesPercentage.value * 0.1, 100) : 0;
});

// My Plate presence checks
const hasVegetables = computed(() => foodGroups.value.find(g => g.name === 'vegetables')?.present || false);
const hasFruits = computed(() => foodGroups.value.find(g => g.name === 'fruits')?.present || false);
const hasGrains = computed(() => foodGroups.value.find(g => g.name === 'grains')?.present || false);
const hasProtein = computed(() => foodGroups.value.find(g => g.name === 'protein')?.present || false);
const hasDairy = computed(() => foodGroups.value.find(g => g.name === 'dairy')?.present || false);

// Overall plate score (percentage of food groups present)
const overallPlateScore = computed(() => {
  const presentGroups = foodGroups.value.filter(group => group.present).length;
  return (presentGroups / foodGroups.value.length) * 100;
});

// Number of present food groups
const presentFoodGroups = computed(() => {
  return foodGroups.value.filter(group => group.present).length;
});

// Tooltip for radar chart
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  category: '',
  score: 0
});

// Favorites state
const favoriteRecipes = ref(new Set());

// Serving multiplier state
const servingMultiplier = ref(1);

// Radar Chart Data - Order must match the SVG labels
const radarCategories = computed(() => [
  { name: 'Energy Boost', score: Math.min(caloriesPercentage.value * 0.8, 100), color: '#ff6b6b' },
  { name: 'Heart Health', score: Math.min(fatPercentage.value * 0.8, 100), color: '#ff9ff3' },
  { name: 'Muscle Power', score: Math.min(proteinPercentage.value * 1.2, 100), color: '#4ecdc4' },
  { name: 'Skin Glow', score: Math.min(proteinPercentage.value * 0.4, 100), color: '#5f27cd' },
  { name: 'Brain Fuel', score: Math.min(carbsPercentage.value * 0.9, 100), color: '#45b7d1' },
  { name: 'Immune Boost', score: Math.min(caloriesPercentage.value * 0.5, 100), color: '#54a0ff' },
  { name: 'Gut Health', score: Math.min(fatPercentage.value * 0.7, 100), color: '#96ceb4' },
  { name: 'Bone Strength', score: Math.min(proteinPercentage.value * 0.6, 100), color: '#feca57' }
]);

// Radar Chart Points Calculation
const radarDataPoints = computed(() => {
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;
  
  return radarCategories.value.map((category, index) => {
    const angle = (index * Math.PI * 2) / radarCategories.value.length - Math.PI / 2;
    const radius = (category.score / 100) * maxRadius;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    };
  });
});

const radarPoints = computed(() => {
  return radarDataPoints.value.map(point => `${point.x},${point.y}`).join(' ');
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
  if (!quickMealIngredients.value.includes(ingredient)) {
    quickMealIngredients.value.push(ingredient);
  }
  ingredientSearch.value = '';
  filteredIngredients.value = [];
};

const removeIngredient = (ingredient) => {
  const index = quickMealIngredients.value.indexOf(ingredient);
  if (index > -1) {
    quickMealIngredients.value.splice(index, 1);
  }
};

const clearFilters = () => {
  selectedTimeRange.value = '';
  selectedCategories.value = [];
  quickMealIngredients.value = [];
  smartMealSelectedIngredients.value = [];
  ingredientSearch.value = '';
  filteredIngredients.value = [];
  currentPage.value = 1; // Reset to first page when clearing filters
};

// Pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const selectRecipe = (candidate) => {
  const fullRecipe = resolveFromDB(candidate);
  selectedRecipe.value = fullRecipe;
  servingMultiplier.value = 1;
  setupIngredientsWithMeasurements();
  setBaseNutrition();
  
  // Prevent automatic scrolling when modal opens
  setTimeout(() => {
    window.scrollTo(0, 0);
  }, 0);
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

const getDefaultQuantity = (unit) => {
  const defaults = {
    'cup': 1,
    'grams': 100,
    'oz': 3.5,
    'tbsp': 1,
    'tsp': 1,
    'piece': 1
  };
  return defaults[unit] || 1;
};

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
    
    console.log(`Parsed measurement: "${measurement}" → quantity: ${quantity}, unit: ${unit}`);
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

const populateMeasurements = (recipe) => {
  // Select the recipe first
  selectRecipe(recipe);
  
  // Reset serving multiplier to 1
  servingMultiplier.value = 1;
  
  // Show a brief success message
  console.log(`Auto-populated measurements for: ${recipe.recipe_name}`);
  
  // Scroll to the ingredients section if it's visible
  setTimeout(() => {
    const ingredientsSection = document.querySelector('.ingredients-section');
    if (ingredientsSection) {
      ingredientsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const calculateTotalMultiplier = () => {
  // Simple calculation - in real app, you'd have a proper nutrition database
  let totalMultiplier = 0;
  ingredientsWithMeasurements.value.forEach(ing => {
    const quantity = ing.quantity || 0;
    const unitMultiplier = getUnitMultiplier(ing.unit);
    totalMultiplier += (quantity * unitMultiplier) / 100; // Normalize to 100g base
  });
  return Math.max(totalMultiplier, 0.1); // Minimum 0.1 to avoid zero
};

const getUnitMultiplier = (unit) => {
  const multipliers = {
    'cup': 240, // grams
    'grams': 1,
    'oz': 28.35,
    'tbsp': 15,
    'tsp': 5,
    'piece': 50 // average piece weight
  };
  return multipliers[unit] || 1;
};

const updateServings = () => {
  // Update all ingredient quantities based on serving multiplier
  ingredientsWithMeasurements.value.forEach(ingredient => {
    ingredient.quantity = ingredient.originalQuantity * servingMultiplier.value;
  });
  
  // Update nutrition calculations
  updateNutrition();
};

const updateNutrition = (ingredient) => {
  // Update quantity to default when unit changes
  if (ingredient) {
    ingredient.quantity = getDefaultQuantity(ingredient.unit);
  }
  // Trigger reactivity update
  console.log('Nutrition updated based on measurements');
};

const getNutritionStatus = (nutrient) => {
  let percentage;
  switch (nutrient) {
    case 'calories':
      percentage = caloriesPercentage.value;
      break;
    case 'protein':
      percentage = proteinPercentage.value;
      break;
    case 'carbs':
      percentage = carbsPercentage.value;
      break;
    case 'fat':
      percentage = fatPercentage.value;
      break;
    default:
      return 'moderate';
  }
  
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'moderate';
  return 'needs-improvement';
};

const showTooltip = (event, category) => {
  const rect = event.target.getBoundingClientRect();
  tooltip.value = {
    visible: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
    category: category.name,
    score: category.score
  };
};

const hideTooltip = () => {
  tooltip.value.visible = false;
};

const closeModal = () => {
  selectedRecipe.value = null;
};

const toggleFavorite = (recipe) => {
  const recipeId = `${recipe.source}_${recipe.id}`;
  
  if (favoriteRecipes.value.has(recipeId)) {
    favoriteRecipes.value.delete(recipeId);
  } else {
    favoriteRecipes.value.add(recipeId);
  }
  
  // Optional: Save to localStorage for persistence
  localStorage.setItem('favoriteRecipes', JSON.stringify([...favoriteRecipes.value]));
};

// Removed handleImageError to prevent repeated placeholder calls

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
  const basePath = '/food_icons/'
  
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

// AI Chat Assistant for Recipe Questions
class RecipeChatAssistant {
  constructor() {
    this.ingredientDatabase = {
      'garlic': { flavor: 'aromatic', health: 'immune-boosting', category: 'aromatic' },
      'onion': { flavor: 'sweet-savory', health: 'antioxidant', category: 'vegetable' },
      'tomato': { flavor: 'acidic-sweet', health: 'vitamin-c', category: 'vegetable' },
      'chicken': { flavor: 'neutral', health: 'protein', category: 'protein' },
      'beef': { flavor: 'rich', health: 'iron', category: 'protein' },
      'butter': { flavor: 'rich', health: 'fat', category: 'fat' },
      'olive oil': { flavor: 'fruity', health: 'healthy-fat', category: 'fat' },
      'salt': { flavor: 'enhancer', health: 'electrolyte', category: 'seasoning' },
      'pepper': { flavor: 'spicy', health: 'metabolism', category: 'spice' },
      'flour': { flavor: 'neutral', health: 'carbohydrate', category: 'grain' }
    };
  }

  async getResponse(question, recipeData) {
    const q = question.toLowerCase();
    
    // First try rule-based responses for common questions
    if (q.includes('spic') || q.includes('hot') || q.includes('heat')) {
      return this.getSpiceSuggestions(recipeData);
    }
    
    if (q.includes('temp') || q.includes('heat') || q.includes('cook')) {
      return this.getTemperatureAdvice(recipeData);
    }
    
    if (q.includes('health') || q.includes('balanced') || q.includes('nutrition')) {
      return this.getNutritionAnalysis(recipeData);
    }
    
    if (q.includes('add') || q.includes('ingredient') || q.includes('flavor')) {
      return this.getIngredientSuggestions(recipeData);
    }
    
    if (q.includes('replace') || q.includes('substitute') || q.includes('instead')) {
      return this.getSubstitutionSuggestions(recipeData, q);
    }
    
    if (q.includes('how to cook') || q.includes('method') || q.includes('technique')) {
      return this.getCookingMethodAdvice(recipeData);
    }
    
    // For any other question, use LLM API
    try {
      return await this.getLLMResponse(question, recipeData);
    } catch (error) {
      console.error('LLM API Error:', error);
      return {
        type: 'error',
        message: 'I\'m having trouble connecting to my AI brain right now. Try asking about spice levels, cooking temperatures, nutrition, or ingredients!',
        suggestions: [
          'How can I make this spicier?',
          'What temperature should I use?',
          'Is this recipe balanced?',
          'What ingredients should I add?'
        ]
      };
    }
  }

  async getLLMResponse(question, recipeData) {
    // For now, use our intelligent fallback system
    // This simulates AI responses without requiring API keys
    return this.getIntelligentFallback(question, recipeData);
  }

  async tryGroqAPI(question, recipeData) {
    // Groq API - Free tier with fast inference
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful cooking assistant for teenagers. Answer questions about recipes in a friendly, easy-to-understand way. Keep responses concise but informative.'
      },
      {
        role: 'user',
        content: `Recipe: ${this.getRecipeDisplayName(recipeData)}
Ingredients: ${(recipeData.ingredients || []).join(', ')}
Category: ${recipeData.category || 'Unknown'}
Calories: ${recipeData.calories || 'Unknown'} per serving
Prep Time: ${selectedRecipe.value?.time_display || 'Unknown'}

Question: ${question}

Please provide a helpful answer about this recipe.`
      }
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer gsk_your_groq_api_key_here', // Replace with actual key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-2-70b-chat',
        messages: messages,
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return {
      type: 'llm',
      message: answer,
      suggestions: [
        'Tell me more about the health benefits',
        'What makes this recipe special?',
        'How can I modify this recipe?',
        'What should I know before cooking?'
      ]
    };
  }

  async tryHuggingFaceAPI(question, recipeData) {
    // Hugging Face Inference API - Free tier
    const API_URL = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium';
    
    const prompt = `You are a helpful cooking assistant for teenagers. Answer questions about recipes in a friendly, easy-to-understand way.

Recipe: ${this.getRecipeDisplayName(recipeData)}
Ingredients: ${(recipeData.ingredients || []).join(', ')}
Category: ${recipeData.category || 'Unknown'}
Calories: ${recipeData.calories || 'Unknown'} per serving

Question: ${question}

Answer:`;

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 150,
          temperature: 0.7,
          do_sample: true
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    let answer = '';
    if (Array.isArray(data) && data.length > 0) {
      answer = data[0].generated_text || data[0].text || 'I need more information to help with that question.';
    } else if (typeof data === 'string') {
      answer = data;
    } else {
      answer = 'I understand your question, but I need more context about this recipe.';
    }

    // Clean up the response
    answer = answer.replace(prompt, '').trim();
    if (answer.length === 0) {
      answer = 'That\'s a great question! Based on this recipe, I can help you understand the benefits and cooking techniques.';
    }

    return {
      type: 'llm',
      message: answer,
      suggestions: [
        'Tell me more about the health benefits',
        'What makes this recipe special?',
        'How can I modify this recipe?',
        'What should I know before cooking?'
      ]
    };
  }

  async tryOpenAICompatibleAPI(question, recipeData) {
    // Try a free OpenAI-compatible API
    const API_URL = 'https://api.openai.com/v1/chat/completions';
    
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful cooking assistant for teenagers. Answer questions about recipes in a friendly, easy-to-understand way.'
      },
      {
        role: 'user',
        content: `Recipe: ${this.getRecipeDisplayName(recipeData)}
Ingredients: ${(recipeData.ingredients || []).join(', ')}
Category: ${recipeData.category || 'Unknown'}
Calories: ${recipeData.calories || 'Unknown'} per serving

Question: ${question}`
      }
    ];

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-your-openai-key-here', // Replace with actual key
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;

    return {
      type: 'llm',
      message: answer,
      suggestions: [
        'Tell me more about the health benefits',
        'What makes this recipe special?',
        'How can I modify this recipe?',
        'What should I know before cooking?'
      ]
    };
  }

  getIntelligentFallback(question, recipeData) {
    const q = question.toLowerCase();
    
    // Handle benefits questions
    if (q.includes('benefit') || q.includes('good') || q.includes('healthy') || q.includes('why') || q.includes('advantage')) {
      const benefits = this.analyzeRecipeBenefits(recipeData);
      return {
        type: 'benefits',
        message: `Here are the key benefits of this ${recipeData.category} recipe:`,
        suggestions: benefits,
        tip: 'This recipe offers great nutritional value and is perfect for a balanced diet!',
        rating: this.getHealthRating(this.getHealthScore(this.calculateNutrition(recipeData)))
      };
    }
    
    // Handle nutrition questions
    if (q.includes('nutrition') || q.includes('calorie') || q.includes('protein') || q.includes('vitamin')) {
      const nutrition = this.calculateNutrition(recipeData);
      return {
        type: 'nutrition',
        message: `This recipe provides excellent nutrition! Here's the breakdown:`,
        breakdown: {
          'Calories': `${nutrition.calories} per serving`,
          'Protein': `${nutrition.protein}g`,
          'Carbs': `${nutrition.carbs}g`,
          'Fat': `${nutrition.fat}g`,
          'Fiber': `${nutrition.fiber}g`
        },
        suggestions: [
          'How can I increase the protein?',
          'Is this recipe low-carb?',
          'What vitamins does this provide?',
          'How can I reduce calories?'
        ],
        tip: 'This recipe is well-balanced and provides essential nutrients!'
      };
    }
    
    // Handle cooking questions
    if (q.includes('cook') || q.includes('prepare') || q.includes('make') || q.includes('how to')) {
      const method = this.detectCookingMethod(recipeData);
      return {
        type: 'cooking',
        message: `Great question! This recipe uses ${method} cooking method. Here's what you need to know:`,
        suggestions: [
          'What temperature should I use?',
          'How long does it take to cook?',
          'What equipment do I need?',
          'Any special techniques?'
        ],
        tip: this.getCookingTiming(method),
        temperature: this.getTemperatureAdvice(recipeData).temperature
      };
    }
    
    // Handle ingredient questions
    if (q.includes('ingredient') || q.includes('what\'s in') || q.includes('contains')) {
      const mainIngredients = (recipeData.ingredients || []).slice(0, 5);
      return {
        type: 'ingredients',
        message: `This recipe features these key ingredients: ${mainIngredients.join(', ')}. Each brings unique flavors and nutritional benefits!`,
        suggestions: [
          'What can I substitute?',
          'Are there any allergens?',
          'Can I make it vegetarian?',
          'What spices work well?'
        ],
        tip: 'Fresh ingredients always taste better!'
      };
    }
    
    // Handle modification questions
    if (q.includes('modify') || q.includes('change') || q.includes('customize') || q.includes('adapt')) {
      return {
        type: 'modification',
        message: `Absolutely! This recipe is very customizable. You can easily adapt it to your preferences:`,
        suggestions: [
          'Make it spicier',
          'Add more vegetables',
          'Reduce the calories',
          'Make it gluten-free'
        ],
        tip: 'Start with small changes and taste as you go!'
      };
    }
    
    // Handle score improvement questions
    if (q.includes('score') || q.includes('improve') || q.includes('better') || q.includes('enhance')) {
      const nutrition = this.calculateNutrition(recipeData);
      const currentScore = this.getHealthScore(nutrition);
      const improvements = this.getScoreImprovements(recipeData, nutrition, currentScore);
      
      return {
        type: 'improvement',
        message: `Great question! Your recipe currently has a health score of ${currentScore}/10. Here's how to improve it:`,
        suggestions: improvements.suggestions,
        tip: improvements.tip,
        rating: `Current: ${currentScore}/10 → Target: ${improvements.targetScore}/10`,
        breakdown: improvements.breakdown
      };
    }
    
    // Handle difficulty questions
    if (q.includes('difficult') || q.includes('easy') || q.includes('hard') || q.includes('skill')) {
      const difficulty = this.getRecipeDifficulty(recipeData);
      return {
        type: 'difficulty',
        message: `This recipe is ${difficulty.level}! ${difficulty.explanation}`,
        suggestions: [
          'What skills do I need?',
          'How long does it take?',
          'What equipment is required?',
          'Any tips for beginners?'
        ],
        tip: difficulty.tip
      };
    }
    
    // Handle general questions about the recipe
    if (q.includes('what') || q.includes('tell me') || q.includes('about') || q.includes('explain')) {
      return {
        type: 'info',
        message: `This ${recipeData.category} recipe is a great choice! It's ${this.getRecipeDescription(recipeData)}. The combination of ingredients provides ${this.getNutritionalValue(recipeData)}. Perfect for ${this.getMealTime(recipeData)}!`,
        suggestions: [
          'What are the health benefits?',
          'How healthy is this recipe?',
          'What cooking tips do you have?',
          'Can I modify this recipe?'
        ],
        tip: 'This recipe is perfect for meal prep and leftovers!'
      };
    }
    
    // Handle taste/flavor questions
    if (q.includes('taste') || q.includes('flavor') || q.includes('delicious') || q.includes('yummy')) {
      return {
        type: 'taste',
        message: `This recipe has amazing flavor! The combination of ingredients creates a ${this.getFlavorProfile(recipeData)} taste that's both satisfying and healthy.`,
        suggestions: [
          'How can I enhance the flavor?',
          'What spices work well?',
          'Can I make it sweeter?',
          'How to balance the taste?'
        ],
        tip: 'The key to great flavor is balancing sweet, salty, sour, and umami!'
      };
    }
    
    // Default intelligent response
    return {
      type: 'general',
      message: `That's an interesting question about ${this.getRecipeDisplayName(recipeData)}! This ${recipeData.category} recipe has ${recipeData.calories} calories per serving and includes ingredients like ${(recipeData.ingredients || []).slice(0, 3).join(', ')}. I can help you understand more about cooking techniques, nutrition, or modifications.`,
      suggestions: [
        'What are the health benefits?',
        'How can I make this healthier?',
        'What cooking tips do you have?',
        'Can I substitute ingredients?'
      ],
      tip: 'Feel free to ask me anything about this recipe!'
    };
  }

  getRecipeDifficulty(recipeData) {
    const prepTime = recipeData.prep_time_minutes || 0;
    const cookTime = recipeData.cook_time_minutes || 0;
    const totalTime = prepTime + cookTime;
    const ingredients = (recipeData.ingredients || []).length;
    
    if (totalTime < 15 && ingredients < 5) {
      return {
        level: 'beginner-friendly',
        explanation: 'It\'s quick to prepare with simple ingredients.',
        tip: 'Perfect for cooking beginners!'
      };
    } else if (totalTime < 30 && ingredients < 8) {
      return {
        level: 'easy',
        explanation: 'It requires basic cooking skills and common ingredients.',
        tip: 'Great for building confidence in the kitchen!'
      };
    } else if (totalTime < 60 && ingredients < 12) {
      return {
        level: 'intermediate',
        explanation: 'It needs some cooking experience and multiple steps.',
        tip: 'Take your time and follow the steps carefully!'
      };
    } else {
      return {
        level: 'advanced',
        explanation: 'It requires good cooking skills and attention to detail.',
        tip: 'This is a great recipe to challenge yourself!'
      };
    }
  }

  getMealTime(recipeData) {
    const category = recipeData.category || '';
    const calories = recipeData.calories || 0;
    
    if (category.includes('breakfast')) {
      return 'starting your day right';
    } else if (category.includes('lunch')) {
      return 'a satisfying midday meal';
    } else if (category.includes('dinner') || category.includes('main')) {
      return 'a hearty evening meal';
    } else if (category.includes('snack')) {
      return 'a healthy snack break';
    } else if (calories < 200) {
      return 'a light meal or snack';
    } else {
      return 'any time of day';
    }
  }

  getFlavorProfile(recipeData) {
    const ingredients = recipeData.ingredients || [];
    const flavors = [];
    
    if (ingredients.some(ing => ing.includes('garlic') || ing.includes('onion'))) {
      flavors.push('aromatic');
    }
    if (ingredients.some(ing => ing.includes('tomato') || ing.includes('lemon'))) {
      flavors.push('bright');
    }
    if (ingredients.some(ing => ing.includes('herb') || ing.includes('basil'))) {
      flavors.push('fresh');
    }
    if (ingredients.some(ing => ing.includes('spice') || ing.includes('pepper'))) {
      flavors.push('warm');
    }
    
    if (flavors.length === 0) {
      return 'balanced and satisfying';
    }
    
    return flavors.join(', ') + ' and well-balanced';
  }

  getRecipeDisplayName(recipeData) {
    // Handle different possible field names for recipe title
    let name = recipeData.title || recipeData.recipe_name || recipeData.name;
    
    // Check if it's literally the string "undefined" or null/undefined
    if (!name || name === 'undefined' || name === 'null') {
      return 'this recipe';
    }
    
    return name;
  }

  getScoreImprovements(recipeData, nutrition, currentScore) {
    const improvements = {
      suggestions: [],
      tip: '',
      targetScore: Math.min(10, currentScore + 3),
      breakdown: {}
    };
    
    const ingredients = recipeData.ingredients || [];
    const category = recipeData.category || '';
    
    // Analyze what's missing or could be improved
    const issues = [];
    const suggestions = [];
    
    // Check protein content
    if (nutrition.protein < 15) {
      issues.push('low protein');
      suggestions.push('Add lean protein like grilled chicken breast or tofu');
      suggestions.push('Include beans or lentils for plant-based protein');
    }
    
    // Check fiber content
    if (nutrition.fiber < 3) {
      issues.push('low fiber');
      suggestions.push('Add vegetables like broccoli, spinach, or bell peppers');
      suggestions.push('Include whole grains like quinoa or brown rice');
    }
    
    // Check fat content
    if (nutrition.fat > 25) {
      issues.push('high fat');
      suggestions.push('Reduce oil/butter, use cooking spray instead');
      suggestions.push('Choose leaner protein options');
    }
    
    // Check vegetable content
    const hasVegetables = ingredients.some(ing => 
      ing.includes('vegetable') || ing.includes('tomato') || 
      ing.includes('onion') || ing.includes('pepper') ||
      ing.includes('carrot') || ing.includes('broccoli')
    );
    
    if (!hasVegetables) {
      issues.push('no vegetables');
      suggestions.push('Add colorful vegetables for vitamins and fiber');
      suggestions.push('Include leafy greens like spinach or kale');
    }
    
    // Check for processed ingredients
    const hasProcessed = ingredients.some(ing => 
      ing.includes('processed') || ing.includes('canned') || 
      ing.includes('packaged') || ing.includes('instant')
    );
    
    if (hasProcessed) {
      issues.push('processed ingredients');
      suggestions.push('Replace processed ingredients with fresh alternatives');
      suggestions.push('Use whole foods instead of packaged items');
    }
    
    // Check sodium content (if we can detect salty ingredients)
    const hasHighSodium = ingredients.some(ing => 
      ing.includes('salt') || ing.includes('soy sauce') || 
      ing.includes('cheese') || ing.includes('bacon')
    );
    
    if (hasHighSodium) {
      issues.push('high sodium');
      suggestions.push('Reduce salt and use herbs/spices for flavor');
      suggestions.push('Choose low-sodium alternatives');
    }
    
    // Category-specific improvements
    if (category.includes('snack')) {
      suggestions.push('Add nuts or seeds for healthy fats');
      suggestions.push('Include fresh fruit for natural sweetness');
    } else if (category.includes('main') || category.includes('dinner')) {
      suggestions.push('Add a side salad for extra vegetables');
      suggestions.push('Include complex carbs like sweet potato');
    } else if (category.includes('breakfast')) {
      suggestions.push('Add berries for antioxidants');
      suggestions.push('Include Greek yogurt for protein');
    }
    
    // If no specific issues found, provide general improvements
    if (suggestions.length === 0) {
      suggestions.push('Add fresh herbs for flavor without calories');
      suggestions.push('Include more colorful vegetables');
      suggestions.push('Use whole grains instead of refined');
      suggestions.push('Add nuts or seeds for healthy fats');
    }
    
    // Set tip based on current score
    if (currentScore < 5) {
      improvements.tip = 'Focus on adding vegetables and reducing processed ingredients!';
    } else if (currentScore < 7) {
      improvements.tip = 'Great start! Add more protein and fiber to boost the score.';
    } else {
      improvements.tip = 'Excellent recipe! Small tweaks can make it even better.';
    }
    
    improvements.suggestions = suggestions.slice(0, 4); // Limit to 4 suggestions
    improvements.breakdown = {
      'Current Issues': issues.length > 0 ? issues.join(', ') : 'None detected',
      'Improvement Focus': this.getImprovementFocus(issues),
      'Expected Boost': `+${improvements.targetScore - currentScore} points`
    };
    
    return improvements;
  }

  getImprovementFocus(issues) {
    if (issues.includes('low protein')) {
      return 'Protein & Muscle Building';
    } else if (issues.includes('low fiber')) {
      return 'Digestive Health & Satiety';
    } else if (issues.includes('high fat')) {
      return 'Heart Health & Weight Management';
    } else if (issues.includes('no vegetables')) {
      return 'Vitamins & Antioxidants';
    } else if (issues.includes('processed ingredients')) {
      return 'Whole Foods & Natural Nutrition';
    } else {
      return 'Overall Nutritional Balance';
    }
  }

  analyzeRecipeBenefits(recipeData) {
    const benefits = [];
    const ingredients = recipeData.ingredients || [];
    
    // Analyze protein content
    if (ingredients.some(ing => ing.includes('chicken') || ing.includes('beef') || ing.includes('fish'))) {
      benefits.push('High protein content for muscle building');
    }
    
    // Analyze vegetable content
    if (ingredients.some(ing => ing.includes('vegetable') || ing.includes('tomato') || ing.includes('onion'))) {
      benefits.push('Rich in vitamins and antioxidants');
    }
    
    // Analyze fiber content
    if (ingredients.some(ing => ing.includes('bean') || ing.includes('lentil') || ing.includes('whole grain'))) {
      benefits.push('High fiber for digestive health');
    }
    
    // Analyze healthy fats
    if (ingredients.some(ing => ing.includes('olive oil') || ing.includes('avocado') || ing.includes('nuts'))) {
      benefits.push('Contains healthy fats for heart health');
    }
    
    // Default benefits
    if (benefits.length === 0) {
      benefits.push('Balanced nutrition for overall health');
      benefits.push('Easy to prepare and customize');
      benefits.push('Great for meal prep and leftovers');
    }
    
    return benefits;
  }

  getRecipeDescription(recipeData) {
    const category = recipeData.category || '';
    const calories = recipeData.calories || 0;
    
    if (calories < 300) {
      return 'light and healthy';
    } else if (calories < 500) {
      return 'moderately filling';
    } else {
      return 'satisfying and hearty';
    }
  }

  getNutritionalValue(recipeData) {
    const ingredients = recipeData.ingredients || [];
    const values = [];
    
    if (ingredients.some(ing => ing.includes('protein'))) {
      values.push('protein');
    }
    if (ingredients.some(ing => ing.includes('vegetable'))) {
      values.push('vitamins');
    }
    if (ingredients.some(ing => ing.includes('fiber'))) {
      values.push('fiber');
    }
    
    if (values.length === 0) {
      return 'balanced nutrition';
    }
    
    return values.join(', ') + ' and more';
  }

  getSpiceSuggestions(recipeData) {
    const suggestions = [
      'Add 1/2 tsp cayenne pepper for heat',
      'Include 1 tbsp paprika for smoky flavor',
      'Try red pepper flakes for controlled spice',
      'Add jalapeños for fresh heat',
      'Use black pepper for mild warmth'
    ];
    
    return {
      type: 'spice',
      message: 'Here are some ways to make your recipe spicier:',
      suggestions: suggestions,
      tip: 'Start with small amounts and taste as you go!',
      nutrition: 'Spices add minimal calories but enhance flavor significantly.'
    };
  }

  getTemperatureAdvice(recipeData) {
    const cookingMethod = this.detectCookingMethod(recipeData);
    
    const tempGuide = {
      'bake': 'Preheat oven to 350°F (175°C) for most dishes',
      'sauté': 'Use medium-high heat (7/10) - oil should shimmer',
      'simmer': 'Low heat, gentle bubbles - perfect for sauces',
      'fry': 'Medium heat (6/10), oil should be hot but not smoking',
      'grill': 'High heat (8/10) for quick cooking',
      'roast': '400°F (200°C) for crispy vegetables'
    };
    
    return {
      type: 'temperature',
      message: `For ${cookingMethod} cooking:`,
      temperature: tempGuide[cookingMethod] || 'Medium heat (5-6/10)',
      tip: 'Always preheat your pan/oven for best results!',
      timing: this.getCookingTiming(cookingMethod)
    };
  }

  getNutritionAnalysis(recipeData) {
    const nutrition = this.calculateNutrition(recipeData);
    const score = this.getHealthScore(nutrition);
    
    return {
      type: 'nutrition',
      message: `Your recipe has a health score of ${score}/10`,
      breakdown: {
        calories: nutrition.calories,
        protein: nutrition.protein,
        carbs: nutrition.carbs,
        fat: nutrition.fat,
        fiber: nutrition.fiber
      },
      suggestions: this.getNutritionSuggestions(nutrition),
      rating: this.getHealthRating(score)
    };
  }

  getIngredientSuggestions(recipeData) {
    const currentIngredients = recipeData.ingredients || [];
    const suggestions = [];
    const category = recipeData.category || '';
    
    // Analyze current ingredients and suggest complementary ones
    if (currentIngredients.some(ing => ing.includes('chicken'))) {
      suggestions.push('Add ginger and scallions for Asian-inspired flavor');
      suggestions.push('Include lemon and herbs for Mediterranean twist');
    }
    if (currentIngredients.some(ing => ing.includes('tomato'))) {
      suggestions.push('Add fresh basil and mozzarella for Italian flair');
      suggestions.push('Include olives and feta for Greek-inspired taste');
    }
    if (currentIngredients.some(ing => ing.includes('beef'))) {
      suggestions.push('Add mushrooms and red wine for rich depth');
      suggestions.push('Include bell peppers for color and crunch');
    }
    
    // Category-specific suggestions
    if (category.includes('snack')) {
      suggestions.push('Add nuts or seeds for healthy crunch');
      suggestions.push('Include fresh fruit for natural sweetness');
    } else if (category.includes('main') || category.includes('dinner')) {
      suggestions.push('Add roasted vegetables for extra nutrition');
      suggestions.push('Include fresh herbs for aromatic finish');
    } else if (category.includes('breakfast')) {
      suggestions.push('Add berries for antioxidants');
      suggestions.push('Include Greek yogurt for protein boost');
    }
    
    // General suggestions based on missing categories
    if (!currentIngredients.some(ing => ing.includes('garlic'))) {
      suggestions.push('Add garlic for aromatic depth');
    }
    if (!currentIngredients.some(ing => ing.includes('onion'))) {
      suggestions.push('Include onions for natural sweetness');
    }
    if (!currentIngredients.some(ing => ing.includes('herb'))) {
      suggestions.push('Add fresh herbs like parsley or cilantro');
    }
    
    // Remove duplicates and limit suggestions
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 4);
    
    return {
      type: 'ingredients',
      message: 'Here are some ingredient suggestions to enhance your recipe:',
      suggestions: uniqueSuggestions.length > 0 ? uniqueSuggestions : [
        'Add fresh herbs for aromatic flavor',
        'Include colorful vegetables for nutrition',
        'Try adding citrus for brightness',
        'Add nuts or seeds for healthy fats'
      ],
      tip: 'Start with small amounts and adjust to taste!'
    };
  }

  getSubstitutionSuggestions(recipeData, question) {
    const substitutions = {
      'butter': 'olive oil (healthier fat)',
      'cream': 'coconut milk (dairy-free)',
      'flour': 'almond flour (gluten-free)',
      'sugar': 'honey (natural sweetener)',
      'salt': 'herbs and spices (lower sodium)',
      'oil': 'applesauce (for baking)'
    };
    
    let suggestion = null;
    for (const [ingredient, substitute] of Object.entries(substitutions)) {
      if (question.includes(ingredient)) {
        suggestion = `Replace ${ingredient} with ${substitute}`;
        break;
      }
    }
    
    return {
      type: 'substitution',
      message: suggestion || 'Here are some healthy substitutions:',
      suggestions: suggestion ? [suggestion] : [
        'Replace butter with olive oil for healthier fat',
        'Use Greek yogurt instead of cream',
        'Try almond flour instead of wheat flour',
        'Substitute honey for sugar in baking'
      ],
      tip: 'Substitutions may change texture slightly - adjust quantities as needed!'
    };
  }

  getCookingMethodAdvice(recipeData) {
    const method = this.detectCookingMethod(recipeData);
    
    const methods = {
      'bake': 'Preheat oven, use proper pan size, check doneness with toothpick',
      'sauté': 'Heat pan first, don\'t overcrowd, keep ingredients moving',
      'simmer': 'Bring to boil first, then reduce heat to gentle bubbles',
      'fry': 'Use enough oil, maintain consistent temperature',
      'grill': 'Preheat grill, oil grates, don\'t move food too early'
    };
    
    return {
      type: 'cooking',
      message: `For ${method} cooking:`,
      advice: methods[method] || 'Use medium heat and watch carefully',
      tips: [
        'Always taste and adjust seasoning',
        'Don\'t rush the cooking process',
        'Use fresh ingredients when possible'
      ]
    };
  }

  detectCookingMethod(recipeData) {
    const title = (recipeData.title || '').toLowerCase();
    const directions = (recipeData.directions || []).join(' ').toLowerCase();
    const text = title + ' ' + directions;
    
    if (text.includes('bake') || text.includes('oven')) return 'bake';
    if (text.includes('fry') || text.includes('pan-fry')) return 'fry';
    if (text.includes('grill') || text.includes('barbecue')) return 'grill';
    if (text.includes('simmer') || text.includes('boil')) return 'simmer';
    if (text.includes('sauté') || text.includes('stir-fry')) return 'sauté';
    if (text.includes('roast')) return 'roast';
    
    return 'cook'; // default
  }

  calculateNutrition(recipeData) {
    // Simplified nutrition calculation
    const ingredients = recipeData.ingredients || [];
    let calories = 0, protein = 0, carbs = 0, fat = 0, fiber = 0;
    
    ingredients.forEach(ingredient => {
      const ing = ingredient.toLowerCase();
      if (ing.includes('chicken') || ing.includes('beef')) {
        calories += 200; protein += 25; fat += 8;
      } else if (ing.includes('vegetable') || ing.includes('tomato')) {
        calories += 25; carbs += 5; fiber += 2;
      } else if (ing.includes('oil') || ing.includes('butter')) {
        calories += 120; fat += 14;
      } else if (ing.includes('flour') || ing.includes('rice')) {
        calories += 100; carbs += 20; fiber += 1;
      }
    });
    
    return { calories, protein, carbs, fat, fiber };
  }

  getHealthScore(nutrition) {
    let score = 5; // base score
    
    // Protein bonus
    if (nutrition.protein > 20) score += 2;
    else if (nutrition.protein > 10) score += 1;
    
    // Fiber bonus
    if (nutrition.fiber > 5) score += 2;
    else if (nutrition.fiber > 2) score += 1;
    
    // Fat penalty
    if (nutrition.fat > 30) score -= 2;
    else if (nutrition.fat > 20) score -= 1;
    
    return Math.max(1, Math.min(10, score));
  }

  getHealthRating(score) {
    if (score >= 8) return 'Excellent - Very healthy!';
    if (score >= 6) return 'Good - Well balanced';
    if (score >= 4) return 'Fair - Could be healthier';
    return 'Needs improvement - Add more vegetables';
  }

  getNutritionSuggestions(nutrition) {
    const suggestions = [];
    
    if (nutrition.protein < 15) {
      suggestions.push('Add lean protein like chicken or beans');
    }
    if (nutrition.fiber < 3) {
      suggestions.push('Include more vegetables for fiber');
    }
    if (nutrition.fat > 25) {
      suggestions.push('Reduce oil/butter, try cooking spray');
    }
    
    return suggestions.length > 0 ? suggestions : ['Your recipe looks well balanced!'];
  }

  getCookingTiming(method) {
    const timings = {
      'bake': '20-45 minutes depending on size',
      'sauté': '5-10 minutes for most vegetables',
      'simmer': '15-30 minutes for sauces',
      'fry': '3-5 minutes per side',
      'grill': '4-6 minutes per side'
    };
    
    return timings[method] || 'Cook until done - check frequently';
  }
}

// Initialize AI Chat Assistant
const chatAssistant = ref(new RecipeChatAssistant());
const chatMessages = ref([]);
const showChatAssistant = ref(false);
const currentQuestion = ref('');

// Chat Assistant Functions
const askQuestion = async () => {
  if (!currentQuestion.value.trim() || !selectedRecipe.value) return;
  
  const question = currentQuestion.value.trim();
  const response = await chatAssistant.value.getResponse(question, selectedRecipe.value);
  
  // Add user message
  chatMessages.value.push({
    type: 'user',
    content: question,
    timestamp: new Date()
  });
  
  // Add assistant response
  chatMessages.value.push({
    type: 'assistant',
    content: response.message,
    suggestions: response.suggestions,
    tip: response.tip,
    nutrition: response.nutrition,
    temperature: response.temperature,
    timing: response.timing,
    breakdown: response.breakdown,
    rating: response.rating,
    timestamp: new Date()
  });
  
  currentQuestion.value = '';
};

const toggleChatAssistant = () => {
  showChatAssistant.value = !showChatAssistant.value;
  if (showChatAssistant.value && chatMessages.value.length === 0) {
    // Add welcome message
    chatMessages.value.push({
      type: 'assistant',
      content: 'Hi! I\'m your AI cooking assistant. I can help with spice levels, cooking temperatures, nutrition advice, ingredient suggestions, and substitutions. What would you like to know about this recipe?',
      suggestions: [
        'How can I make this spicier?',
        'What temperature should I use?',
        'Is this recipe balanced?',
        'What ingredients should I add?'
      ],
      timestamp: new Date()
    });
  }
};

const useSuggestion = (suggestion) => {
  currentQuestion.value = suggestion;
  askQuestion();
};

// API calls
const API_BASE = 'https://nexgentech-api.onrender.com'; // Use the working API

const fetchRecipes = async () => {
  loading.value = true;
  try {
    const response = await fetch(`${API_BASE}/api/recipes/search?limit=200`);
    
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
  // Load favorites from localStorage
  const savedFavorites = localStorage.getItem('favoriteRecipes');
  if (savedFavorites) {
    try {
      favoriteRecipes.value = new Set(JSON.parse(savedFavorites));
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
    }
  }
  
  fetchFilterOptions();
  // Don't fetch recipes automatically - wait for meal type selection
  // fetchRecipes();
  
  // Initialize Smart Meal Plan with all ingredients selected by default
  initializeSmartMealIngredients();
});

// Initialize Smart Meal Plan ingredients as selected by default
function initializeSmartMealIngredients() {
  const allIngredients = [];
  Object.values(smartMealIngredientCategories.value).forEach(categoryIngredients => {
    allIngredients.push(...categoryIngredients);
  });
  smartMealSelectedIngredients.value = [...allIngredients];
}

// Meal type selection function
function selectMealType(type) {
  selectedMealType.value = type;
  
  if (type === 'smart') {
    // Auto-select categories for Smart Meal Plan
    selectedCategories.value = ['breakfast', 'desserts', 'main-meals', 'side-dishes'];
  } else {
    // Reset categories for Quick Meals
    selectedCategories.value = [];
  }
  
  // Fetch recipes when meal type is selected
  fetchRecipes();
}

// Smart Meal Plan helper functions
function getCategoryIcon(category) {
  const icons = {
    breakfast: '🥣',
    protein: '🍗',
    vegetables: '🥦',
    fruits: '🍎'
  };
  return icons[category] || '🍽️';
}

function toggleIngredient(ingredient) {
  const index = quickMealIngredients.value.indexOf(ingredient);
  if (index > -1) {
    quickMealIngredients.value.splice(index, 1);
  } else {
    quickMealIngredients.value.push(ingredient);
  }
  // Trigger recipe filtering when ingredients change
  fetchRecipes();
}

function toggleSmartMealIngredient(ingredient) {
  const index = smartMealSelectedIngredients.value.indexOf(ingredient);
  if (index > -1) {
    smartMealSelectedIngredients.value.splice(index, 1);
  } else {
    smartMealSelectedIngredients.value.push(ingredient);
  }
  // Trigger recipe filtering when ingredients change
  fetchRecipes();
}

function removeCurrentIngredient(ingredient) {
  if (selectedMealType.value === 'quick') {
    const index = quickMealIngredients.value.indexOf(ingredient);
    if (index > -1) {
      quickMealIngredients.value.splice(index, 1);
    }
  } else {
    const index = smartMealSelectedIngredients.value.indexOf(ingredient);
    if (index > -1) {
      smartMealSelectedIngredients.value.splice(index, 1);
    }
  }
  fetchRecipes();
}

// Category search functions
function searchCategoryIngredients(category) {
  const searchTerm = categorySearch.value[category].toLowerCase();
  if (!searchTerm) {
    categorySearchResults.value[category] = [];
    return;
  }
  
  // Search in all ingredients for matches
  const matches = allIngredients.value.filter(ingredient => 
    ingredient.toLowerCase().includes(searchTerm) &&
    !filteredSmartMealIngredients.value[category].includes(ingredient)
  );
  
  categorySearchResults.value[category] = matches.slice(0, 5); // Limit to 5 results
}

function getDisplayedIngredients(category) {
  const baseIngredients = filteredSmartMealIngredients.value[category];
  const searchResults = categorySearchResults.value[category];
  
  // Show base ingredients + search results
  return [...baseIngredients, ...searchResults];
}

async function ensureJpegOrPng(file) {
  if (!file) return null;
  if (/^image\/(jpeg|png)$/i.test(file.type)) return file;

  // convert WebP/GIF etc. to PNG
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width; canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  return new Promise(resolve => {
    canvas.toBlob(b => {
      resolve(new File([b], (file.name || 'image') + '.png', { type: 'image/png' }));
    }, 'image/png', 0.92);
  });
}

async function onImagePicked(e) {
  analyzeError.value = '';
  analyzeTips.value = [];

  const f = e.target.files?.[0];
  if (!f) {
    pickedFile.value = null;
    previewUrl.value = '';
    return;
  }

  // --- front check file size ---
  if (f.size > 5 * 1024 * 1024) {
    analyzeError.value = 'picture is too large (>5MB), please compress and try again!';
    pickedFile.value = null;
    previewUrl.value = '';
    return;
  }

  // --- preview original file ---
  pickedFile.value = f;
  previewUrl.value = URL.createObjectURL(f);

  // --- if webp/gif，convert to png（ensure Rekognition support） ---
  if (!/^image\/(jpeg|png)$/i.test(f.type)) {
    try {
      const bitmap = await createImageBitmap(f);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(bitmap, 0, 0);
      const blob = await new Promise(resolve =>
        canvas.toBlob(b => resolve(b), 'image/png', 0.92)
      );
      const newFile = new File([blob], f.name.replace(/\.[^.]+$/, '') + '.png', {
        type: 'image/png',
      });
      pickedFile.value = newFile;
      console.log('[vision] converted', f.type, '→ image/png');
    } catch (err) {
      console.warn('[vision] convert to PNG failed:', err);
    }
  }
}


const detectedLabels = ref([]); 

async function analyzePickedImage() {
  const LAMBDA_URL = 'https://www.nexgentech.me/api/vision/detect';
  if (!pickedFile.value) return;

  analyzeError.value = '';
  analyzeTips.value = [];
  detectedLabels.value = [];
  analyzing.value = true;

  try {
    // 1) convert jpg/png（convert webp/gif to png）
    const uploadFile = await ensureJpegOrPng(pickedFile.value);
    if (!uploadFile) {
      analyzeError.value = 'please select a valid image file';
      return;
    }
    if (uploadFile.size > 5 * 1024 * 1024) {
      analyzeError.value = 'picture is too large (>5MB), please compress and try again!';
      return;
    }

    // 2) send request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s
    const resp = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': uploadFile.type || 'application/octet-stream' },
      body: uploadFile,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    // 3) parse response
    console.log('[vision] status:', resp.status, resp.statusText);
    const text = await resp.text();
    console.log('[vision] raw body:', text);

    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

    // error handling
    if (!resp.ok) {
      const map = {
        413: 'picture too large!(>5MB)',
        415: 'only JPG/PNG images are supported!',
        422: 'no usable ingredients found!'
      };
      analyzeError.value = data?.error || map[resp.status] || `${resp.status} ${resp.statusText}`;
      return;
    }

    // 4) align with new API response format
    const labels = Array.isArray(data.labels) ? data.labels : [];
    detectedLabels.value = labels; // for chips
    if (labels.length) {
      analyzeTips.value.push('Detected: ' + labels.map(x => x.label).join(', '));
    }

    if (Array.isArray(data.candidates) && data.candidates.length) {
      // card shows _matched_label(highest confidence)
      candidateRecipes.value = data.candidates;
      showCandidateModal.value = true;
    } else {
      // 5) no candidates: generate a "synthetic recipe" using the highest confidence label
      const top = labels.sort((a, b) => (b.conf || 0) - (a.conf || 0))[0];
      const key = top?.label || 'salad';
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
    analyzeError.value = (err && err.name === 'AbortError') ? 'request timed out, please try again' : (err.message || 'Network error');
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

const recipeImg = (c) => {
  // 1)  image_filename first
  if (c?.image_filename) {
    let name = String(c.image_filename);
    // make sure there's a valid extension, otherwise add .png
    if (!/\.(png|jpe?g|webp|gif)$/i.test(name)) name += '.png';
    return `https://nexgentech-api.onrender.com/food_icons/${encodeURIComponent(name)}`;
  }

  // 2) fallback to image_url
  let url = String(c?.image_url || '');
  if (!url) return 'https://nexgentech-api.onrender.com/food_icons/placeholder.png'; // default placeholder

  // Check the last segment of the file
  const i = url.lastIndexOf('/');
  const base = i >= 0 ? url.slice(0, i + 1) : '';
  let file = i >= 0 ? url.slice(i + 1) : url;

  // If no valid extension, add .png
  if (!/\.(png|jpe?g|webp|gif)$/i.test(file)) file += '.png';

  return base + encodeURIComponent(file);
};


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

/* Meal Type Selection Styles */
.meal-type-section {
  position: relative;
  margin-bottom: 24px;
  z-index: 1;
}

.meal-type-container {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 20px;
}

.meal-type-title {
  font-family: 'Merriweather', serif;
  font-size: 24px;
  font-weight: 600;
  color: #294B0A;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.meal-type-buttons {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.meal-type-btn {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(41, 75, 10, 0.2);
  border-radius: 16px;
  padding: 20px 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 180px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.meal-type-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  border-color: rgba(41, 75, 10, 0.4);
}

.meal-type-btn.active {
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  border-color: #8b7765;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(139, 119, 101, 0.3);
}

/* Enhanced styling when no selection is made */
.meal-type-section:not(.has-selection) .meal-type-btn {
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 0 0 0 rgba(41, 75, 10, 0.4);
  }
  50% {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 0 0 8px rgba(41, 75, 10, 0.1);
  }
}

.meal-icon {
  font-size: 32px;
  line-height: 1;
}

.meal-text {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.meal-desc {
  font-family: 'Merriweather', serif;
  font-size: 14px;
  opacity: 0.8;
  line-height: 1.2;
}

@media (max-width: 768px) {
  .meal-type-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .meal-type-btn {
    min-width: 200px;
  }
  
  .meal-type-title {
    font-size: 20px;
  }
}

/* Plant-Based Filter Styles */
.dietary-preference {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-size: 14px;
  color: #294B0A;
}

.radio-option input[type="radio"] {
  margin: 0;
  accent-color: #8b7765;
}

.radio-label {
  font-weight: 500;
}

/* Smart Ingredients Grid Styles */
.smart-ingredients-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px;
  margin-top: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(41, 75, 10, 0.1);
}

/* Specific positioning for categories */
.smart-ingredients-grid .ingredient-category:nth-child(1) {
  grid-column: 1;
  grid-row: 1;
}

.smart-ingredients-grid .ingredient-category:nth-child(2) {
  grid-column: 2;
  grid-row: 1;
}

.smart-ingredients-grid .ingredient-category:nth-child(3) {
  grid-column: 1;
  grid-row: 2;
}

.smart-ingredients-grid .ingredient-category:nth-child(4) {
  grid-column: 2;
  grid-row: 2;
}

.ingredient-category {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 16px;
  border: 1px solid rgba(41, 75, 10, 0.1);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(41, 75, 10, 0.1);
}

.category-icon {
  font-size: 20px;
}

.category-name {
  font-family: 'Merriweather', serif;
  font-size: 16px;
  font-weight: 600;
  color: #294B0A;
}

.category-search {
  margin-bottom: 12px;
}

.category-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(41, 75, 10, 0.2);
  border-radius: 8px;
  font-family: 'Merriweather', serif;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.9);
  transition: border-color 0.2s ease;
}

.category-search-input:focus {
  outline: none;
  border-color: #8b7765;
}

.category-search-input::placeholder {
  color: rgba(41, 75, 10, 0.5);
}

.ingredient-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ingredient-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(41, 75, 10, 0.2);
  border-radius: 20px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Merriweather', serif;
  font-size: 13px;
}

.ingredient-pill:hover {
  background: rgba(41, 75, 10, 0.1);
  border-color: rgba(41, 75, 10, 0.4);
}

.ingredient-pill.selected {
  background: linear-gradient(135deg, #8b7765 0%, #a68a6b 100%);
  border-color: #8b7765;
  color: #ffffff !important;
  font-weight: 600;
}

.ingredient-name {
  font-weight: 500;
}

.ingredient-action {
  font-weight: bold;
  font-size: 14px;
  line-height: 1;
  color: inherit;
}

/* Smart Meal Plan Categories Layout */
.smart-meal-categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.category-group {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(41, 75, 10, 0.1);
}

.category-title {
  font-family: 'Merriweather', serif;
  font-size: 18px;
  font-weight: 600;
  color: #294B0A;
  margin-bottom: 15px;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(41, 75, 10, 0.2);
}

.category-recipe {
  display: flex;
  justify-content: center;
}

.category-recipe .recipe-card {
  width: 100%;
  max-width: 300px;
}

/* Quick Swap Button */
.recipe-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.cal-info, .protein-info {
  background: linear-gradient(135deg, #ff7f50 0%, #ff6b35 100%);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 8px rgba(255, 127, 80, 0.3);
}

.quick-swap-btn {
  background: linear-gradient(135deg, #ff7f50 0%, #ff6b35 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 127, 80, 0.3);
  font-family: 'Merriweather', serif;
}

.quick-swap-btn:hover {
  background: linear-gradient(135deg, #ff6b35 0%, #ff5722 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 127, 80, 0.4);
}

.quick-swap-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(255, 127, 80, 0.3);
}

/* Responsive adjustments for Smart Meal Plan */
@media (max-width: 1200px) {
  .smart-meal-categories {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .smart-meal-categories {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .category-group {
    padding: 15px;
    min-height: auto;
  }
  
  .category-title {
    font-size: 16px;
  }
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
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.subtitle {
  text-align: center;
  color: white;
  font-size: 1.2rem;
  margin-bottom: 3rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
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

.ingredient-more {
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  font-style: italic;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
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
  padding: 30px 10px 10px 10px;
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
  cursor: pointer;
}

.recipe-card:hover .recipe-image {
  transform: scale(1.05);
}

.recipe-image:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
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

/* Large modal for 3-column layout */
.modal-content-large {
  background: white;
  border-radius: 15px;
  max-width: 95vw;
  width: 1400px;
  max-height: 95vh;
  overflow-y: auto;
  position: relative;
}

/* Three column layout */
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
  font-family: 'Merriweather', serif;
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
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #ced4da;
  border-radius: 8px;
  font-size: 1rem;
  text-align: center;
  background: white;
  transition: border-color 0.3s ease;
}

.serving-multiplier-input:focus {
  outline: none;
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
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

.ingredient-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.ingredient-name {
  font-weight: 500;
  flex: 1;
}

.measurement-controls {
  display: flex;
  gap: 8px;
  align-items: center;
}

.unit-dropdown, .quantity-input {
  padding: 8px 12px;
  border: 2px solid #d4c4a8;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Merriweather', serif;
  color: #8b7765;
  background: white;
  transition: border-color 0.3s ease;
}

.unit-dropdown:focus, .quantity-input:focus {
  outline: none;
  border-color: #1a5536;
  box-shadow: 0 0 0 3px rgba(26, 85, 54, 0.1);
}

.quantity-input {
  width: 80px;
  text-align: center;
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

.nutrition-summary {
  background: white;
  margin: 0;
  border-radius: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nutrition-summary .section-title {
  color: #8b7765;
  margin-bottom: 25px;
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.nutrition-item {
  text-align: center;
  padding: 10px;
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
  border-radius: 15px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.nutrition-item:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 127, 80, 0.4);
}

.nutrition-item:hover::before {
  opacity: 1;
}

.nutrition-label {
  display: block;
  color: white;
  font-size: 0.65rem;
  margin-bottom: 4px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.nutrition-value {
  display: block;
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* Combined Visualizations */
.combined-visualizations {
  background: white;
  padding: 30px;
  border-radius: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.analysis-description {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 20px;
  font-style: italic;
}

.visualizations-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

.subsection-title {
  color: #8b7765;
  font-size: 1.2rem;
  margin-bottom: 15px;
  text-align: center;
  font-family: 'Merriweather', serif;
}

/* Food Groups Analysis */
.food-groups-analysis {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.food-groups-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.legend-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.legend-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.legend-color.vegetables { background: linear-gradient(135deg, #4caf50, #66bb6a); }
.legend-color.fruits { background: linear-gradient(135deg, #ff9800, #ffb74d); }
.legend-color.grains { background: linear-gradient(135deg, #8d6e63, #a1887f); }
.legend-color.protein { background: linear-gradient(135deg, #f44336, #ef5350); }
.legend-color.dairy { background: linear-gradient(135deg, #2196f3, #42a5f5); }

.legend-label {
  flex: 1;
  font-weight: 600;
  color: #8b7765;
  font-size: 1rem;
}

.legend-status {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 12px;
}

.legend-status.present {
  background: #e8f5e8;
  color: #2e7d32;
}

.legend-status.missing {
  background: #ffebee;
  color: #c62828;
}


/* Nutrition Radar Chart */
.nutrition-radar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
  max-width: 300px;
}

.radar-polygon {
  animation: drawPolygon 1s ease-in-out;
}

.radar-point {
  animation: pulse 2s infinite;
  cursor: pointer;
  transition: all 0.3s ease;
}

.radar-point:hover {
  r: 8;
  fill: #ff6b6b;
  stroke: white;
  stroke-width: 2;
}

.radar-label {
  font-size: 12px;
  font-weight: 600;
  fill: #8b7765;
  font-family: 'Merriweather', serif;
}

/* Radar Tooltip */
.radar-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.tooltip-content strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.tooltip-score {
  font-size: 1.1rem;
  font-weight: 700;
  color: #4ecdc4;
}

@keyframes drawPolygon {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}

@keyframes pulse {
  0%, 100% {
    r: 4;
    opacity: 1;
  }
  50% {
    r: 6;
    opacity: 0.7;
  }
}

/* Nutrition Comparison Visualization */
.nutrition-comparison {
  background: white;
  padding: 30px;
  border-radius: 0 0 15px 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.comparison-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

.comparison-chart {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.chart-header {
  text-align: center;
  margin-bottom: 25px;
}

.chart-header h4 {
  color: #8b7765;
  font-size: 1.3rem;
  margin-bottom: 8px;
  font-family: 'Merriweather', serif;
}

.chart-subtitle {
  color: #666;
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
  font-weight: 600;
  color: #8b7765;
  font-size: 1rem;
}

.current-value {
  font-weight: 700;
  color: #1a5536;
  font-size: 1.1rem;
}

.progress-container {
  position: relative;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
  position: relative;
}

.progress-fill.calories {
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
}

.progress-fill.protein {
  background: linear-gradient(90deg, #4ecdc4, #6ed5cd);
}

.progress-fill.carbs {
  background: linear-gradient(90deg, #45b7d1, #6bc5d8);
}

.progress-fill.fat {
  background: linear-gradient(90deg, #f9ca24, #fbd54a);
}

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

/* Pagination Styles */
.pagination-container-top {
  margin: 40px 0 20px 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.pagination-container {
  margin-top: 30px;
  text-align: center;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.pagination-btn {
  padding: 10px 20px;
  background: #1a5536;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #2d7a4a;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.pagination-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #d4c4a8;
  background: white;
  color: #8b7765;
  border-radius: 50%;
  cursor: pointer;
  font-family: 'Merriweather', serif;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  border-color: #1a5536;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.page-btn.active {
  background: #1a5536;
  color: white;
  border-color: #1a5536;
}

.pagination-info {
  color: white;
  font-size: 0.9rem;
  opacity: 0.9;
  font-family: 'Merriweather', serif;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .pagination-btn {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
  
  .page-btn {
    width: 35px;
    height: 35px;
    font-size: 0.8rem;
  }
  
  .pagination-info {
    font-size: 0.8rem;
  }
  
  .comparison-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
  }
  
  .plate-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .plate-circle {
    width: 250px;
    height: 250px;
  }
  
  .radar-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .radar-svg {
    height: 250px;
  }
  
  .visualizations-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.candidate-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;}
.candidate-panel{background:#fff;max-width:760px;width:92%;border-radius:16px;padding:20px;}
.candidate-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:12px;}
.candidate-card{border:1px solid #eee;border-radius:12px;overflow:hidden;cursor:pointer;transition:.2s;background:#fff;}
.candidate-card:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(0,0,0,.08);}
.candidate-card img{width:100%;height:120px;object-fit:cover;}
.candidate-card .title{font-weight:600;padding:8px 10px;}
.candidate-card .meta{font-size:.9rem;color:#666;padding:0 10px 12px;}
.close-btn{margin-top:10px}

/* AI Chat Assistant Styles */
.ai-chat-toggle {
  position: absolute;
  top: 20px;
  right: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  z-index: 1000;
}

.ai-chat-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.ai-chat-toggle.active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  box-shadow: 0 4px 15px rgba(240, 147, 251, 0.3);
}

.ai-icon {
  font-size: 16px;
}

.ai-text {
  font-size: 14px;
}

/* Chat Modal Styles */
.chat-modal-overlay {
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
}

.chat-modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 600px;
  height: 80vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.chat-close {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.chat-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chat-message {
  display: flex;
  flex-direction: column;
}

.chat-message.user {
  align-items: flex-end;
}

.chat-message.assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 80%;
  padding: 15px 20px;
  border-radius: 20px;
  position: relative;
}

.chat-message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 5px;
}

.chat-message.assistant .message-content {
  background: #f8f9fa;
  color: #333;
  border-bottom-left-radius: 5px;
  border: 1px solid #e9ecef;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.message-suggestions {
  margin-top: 10px;
}

.suggestions-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 600;
}

.suggestion-btn {
  background: #e3f2fd;
  color: #1976d2;
  border: none;
  padding: 8px 12px;
  border-radius: 15px;
  font-size: 12px;
  margin: 2px 4px 2px 0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-btn:hover {
  background: #bbdefb;
  transform: translateY(-1px);
}

.message-tip {
  background: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 8px;
  border-left: 3px solid #ffc107;
}

.message-info {
  background: #d1ecf1;
  color: #0c5460;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 8px;
  border-left: 3px solid #17a2b8;
}

.message-rating {
  background: #d4edda;
  color: #155724;
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 12px;
  margin-top: 8px;
  border-left: 3px solid #28a745;
  font-weight: 600;
}

.nutrition-breakdown {
  margin-top: 10px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #dee2e6;
}

.breakdown-title {
  font-size: 12px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.breakdown-label {
  color: #6c757d;
  font-weight: 500;
}

.breakdown-value {
  color: #495057;
  font-weight: 600;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 10px;
  background: #f8f9fa;
}

.chat-input-field {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #dee2e6;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.3s ease;
}

.chat-input-field:focus {
  border-color: #667eea;
}

.chat-send-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.chat-send-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive Chat Styles */
@media (max-width: 768px) {
  .chat-modal-content {
    width: 95%;
    height: 90vh;
  }
  
  .ai-chat-toggle {
    right: 20px;
    padding: 10px 16px;
    font-size: 12px;
  }
  
  .ai-text {
    display: none;
  }
  
  .message-content {
    max-width: 90%;
  }
  
  .breakdown-grid {
    grid-template-columns: 1fr;
  }
}

.image-analyze-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom: 10px; }
.image-input { padding: 10px 12px; border: 2px solid #d4c4a8; border-radius: 12px; background: white; color: #8b7765; font-family: 'Merriweather', serif; }
.analyze-btn { padding: 10px 16px; background:#1a5536; color:#fff; border:none; border-radius: 12px; cursor:pointer; font-family:'Merriweather', serif; transition:.2s; }
.analyze-btn:disabled { background:#999; cursor:not-allowed; }
.analyze-btn:hover:not(:disabled){ background:#2d7a4a; transform: translateY(-1px); }
.image-preview-wrap { margin-top: 10px; }
.image-preview img { max-width: 220px; border-radius: 12px; border:1px solid rgba(0,0,0,.1); }
.analyze-error { color:#b00020; margin-top: 6px; }
.analyze-tips { margin:8px 0 0; padding-left: 1.1rem; color:#8b7765; }

</style>