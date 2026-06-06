// api.js — Edamam API integration

const RECIPE_APP_ID  = import.meta.env.VITE_RECIPE_APP_ID
const RECIPE_APP_KEY = import.meta.env.VITE_RECIPE_APP_KEY
const NUTRITION_APP_ID  = import.meta.env.VITE_NUTRITION_APP_ID
const NUTRITION_APP_KEY = import.meta.env.VITE_NUTRITION_APP_KEY

/**
 * Search recipes by query and optional diet/health filters
 * @param {string} query - search term
 * @param {string[]} filters - health labels e.g. ['vegan', 'gluten-free']
 * @param {number} from - pagination start
 * @returns {Promise<{hits: Array, count: number}>}
 */
export async function searchRecipes(query, filters = [], from = 0) {
  const params = new URLSearchParams({
    type: 'public',
    q: query,
    app_id: RECIPE_APP_ID,
    app_key: RECIPE_APP_KEY,
    from: String(from),
    to: String(from + 20),
  })

  filters.forEach(f => params.append('health', f))

  const res = await fetch(
    `https://api.edamam.com/api/recipes/v2?${params}`
  )

  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid API key. Please check your .env file.')
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment.')
    throw new Error(`API error: ${res.status}`)
  }

  const data = await res.json()
  return {
    hits: data.hits || [],
    count: data.count || 0,
    nextPage: data._links?.next?.href || null
  }
}

/**
 * Analyze nutrition for a recipe using ingredient list
 * @param {string} title - recipe title
 * @param {string[]} ingredients - array of ingredient strings
 * @param {number} yield_ - number of servings
 * @returns {Promise<Object>} - analyzed recipe nutrition data
 */
export async function analyzeNutrition(title, ingredients, yield_ = 4) {
  const params = new URLSearchParams({
    app_id: NUTRITION_APP_ID,
    app_key: NUTRITION_APP_KEY,
  })

  const res = await fetch(
    `https://api.edamam.com/api/nutrition-details?${params}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, ingr: ingredients, yield: String(yield_) })
    }
  )

  if (!res.ok) {
    if (res.status === 555) throw new Error('Recipe ingredients could not be analyzed.')
    if (res.status === 422) throw new Error('Could not parse the ingredient list.')
    throw new Error(`Nutrition API error: ${res.status}`)
  }

  return await res.json()
}

/**
 * Extract clean recipe object from an Edamam hit
 */
export function parseRecipe(hit) {
  const r = hit.recipe
  return {
    id: encodeURIComponent(hit._links?.self?.href || r.label),
    label: r.label,
    image: r.image,
    source: r.source,
    url: r.url,
    yield: r.yield,
    calories: Math.round(r.calories),
    caloriesPerServing: Math.round(r.calories / r.yield),
    totalNutrients: r.totalNutrients,
    dietLabels: r.dietLabels || [],
    healthLabels: r.healthLabels || [],
    ingredientLines: r.ingredientLines || [],
    cuisineType: r.cuisineType || [],
    mealType: r.mealType || [],
    macros: {
      protein: Math.round((r.totalNutrients?.PROCNT?.quantity || 0) / r.yield),
      carbs:   Math.round((r.totalNutrients?.CHOCDF?.quantity || 0) / r.yield),
      fat:     Math.round((r.totalNutrients?.FAT?.quantity    || 0) / r.yield),
      fiber:   Math.round((r.totalNutrients?.FIBTG?.quantity  || 0) / r.yield),
    }
  }
}
