// views/search.js — search page
import { searchRecipes, parseRecipe } from '../api/api.js'
import { createRecipeCard } from '../modules/recipeCard.js'
import { session } from '../modules/storage.js'
import { spinner, errorState, debounce, showToast } from '../modules/ui.js'

const FILTERS = [
  { label: 'Vegan',       value: 'vegan' },
  { label: 'Vegetarian',  value: 'vegetarian' },
  { label: 'Gluten-free', value: 'gluten-free' },
  { label: 'Dairy-free',  value: 'dairy-free' },
  { label: 'Keto',        value: 'keto-friendly' },
  { label: 'Low-sodium',  value: 'low-sodium' },
  { label: 'High-protein',value: 'high-protein' },
]

let activeFilters = []
let lastQuery = ''

export function renderSearch(app, navigate) {
  app.innerHTML = `
    <div class="page">
      <div class="search-hero">
        <h1>Find recipes.<br>Know what you eat.</h1>
        <p>Search thousands of recipes with full nutrition breakdown</p>

        <div class="search-bar-wrap">
          <input
            type="text"
            class="search-input"
            id="search-input"
            placeholder="Try 'chicken stir fry' or 'lentil soup'..."
            autocomplete="off"
          />
          <button class="search-btn" id="search-btn">Search</button>
        </div>

        <div class="filter-row" id="filter-row">
          ${FILTERS.map(f => `
            <button class="filter-chip ${activeFilters.includes(f.value) ? 'active' : ''}"
              data-filter="${f.value}">${f.label}</button>
          `).join('')}
        </div>

        <div class="search-history" id="search-history"></div>
      </div>

      <div id="results-area"></div>
    </div>
  `

  const input = app.querySelector('#search-input')
  const btn   = app.querySelector('#search-btn')
  const resultsArea = app.querySelector('#results-area')

  // Restore last query
  if (lastQuery) {
    input.value = lastQuery
    doSearch(lastQuery, resultsArea, navigate)
  }

  // Render history chips
  renderHistory(app.querySelector('#search-history'), input, resultsArea, navigate)

  // Filter chips
  app.querySelector('#filter-row').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip')
    if (!chip) return
    const val = chip.dataset.filter
    if (activeFilters.includes(val)) {
      activeFilters = activeFilters.filter(f => f !== val)
      chip.classList.remove('active')
    } else {
      activeFilters.push(val)
      chip.classList.add('active')
    }
    if (lastQuery) doSearch(lastQuery, resultsArea, navigate)
  })

  // Search button
  btn.addEventListener('click', () => {
    const q = input.value.trim()
    if (!q) return
    doSearch(q, resultsArea, navigate)
  })

  // Enter key
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.trim()
      if (q) doSearch(q, resultsArea, navigate)
    }
  })

  // Debounced live search
  const debouncedSearch = debounce((q) => {
    if (q.length >= 3) doSearch(q, resultsArea, navigate)
  }, 600)
  input.addEventListener('input', () => debouncedSearch(input.value.trim()))

  // Focus
  input.focus()
}

async function doSearch(query, container, navigate) {
  lastQuery = query
  addToHistory(query)
  container.innerHTML = spinner()

  try {
    const { hits, count } = await searchRecipes(query, activeFilters)

    if (!hits.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h2>No recipes found</h2>
          <p>Try a different search term or remove some filters</p>
        </div>`
      return
    }

    const recipes = hits.map(parseRecipe)

    container.innerHTML = `<p class="results-count">${count.toLocaleString()} results for "<strong>${query}</strong>"</p>`
    const grid = document.createElement('div')
    grid.className = 'results-grid'

    recipes.forEach(recipe => {
      const card = createRecipeCard(recipe, (r) => navigate('detail', r))
      grid.appendChild(card)
    })

    container.appendChild(grid)

  } catch (err) {
    container.innerHTML = errorState(err.message)
  }
}

function addToHistory(query) {
  const history = session.get('search_history') || []
  const updated = [query, ...history.filter(q => q !== query)].slice(0, 8)
  session.set('search_history', updated)
}

function renderHistory(container, input, resultsArea, navigate) {
  const history = session.get('search_history') || []
  if (!history.length) return
  container.innerHTML = history.map(q =>
    `<span class="history-chip" data-q="${q}">🕐 ${q}</span>`
  ).join('')
  container.addEventListener('click', e => {
    const chip = e.target.closest('.history-chip')
    if (!chip) return
    input.value = chip.dataset.q
    doSearch(chip.dataset.q, resultsArea, navigate)
  })
}
