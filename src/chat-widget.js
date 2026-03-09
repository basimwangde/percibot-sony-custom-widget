/* PerciBot — SAC Chat Widget (calls backend API directly) */
;(function () {
    const tpl = document.createElement('template')
    tpl.innerHTML = `
      <style>
        :host { display:block; height:100%; font:14px/1.45 var(--sapFontFamily, "72", Arial); color:#0b1221 }
        .wrap{height:100%; display:flex; flex-direction:column; box-sizing:border-box; background:#fff}
        header{
          display:flex; align-items:center; justify-content:space-between; padding:10px 14px;
          color:#fff; border-radius:10px; margin:10px; min-height:42px;
        }
        .brand{font-weight:700}
        .chip{font-size:12px; padding:4px 8px; border-radius:999px; background:rgba(255,255,255,.2)}
        .body {
          flex:1;
          display:flex;
          flex-direction:column;
          gap:10px;
          padding:10px;
          min-height:0;
        }
        .panel{
          flex:1;
          overflow-y:auto;
          overflow-x:hidden;
          border:1px solid #e7eaf0;
          border-radius:12px;
          padding:10px;
          background:#f7f9fc;
          position:relative;
          user-select:text;
          -webkit-user-select:text;
        }
        .msg{
          max-width:85%;
          margin:6px 0;
          padding:10px 12px;
          border-radius:14px;
          box-shadow:0 1px 2px rgba(0,0,0,.04);
          user-select:text;
          -webkit-user-select:text;
        }
        .user{ margin-left:auto; }
        .suggestions{
          margin:8px 0 4px;
          padding:8px 10px;
          border-radius:10px;
          border:1px solid #e7eaf0;
          background:#f9fafc;
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .suggest-chip-row{
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .suggest-chip{
          font-size:12px;
          padding:6px 10px;
          border-radius:999px;
          border:1px solid #d0d3da;
          background:#ffffff;
          cursor:pointer;
          max-width:100%;
          width:100%;
          text-align:left;
          white-space:normal;
        }
        .suggest-chip:hover{
          background:#eef4ff;
          border-color:#4d9aff;
        }
        .inputRow{ display:flex; gap:8px; align-items:flex-start }
        textarea{
          flex:1; resize:vertical; min-height:64px; max-height:220px;
          padding:10px 12px; border:1px solid #d0d3da; border-radius:12px; background:#fff; outline:none;
        }
        textarea:focus{ border-color:#4d9aff; box-shadow:0 0 0 2px rgba(77,154,255,.15) }
        button{
          padding:10px 14px; border:1px solid #d0d3da; border-radius:12px; background:#fff; cursor:pointer
        }
        button.primary{ color:#fff; border-color:transparent }
        button:disabled{ opacity:.5; cursor:not-allowed }
        .muted{opacity:.7; font-size:12px}
        .footer{display:flex; justify-content:space-between; align-items:center; padding:0 10px 10px}

        .msg.bot p { margin: 6px 0; }
        .msg.bot ul, .msg.bot ol { padding-left: 20px; margin: 6px 0; }
        .msg.bot li { margin: 4px 0; }
        .msg.bot table { border-collapse: collapse; width: 100%; margin: 6px 0; }
        .msg.bot th, .msg.bot td { border: 1px solid #e7eaf0; padding: 6px 8px; text-align: left; }
        .msg.bot thead th { background: #f3f6ff; }
        .msg.bot code { background:#f1f3f7; padding:2px 4px; border-radius:4px; }
        .msg.bot.typing{ display:inline-flex; align-items:center; gap:8px; }
        .typing .dots{ display:inline-flex; gap:4px; }
        .typing .dots span{
          width:6px; height:6px; border-radius:50%;
          background:#c7ccd8; display:inline-block;
          animation: percibot-blink 1s infinite ease-in-out;
        }
        .typing .dots span:nth-child(2){ animation-delay:.15s }
        .typing .dots span:nth-child(3){ animation-delay:.30s }

        @keyframes percibot-blink{
          0%{ opacity:.2; transform:translateY(0) }
          20%{ opacity:1; transform:translateY(-2px) }
          100%{ opacity:.2; transform:translateY(0) }
        }

        .msg.bot.typing{ position:sticky; bottom:0; }
      </style>
      <div class="wrap">
        <header>
          <div class="brand">PerciBOT</div>
          <div class="chip" id="modelChip">AI Assistant</div>
        </header>

        <div class="body">
          <div class="panel" id="chat"></div>

          <div class="suggestions">
            <div class="muted">Try asking…</div>
            <div class="suggest-chip-row">
              <button class="suggest-chip" data-q="What was the Monthly Active Users (MAU) for the current month?">What was the Monthly Active Users (MAU) for the current month?</button>
              <button class="suggest-chip" data-q="How has MAU trended over the past 6 months?">How has MAU trended over the past 6 months?</button>
              <button class="suggest-chip" data-q="SVOD MAU and AVOD MAU compare over the past 6 months?">SVOD MAU and AVOD MAU compare over the past 6 months?</button>
              <button class="suggest-chip" data-q="What are the Top 5 shows based on MAV?">What are the Top 5 shows based on MAV?</button>
              <button class="suggest-chip" data-q="Show MAV performance by content category for the last month">Show MAV performance by content category for the last month</button>
            </div>
          </div>

          <div class="inputRow">
            <textarea id="input" placeholder="Ask anything about your analytics…"></textarea>
            <div style="display:flex; flex-direction:column; gap:8px;">
              <button class="primary" id="send">Send</button>
              <button id="clear">Clear</button>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="muted" id="hint">AI can make mistakes. Please verify results.</div>
          <div class="muted"><a href="https://www.linkedin.com/company/percipere/" target="_blank" >Percipere Consulting</a></div>
        </div>
      </div>
    `

    const BACKEND_URL = 'https://percibot.cfapps.in30.hana.ondemand.com/ask'

    class PerciBot extends HTMLElement {
      constructor () {
        super()
        this._shadowRoot = this.attachShadow({ mode: 'open' })
        this._shadowRoot.appendChild(tpl.content.cloneNode(true))
        this.$ = id => this._shadowRoot.getElementById(id)

        this.$chat = this.$('chat')
        this.$input = this.$('input')
        this.$send = this.$('send')
        this.$clear = this.$('clear')
        this.$modelChip = this.$('modelChip')
        this.$hint = this.$('hint')

        this.$send.addEventListener('click', () => this._send())
        this.$clear.addEventListener('click', () => (this.$chat.innerHTML = ''))
        this.$input.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            this._send()
          }
        })
        this._shadowRoot.querySelectorAll('.suggest-chip').forEach(btn => {
          btn.addEventListener('click', () => {
            const q = btn.getAttribute('data-q') || btn.textContent || ''
            if (!q) return
            this.$input.value = q
            this._send()
          })
        })

        this._props = {
          welcomeText: "Hello, I'm PerciBOT! How can I assist you?",
          primaryColor: '#1f4fbf',
          primaryDark: '#163a8a',
          surfaceColor: '#ffffff',
          surfaceAlt: '#f6f8ff',
          textColor: '#0b1221',
        }
        this.summaryResponse = ''
      }

      connectedCallback () {
        if (!this.$chat.innerHTML && this._props.welcomeText) {
          this._append('bot', this._props.welcomeText)
        }
      }

      onCustomWidgetAfterUpdate (changedProps = {}) {
        Object.assign(this._props, changedProps)
        this._applyTheme()

        if (changedProps.summaryPrompt !== undefined) {
          this._generateSummary(changedProps.summaryPrompt)
          return
        }

        if (!this.$chat.innerHTML && this._props.welcomeText) {
          this._append('bot', this._props.welcomeText)
        }
      }

      getLastSummary () {
        return this.summaryResponse ? String(this.summaryResponse) : ''
      }

      onCustomWidgetRequest (methodName, params) {
        if (methodName === 'generateSummary') {
          let payload = ''
          if (typeof params === 'string') {
            payload = params
          } else if (Array.isArray(params)) {
            payload = params[0] || ''
          } else if (params && typeof params === 'object') {
            payload = params.payload || ''
          }
          this._generateSummary(payload)
          return
        }

        if (methodName === 'getLastSummary') {
          return this.summaryResponse || ''
        }
      }

      async _generateSummary (prompt) {
        const q = (prompt || '').trim()
        if (!q) return
        this._append('user', q)
        this.$input.value = ''

        this._startTyping()
        this.$send.disabled = true

        try {
          const sessionId = this._sessionId || this._buildSessionId()
          this._sessionId = sessionId
          const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q, session: sessionId })
          })

          if (!res.ok) {
            const txt = await res.text()
            throw new Error(`${res.status} ${res.statusText}: ${txt}`)
          }

          const data = await res.json()
          const ans = data.response || data.answer || data.result || JSON.stringify(data)
          this.summaryResponse = ans
          this._stopTyping()
          this._append('bot', ans)
          return ans
        } catch (e) {
          this._stopTyping()
          this._append('bot', `Error: ${e.message}`)
        } finally {
          this.$send.disabled = false
        }
      }

      setProperties (props) {
        this.onCustomWidgetAfterUpdate(props)
      }

      _applyTheme () {
        const wrap = this._shadowRoot.querySelector('.wrap')
        const header = this._shadowRoot.querySelector('header')
        const panel = this._shadowRoot.querySelector('.panel')
        const buttons = this._shadowRoot.querySelectorAll('button.primary')

        wrap.style.background = this._props.surfaceColor || '#ffffff'
        wrap.style.color = this._props.textColor || '#0b1221'
        panel.style.background = this._props.surfaceAlt || '#f6f8ff'
        header.style.background = `linear-gradient(90deg, ${
          this._props.primaryColor || '#1f4fbf'
        }, ${this._props.primaryDark || '#163a8a'})`

        buttons.forEach(btn => {
          btn.style.background = `linear-gradient(90deg, ${
            this._props.primaryColor || '#1f4fbf'
          }, ${this._props.primaryDark || '#163a8a'})`
        })
      }

      _escapeHtml (s = '') {
        return String(s)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      }

      _mdLists (md) {
        const lines = md.split('\n')
        const out = []
        let inUl = false, inOl = false

        const flush = () => {
          if (inUl) { out.push('</ul>'); inUl = false }
          if (inOl) { out.push('</ol>'); inOl = false }
        }

        for (const line of lines) {
          if (/^\s*[-*]\s+/.test(line)) {
            if (!inUl) { flush(); out.push('<ul>'); inUl = true }
            out.push(`<li>${this._mdInline(line.replace(/^\s*[-*]\s+/, ''))}</li>`)
          } else if (/^\s*\d+\.\s+/.test(line)) {
            if (!inOl) { flush(); out.push('<ol>'); inOl = true }
            out.push(`<li>${this._mdInline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`)
          } else if (line.trim() === '') {
            flush()
            out.push('<br/>')
          } else {
            flush()
            out.push(`<p>${this._mdInline(line)}</p>`)
          }
        }
        flush()
        return out.join('')
      }

      _mdTable (block) {
        const raw = block.trim().split('\n').filter(Boolean)
        if (raw.length < 2) return null

        const norm = raw.map(line =>
          line.replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '')
        )

        const sepCells = norm[1].split('|').map(s => s.trim())
        const sepOk =
          sepCells.length > 0 && sepCells.every(c => /^:?-{3,}:?$/.test(c))
        if (!sepOk) return null

        const toCells = line =>
          line.split('|').map(c => c.trim()).filter(c => c.length > 0).map(c => this._mdInline(c))

        const head = toCells(norm[0])
        const bodyRows = norm.slice(2).map(toCells)

        const ths = head.map(h => `<th>${h}</th>`).join('')
        const trs = bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')

        return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`
      }

      _mdInline (s) {
        let t = this._escapeHtml(s)
        t = t.replace(/`([^`]+)`/g, '<code>$1</code>')
        t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
        return t
      }

      _renderMarkdown (md = '') {
        const blocks = md.split(/\n{2,}/)
        return blocks.map(b => {
          const maybe = this._mdTable(b)
          return maybe ? maybe : this._mdLists(b)
        }).join('\n')
      }

      _append (role, text) {
        const b = document.createElement('div')
        b.className = `msg ${role === 'user' ? 'user' : 'bot'}`

        if (role === 'user') {
          b.textContent = text
        } else {
          b.innerHTML = this._renderMarkdown(String(text || ''))
        }

        if (role === 'user') {
          b.style.background = '#97cdf2ff'
          b.style.border = '1px solid #e7eaf0'
          b.style.color = this._props.textColor || '#0b1221'
        } else {
          b.style.background = '#ffffff'
          b.style.border = '1px solid #e7eaf0'
          b.style.color = this._props.textColor || '#0b1221'
        }

        this.$chat.appendChild(b)
        this.$chat.scrollTop = this.$chat.scrollHeight
      }

      _startTyping () {
        if (this._typingEl) return
        const b = document.createElement('div')
        b.className = 'msg bot typing'
        b.innerHTML = `<span class="muted">PerciBOT</span><span class="dots"><span></span><span></span><span></span></span>`
        b.style.background = '#ffffff'
        b.style.border = '1px solid #e7eaf0'
        b.style.color = this._props.textColor || '#0b1221'

        this.$chat.appendChild(b)
        this.$chat.scrollTop = this.$chat.scrollHeight
        this._typingEl = b
      }

      _stopTyping () {
        if (this._typingEl && this._typingEl.parentNode) {
          this._typingEl.parentNode.removeChild(this._typingEl)
        }
        this._typingEl = null
      }

      async _send () {
        const q = (this.$input.value || '').trim()
        if (!q) return
        this._append('user', q)
        this.$input.value = ''

        this._startTyping()
        this.$send.disabled = true

        try {
          const sessionId = this._sessionId || this._buildSessionId()
          this._sessionId = sessionId
          const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: q, session: sessionId })
          })

          if (!res.ok) {
            const txt = await res.text()
            throw new Error(`${res.status} ${res.statusText}: ${txt}`)
          }

          const data = await res.json()
          const ans = data.response || data.answer || data.result || JSON.stringify(data)
          this._stopTyping()
          this._append('bot', ans)
        } catch (e) {
          this._stopTyping()
          this._append('bot', `Error: ${e.message}`)
        } finally {
          this.$send.disabled = false
        }
      }

      _buildSessionId () {
        const d = new Date()
        const pad = n => String(n).padStart(2, '0')
        const y = d.getFullYear()
        const m = pad(d.getMonth() + 1)
        const day = pad(d.getDate())
        return `PerciBOT_${y}${m}${day}`
      }
    }

    if (!customElements.get('perci-bot')) {
      customElements.define('perci-bot', PerciBot)
    }
  })()
