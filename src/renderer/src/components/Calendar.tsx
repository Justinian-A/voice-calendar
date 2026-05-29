import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent } from '../types/api'
import EventForm from './EventForm'
import './Calendar.css'

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

export default function Calendar(): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  // 获取当月事件
  const fetchEvents = useCallback(async () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01 00:00:00`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay} 23:59:59`

    const result = await window.api.event.getByDateRange(startDate, endDate)
    if (result.success) {
      setEvents(result.data || [])
    }
  }, [currentDate])

  // 生成日历天数
  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()
    const today = new Date()

    const days: CalendarDay[] = []

    // 上个月的日期
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: []
      })
    }

    // 本月的日期
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i)
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        events: []
      })
    }

    // 下个月的日期（补满6行）
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: []
      })
    }

    setCalendarDays(days)
  }, [currentDate])

  // 获取事件
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // 将事件分配到对应的日期
  useEffect(() => {
    setCalendarDays((prev) =>
      prev.map((day) => ({
        ...day,
        events: events.filter((event) => {
          const eventDate = new Date(event.start_time)
          return (
            eventDate.getDate() === day.date.getDate() &&
            eventDate.getMonth() === day.date.getMonth() &&
            eventDate.getFullYear() === day.date.getFullYear()
          )
        })
      }))
    )
  }, [events])

  // 切换月份
  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1))
  }

  // 格式化日期为YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 处理日期点击
  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date)
  }

  // 处理添加事件
  const handleAddEvent = () => {
    setEditingEvent(null)
    setShowEventForm(true)
  }

  // 处理编辑事件
  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }

  // 处理删除事件
  const handleDeleteEvent = async (id: number) => {
    if (window.confirm('确定要删除这个事件吗？')) {
      const result = await window.api.event.delete(id)
      if (result.success) {
        fetchEvents()
      }
    }
  }

  // 处理表单保存
  const handleFormSave = () => {
    setShowEventForm(false)
    setEditingEvent(null)
    fetchEvents()
  }

  // 获取选中日期的事件
  const selectedDateEvents = selectedDate
    ? events.filter((event) => {
        const eventDate = new Date(event.start_time)
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        )
      })
    : []

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="calendar-container">
      <div className="calendar-main">
        {/* 日历头部 */}
        <div className="calendar-header">
          <button className="month-btn" onClick={() => changeMonth(-1)}>
            &lt;
          </button>
          <h2>
            {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
          </h2>
          <button className="month-btn" onClick={() => changeMonth(1)}>
            &gt;
          </button>
          <button className="today-btn" onClick={() => setCurrentDate(new Date())}>
            今天
          </button>
        </div>

        {/* 星期头部 */}
        <div className="calendar-weekdays">
          {weekDays.map((day) => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="calendar-grid">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
                day.isToday ? 'today' : ''
              } ${selectedDate?.getTime() === day.date.getTime() ? 'selected' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <span className="day-number">{day.date.getDate()}</span>
              {day.events.length > 0 && (
                <div className="event-dots">
                  {day.events.slice(0, 3).map((event, i) => (
                    <span key={i} className="event-dot" title={event.title} />
                  ))}
                  {day.events.length > 3 && <span className="more-events">+{day.events.length - 3}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 事件详情面板 */}
      <div className="calendar-sidebar">
        <div className="sidebar-header">
          <h3>
            {selectedDate
              ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 事件`
              : '选择日期查看事件'}
          </h3>
          <button className="add-btn" onClick={handleAddEvent}>
            + 添加事件
          </button>
        </div>

        <div className="event-list">
          {selectedDateEvents.length === 0 ? (
            <p className="no-events">暂无事件</p>
          ) : (
            selectedDateEvents.map((event) => (
              <div key={event.id} className="event-card">
                <div className="event-time">
                  {event.is_all_day
                    ? '全天'
                    : new Date(event.start_time).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                </div>
                <div className="event-info">
                  <h4>{event.title}</h4>
                  {event.location && <p className="event-location">📍 {event.location}</p>}
                  {event.description && <p className="event-desc">{event.description}</p>}
                </div>
                <div className="event-actions">
                  <button className="edit-btn" onClick={() => handleEditEvent(event)}>
                    ✏️
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteEvent(event.id!)}>
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 事件表单弹窗 */}
      {showEventForm && (
        <EventForm
          event={editingEvent}
          selectedDate={selectedDate ? formatDate(selectedDate) : formatDate(new Date())}
          onSave={handleFormSave}
          onCancel={() => {
            setShowEventForm(false)
            setEditingEvent(null)
          }}
        />
      )}
    </div>
  )
}
