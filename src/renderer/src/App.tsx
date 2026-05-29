import { useState, useCallback } from 'react'
import Calendar from './components/Calendar'
import VoicePage from './components/VoicePage'
import SettingsPage from './components/SettingsPage'
import './styles/app.css'

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'calendar' | 'voice' | 'settings'>('voice')
  const [calendarKey, setCalendarKey] = useState(0)

  // 当语音创建事件后，刷新日历
  const handleEventCreated = useCallback(() => {
    setCalendarKey((prev) => prev + 1)
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎤 语音日历</h1>
        <nav className="nav-tabs">
          <button
            className={activeTab === 'calendar' ? 'active' : ''}
            onClick={() => setActiveTab('calendar')}
          >
            📅 日历
          </button>
          <button
            className={activeTab === 'voice' ? 'active' : ''}
            onClick={() => setActiveTab('voice')}
          >
            🎙️ 语音
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ 设置
          </button>
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'calendar' && <Calendar key={calendarKey} />}
        {activeTab === 'voice' && <VoicePage onEventCreated={handleEventCreated} />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

export default App
