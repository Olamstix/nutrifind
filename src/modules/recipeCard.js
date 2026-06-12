// recipeCard.js — recipe card component
import { isSaved, saveRecipe, removeRecipe } from './favorites.js'
import { showToast } from './ui.js'

export function createRecipeCard(recipe, onView) {
  const card = document.createElement('div')
  card.className = 'recipe-card'
  card.dataset.id = recipe.id

  const saved = isSaved(recipe.id)

  card.innerHTML = `
    ${recipe.image
      ? `<img class="recipe-card-img" src="${recipe.image}" alt="${recipe.label}" loading="lazy">`
      : `<div class="recipe-card-img-placeholder" role="img" aria-label="No image available">🥗</div>`
    }
    <div class="recipe-card-body">
      <h3 class="recipe-card-title">${recipe.label}</h3>
      <div class="recipe-card-source">${recipe.source}</div>
      <div class="recipe-card-kcal">${recipe.caloriesPerServing} kcal / serving</div>
      <div class="recipe-card-macros">
        <span class="macro-pill"><strong>${recipe.macros.protein}g</strong> protein</span>
        <span class="macro-pill"><strong>${recipe.macros.carbs}g</strong> carbs</span>
        <span class="macro-pill"><strong>${recipe.macros.fat}g</strong> fat</span>
      </div>
      <div class="recipe-card-footer">
        <button class="btn-view" aria-label="View nutrition details for ${recipe.label}">View nutrition →</button>
        <button class="btn-save ${saved ? 'saved' : ''}"
          aria-pressed="${saved}"
          aria-label="${saved ? `Remove ${recipe.label} from saved recipes` : `Save ${recipe.label}`}">
          ${saved ? '❤️' : '🤍'}
        </button>
      </div>
    </div>
  `

  // View button
  card.querySelector('.btn-view').addEventListener('click', () => onView(recipe))

  // Save button
  const saveBtn = card.querySelector('.btn-save')
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    if (isSaved(recipe.id)) {
      removeRecipe(recipe.id)
      saveBtn.textContent = '🤍'
      saveBtn.classList.remove('saved')
      saveBtn.setAttribute('aria-pressed', 'false')
      saveBtn.setAttribute('aria-label', `Save ${recipe.label}`)
      showToast('Removed from saved recipes')
    } else {
      saveRecipe(recipe)
      saveBtn.textContent = '❤️'
      saveBtn.classList.add('saved')
      saveBtn.setAttribute('aria-pressed', 'true')
      saveBtn.setAttribute('aria-label', `Remove ${recipe.label} from saved recipes`)
      showToast('Recipe saved!')
    }
  })

  return card
}