import { useState, useCallback } from 'react'
import VoiceInput from './VoiceInput'
import { parseVoiceCommand, generateConfirmMessage, ParsedCommand } from '../utils/voiceCommand'
import { CalendarEvent } from '../types/api'
import './VoicePage.css'

interface VoicePageProps {
  onEventCreated?: () => void
}

export default function VoicePage({ onEventCreated }: VoicePageProps): JSX.Element {
  const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // 处理语音识别结果
  const handleVoiceResult = useCallback(async (text: string) => {
    setError('')
    setIsProcessing(true)

    try {
      // 解析语音指令
      const command = parseVoiceCommand(text)
      setLastCommand(command)

      // 执行指令
      switch (command.action) {
        case 'add':
          await handleAddEvent(command)
          break
        case 'delete':
          await handleDeleteEvent(command)
          break
        case 'view':
          await handleViewEvents(command)
          break
        case 'search':
          await handleSearchEvents(command)
          break
        default:
          setConfirmMessage('❓ 未能识别您的指令，请重试。可以说"添加明天下午三点开会"')
      }
    } catch (err) {
      setError('处理失败，请重试')
      console.error('语音指令处理失败:', err)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // 添加事件
  const handleAddEvent = async (command: ParsedCommand) => {
    if (!command.title) {
      setError('请说明要添加的事件内容')
      return
    }

    const now = new Date()
    const eventDate = command.date || new Date().toISOString().split('T')[0]
    const eventTime = command.time || '09:00'

    const eventData: CalendarEvent = {
      title: command.title,
      start_time: `${eventDate} ${eventTime}:00`,
      location: command.location,
      description: command.description,
      reminder_minutes: 15,
      is_all_day: !command.time
    }

    const result = await window.api.event.create(eventData)
    if (result.success) {
      setConfirmMessage(generateConfirmMessage(command))
      onEventCreated?.()
    } else {
      setError(`添加失败：${result.error}`)
    }
  }

  // 删除事件
  const handleDeleteEvent = async (command: ParsedCommand) => {
    // 先搜索匹配的事件
    let events: CalendarEvent[] = []

    if (command.date) {
      const result = await window.api.event.getByDate(command.date)
      if (result.success && result.data) {
        events = result.data
      }
    } else if (command.title) {
      const result = await window.api.event.search(command.title)
      if (result.success && result.data) {
        events = result.data
      }
    }

    if (events.length === 0) {
      setError('未找到匹配的事件')
      return
    }

    // 删除找到的事件
    for (const event of events) {
      if (event.id) {
        await window.api.event.delete(event.id)
      }
    }

    setConfirmMessage(generateConfirmMessage(command))
    onEventCreated?.()
  }

  // 查看事件
  const handleViewEvents = async (command: ParsedCommand) => {
    const date = command.date || new Date().toISOString().split('T')[0]
    const result = await window.api.event.getByDate(date)

    if (result.success && result.data) {
      if (result.data.length === 0) {
        setConfirmMessage(`📅 ${date} 没有安排事件`)
      } else {
        const eventList = result.data.map((e) => `• ${e.title}`).join('\n')
        setConfirmMessage(`📅 ${date} 的日程：\n${eventList}`)
      }
    } else {
      setError('获取日程失败')
    }
  }

  // 搜索事件
  const handleSearchEvents = async (command: ParsedCommand) => {
    if (!command.title) {
      setError('请说明要搜索的内容')
      return
    }

    const result = await window.api.event.search(command.title)
    if (result.success && result.data) {
      if (result.data.length === 0) {
        setConfirmMessage(`🔍 未找到与"${command.title}"相关的事件`)
      } else {
        const eventList = result.data.map((e) => `• ${e.title} (${e.start_time})`).join('\n')
        setConfirmMessage(`🔍 搜索结果：\n${eventList}`)
      }
    } else {
      setError('搜索失败')
    }
  }

  // 处理错误
  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg)
    setConfirmMessage('')
  }, [])

  return (
    <div className="voice-page">
      <div className="voice-page-header">
        <h2>🎙️ 语音助手</h2>
        <p>说出你想做的事情，我来帮你安排</p>
      </div>

      <VoiceInput onResult={handleVoiceResult} onError={handleError} />

      {isProcessing && (
        <div className="processing-message">
          <span className="spinner"></span>
          <span>处理中...</span>
        </div>
      )}

      {confirmMessage && (
        <div className="confirm-message">
          <pre>{confirmMessage}</pre>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      <div className="voice-examples">
        <h3>💡 语音指令示例</h3>
        <div className="examples-grid">
          <div className="example-card">
            <h4>📅 添加事件</h4>
            <ul>
              <li>"添加明天下午三点开会"</li>
              <li>"创建下周一上午10点面试"</li>
              <li>"安排后天晚上聚餐"</li>
            </ul>
          </div>
          <div className="example-card">
            <h4>🗑️ 删除事件</h4>
            <ul>
              <li>"删除明天的会议"</li>
              <li>"取消下周一的面试"</li>
            </ul>
          </div>
          <div className="example-card">
            <h4>📋 查看日程</h4>
            <ul>
              <li>"查看今天的日程"</li>
              <li>"明天有什么安排"</li>
              <li>"看看下周一的安排"</li>
            </ul>
          </div>
          <div className="example-card">
            <h4>🔍 搜索事件</h4>
            <ul>
              <li>"搜索会议"</li>
              <li>"查找面试"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
