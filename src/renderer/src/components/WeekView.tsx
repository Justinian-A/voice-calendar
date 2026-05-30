import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent, getCategoryColor, getCategoryName } from '../types/api'
import EventForm from './EventForm'
import './WeekView.css'

interface WeekViewProps {
  onEventClick?: (event: CalendarEvent) => void
}

export default function WeekView({ onEventClick }: WeekViewProps): JSX.Element {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')

  // 获取一周的日期范围
  const getWeekDates = useCallback(() => {
    const dates: Date[] = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [currentDate])

  // 获取一周的事件
  const fetchEvents = useCallback(async () => {
    const weekDates = getWeekDates()
    const startDate = `${weekDates[0].getFullYear()}-${String(weekDates[0].getMonth() + 1).padStart(2, '0')}-${String(weekDates[0].getDate()).padStart(2, '0')} 00:00:00`
    const endDate = `${weekDates[6].getFullYear()}-${String(weekDates[6].getMonth() + 1).padStart(2, '0')}-${String(weekDates[6].getDate()).padStart(2, '0')} 23:59:59`

    const result = await window.api.event.getByDateRange(startDate, endDate)
    if (result.success) {
      setEvents(result.data || [])
    }
  }, [getWeekDates])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // 切换周
  const changeWeek = (delta: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + delta * 7)
    setCurrentDate(newDate)
  }

  // 格式化日期为YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 获取指定日期的事件
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = formatDate(date)
    return events.filter(event => {
      const eventDate = event.start_time.split(' ')[0]
      return eventDate === dateStr
    })
  }

  // 处理日期点击
  const handleDateClick = (date: Date) => {
    setSelectedDate(formatDate(date))
    setEditingEvent(null)
    setShowEventForm(true)
  }

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

  const weekDates = getWeekDates()
  const today = new Date()
  const todayStr = formatDate(today)
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

  // 计算本周的日期范围显示
  const weekRange = `${weekDates[0].getMonth() + 1}月${weekDates[0].getDate()}日 - ${weekDates[6].getMonth() + 1}月${weekDates[6].getDate()}日`

  return (
    <div className="week-view">
      <div className="week-header">
        <button className="week-nav-btn" onClick={() => changeWeek(-1)}>&lt;</button>
        <h2>{currentDate.getFullYear()}年 {weekRange}</h2>
        <button className="week-nav-btn" onClick={() => changeWeek(1)}>&gt;</button>
        <button className="today-btn" onClick={() => setCurrentDate(new Date())}>今天</button>
      </div>

      <div className="week-grid">
        {/* 时间列 */}
        <div className="time-column">
          <div className="time-header"></div>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="time-slot">
              <span>{String(i).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* 日期列 */}
        {weekDates.map((date, index) => {
          const dateStr = formatDate(date)
          const isToday = dateStr === todayStr
          const dayEvents = getEventsForDate(date)

          return (
            <div key={index} className={`day-column ${isToday ? 'today' : ''}`}>
              <div className="day-header" onClick={() => handleDateClick(date)}>
                <span className="day-name">{weekDays[index]}</span>
                <span className={`day-number ${isToday ? 'today-number' : ''}`}>
                  {date.getDate()}
                </span>
              </div>

              <div className="day-content">
                {/* 全天事件 */}
                {dayEvents.filter(e => e.is_all_day).map(event => (
                  <div
                    key={event.id}
                    className="event-item all-day"
                    style={{ backgroundColor: getCategoryColor(event.category || 'other') }}
                    onClick={(e) => handleEventClick(event, e)}
                  >
                    <span className="event-title">{event.title}</span>
                  </div>
                ))}

                {/* 时间事件 */}
                {dayEvents.filter(e => !e.is_all_day).map(event => {
                  const startTime = new Date(event.start_time)
                  const endTime = event.end_time ? new Date(event.end_time) : new Date(startTime.getTime() + 3600000)
                  const startHour = startTime.getHours()
                  const startMinute = startTime.getMinutes()
                  const duration = (endTime.getTime() - startTime.getTime()) / 60000
                  const top = (startHour * 60 + startMinute) * (60 / 60)
                  const height = Math.max(duration * (60 / 60), 20)

                  return (
                    <div
                      key={event.id}
                      className="event-item"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: getCategoryColor(event.category || 'other')
                      }}
                      onClick={(e) => handleEventClick(event, e)}
                    >
                      <span className="event-time">
                        {String(startHour).padStart(2, '0')}:{String(startMinute).padStart(2, '0')}
                      </span>
                      <span className="event-title">{event.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {showEventForm && (
        <EventForm
          event={editingEvent}
          selectedDate={selectedDate || formatDate(today)}
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
