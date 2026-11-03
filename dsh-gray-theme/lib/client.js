/**
 * dsh-gray-theme — browser half.
 *
 * Registers a token-override layer (never setTheme), a small settings section,
 * and keeps the host-painted boot shell in sync with saved config.
 */
window.__ModuleLoader__.load({
  id: 'dsh-gray-theme',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    var react = require('react')
    var h = react.createElement
    var useEffect = react.useEffect
    var useState = react.useState

    var API = '/gray-theme/config'
    var ART = '/gray-theme/art/'
    var SOURCE = 'dsh-gray-theme'

    function pair(light, dark) {
      return { light: light, dark: dark }
    }

    /* Only same-named alias tokens are overridden; layout stays DSH's. */
    var TOKENS = {
      '--dsw-alias-bg-base': pair('#f4f7f6', '#070c0e'),
      '--dsw-alias-bg-layer-1': pair('#ffffff', '#0a1316'),
      '--dsw-alias-bg-layer-2': pair('#edf3f1', '#0e1a1d'),
      '--dsw-alias-bg-layer-3': pair('#e4ece9', '#132327'),
      '--dsw-alias-bg-module-platform': pair('#ffffff', '#0a1316'),
      '--dsw-alias-bg-overlay': pair('rgba(11,31,26,0.36)', 'rgba(2,7,8,0.78)'),
      '--dsw-alias-bg-mask-1': pair('rgba(11,31,26,0.06)', 'rgba(0,0,0,0.38)'),
      '--dsw-alias-bg-mask-2': pair('rgba(11,31,26,0.12)', 'rgba(0,0,0,0.62)'),
      '--dsw-alias-bg-mask-3': pair('rgba(11,31,26,0.22)', 'rgba(0,0,0,0.8)'),
      '--dsw-alias-bg-skeleton': pair('#e4ece9', '#132327'),
      '--dsw-alias-border-l1': pair('rgba(11,31,26,0.06)', 'rgba(255,255,255,0.06)'),
      '--dsw-alias-border-l2': pair('rgba(11,31,26,0.1)', 'rgba(255,255,255,0.1)'),
      '--dsw-alias-border-l3': pair('rgba(11,31,26,0.16)', 'rgba(255,255,255,0.16)'),
      '--dsw-alias-border-l4': pair('rgba(11,31,26,0.24)', 'rgba(255,255,255,0.24)'),
      '--dsw-alias-border-l2-darkmode-thin': pair('rgba(11,31,26,0.08)', 'rgba(255,255,255,0.08)'),
      '--dsw-alias-border-inverted': pair('rgba(255,255,255,0.16)', 'rgba(0,0,0,0.24)'),
      '--dsw-alias-brand-primary': pair('#10211f', '#e7f1f0'),
      '--dsw-alias-brand-primary-invert': pair('#e7f1f0', '#070c0e'),
      '--dsw-alias-brand-text': pair('#10211f', '#e7f1f0'),
      '--dsw-alias-button-primary-fill': pair('#0f766e', '#5eead4'),
      '--dsw-alias-button-primary-hover': pair('#115e59', '#7ff7ea'),
      '--dsw-alias-button-primary-dimmed': pair('#99d6ce', '#2b7a70'),
      '--dsw-alias-button-contrast-fill': pair('#10211f', '#e7f1f0'),
      '--dsw-alias-label-primary': pair('#10211f', '#e7f1f0'),
      '--dsw-alias-label-secondary': pair('#3e5b57', '#a7bebc'),
      '--dsw-alias-label-tertiary': pair('#6f8b89', '#6f8b89'),
      '--dsw-alias-label-caption': pair('#8aa39f', '#506966'),
      '--dsw-alias-label-primary-foreground': pair('#ffffff', '#04100f'),
      '--dsw-alias-label-primary-inverted': pair('#ffffff', '#04100f'),
      '--dsw-alias-label-primary-dimmed': pair('#3e5b57', '#a7bebc'),
      '--dsw-alias-label-dimmed': pair('#6f8b89', '#6f8b89'),
      '--dsw-alias-link': pair('#0f766e', '#7ff7ea'),
      '--dsw-alias-state-business-primary': pair('#0f766e', '#5eead4'),
      '--dsw-alias-state-business-tertiary': pair('#d6e9e4', '#14302d'),
      '--dsw-alias-state-error-primary': pair('#b4443c', '#e07a7a'),
      '--dsw-alias-state-error-secondary': pair('#f3d8d5', '#361b1b'),
      '--dsw-alias-state-warn-primary': pair('#9a6418', '#e8b86a'),
      '--dsw-alias-state-warn-secondary': pair('#f4e8d2', '#33250f'),
      '--dsw-alias-state-warn-tertiary': pair('#faf3e6', '#241b0c'),
      '--dsw-alias-state-success-primary': pair('#0f766e', '#5eead4'),
      '--dsw-alias-state-success-secondary': pair('#d6e9e4', '#14302d'),
      '--dsw-alias-state-success-tertiary': pair('#eaf5f2', '#0c1f1d'),
      '--dsw-alias-state-idle-primary': pair('#6f8b89', '#6f8b89'),
      '--dsw-alias-markdown-code-block': pair('#f0f5f3', '#081114'),
      '--dsw-alias-markdown-code-block-banner': pair('#e4ece9', '#0c1a1d'),
      '--dsw-alias-markdown-inline-code': pair('#e4ece9', '#102427'),
      '--dsw-alias-markdown-tag': pair('#d6e9e4', '#12302e'),
      '--dsw-alias-markdown-citation': pair('#d6e9e4', '#102a27'),
      '--dsw-alias-markdown-placeholder': pair('#8aa39f', '#506966'),
      '--dsw-alias-specific-sidebar-fill': pair('#eef3f1', '#081013'),
      '--dsw-alias-scrollbar-bg-l1': pair('#c9d8d4', '#1a2c2f'),
      '--dsw-alias-scrollbar-hover-l1': pair('#afc5c0', '#2a4649'),
      '--dsw-alias-settings-card-fill': pair('#ffffff', '#0b1417'),
      '--dsw-alias-settings-card-stroke': pair('rgba(11,31,26,0.08)', 'rgba(255,255,255,0.08)'),
      '--dsw-alias-interactive-bg-hover': pair('rgba(11,31,26,0.035)', 'rgba(255,255,255,0.04)'),
      '--dsw-alias-interactive-bg-active': pair('rgba(15,118,110,0.08)', 'rgba(94,234,212,0.1)'),
      '--dsw-alias-interactive-bg-hover-accent': pair('rgba(15,118,110,0.06)', 'rgba(94,234,212,0.08)'),
      '--dsw-alias-menu-icon': pair('#3e5b57', '#a7bebc'),
      '--dsw-alias-menu-group-header-fill': pair('#eef3f1', '#0b1417'),
      '--dsw-alias-tooltip-bg': pair('#10211f', '#132327'),
      '--dsw-alias-tooltip-key-bg': pair('#e4ece9', '#1a2c2f'),
      '--dsw-alias-toast-bg': pair('#10211f', '#132327'),
      '--dsw-alias-turn-trigger-bg': pair('#edf3f1', '#0e1a1d'),
      '--dsw-alias-turn-trigger-bg-hover': pair('#e4ece9', '#132327'),
      '--dsw-alias-button-ghost-active-fill': pair('rgba(15,118,110,0.08)', 'rgba(94,234,212,0.1)'),
      '--dsw-alias-button-ghost-active-border': pair('rgba(15,118,110,0.22)', 'rgba(94,234,212,0.28)'),
      '--dsw-alias-button-elevated-fill': pair('#ffffff', '#0e1a1d'),
      '--dsw-alias-button-floating-fill': pair('#ffffff', '#0e1a1d'),
      '--dsw-alias-button-floating-hover': pair('#edf3f1', '#132327')
    }

    function setDomEnabled(enabled) {
      try {
        if (enabled) document.documentElement.dataset.grayTheme = 'on'
        else delete document.documentElement.dataset.grayTheme
      } catch (e) { /* noop */ }
    }

    var tokenDisposer = null
    function applyTokens(ctx, enabled) {
      if (enabled) {
        if (tokenDisposer) return
        try {
          tokenDisposer = ctx.theme.overrideTokens(SOURCE, TOKENS)
        } catch (error) {
          console.warn('[dsh-gray-theme] token override failed', error)
        }
      } else if (tokenDisposer) {
        try { tokenDisposer() } catch (e) { /* noop */ }
        tokenDisposer = null
      }
      setDomEnabled(enabled)
    }

    function applyConfig(ctx, config) {
      applyTokens(ctx, config.enabled !== false)
    }

    function fetchConfig() {
      return fetch(API, { headers: { Accept: 'application/json' }, cache: 'no-store' })
        .then(function (response) { return response.json() })
        .then(function (payload) {
          if (!payload || payload.ok !== true) throw new Error('bad config response')
          return payload
        })
    }

    function postConfig(patch) {
      return fetch(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ patch: patch })
      })
        .then(function (response) { return response.json() })
        .then(function (payload) {
          if (!payload || payload.ok !== true) throw new Error(payload && payload.error || 'save failed')
          return payload.config
        })
    }

    function defaultConfig() {
      var boot = typeof window !== 'undefined' && window.__GRAY_THEME__ ? window.__GRAY_THEME__.config : null
      return Object.assign({
        enabled: true,
        boot: true,
        mode: 'session',
        portrait: 'nightfall',
        duration: 3600
      }, boot || {})
    }

    function Glyph(props) {
      return h('span', { className: '__gt_dot', 'aria-hidden': 'true' }, props.children || null)
    }

    function Toggle(props) {
      return h('label', { className: '__gt_row' },
        h('span', { className: '__gt_label' },
          h('strong', null, props.label),
          props.hint ? h('span', { className: '__gt_hint' }, props.hint) : null
        ),
        h('input', {
          type: 'checkbox',
          checked: !!props.checked,
          onChange: function (event) { props.onChange(event.target.checked) },
          'aria-label': props.label
        })
      )
    }

    function Panel(props) {
      var initial = defaultConfig()
      var [config, setConfig] = useState(initial)
      var [loading, setLoading] = useState(true)
      var [saving, setSaving] = useState(false)
      var [status, setStatus] = useState('')
      var [error, setError] = useState('')

      useEffect(function () {
        var alive = true
        fetchConfig()
          .then(function (payload) {
            if (!alive) return
            setConfig(payload.config)
            applyConfig(ctxRef, payload.config)
            setLoading(false)
          })
          .catch(function (err) {
            if (!alive) return
            setError(String(err && err.message || err))
            setLoading(false)
          })
        return function () { alive = false }
      }, [])

      var ctxRef = props.ctx

      function patch(next) {
        setConfig(function (current) { return Object.assign({}, current, next) })
        setStatus('')
        setError('')
      }

      function save(extra) {
        var next = Object.assign({}, config, extra || {})
        setSaving(true)
        setError('')
        setStatus('保存中…')
        return postConfig(next)
          .then(function (saved) {
            setConfig(saved)
            applyConfig(ctxRef, saved)
            setStatus('已保存')
            setSaving(false)
            return saved
          })
          .catch(function (err) {
            setSaving(false)
            setStatus('')
            setError(String(err && err.message || err))
            throw err
          })
      }

      function reset() {
        setSaving(true)
        setError('')
        fetch(API, {
          method: 'POST',
          headers: { 'content-type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ action: 'reset' })
        })
          .then(function (response) { return response.json() })
          .then(function (payload) {
            if (!payload || payload.ok !== true) throw new Error('reset failed')
            setConfig(payload.config)
            applyConfig(ctxRef, payload.config)
            setSaving(false)
            setStatus('已恢复默认')
          })
          .catch(function (err) {
            setSaving(false)
            setError(String(err && err.message || err))
          })
      }

      function replay() {
        save({ boot: true })
          .then(function () {
            try { sessionStorage.removeItem('gray-theme:booted') } catch (e) { /* noop */ }
            var url = new URL(window.location.href)
            url.searchParams.set('gray_boot', '1')
            window.location.href = url.toString()
          })
          .catch(function () { /* status already shown */ })
      }

      var portraits = (window.__GRAY_THEME__ && window.__GRAY_THEME__.portraits) || []
      var selected = config.portrait || 'nightfall'
      var hero = ART + selected

      return h('div', { className: '__gt_root' },
        h('div', { className: '__gt_hero' },
          h('div', { className: '__gt_heroBg', style: { backgroundImage: 'url("' + hero + '")' } }),
          h('div', { className: '__gt_heroShade' }),
          h('div', { className: '__gt_heroText' },
            h('span', { className: '__gt_eyebrow' }, 'GRAY / NANITE ARCHIVE'),
            h('h2', { className: '__gt_title' }, '灰风 · 纳米档案'),
            h('p', { className: '__gt_sub' }, '整个文明，只以一个人的形式与你对话。')
          )
        ),
        h('div', { className: '__gt_group' },
          h('div', { className: '__gt_groupHead' },
            h('span', { className: '__gt_groupTitle' }, 'SURFACE / 界面'),
            h('span', { className: '__gt_status' }, loading ? '读取中…' : '本地配置')
          ),
          h(Toggle, {
            label: '启用灰风主题',
            hint: '只替换颜色、字体与质感；DSH 的结构与操作习惯保持不变。',
            checked: config.enabled !== false,
            onChange: function (value) { patch({ enabled: value }); applyConfig(ctxRef, Object.assign({}, config, { enabled: value })) }
          }),
          h(Toggle, {
            label: '启动画面',
            hint: '下一次刷新页面时生效。可随时跳过，不拦截进入应用。',
            checked: config.boot !== false,
            onChange: function (value) { patch({ boot: value }) }
          }),
          h('div', { className: '__gt_row' },
            h('span', { className: '__gt_label' },
              h('strong', null, '出现频率'),
              h('span', { className: '__gt_hint' }, '默认每次浏览器会话只出现一次。')
            ),
            h('select', {
              className: '__gt_select',
              value: config.mode || 'session',
              onChange: function (event) { patch({ mode: event.target.value }) }
            },
              h('option', { value: 'session' }, '每次会话'),
              h('option', { value: 'daily' }, '每天一次'),
              h('option', { value: 'always' }, '每次刷新')
            )
          )
        ),
        h('div', { className: '__gt_group' },
          h('div', { className: '__gt_groupHead' },
            h('span', { className: '__gt_groupTitle' }, 'PORTRAIT / 立绘'),
            h('span', { className: '__gt_status' }, '同人图 · 仅本地')
          ),
          h('div', { className: '__gt_gallery' },
            portraits.map(function (item) {
              return h('button', {
                key: item.id,
                type: 'button',
                className: '__gt_thumb',
                'data-active': item.id === selected ? 'true' : 'false',
                onClick: function () { patch({ portrait: item.id }) },
                title: item.label
              },
                h('img', { src: ART + item.id, alt: item.label, loading: 'lazy' }),
                h('span', null, item.label)
              )
            })
          )
        ),
        h('div', { className: '__gt_group' },
          h('div', { className: '__gt_groupHead' },
            h('span', { className: '__gt_groupTitle' }, 'ACTION / 应用'),
            h('span', { className: '__gt_status' }, saving ? '写入中…' : (error || status || '一切就绪'))
          ),
          h('div', { className: '__gt_actions' },
            h('button', { className: '__gt_btn __gt_btnPrimary', type: 'button', disabled: saving, onClick: function () { save() } }, '保存设置'),
            h('button', { className: '__gt_btn', type: 'button', disabled: saving, onClick: replay }, '保存并重播启动'),
            h('button', { className: '__gt_btn', type: 'button', disabled: saving, onClick: reset }, '恢复默认')
          ),
          h('p', { className: '__gt_hint' }, '主题切换立即生效；启动画面的开关与频率在下次刷新时生效。')
        )
      )
    }

    var inject = ['theme', 'slots']

    function apply(ctx) {
      var initial = defaultConfig()
      applyConfig(ctx, initial)
      try {
        var panel = function () { return h(Panel, { ctx: ctx }) }
        ctx.slots.inject('settings.section', function () {
          return ctx.slots.register(
            { name: 'settings.section', id: 'gray-theme', order: 34, label: '灰风主题' },
            panel
          )
        })
      } catch (error) {
        console.warn('[dsh-gray-theme] settings section registration failed', error)
      }
      ctx.effect(function () {
        return function () {
          if (tokenDisposer) {
            try { tokenDisposer() } catch (e) { /* noop */ }
            tokenDisposer = null
          }
        }
      }, 'dsh-gray-theme: token layer')
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  }
})
