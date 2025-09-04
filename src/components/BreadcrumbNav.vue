<template>
  <nav class="breadcrumb" aria-label="Breadcrumb">
    <ol class="breadcrumb-list">
      <li v-for="(item, index) in breadcrumbs" :key="index" class="breadcrumb-item">
        <router-link 
          v-if="index < breadcrumbs.length - 1" 
          :to="item.path" 
          class="breadcrumb-link"
        >
          {{ item.name }}
        </router-link>
        <span v-else class="breadcrumb-current" aria-current="page">
          {{ item.name }}
        </span>
        <span v-if="index < breadcrumbs.length - 1" class="breadcrumb-separator">></span>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const pathSegments = route.path.split('/').filter(segment => segment)
  const breadcrumbItems = [
    { name: 'Home', path: '/' }
  ]

  // Map route paths to display names
  const routeNames = {
    'game': 'Discover Games',
    'wordle-game': 'Wordle Game',
    'food-swap': 'Healthier Swaps'
  }

  // Build breadcrumb trail based on current route
  if (pathSegments.length === 0) {
    return [{ name: 'Home', path: '/' }]
  }

  // Add intermediate breadcrumbs
  if (pathSegments.includes('game') && !pathSegments.includes('wordle-game') && !pathSegments.includes('food-swap')) {
    // This is the Discover Games page itself
    breadcrumbItems.push({ name: 'Discover Games', path: '/game' })
  } else if (pathSegments.includes('wordle-game')) {
    // This is Wordle Game page - add Discover Games as intermediate
    breadcrumbItems.push({ name: 'Discover Games', path: '/game' })
    breadcrumbItems.push({ name: 'Wordle Game', path: '/wordle-game' })
  } else if (pathSegments.includes('food-swap')) {
    // This is Food Swap page - direct from Home
    breadcrumbItems.push({ name: 'Healthier Swaps', path: '/food-swap' })
  }

  return breadcrumbItems
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 20px;
  padding: 0 16px;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  gap: 8px;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  color: #ffffff;
  text-decoration: none;
  font-family: 'Merriweather', serif;
  font-size: 1.1rem;
  font-weight: 700;
  transition: color 0.3s ease;
  padding: 6px 12px;
  border-radius: 6px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.breadcrumb-link:hover {
  color: #A3B394;
  background-color: rgba(163, 179, 148, 0.2);
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.breadcrumb-current {
  color: #ffffff;
  font-family: 'Merriweather', serif;
  font-size: 1.1rem;
  font-weight: 700;
  padding: 6px 12px;
  background-color: rgba(163, 179, 148, 0.25);
  border-radius: 6px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.breadcrumb-separator {
  color: #ffffff;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0 6px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* Responsive design */
@media (max-width: 768px) {
  .breadcrumb {
    padding: 0 12px;
    margin-bottom: 16px;
  }
  
  .breadcrumb-link,
  .breadcrumb-current {
    font-size: 1rem;
    padding: 4px 8px;
  }
  
  .breadcrumb-separator {
    margin: 0 4px;
    font-size: 1.1rem;
  }
}
</style>
