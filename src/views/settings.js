// views/settings.js — user settings page
import { storage } from '../modules/storage.js'
import { showToast } from '../modules/ui.js'

export function renderSettings(app) {
  const goals = storage.get('nutrifind_goals') || {
    calories: 2000, protein: 150, carbs: 250, fat: 65
  }

  app.innerHTML = `
    <div class="page">
      <div class="page-header">
        <h1>Settings</h1>
        <p>Customize your daily nutrition targets</p>
      </div>

      <div class="settings-card">
        <h2>Daily nutrition goals</h2>
        <div class="settings-grid">
          <div class="settings-field">
            <label for="goal-calories">Daily calories (kcal)</label>
            <input type="number" id="goal-calories" class="settings-input"
              value="${goals.calories}" min="500" max="10000" step="50">
          </div>
          <div class="settings-field">
            <label for="goal-protein">Protein (g)</label>
            <input type="number" id="goal-protein" class="settings-input"
              value="${goals.protein}" min="0" max="500" step="5">
          </div>
          <div class="settings-field">
            <label for="goal-carbs">Carbohydrates (g)</label>
            <input type="number" id="goal-carbs" class="settings-input"
              value="${goals.carbs}" min="0" max="1000" step="5">
          </div>
          <div class="settings-field">
            <label for="goal-fat">Fat (g)</label>
            <input type="number" id="goal-fat" class="settings-input"
              value="${goals.fat}" min="0" max="300" step="5">
          </div>
        </div>
        <button class="btn-save-settings" id="save-goals">Save goals</button>
      </div>

      <div class="settings-card">
        <h2>About NutriFind</h2>
        <p style="font-size:14px;color:var(--gray-500);line-height:1.7">
          NutriFind uses the <strong>Edamam Recipe Search API</strong> and
          <strong>Edamam Nutrition Analysis API</strong> to provide recipe discovery
          and detailed nutritional information. Built for WDD 330 Final Project.
        </p>
        <p style="font-size:14px;color:var(--gray-500);line-height:1.7;margin-top:0.75rem">
          Data is stored locally in your browser. No account required.
        </p>
      </div>

      <div class="settings-card">
        <h2>Clear data</h2>
        <p style="font-size:14px;color:var(--gray-500);margin-bottom:1rem">
          Remove all saved recipes and meal logs from your browser.
        </p>
        <button class="btn-save-settings" id="clear-data"
          style="background:var(--coral)">Clear all data</button>
      </div>
    </div>
  `

  app.querySelector('#save-goals').addEventListener('click', () => {
    const newGoals = {
      calories: Number(app.querySelector('#goal-calories').value),
      protein:  Number(app.querySelector('#goal-protein').value),
      carbs:    Number(app.querySelector('#goal-carbs').value),
      fat:      Number(app.querySelector('#goal-fat').value),
    }
    storage.set('nutrifind_goals', newGoals)
    showToast('Goals saved!')
  })

  app.querySelector('#clear-data').addEventListener('click', () => {
    if (confirm('This will delete all saved recipes and meal logs. Are you sure?')) {
      localStorage.clear()
      showToast('All data cleared')
    }
  })
}
