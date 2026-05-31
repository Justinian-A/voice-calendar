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
          setConfirmMessage('❓ 未能识别您的指令，请重试。\n\n💡 提示：请在句子中加入关键词，如"添加"、"删除"、"查看"等。')
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

      {/* 使用提示卡片 */}
      <div className="usage-tips-card">
        <div className="tips-header">
          <span className="tips-icon">💡</span>
          <h3>使用提示</h3>
        </div>
        <div className="tips-content">
          <p className="tip-main">
            请在语音中加入<strong>动作关键词</strong>，系统才能准确识别您的意图：
          </p>
          <div className="keywords-grid">
            <div className="keyword-item add">
              <span className="keyword">添加</span>
              <span className="keyword-example">"添加明天下午三点开会"</span>
            </div>
            <div className="keyword-item delete">
              <span className="keyword">删除</span>
              <span className="keyword-example">"删除明天的会议"</span>
            </div>
            <div className="keyword-item view">
              <span className="keyword">查看</span>
              <span className="keyword-example">"查看今天的日程"</span>
            </div>
            <div className="keyword-item search">
              <span className="keyword">搜索</span>
              <span className="keyword-example">"搜索会议"</span>
            </div>
          </div>
          <p className="tip-note">
            💡 智能提示：如果您说的内容包含时间（如"明天上午十点"），系统会自动识别为添加事件。
          </p>
        </div>
      </div>
    </div>
  )
}
