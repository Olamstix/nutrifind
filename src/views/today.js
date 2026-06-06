// views/today.js — daily nutrition tracker
import { getLog, removeMeal, getDailyTotals } from '../modules/dailyLog.js'
import { storage } from '../modules/storage.js'
import { showToast } from '../modules/ui.js'

export function renderToday(app) {
  const log    = getLog()
  const totals = getDailyTotals()
  const goals  = storage.get('nutrifind_goals') || {
    calories: 2000, protein: 150, carbs: 250, fat: 65
  }

  const pct = (val, goal) => Math.min(100, Math.round((val / goal) * 100))
  const isOver = (val, goal) => val > goal

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1>Today's Nutrition</h1>
        <p>${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</p>
      </div>

      <div class="today-summary">
        <h2>Daily Progress</h2>

        <div class="progress-section">
          <div class="progress-label">
            <span>Calories</span>
            <span>${Math.round(totals.calories)} / ${goals.calories} kcal</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${isOver(totals.calories, goals.calories) ? 'over' : ''}"
              style="width:${pct(totals.calories, goals.calories)}%"></div>
          </div>
        </div>

        <div class="today-macros">
          <div class="today-macro-box">
            <div class="today-macro-val">${Math.round(totals.protein)}g</div>
            <div class="today-macro-label">Protein / ${goals.protein}g</div>
            <div class="progress-bar-bg" style="margin-top:6px">
              <div class="progress-bar-fill" style="width:${pct(totals.protein, goals.protein)}%"></div>
            </div>
          </div>
          <div class="today-macro-box">
            <div class="today-macro-val">${Math.round(totals.carbs)}g</div>
            <div class="today-macro-label">Carbs / ${goals.carbs}g</div>
            <div class="progress-bar-bg" style="margin-top:6px">
              <div class="progress-bar-fill" style="width:${pct(totals.carbs, goals.carbs)}%"></div>
            </div>
          </div>
          <div class="today-macro-box">
            <div class="today-macro-val">${Math.round(totals.fat)}g</div>
            <div class="today-macro-label">Fat / ${goals.fat}g</div>
            <div class="progress-bar-bg" style="margin-top:6px">
              <div class="progress-bar-fill" style="width:${pct(totals.fat, goals.fat)}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="page-header" style="margin-bottom:1rem">
        <h1 style="font-size:22px">Meals logged</h1>
      </div>

      <div class="meal-log" id="meal-log">
        ${log.length === 0
          ? `<div class="empty-state">
               <div class="empty-state-icon">🍽️</div>
               <h2>No meals logged yet</h2>
               <p>Search for recipes and tap "Add to today"</p>
             </div>`
          : log.map(entry => `
              <div class="meal-log-item" data-entry-id="${entry.id}">
                <div class="meal-log-info">
                  <div class="meal-log-title">${entry.label}</div>
                  <div class="meal-log-meta">
                    ${entry.servings} serving${entry.servings > 1 ? 's' : ''}
                    · P: ${Math.round((entry.macros?.protein || 0) * entry.servings)}g
                    · C: ${Math.round((entry.macros?.carbs   || 0) * entry.servings)}g
                    · F: ${Math.round((entry.macros?.fat     || 0) * entry.servings)}g
                  </div>
                </div>
                <div class="meal-log-kcal">
                  ${Math.round((entry.caloriesPerServing || 0) * entry.servings)} kcal
                </div>
                <button class="btn-remove" data-id="${entry.id}" title="Remove">✕</button>
              </div>
            `).join('')
        }
      </div>
    </div>
  `

  // Remove meal buttons
  app.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id)
      removeMeal(id)
      showToast('Meal removed')
      renderToday(app)
    })
  })
}
