// views/detail.js — recipe detail page
import { analyzeNutrition } from '../api/api.js'
import { isSaved, saveRecipe, removeRecipe } from '../modules/favorites.js'
import { addMeal } from '../modules/dailyLog.js'
import { showToast, spinner, errorState, fmt } from '../modules/ui.js'

let servings = 1
let nutritionData = null
let currentRecipe = null

export async function renderDetail(app, recipe, navigate) {
  currentRecipe = recipe
  servings = Math.round(recipe.yield) || 1

  app.innerHTML = `
    <div class="page">
      <a class="detail-back" id="back-btn">← Back to results</a>
      <div class="detail-layout">
        <div class="detail-left">
          ${recipe.image
            ? `<img class="detail-img" src="${recipe.image}" alt="${recipe.label}">`
            : `<div class="detail-img-placeholder">🥗</div>`
          }
        </div>
        <div class="detail-right">
          <h1 class="detail-title">${recipe.label}</h1>
          <p class="detail-meta">
            By ${recipe.source}
            ${recipe.cuisineType?.length ? ' · ' + recipe.cuisineType.join(', ') : ''}
            ${recipe.mealType?.length ? ' · ' + recipe.mealType.join(', ') : ''}
          </p>

          <div class="detail-labels">
            ${recipe.dietLabels.slice(0, 4).map(l =>
              `<span class="detail-label">${l}</span>`
            ).join('')}
          </div>

          <div class="serving-row">
            <span class="serving-label">Servings:</span>
            <button class="serving-btn" id="serving-minus">−</button>
            <span class="serving-count" id="serving-count">${servings}</span>
            <button class="serving-btn" id="serving-plus">+</button>
          </div>

          <div id="macro-summary" class="macro-summary">
            <div class="spinner-wrap"><div class="loader"></div></div>
          </div>

          <div id="nutrient-section">
            ${spinner()}
          </div>

          <div class="detail-actions">
            <button class="btn-add-today" id="btn-add-today">+ Add to today</button>
            <button class="btn-save-detail ${isSaved(recipe.id) ? 'saved' : ''}" id="btn-save">
              ${isSaved(recipe.id) ? '❤️ Saved' : '🤍 Save recipe'}
            </button>
            ${recipe.url ? `<a href="${recipe.url}" target="_blank" rel="noopener" class="btn-save-detail">🔗 View recipe</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  `

  // Back button
  app.querySelector('#back-btn').addEventListener('click', () => navigate('search'))

  // Save button
  const saveBtn = app.querySelector('#btn-save')
  saveBtn.addEventListener('click', () => {
    if (isSaved(recipe.id)) {
      removeRecipe(recipe.id)
      saveBtn.textContent = '🤍 Save recipe'
      saveBtn.classList.remove('saved')
      showToast('Removed from saved')
    } else {
      saveRecipe(recipe)
      saveBtn.textContent = '❤️ Saved'
      saveBtn.classList.add('saved')
      showToast('Recipe saved!')
    }
  })

  // Add to today button
  app.querySelector('#btn-add-today').addEventListener('click', () => {
    addMeal({ ...recipe, caloriesPerServing: recipe.caloriesPerServing }, servings)
    showToast(`Added ${servings} serving${servings > 1 ? 's' : ''} to today!`)
  })

  // Serving adjusters
  app.querySelector('#serving-minus').addEventListener('click', () => {
    if (servings > 1) { servings--; updateServings(app) }
  })
  app.querySelector('#serving-plus').addEventListener('click', () => {
    if (servings < 20) { servings++; updateServings(app) }
  })

  // Fetch nutrition
  try {
    nutritionData = await analyzeNutrition(
      recipe.label,
      recipe.ingredientLines,
      recipe.yield
    )
    renderNutrition(app)
  } catch (err) {
    // Fallback to recipe search data if nutrition API fails
    renderNutritionFallback(app, recipe)
  }
}

function updateServings(app) {
  app.querySelector('#serving-count').textContent = servings
  if (nutritionData) renderNutrition(app)
  else renderNutritionFallback(app, currentRecipe)
}

function getPerServing(nutrient) {
  if (!nutritionData || !nutrient) return 0
  const base = nutrient.quantity / (nutritionData.yield || 1)
  return Math.round(base * servings)
}

function renderNutrition(app) {
  const n = nutritionData.totalNutrients
  const d = nutritionData.totalDaily
  const yld = nutritionData.yield || 1

  const cal = Math.round((nutritionData.calories / yld) * servings)
  const protein = getPerServing(n.PROCNT)
  const carbs   = getPerServing(n.CHOCDF)
  const fat      = getPerServing(n.FAT)

  app.querySelector('#macro-summary').innerHTML = `
    <div class="macro-box highlight">
      <div class="macro-box-val">${cal}</div>
      <div class="macro-box-label">calories</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-val">${protein}g</div>
      <div class="macro-box-label">protein</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-val">${carbs}g</div>
      <div class="macro-box-label">carbs</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-val">${fat}g</div>
      <div class="macro-box-label">fat</div>
    </div>
  `

  const rows = [
    { label: 'Macronutrients', section: true },
    { label: 'Fiber',          key: 'FIBTG',  unit: 'g' },
    { label: 'Sugar',          key: 'SUGAR',  unit: 'g' },
    { label: 'Saturated fat',  key: 'FASAT',  unit: 'g' },
    { label: 'Cholesterol',    key: 'CHOLE',  unit: 'mg' },
    { label: 'Minerals',       section: true },
    { label: 'Sodium',         key: 'NA',     unit: 'mg' },
    { label: 'Calcium',        key: 'CA',     unit: 'mg' },
    { label: 'Iron',           key: 'FE',     unit: 'mg' },
    { label: 'Potassium',      key: 'K',      unit: 'mg' },
    { label: 'Magnesium',      key: 'MG',     unit: 'mg' },
    { label: 'Vitamins',       section: true },
    { label: 'Vitamin A',      key: 'VITA_RAE', unit: 'µg' },
    { label: 'Vitamin C',      key: 'VITC',   unit: 'mg' },
    { label: 'Vitamin D',      key: 'VITD',   unit: 'µg' },
    { label: 'Vitamin E',      key: 'TOCPHA', unit: 'mg' },
    { label: 'Vitamin K',      key: 'VITK1',  unit: 'µg' },
    { label: 'Vitamin B12',    key: 'VITB12', unit: 'µg' },
    { label: 'Folate',         key: 'FOLDFE', unit: 'µg' },
  ]

  const tableRows = rows.map(row => {
    if (row.section) {
      return `<tr class="nutrient-section-head"><td colspan="3">${row.label}</td></tr>`
    }
    const qty = n[row.key]
    if (!qty) return ''
    const perServing = Math.round((qty.quantity / yld) * servings * 10) / 10
    const dv = d[row.key] ? Math.round((d[row.key].quantity / yld) * servings) : null
    return `
      <tr>
        <td>${row.label}</td>
        <td style="text-align:right;color:var(--gray-700);font-weight:500">
          ${perServing}${row.unit}
        </td>
        <td style="text-align:right;color:var(--gray-500);font-size:12px">
          ${dv !== null ? dv + '% DV' : ''}
        </td>
      </tr>`
  }).join('')

  app.querySelector('#nutrient-section').innerHTML = `
    <table class="nutrient-table">
      <thead>
        <tr>
          <th>Nutrient</th>
          <th style="text-align:right">Per ${servings} serving${servings > 1 ? 's' : ''}</th>
          <th style="text-align:right">% Daily value</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  `
}

function renderNutritionFallback(app, recipe) {
  const s = servings
  const cal     = recipe.caloriesPerServing * s
  const protein = (recipe.macros.protein || 0) * s
  const carbs   = (recipe.macros.carbs   || 0) * s
  const fat     = (recipe.macros.fat     || 0) * s
  const fiber   = (recipe.macros.fiber   || 0) * s

  app.querySelector('#macro-summary').innerHTML = `
    <div class="macro-box highlight">
      <div class="macro-box-val">${cal}</div>
      <div class="macro-box-label">calories</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-val">${protein}g</div>
      <div class="macro-box-label">protein</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-val">${carbs}g</div>
      <div class="macro-box-label">carbs</div>
    </div>
    <div class="macro-box">
      <div class="macro-box-val">${fat}g</div>
      <div class="macro-box-label">fat</div>
    </div>
  `
  app.querySelector('#nutrient-section').innerHTML = `
    <table class="nutrient-table">
      <thead>
        <tr><th>Nutrient</th><th style="text-align:right">Per ${s} serving${s>1?'s':''}</th></tr>
      </thead>
      <tbody>
        <tr><td>Protein</td><td style="text-align:right;font-weight:500">${protein}g</td></tr>
        <tr><td>Carbohydrates</td><td style="text-align:right;font-weight:500">${carbs}g</td></tr>
        <tr><td>Fat</td><td style="text-align:right;font-weight:500">${fat}g</td></tr>
        <tr><td>Fiber</td><td style="text-align:right;font-weight:500">${fiber}g</td></tr>
      </tbody>
    </table>
    <p style="font-size:12px;color:var(--gray-500);margin-top:8px">
      ⚠️ Detailed nutrition unavailable — showing basic data from recipe search.
    </p>
  `
}
