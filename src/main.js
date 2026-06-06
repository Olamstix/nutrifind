// main.js — app entry point and router
import { renderSearch } from './views/search.js'
import { renderDetail } from './views/detail.js'
import { renderSaved }  from './views/saved.js'
import { renderToday }  from './views/today.js'
import { renderSettings } from './views/settings.js'
import { setActiveNav } from './modules/ui.js'

const app = document.getElementById('app')

let currentView = 'search'
let currentRecipe = null

function navigate(view, data = null) {
  currentView = view
  if (data) currentRecipe = data
  render()
}

function render() {
  // Scroll to top
  window.scrollTo(0, 0)

  // Update nav
  setActiveNav(currentView)

  // Render view
  switch (currentView) {
    case 'search':
      renderSearch(app, navigate)
      break
    case 'detail':
      renderDetail(app, currentRecipe, navigate)
      break
    case 'saved':
      renderSaved(app, navigate)
      break
    case 'today':
      renderToday(app)
      break
    case 'settings':
      renderSettings(app)
      break
    default:
      renderSearch(app, navigate)
  }
}

// Hash-based routing
function handleRoute() {
  const hash = window.location.hash
  if (hash === '#/saved')    navigate('saved')
  else if (hash === '#/today')    navigate('today')
  else if (hash === '#/settings') navigate('settings')
  else                            navigate('search')
}

window.addEventListener('hashchange', handleRoute)

// Initial render
handleRoute()
