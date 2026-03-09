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
          position:relative; /* anchor overlays like sample panel */
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
          margin:6px 10px 4px;
          display:flex;
          flex-direction:column;
          gap:6px;
        }
        .suggest-title{
          font-size:12px;
          font-weight:600;
          letter-spacing:.06em;
          text-transform:uppercase;
          opacity:.65;
        }
        .suggest-chip-row{
          display:flex;
          flex-wrap:wrap;
          gap:8px;
        }
        .suggest-chip{
          font-size:12px;
          padding:6px 12px;
          border-radius:999px;
          border:1px solid #d0d3da;
          background:linear-gradient(180deg,#ffffff,#f7f9ff);
          cursor:pointer;
          max-width:100%;
          text-align:left;
          white-space:normal;
          box-shadow:0 1px 2px rgba(15,23,42,.06);
        }
        .suggest-chip:hover{
          background:linear-gradient(180deg,#f9fbff,#eef4ff);
          border-color:#4d9aff;
        }
        .sample-toggle-row{
          display:flex;
          justify-content:flex-start;
          padding:0 2px;
        }
        .sample-toggle{
          border:none;
          background:transparent;
          color:#1f4fbf;
          font-size:12px;
          font-weight:600;
          cursor:pointer;
          padding:0;
          display:inline-flex;
          align-items:center;
          gap:4px;
        }
        .sample-toggle::before{
          content:'❓';
          font-size:12px;
        }
        .sample-toggle:hover{
          text-decoration:underline;
        }
        .sample-panel{
          position:absolute;
          top:24px;
          left:16px;
          right:16px;
          bottom:80px;
          background:#ffffff;
          border-radius:12px;
          box-shadow:0 18px 45px rgba(15,23,42,.22);
          border:1px solid #e2e8f0;
          padding:14px 16px;
          overflow:auto;
          z-index:5;
          display:none;
        }
        .sample-panel-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:10px;
        }
        .sample-panel-title{
          font-size:13px;
          font-weight:700;
        }
        .sample-panel-close{
          border:none;
          background:transparent;
          cursor:pointer;
          font-size:18px;
          line-height:1;
        }
        .sample-section{
          margin-bottom:10px;
        }
        .sample-section-title{
          font-size:12px;
          font-weight:600;
          margin-bottom:4px;
        }
        .sample-q-list{
          display:flex;
          flex-direction:column;
          gap:4px;
        }
        .sample-q{
          text-align:left;
          font-size:12px;
          padding:6px 8px;
          border-radius:8px;
          border:1px solid #e2e8f0;
          background:#f8fafc;
          cursor:pointer;
        }
        .sample-q:hover{
          background:#edf2ff;
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

          <div class="suggestions" id="suggestions">
            <div class="suggest-title">Try asking…</div>
            <div class="suggest-chip-row">
              <button class="suggest-chip" data-q="What was the Monthly Active Users (MAU) for the current month?">What was the Monthly Active Users (MAU) for the current month?</button>
              <button class="suggest-chip" data-q="How has MAU trended over the past 6 months?">How has MAU trended over the past 6 months?</button>
              <button class="suggest-chip" data-q="SVOD MAU and AVOD MAU compare over the past 6 months?">SVOD MAU and AVOD MAU compare over the past 6 months?</button>
              <button class="suggest-chip" data-q="What are the Top 5 shows based on MAV?">What are the Top 5 shows based on MAV?</button>
              <button class="suggest-chip" data-q="Show MAV performance by content category for the last month">Show MAV performance by content category for the last month</button>
            </div>
          </div>

          <div class="sample-toggle-row">
            <button id="sampleToggle" class="sample-toggle">Sample questions</button>
          </div>

          <div class="sample-panel" id="samplePanel">
            <div class="sample-panel-header">
              <div class="sample-panel-title">Sample questions library</div>
              <button class="sample-panel-close" id="sampleClose" aria-label="Close sample questions">×</button>
            </div>
            <div class="sample-section">
              <div class="sample-section-title">1. Platform User Engagement</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What was the Monthly Active Users (MAU) for the last month?">What was the Monthly Active Users (MAU) for the last month?</button>
                <button class="sample-q" data-q="How has MAU trended over the past 6 months?">How has MAU trended over the past 6 months?</button>
                <button class="sample-q" data-q="What is the SVOD MAU for the last month?">What is the SVOD MAU for the last month?</button>
                <button class="sample-q" data-q="What is the AVOD MAU for the last month?">What is the AVOD MAU for the last month?</button>
                <button class="sample-q" data-q="How do SVOD MAU and AVOD MAU compare over the past 6 months?">How do SVOD MAU and AVOD MAU compare over the past 6 months?</button>
                <button class="sample-q" data-q="Which month recorded the highest MAU in the dataset?">Which month recorded the highest MAU in the dataset?</button>
                <button class="sample-q" data-q="What is the Daily Active Users (DAU) for the most recent month?">What is the Daily Active Users (DAU) for the most recent month?</button>
                <button class="sample-q" data-q="How does DAU compare between SVOD and AVOD users?">How does DAU compare between SVOD and AVOD users?</button>
                <button class="sample-q" data-q="What is the average number of active days per MAU (Avg. MAU Days)?">What is the average number of active days per MAU (Avg. MAU Days)?</button>
                <button class="sample-q" data-q="Which month had the highest average MAU days?">Which month had the highest average MAU days?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">2. Viewer Engagement</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What was the Monthly Active Viewers (MAV) last month?">What was the Monthly Active Viewers (MAV) last month?</button>
                <button class="sample-q" data-q="How has MAV trended over the past 6 months?">How has MAV trended over the past 6 months?</button>
                <button class="sample-q" data-q="What is the SVOD MAV for the last month?">What is the SVOD MAV for the last month?</button>
                <button class="sample-q" data-q="What is the AVOD MAV for the last month?">What is the AVOD MAV for the last month?</button>
                <button class="sample-q" data-q="How do SVOD MAV and AVOD MAV compare month-over-month?">How do SVOD MAV and AVOD MAV compare month-over-month?</button>
                <button class="sample-q" data-q="What is the average daily active viewers (DAV) for the current month?">What is the average daily active viewers (DAV) for the current month?</button>
                <button class="sample-q" data-q="Compare SVOD DAV and AVOD DAV for the past 3 months.">Compare SVOD DAV and AVOD DAV for the past 3 months.</button>
                <button class="sample-q" data-q="What is the average number of active days per viewer (Avg. MAV Days)?">What is the average number of active days per viewer (Avg. MAV Days)?</button>
                <button class="sample-q" data-q="Which month recorded the highest MAV?">Which month recorded the highest MAV?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">3. User to Viewer Conversion</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What is the monthly user-to-viewer conversion rate?">What is the monthly user-to-viewer conversion rate?</button>
                <button class="sample-q" data-q="How has user-to-viewer conversion changed over the last 6 months?">How has user-to-viewer conversion changed over the last 6 months?</button>
                <button class="sample-q" data-q="What is the daily user-to-viewer conversion rate?">What is the daily user-to-viewer conversion rate?</button>
                <button class="sample-q" data-q="Which month had the highest user-to-viewer conversion?">Which month had the highest user-to-viewer conversion?</button>
                <button class="sample-q" data-q="How does conversion vary month-over-month?">How does conversion vary month-over-month?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">4. Video Consumption</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What were the total video views last month?">What were the total video views last month?</button>
                <button class="sample-q" data-q="What were the SVOD video views last month?">What were the SVOD video views last month?</button>
                <button class="sample-q" data-q="What were the AVOD video views last month?">What were the AVOD video views last month?</button>
                <button class="sample-q" data-q="How have video views trended over the past 6 months?">How have video views trended over the past 6 months?</button>
                <button class="sample-q" data-q="Which month recorded the highest number of video views?">Which month recorded the highest number of video views?</button>
                <button class="sample-q" data-q="How do SVOD video views compare with AVOD video views over time?">How do SVOD video views compare with AVOD video views over time?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">5. Watch Time Analytics</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What was the total watch time last month?">What was the total watch time last month?</button>
                <button class="sample-q" data-q="What was the SVOD total watch time last month?">What was the SVOD total watch time last month?</button>
                <button class="sample-q" data-q="What was the AVOD total watch time last month?">What was the AVOD total watch time last month?</button>
                <button class="sample-q" data-q="How has watch time trended over the last 6 months?">How has watch time trended over the last 6 months?</button>
                <button class="sample-q" data-q="What is the average watch time per viewer (WT/Viewer)?">What is the average watch time per viewer (WT/Viewer)?</button>
                <button class="sample-q" data-q="How does WT/Viewer compare between SVOD and AVOD viewers?">How does WT/Viewer compare between SVOD and AVOD viewers?</button>
                <button class="sample-q" data-q="Which month recorded the highest watch time per viewer?">Which month recorded the highest watch time per viewer?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">6. Monetization Metrics</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What were the total monetizable views last month?">What were the total monetizable views last month?</button>
                <button class="sample-q" data-q="What were the SVOD monetizable views last month?">What were the SVOD monetizable views last month?</button>
                <button class="sample-q" data-q="What were the AVOD monetizable views last month?">What were the AVOD monetizable views last month?</button>
                <button class="sample-q" data-q="How have monetizable views changed over time?">How have monetizable views changed over time?</button>
                <button class="sample-q" data-q="Which month recorded the highest monetizable views?">Which month recorded the highest monetizable views?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">7. Viewer Cohort Analysis</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="Show the distribution of viewers by active days cohort.">Show the distribution of viewers by active days cohort.</button>
                <button class="sample-q" data-q="How many viewers fall into low, medium, and high activity cohorts?">How many viewers fall into low, medium, and high activity cohorts?</button>
                <button class="sample-q" data-q="Which cohort contributes the largest share of viewers?">Which cohort contributes the largest share of viewers?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">8. Content Performance</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="What are the Top 5 shows based on MAU?">What are the Top 5 shows based on MAU?</button>
                <button class="sample-q" data-q="What are the Top 5 shows based on MAV?">What are the Top 5 shows based on MAV?</button>
                <button class="sample-q" data-q="What are the Top 5 shows based on video views?">What are the Top 5 shows based on video views?</button>
                <button class="sample-q" data-q="What are the Top 5 shows based on watch time?">What are the Top 5 shows based on watch time?</button>
                <button class="sample-q" data-q="What are the Top 5 shows based on watch time per viewer?">What are the Top 5 shows based on watch time per viewer?</button>
                <button class="sample-q" data-q="Show the Top 5 SVOD shows based on watch time.">Show the Top 5 SVOD shows based on watch time.</button>
                <button class="sample-q" data-q="Show the Top 5 AVOD shows based on video views.">Show the Top 5 AVOD shows based on video views.</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">9. Category Performance</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="Show MAV performance by content category for the last month.">Show MAV performance by content category for the last month.</button>
                <button class="sample-q" data-q="Compare viewership across content categories (LIV, Sports, SAB, SET, Others).">Compare viewership across content categories (LIV, Sports, SAB, SET, Others).</button>
                <button class="sample-q" data-q="Which content category recorded the highest MAV last month?">Which content category recorded the highest MAV last month?</button>
                <button class="sample-q" data-q="How has category-wise MAV changed over time?">How has category-wise MAV changed over time?</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">10. Content Age Analysis</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="How many video views came from new content versus old content?">How many video views came from new content versus old content?</button>
                <button class="sample-q" data-q="Show video views for content released within the last 90 days.">Show video views for content released within the last 90 days.</button>
                <button class="sample-q" data-q="Show video views for content released within the last 45 days.">Show video views for content released within the last 45 days.</button>
                <button class="sample-q" data-q="Show video views for content released within the last 15 days.">Show video views for content released within the last 15 days.</button>
                <button class="sample-q" data-q="Compare views between new content and older content.">Compare views between new content and older content.</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">11. Trailer Performance</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="Which trailers generated the highest video views last month?">Which trailers generated the highest video views last month?</button>
                <button class="sample-q" data-q="Show the Top 5 trailers based on video views.">Show the Top 5 trailers based on video views.</button>
              </div>
            </div>

            <div class="sample-section">
              <div class="sample-section-title">12. Advanced Analytical Questions</div>
              <div class="sample-q-list">
                <button class="sample-q" data-q="Which shows have high MAU but relatively low watch time per viewer?">Which shows have high MAU but relatively low watch time per viewer?</button>
                <button class="sample-q" data-q="Which content categories generate high MAV but comparatively lower watch time?">Which content categories generate high MAV but comparatively lower watch time?</button>
                <button class="sample-q" data-q="Which month shows growth across MAU, MAV, video views, and watch time?">Which month shows growth across MAU, MAV, video views, and watch time?</button>
                <button class="sample-q" data-q="Which shows drive the highest engagement per viewer?">Which shows drive the highest engagement per viewer?</button>
                <button class="sample-q" data-q="Which segment (SVOD or AVOD) shows stronger watch time per viewer trends?">Which segment (SVOD or AVOD) shows stronger watch time per viewer trends?</button>
              </div>
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
        this.$suggestions = this.$('suggestions')
        this.$sampleToggle = this.$('sampleToggle')
        this.$samplePanel = this.$('samplePanel')
        this.$sampleClose = this.$('sampleClose')

        this.$send.addEventListener('click', () => this._send())
        this.$clear.addEventListener('click', () => {
          // remove only message bubbles, keep suggestion block
          Array.from(this.$chat.querySelectorAll('.msg')).forEach(el => el.remove())
          if (this.$suggestions) this.$suggestions.style.display = ''
        })
        this.$input.addEventListener('keydown', e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            this._send()
          }
        })

        this._wireSuggestionChips()
        this._wireSamplePanel()

        this._props = {
          welcomeText: "Hello, I'm PerciBOT! How can I assist you?",
          primaryColor: '#1f4fbf',
          primaryDark: '#163a8a',
          surfaceColor: '#ffffff',
          surfaceAlt: '#f6f8ff',
          textColor: '#0b1221',
        }
        this.summaryResponse = ''
        this._welcomeShown = false
      }

      connectedCallback () {
        if (!this._welcomeShown && this._props.welcomeText) {
          this._append('bot', this._props.welcomeText)
          this._welcomeShown = true
        }
      }

      onCustomWidgetAfterUpdate (changedProps = {}) {
        Object.assign(this._props, changedProps)
        this._applyTheme()

        if (changedProps.summaryPrompt !== undefined) {
          this._generateSummary(changedProps.summaryPrompt)
          return
        }

        if (!this._welcomeShown && this._props.welcomeText) {
          this._append('bot', this._props.welcomeText)
          this._welcomeShown = true
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

      _wireSuggestionChips () {
        const chips = this._shadowRoot.querySelectorAll('.suggest-chip')
        chips.forEach(btn => {
          btn.addEventListener('click', () => {
            const q = btn.getAttribute('data-q') || btn.textContent || ''
            if (!q) return
            this.$input.value = q
            this._send()
            if (this.$suggestions) this.$suggestions.style.display = 'none'
          })
        })
      }

      _wireSamplePanel () {
        if (this.$sampleToggle && this.$samplePanel) {
          this.$sampleToggle.addEventListener('click', () => {
            const isOpen = this.$samplePanel.style.display === 'block'
            this.$samplePanel.style.display = isOpen ? 'none' : 'block'
          })
        }
        if (this.$sampleClose && this.$samplePanel) {
          this.$sampleClose.addEventListener('click', () => {
            this.$samplePanel.style.display = 'none'
          })
        }
        const qs = this._shadowRoot.querySelectorAll('.sample-q')
        qs.forEach(btn => {
          btn.addEventListener('click', () => {
            const q = btn.getAttribute('data-q') || btn.textContent || ''
            if (!q) return
            this.$input.value = q
            this._send()
            if (this.$samplePanel) this.$samplePanel.style.display = 'none'
          })
        })
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
        if (this.$suggestions) this.$suggestions.style.display = 'none'
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
