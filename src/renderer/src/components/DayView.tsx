import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent, getCategoryColor, getCategoryName } from '../types/api'
import EventForm from './EventForm'
import './DayView.css'

interface DayViewProps {
  onEventClick?: (event: CalendarEvent) => void
}

export default function DayView({ onEventClick }: DayViewProps): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)

  // 格式化日期为YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 获取当天事件
  const fetchEvents = useCallback(async () => {
    const dateStr = formatDate(currentDate)
    const result = await window.api.event.getByDate(dateStr)
    if (result.success) {
      setEvents(result.data || [])
    }
  }, [currentDate])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // 切换日期
  const changeDay = (delta: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + delta)
    setCurrentDate(newDate)
  }

  // 处理时间槽点击
  const handleTimeSlotClick = (hour: number) => {
    const dateStr = formatDate(currentDate)
    const timeStr = `${String(hour).padStart(2, '0')}:00`
    setSelectedTime(`${dateStr} ${timeStr}`)
    setEditingEvent(null)
    setShowEventForm(true)
  }

  const [selectedTime, setSelectedTime] = useState<string>('')

  // 处理事件点击
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onEventClick) {
      onEventClick(event)
    } else {
      setEditingEvent(event)
      setShowEventForm(true)
    }
  }

  // 处理表单保存
  const handleFormSave = () => {
    setShowEventForm(false)
    setEditingEvent(null)
    fetchEvents()
  }

  const today = new Date()
  const isToday = formatDate(currentDate) === formatDate(today)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[currentDate.getDay()]

  // 分离全天事件和时间事件
  const allDayEvents = events.filter(e => e.is_all_day)
  const timeEvents = events.filter(e => !e.is_all_day)

  return (
    <div className="day-view">
      <div className="day-header">
        <button className="day-nav-btn" onClick={() => changeDay(-1)}>&lt;</button>
        <div className="day-title">
          <h2>{currentDate.getFullYear()}年{currentDate.getMonth() + 1}月{currentDate.getDate()}日</h2>
          <span className="week-day">{weekDay}</span>
          {isToday && <span className="today-badge">今天</span>}
        </div>
        <button className="day-nav-btn" onClick={() => changeDay(1)}>&gt;</button>
        <button className="today-btn" onClick={() => setCurrentDate(new Date())}>今天</button>
      </div>

      <div className="day-content">
        {/* 全天事件区域 */}
        {allDayEvents.length > 0 && (
          <div className="all-day-section">
            <div className="all-day-label">全天</div>
            <div className="all-day-events">
              {allDayEvents.map(event => (
                <div
                  key={event.id}
                  className="event-item all-day"
                  style={{ backgroundColor: getCategoryColor(event.category || 'other') }}
                  onClick={(e) => handleEventClick(event, e)}
                >
                  <span className="event-category">{getCategoryName(event.category || 'other')}</span>
                  <span className="event-title">{event.title}</span>
                  {event.location && <span className="event-location">📍 {event.location}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 时间轴 */}
        <div className="timeline">
          {Array.from({ length: 24 }, (_, hour) => {
            const hourEvents = timeEvents.filter(e => {
              const eventHour = new Date(e.start_time).getHours()
              return eventHour === hour
            })

            return (
              <div key={hour} className="time-slot" onClick={() => handleTimeSlotClick(hour)}>
                <div className="time-label">{String(hour).padStart(2, '0')}:00</div>
                <div className="time-content">
                  {hourEvents.map(event => {
                    const startTime = new Date(event.start_time)
                    const endTime = event.end_time ? new Date(event.end_time) : new Date(startTime.getTime() + 3600000)
                    const duration = (endTime.getTime() - startTime.getTime()) / 60000
                    const height = Math.max(duration, 30)

                    return (
                      <div
                        key={event.id}
                        className="event-item"
                        style={{
                          height: `${height}px`,
                          backgroundColor: getCategoryColor(event.category || 'other')
                        }}
                        onClick={(e) => handleEventClick(event, e)}
                      >
                        <div className="event-time">
                          {String(startTime.getHours()).padStart(2, '0')}:{String(startTime.getMinutes()).padStart(2, '0')}
                          {' - '}
                          {String(endTime.getHours()).padStart(2, '0')}:{String(endTime.getMinutes()).padStart(2, '0')}
                        </div>
                        <div className="event-title">{event.title}</div>
                        <div className="event-meta">
                          <span className="event-category">{getCategoryName(event.category || 'other')}</span>
                          {event.location && <span className="event-location">📍 {event.location}</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          selectedDate={selectedTime || formatDate(currentDate)}
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
