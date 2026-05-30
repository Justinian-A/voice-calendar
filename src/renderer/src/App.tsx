import { useState, useCallback } from 'react'
import Calendar from './components/Calendar'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import VoicePage from './components/VoicePage'
import SettingsPage from './components/SettingsPage'
import './styles/app.css'

type CalendarView = 'month' | 'week' | 'day'
type AppTab = 'calendar' | 'voice' | 'settings'

function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('voice')
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
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
        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <div className="calendar-view-tabs">
              <button
                className={calendarView === 'month' ? 'active' : ''}
                onClick={() => setCalendarView('month')}
              >
                月
              </button>
              <button
                className={calendarView === 'week' ? 'active' : ''}
                onClick={() => setCalendarView('week')}
              >
                周
              </button>
              <button
                className={calendarView === 'day' ? 'active' : ''}
                onClick={() => setCalendarView('day')}
              >
                日
              </button>
            </div>
            {calendarView === 'month' && <Calendar key={calendarKey} />}
            {calendarView === 'week' && <WeekView key={calendarKey} />}
            {calendarView === 'day' && <DayView key={calendarKey} />}
          </div>
        )}
        {activeTab === 'voice' && <VoicePage onEventCreated={handleEventCreated} />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}

export default App
