export interface ParsedCommand {
  action: 'add' | 'delete' | 'view' | 'search' | 'unknown'
  title?: string
  date?: string
  time?: string
  location?: string
  description?: string
  rawText: string
}

// 日期关键词映射
const DATE_KEYWORDS: Record<string, () => string> = {
  '今天': () => {
    const today = new Date()
    return formatDate(today)
  },
  '明天': () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatDate(tomorrow)
  },
  '后天': () => {
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    return formatDate(dayAfter)
  },
  '大后天': () => {
    const day = new Date()
    day.setDate(day.getDate() + 3)
    return formatDate(day)
  },
  '昨天': () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return formatDate(yesterday)
  }
}

// 星期关键词映射
const WEEKDAY_MAP: Record<string, number> = {
  '周一': 1, '星期一': 1,
  '周二': 2, '星期二': 2,
  '周三': 3, '星期三': 3,
  '周四': 4, '星期四': 4,
  '周五': 5, '星期五': 5,
  '周六': 6, '星期六': 6,
  '周日': 0, '星期日': 0, '周天': 0
}

// 格式化日期为YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 解析日期
function parseDate(text: string): string | undefined {
  // 检查关键词
  for (const [keyword, getDate] of Object.entries(DATE_KEYWORDS)) {
    if (text.includes(keyword)) {
      return getDate()
    }
  }

  // 检查星期
  for (const [keyword, dayNum] of Object.entries(WEEKDAY_MAP)) {
    if (text.includes(keyword)) {
      const today = new Date()
      const currentDay = today.getDay()
      let diff = dayNum - currentDay
      if (diff <= 0) diff += 7
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + diff)
      return formatDate(targetDate)
    }
  }

  // 检查日期格式（X月X日）
  const dateMatch = text.match(/(\d{1,2})月(\d{1,2})[日号]/)
  if (dateMatch) {
    const year = new Date().getFullYear()
    const month = parseInt(dateMatch[1])
    const day = parseInt(dateMatch[2])
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return undefined
}

// 解析时间
function parseTime(text: string): string | undefined {
  // 匹配时间格式（如：下午3点、15:30、上午10点半）
  const timePatterns = [
    /([上下]午)?(\d{1,2})[点时](\d{1,2})?[分]?/,
    /(\d{1,2}):(\d{2})/,
    /(\d{1,2})点半/
  ]

  for (const pattern of timePatterns) {
    const match = text.match(pattern)
    if (match) {
      let hour = parseInt(match[2] || match[1])
      let minute = match[3] ? parseInt(match[3]) : 0

      // 处理上午/下午
      if (match[1] === '下午' && hour < 12) {
        hour += 12
      } else if (match[1] === '上午' && hour === 12) {
        hour = 0
      }

      // 处理"点半"
      if (text.includes('点半')) {
        minute = 30
      }

      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }
  }

  return undefined
}

// 提取事件标题
function extractTitle(text: string, action: string): string {
  // 移除动作关键词
  let title = text
  const actionKeywords = ['添加', '新建', '创建', '增加', '删除', '移除', '取消', '查看', '查询', '看看', '显示']
  for (const keyword of actionKeywords) {
    title = title.replace(keyword, '')
  }

  // 移除日期和时间相关词汇
  const removeWords = ['今天', '明天', '后天', '大后天', '昨天', '上午', '下午', '晚上', '早上']
  for (const word of removeWords) {
    title = title.replace(word, '')
  }

  // 移除时间
  title = title.replace(/\d{1,2}[点时:]\d{0,2}[分]?/g, '')
  title = title.replace(/点半/g, '')

  // 移除日期
  title = title.replace(/\d{1,2}月\d{1,2}[日号]/g, '')
  title = title.replace(/[周星][一二三四五六日天]/g, '')

  // 清理多余空格和标点
  title = title.replace(/[，。！？,\.!\?]/g, '').trim()
  title = title.replace(/\s+/g, ' ')

  // 如果标题为空，使用默认值
  if (!title) {
    if (action === 'add') {
      title = '新事件'
    }
  }

  return title
}

// 解析语音指令
export function parseVoiceCommand(text: string): ParsedCommand {
  const result: ParsedCommand = {
    action: 'unknown',
    rawText: text
  }

  // 识别动作
  if (/添加|新建|创建|增加|安排|约/.test(text)) {
    result.action = 'add'
  } else if (/删除|移除|取消|去掉/.test(text)) {
    result.action = 'delete'
  } else if (/查看|查询|看看|显示|有什么|日程|安排/.test(text)) {
    result.action = 'view'
  } else if (/搜索|找|查找/.test(text)) {
    result.action = 'search'
  }

  // 解析日期
  result.date = parseDate(text)

  // 解析时间
  result.time = parseTime(text)

  // 提取标题
  result.title = extractTitle(text, result.action)

  // 提取地点
  const locationMatch = text.match(/在(.+?)(?:有|开|举行|进行|$)/)
  if (locationMatch) {
    result.location = locationMatch[1].trim()
  }

  return result
}

// 生成确认消息
export function generateConfirmMessage(command: ParsedCommand): string {
  switch (command.action) {
    case 'add':
      let msg = `✅ 已添加事件：${command.title}`
      if (command.date) msg += `，日期：${command.date}`
      if (command.time) msg += `，时间：${command.time}`
      if (command.location) msg += `，地点：${command.location}`
      return msg

    case 'delete':
      return `🗑️ 已删除匹配"${command.title || command.date}"的事件`

    case 'view':
      if (command.date) {
        return `📅 正在查看 ${command.date} 的日程`
      }
      return '📅 正在查看今天的日程'

    case 'search':
      return `🔍 正在搜索：${command.title}`

    default:
      return '❓ 未能识别您的指令，请重试'
  }
}
