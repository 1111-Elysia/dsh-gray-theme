/* ============================================================================
 * dsh-gray-theme — boot sequence runtime
 * Runs once per configured cadence. The host already painted the shell, so
 * this file only owns dismissal, timing, and the local cadence flag.
 * ========================================================================== */

(function () {
  'use strict'

  var root = document.getElementById('gray-boot')
  var html = document.documentElement
  if (!root || !html) return

  var data = window.__GRAY_THEME__ || {}
  var config = data.config || {}
  var reduced = false
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { /* noop */ }

  function markShown() {
    try {
      if (config.mode === 'session') sessionStorage.setItem('gray-theme:booted', '1')
      if (config.mode === 'daily' && data.today) localStorage.setItem('gray-theme:day', data.today)
    } catch (e) { /* private mode / storage disabled: the boot still works */ }
  }

  if (html.classList.contains('gray-boot-skip')) {
    root.remove()
    html.classList.remove('gray-boot')
    return
  }

  markShown()

  var done = false
  var timer = 0

  function cleanup() {
    try { root.remove() } catch (e) { /* noop */ }
    html.classList.remove('gray-boot')
    html.classList.remove('gray-boot-skip')
    try {
      var url = new URL(window.location.href)
      if (url.searchParams.has('gray_boot')) {
        url.searchParams.delete('gray_boot')
        history.replaceState(null, '', url.toString())
      }
    } catch (e) { /* noop */ }
  }

  function dismiss() {
    if (done) return
    done = true
    if (timer) {
      clearTimeout(timer)
      timer = 0
    }
    document.removeEventListener('keydown', onKey, true)
    root.classList.add('is-leaving')
    if (reduced) {
      cleanup()
      return
    }
    setTimeout(cleanup, 330)
  }

  function onKey(event) {
    if (event.key === 'Escape' || event.key === 'Enter') {
      event.preventDefault()
      event.stopPropagation()
      dismiss()
    }
  }

  root.addEventListener('click', function (event) {
    var enter = event.target && event.target.closest ? event.target.closest('.gb-enter') : null
    if (enter) event.preventDefault()
    dismiss()
  })

  document.addEventListener('keydown', onKey, true)

  var duration = Number(config.duration)
  if (!Number.isFinite(duration)) duration = 3600
  duration = Math.min(7000, Math.max(2200, duration))

  timer = setTimeout(dismiss, reduced ? 900 : duration)

  /* Hard stop if a stylesheet or the app somehow keeps the overlay alive. */
  setTimeout(function () {
    if (!done) dismiss()
  }, 9000)
})()
