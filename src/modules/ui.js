// ui.js — shared UI utilities

/** Show a toast notification */
export function showToast(message) {
  let toast = document.getElementById('toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.id = 'toast'
    toast.className = 'toast'
    document.body.appendChild(toast)
  }
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}

/** Render a spinner */
export function spinner() {
  return `<div class="spinner-wrap"><div class="loader"></div></div>`
}

/** Render error state */
export function errorState(message) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h2>Something went wrong</h2>
      <p>${message}</p>
    </div>`
}

/** Format a number with unit */
export function fmt(val, unit = 'g') {
  if (val === undefined || val === null) return `0${unit}`
  return `${Math.round(val)}${unit}`
}

/** Set active nav link */
export function setActiveNav(page) {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page)
  })
}

/** Debounce a function */
export function debounce(fn, delay = 400) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
