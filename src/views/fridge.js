// views/fridge.js — "What's in my fridge?" ingredient-based search
import { searchRecipes, parseRecipe } from '../api/api.js'
import { createRecipeCard } from '../modules/recipeCard.js'
import { spinner, errorState } from '../modules/ui.js'

let ingredients = []

export function renderFridge(app, navigate) {
  app.innerHTML = `
    <div class="page">
      <div class="search-hero">
        <h1>What's in my fridge?</h1>
        <p>Add the ingredients you have, and we'll find recipes that use them</p>

        <div class="search-bar-wrap">
          <input
            type="text"
            class="search-input"
            id="ingredient-input"
            placeholder="Type an ingredient and press Enter..."
            autocomplete="off"
            aria-label="Add an ingredient"
          />
          <button class="search-btn" id="add-ingredient-btn" aria-label="Add ingredient">Add</button>
        </div>

        <div class="filter-row" id="ingredient-chips" role="list" aria-label="Your ingredients"></div>

        <div style="margin-top:1.25rem">
          <button class="search-btn" id="find-recipes-btn" aria-label="Find recipes using these ingredients">
            Find recipes →
          </button>
        </div>
      </div>

      <div id="fridge-results"></div>
    </div>
  `

  const input = app.querySelector('#ingredient-input')
  const chipRow = app.querySelector('#ingredient-chips')
  const resultsArea = app.querySelector('#fridge-results')

  renderChips(chipRow)

  function addIngredient() {
    const val = input.value.trim().toLowerCase()
    if (val && !ingredients.includes(val)) {
      ingredients.push(val)
      renderChips(chipRow)
      input.value = ''
    }
    input.focus()
  }

  app.querySelector('#add-ingredient-btn').addEventListener('click', addIngredient)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addIngredient()
    }
  })

  chipRow.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip')
    if (!chip) return
    ingredients = ingredients.filter(i => i !== chip.dataset.ingredient)
    renderChips(chipRow)
  })

  app.querySelector('#find-recipes-btn').addEventListener('click', () => {
    findRecipes(resultsArea, navigate)
  })

  input.focus()
}

function renderChips(container) {
  if (!ingredients.length) {
    container.innerHTML = `<p style="font-size:13px;color:var(--gray-500)">No ingredients added yet</p>`
    return
  }
  container.innerHTML = ingredients.map(ing => `
    <button class="filter-chip active" data-ingredient="${ing}"
      aria-label="Remove ${ing} from list">
      ${ing} ✕
    </button>
  `).join('')
}

async function findRecipes(container, navigate) {
  if (!ingredients.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🥕</div>
        <h2>Add some ingredients first</h2>
        <p>Type ingredients above and click "Add" to build your list</p>
      </div>`
    return
  }

  container.innerHTML = spinner()

  const query = ingredients.join(' ')

  try {
    const { hits, count } = await searchRecipes(query)

    if (!hits.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h2>No recipes found</h2>
          <p>Try removing an ingredient or using more common terms</p>
        </div>`
      return
    }

    const recipes = hits.map(parseRecipe)

    container.innerHTML = `<p class="results-count">
      ${count.toLocaleString()} recipes using <strong>${ingredients.join(', ')}</strong>
    </p>`

    const grid = document.createElement('div')
    grid.className = 'results-grid'
    grid.setAttribute('role', 'list')

    recipes.forEach(recipe => {
      const card = createRecipeCard(recipe, (r) => navigate('detail', r))
      card.setAttribute('role', 'listitem')
      grid.appendChild(card)
    })

    container.appendChild(grid)

  } catch (err) {
    container.innerHTML = errorState(err.message)
  }
}