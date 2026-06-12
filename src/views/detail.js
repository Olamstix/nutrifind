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
      <button class="detail-back" id="back-btn" aria-label="Back to search results">← Back to results</button>
      <div class="detail-layout">
        <div class="detail-left">
          ${recipe.image
            ? `<img class="detail-img" src="${recipe.image}" alt="${recipe.label}" loading="lazy">`
            : `<div class="detail-img-placeholder" role="img" aria-label="No image available">🥗</div>`
          }
        </div>
        <div class="detail-right">
          <h1 class="detail-title">${recipe.label}</h1>
          <p class="detail-meta">
            By ${recipe.source}
            ${recipe.cuisineType?.length ? ' · ' + recipe.cuisineType.join(', ') : ''}
            ${recipe.mealType?.length ? ' · ' + recipe.mealType.join(', ') : ''}
          </p>

          <div class="detail-labels" aria-label="Dietary labels">
            ${recipe.dietLabels.slice(0, 4).map(l =>
              `<span class="detail-label">${l}</span>`
            ).join('')}
          </div>

          <div class="serving-row" role="group" aria-label="Adjust servings">
            <span class="serving-label" id="serving-label">Servings:</span>
            <button class="serving-btn" id="serving-minus" aria-label="Decrease servings" aria-controls="serving-count">−</button>
            <span class="serving-count" id="serving-count" aria-live="polite">${servings}</span>
            <button class="serving-btn" id="serving-plus" aria-label="Increase servings" aria-controls="serving-count">+</button>
          </div>

          <div id="macro-summary" class="macro-summary" aria-live="polite" aria-label="Nutrition summary">
            <div class="spinner-wrap"><div class="loader" aria-hidden="true"></div><span class="sr-only">Loading nutrition data...</span></div>
          </div>

          <div id="nutrient-section" aria-live="polite">
            ${spinner()}
          </div>

          <div class="detail-actions">
            <button class="btn-add-today" id="btn-add-today" aria-label="Add this recipe to today's meal log">+ Add to today</button>
            <button class="btn-save-detail ${isSaved(recipe.id) ? 'saved' : ''}" id="btn-save"
              aria-pressed="${isSaved(recipe.id)}">
              ${isSaved(recipe.id) ? '❤️ Saved' : '🤍 Save recipe'}
            </button>
            <button class="btn-save-detail" id="btn-print" aria-label="Open printable nutrition label">🖨️ Print label</button>
            ${recipe.url ? `<a href="${recipe.url}" target="_blank" rel="noopener" class="btn-save-detail">🔗 View recipe</a>` : ''}
          </div>
        </div>
      </div>
    </div>

    <div id="print-label" class="print-only" aria-hidden="true"></div>
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
      saveBtn.setAttribute('aria-pressed', 'false')
      showToast('Removed from saved')
    } else {
      saveRecipe(recipe)
      saveBtn.textContent = '❤️ Saved'
      saveBtn.classList.add('saved')
      saveBtn.setAttribute('aria-pressed', 'true')
      showToast('Recipe saved!')
    }
  })

  // Print nutrition label button
  app.querySelector('#btn-print').addEventListener('click', () => {
    printNutritionLabel(recipe, servings, nutritionData)
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

/**
 * Builds a print-optimized nutrition facts label and opens the browser
 * print dialog. Uses live nutritionData if available, otherwise falls
 * back to the basic macros from the recipe search result.
 */
function printNutritionLabel(recipe, servings, nutritionData) {
  let rows = []

  if (nutritionData) {
    const n = nutritionData.totalNutrients
    const yld = nutritionData.yield || 1
    const per = (key) => n[key] ? Math.round((n[key].quantity / yld) * servings * 10) / 10 : 0

    rows = [
      ['Calories', Math.round((nutritionData.calories / yld) * servings), ''],
      ['Total Fat', per('FAT'), 'g'],
      ['  Saturated Fat', per('FASAT'), 'g'],
      ['Cholesterol', per('CHOLE'), 'mg'],
      ['Sodium', per('NA'), 'mg'],
      ['Total Carbohydrate', per('CHOCDF'), 'g'],
      ['  Dietary Fiber', per('FIBTG'), 'g'],
      ['  Sugars', per('SUGAR'), 'g'],
      ['Protein', per('PROCNT'), 'g'],
      ['Vitamin C', per('VITC'), 'mg'],
      ['Calcium', per('CA'), 'mg'],
      ['Iron', per('FE'), 'mg'],
      ['Potassium', per('K'), 'mg'],
    ]
  } else {
    const m = recipe.macros
    rows = [
      ['Calories', recipe.caloriesPerServing * servings, ''],
      ['Total Fat', (m.fat || 0) * servings, 'g'],
      ['Total Carbohydrate', (m.carbs || 0) * servings, 'g'],
      ['  Dietary Fiber', (m.fiber || 0) * servings, 'g'],
      ['Protein', (m.protein || 0) * servings, 'g'],
    ]
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Nutrition Facts — ${recipe.label}</title>
      <style>
        body { font-family: Helvetica, Arial, sans-serif; padding: 24px; color: #000; }
        .label-box { max-width: 320px; border: 2px solid #000; padding: 12px; }
        h1 { font-size: 22px; border-bottom: 8px solid #000; padding-bottom: 6px; margin: 0 0 6px; }
        .recipe-name { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
        .servings { font-size: 12px; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        td { padding: 3px 0; border-bottom: 1px solid #ccc; }
        td:last-child { text-align: right; font-weight: bold; }
        tr.indent td:first-child { padding-left: 16px; font-weight: normal; }
        tr.bold td { font-weight: bold; border-bottom: 4px solid #000; }
        .footer-note { font-size: 10px; margin-top: 10px; color: #555; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="label-box">
        <h1>Nutrition Facts</h1>
        <div class="recipe-name">${recipe.label}</div>
        <div class="servings">Servings: ${servings} · Source: ${recipe.source}</div>
        <table>
          ${rows.map(([label, val, unit], i) => `
            <tr class="${label.startsWith('  ') ? 'indent' : ''} ${i === 0 ? 'bold' : ''}">
              <td>${label.trim()}</td>
              <td>${val}${unit}</td>
            </tr>
          `).join('')}
        </table>
        <div class="footer-note">
          Generated by NutriFind · Values are estimates based on ${servings} serving${servings > 1 ? 's' : ''}.
          % Daily Values vary by individual needs.
        </div>
      </div>
    </body>
    </html>
  `

  const printWindow = window.open('', '_blank')
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
}