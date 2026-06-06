// views/saved.js — saved recipes page
import { getFavorites, removeRecipe } from '../modules/favorites.js'
import { createRecipeCard } from '../modules/recipeCard.js'
import { showToast } from '../modules/ui.js'

export function renderSaved(app, navigate) {
  const favs = getFavorites()

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1>Saved Recipes</h1>
        <p>${favs.length} recipe${favs.length !== 1 ? 's' : ''} saved</p>
      </div>
      <div id="saved-grid"></div>
    </div>
  `

  const grid = app.querySelector('#saved-grid')

  if (!favs.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🤍</div>
        <h2>No saved recipes yet</h2>
        <p>Tap the heart icon on any recipe to save it here</p>
      </div>`
    return
  }

  const resultsGrid = document.createElement('div')
  resultsGrid.className = 'results-grid'

  favs.forEach(recipe => {
    const card = createRecipeCard(recipe, (r) => navigate('detail', r))
    resultsGrid.appendChild(card)
  })

  grid.appendChild(resultsGrid)
}
