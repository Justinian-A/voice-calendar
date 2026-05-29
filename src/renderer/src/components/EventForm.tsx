import { useState, useEffect } from 'react'
import { CalendarEvent } from '../types/api'
import './EventForm.css'

interface EventFormProps {
  event?: CalendarEvent | null
  selectedDate: string
  onSave: () => void
  onCancel: () => void
}

export default function EventForm({ event, selectedDate, onSave, onCancel }: EventFormProps): JSX.Element {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(selectedDate)
  const [startTime, setStartTime] = useState('09:00')
  const [endDate, setEndDate] = useState(selectedDate)
  const [endTime, setEndTime] = useState('10:00')
  const [location, setLocation] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState(15)
  const [isAllDay, setIsAllDay] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (event) {
      setTitle(event.title)
      setDescription(event.description || '')
      setLocation(event.location || '')
      setReminderMinutes(event.reminder_minutes || 15)
      setIsAllDay(event.is_all_day || false)

      const start = new Date(event.start_time)
      setStartDate(
        `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
      )
      setStartTime(
        `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
      )

      if (event.end_time) {
        const end = new Date(event.end_time)
        setEndDate(
          `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
        )
        setEndTime(
          `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
        )
      }
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('请输入事件标题')
      return
    }

    setLoading(true)

    const eventData: CalendarEvent = {
      title: title.trim(),
      description: description.trim() || undefined,
      start_time: isAllDay ? `${startDate} 00:00:00` : `${startDate} ${startTime}:00`,
      end_time: isAllDay ? `${endDate} 23:59:59` : `${endDate} ${endTime}:00`,
      location: location.trim() || undefined,
      reminder_minutes: reminderMinutes,
      is_all_day: isAllDay
    }

    try {
      if (event?.id) {
        await window.api.event.update(event.id, eventData)
      } else {
        await window.api.event.create(eventData)
      }
      onSave()
    } catch (error) {
      console.error('保存事件失败:', error)
      alert('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const reminderOptions = [
    { value: 0, label: '准时' },
    { value: 5, label: '提前5分钟' },
    { value: 15, label: '提前15分钟' },
    { value: 30, label: '提前30分钟' },
    { value: 60, label: '提前1小时' },
    { value: 1440, label: '提前1天' }
  ]

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? '编辑事件' : '添加事件'}</h2>
          <button className="close-btn" onClick={onCancel}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">事件标题 *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入事件标题"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">描述</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入事件描述（可选）"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
              />
              <span>全天事件</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">开始日期</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            {!isAllDay && (
              <div className="form-group">
                <label htmlFor="startTime">开始时间</label>
                <input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endDate">结束日期</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {!isAllDay && (
              <div className="form-group">
                <label htmlFor="endTime">结束时间</label>
                <input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="location">地点</label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="输入地点（可选）"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reminder">提醒</label>
            <select
              id="reminder"
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
            >
              {reminderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              取消
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
