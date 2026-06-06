// favorites.js — manage saved recipes in localStorage
import { storage } from './storage.js'

const KEY = 'nutrifind_favorites'

export function getFavorites() {
  return storage.get(KEY) || []
}

export function isSaved(recipeId) {
  return getFavorites().some(r => r.id === recipeId)
}

export function saveRecipe(recipe) {
  const favs = getFavorites()
  if (!isSaved(recipe.id)) {
    favs.unshift(recipe)
    storage.set(KEY, favs)
  }
}

export function removeRecipe(recipeId) {
  const favs = getFavorites().filter(r => r.id !== recipeId)
  storage.set(KEY, favs)
}
