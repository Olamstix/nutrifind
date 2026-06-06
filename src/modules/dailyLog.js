// dailyLog.js — daily meal tracking
import { storage } from './storage.js'

function todayKey() {
  return `nutrifind_log_${new Date().toISOString().slice(0, 10)}`
}

export function getLog() {
  return storage.get(todayKey()) || []
}

export function addMeal(recipe, servings = 1) {
  const log = getLog()
  log.push({
    id: Date.now(),
    recipeId: recipe.id,
    label: recipe.label,
    servings,
    caloriesPerServing: recipe.caloriesPerServing,
    macros: recipe.macros,
    addedAt: new Date().toISOString()
  })
  storage.set(todayKey(), log)
}

export function removeMeal(entryId) {
  const log = getLog().filter(e => e.id !== entryId)
  storage.set(todayKey(), log)
}

export function getDailyTotals() {
  const log = getLog()
  return log.reduce((acc, entry) => {
    const s = entry.servings
    acc.calories += (entry.caloriesPerServing || 0) * s
    acc.protein  += (entry.macros?.protein || 0) * s
    acc.carbs    += (entry.macros?.carbs   || 0) * s
    acc.fat      += (entry.macros?.fat     || 0) * s
    return acc
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
}
