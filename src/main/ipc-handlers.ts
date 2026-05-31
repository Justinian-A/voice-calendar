import { ipcMain, dialog, app } from 'electron'
import { database, CalendarEvent } from './database'
import { baiduSpeech } from './baidu-speech'
import { emailService } from './email-service'
import { notificationService } from './notification-service'
import { reminderScheduler } from './reminder-scheduler'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

export function registerIpcHandlers(): void {
  // 事件相关IPC处理

  // 创建事件
  ipcMain.handle('event:create', async (_, event: CalendarEvent) => {
    try {
      return { success: true, data: database.createEvent(event) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取所有事件
  ipcMain.handle('event:getAll', async () => {
    try {
      return { success: true, data: database.getAllEvents() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 根据ID获取事件
  ipcMain.handle('event:getById', async (_, id: number) => {
    try {
      const event = database.getEventById(id)
      if (event) {
        return { success: true, data: event }
      }
      return { success: false, error: '事件不存在' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取指定日期的事件
  ipcMain.handle('event:getByDate', async (_, date: string) => {
    try {
      return { success: true, data: database.getEventsByDate(date) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 获取日期范围内的事件
  ipcMain.handle('event:getByDateRange', async (_, startDate: string, endDate: string) => {
    try {
      return { success: true, data: database.getEventsByDateRange(startDate, endDate) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 更新事件
  ipcMain.handle('event:update', async (_, id: number, event: Partial<CalendarEvent>) => {
    try {
      const updated = database.updateEvent(id, event)
      if (updated) {
        return { success: true, data: updated }
      }
      return { success: false, error: '事件不存在' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 删除事件
  ipcMain.handle('event:delete', async (_, id: number) => {
    try {
      const deleted = database.deleteEvent(id)
      if (deleted) {
        return { success: true }
      }
      return { success: false, error: '事件不存在' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 搜索事件
  ipcMain.handle('event:search', async (_, keyword: string) => {
    try {
      return { success: true, data: database.searchEvents(keyword) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 语音识别相关IPC处理

  // 语音识别
  ipcMain.handle('speech:recognize', async (_, audioBase64: string) => {
    try {
      const result = await baiduSpeech.recognizeSpeech(audioBase64, 'pcm', 16000)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 语音识别（带长度）
  ipcMain.handle('speech:recognizeWithLength', async (_, audioBase64: string, length: number) => {
    try {
      const result = await baiduSpeech.recognizeSpeech(audioBase64, 'pcm', 16000, length)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 设置相关IPC处理

  // 获取提醒设置
  ipcMain.handle('settings:getReminder', async () => {
    try {
      return { success: true, data: reminderScheduler.getSettings() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 更新提醒设置
  ipcMain.handle('settings:updateReminder', async (_, settings: any) => {
    try {
      reminderScheduler.updateSettings(settings)
      return { success: true, data: reminderScheduler.getSettings() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 测试邮件
  ipcMain.handle('settings:testEmail', async (_, emailAddress: string) => {
    try {
      await emailService.testEmail(emailAddress)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 测试通知
  ipcMain.handle('settings:testNotification', async () => {
    try {
      await notificationService.testNotification()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 数据导出相关IPC处理

  // 导出为JSON
  ipcMain.handle('data:exportJSON', async () => {
    try {
      const events = database.getAllEvents()
      const data = JSON.stringify(events, null, 2)
      
      const { filePath } = await dialog.showSaveDialog({
        title: '导出JSON',
        defaultPath: join(app.getPath('desktop'), `voice-calendar-events-${new Date().toISOString().split('T')[0]}.json`),
        filters: [{ name: 'JSON文件', extensions: ['json'] }]
      })

      if (filePath) {
        writeFileSync(filePath, data, 'utf-8')
        return { success: true, filePath }
      }
      return { success: false, error: '用户取消' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 导出为CSV
  ipcMain.handle('data:exportCSV', async () => {
    try {
      const events = database.getAllEvents()
      const headers = ['ID', '标题', '描述', '开始时间', '结束时间', '地点', '分类', '全天事件']
      const rows = events.map(e => [
        e.id,
        `"${(e.title || '').replace(/"/g, '""')}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        e.start_time,
        e.end_time || '',
        `"${(e.location || '').replace(/"/g, '""')}"`,
        e.category || 'other',
        e.is_all_day ? '是' : '否'
      ])
      
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      
      const { filePath } = await dialog.showSaveDialog({
        title: '导出CSV',
        defaultPath: join(app.getPath('desktop'), `voice-calendar-events-${new Date().toISOString().split('T')[0]}.csv`),
        filters: [{ name: 'CSV文件', extensions: ['csv'] }]
      })

      if (filePath) {
        writeFileSync(filePath, '\ufeff' + csv, 'utf-8') // 添加BOM支持中文
        return { success: true, filePath }
      }
      return { success: false, error: '用户取消' }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 从JSON导入
  ipcMain.handle('data:importJSON', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: '导入JSON',
        filters: [{ name: 'JSON文件', extensions: ['json'] }],
        properties: ['openFile']
      })

      if (filePaths.length === 0) {
        return { success: false, error: '用户取消' }
      }

      const data = readFileSync(filePaths[0], 'utf-8')
      const events = JSON.parse(data) as CalendarEvent[]
      
      let imported = 0
      for (const event of events) {
        if (event.title && event.start_time) {
          database.createEvent(event)
          imported++
        }
      }

      return { success: true, count: imported }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 从CSV导入
  ipcMain.handle('data:importCSV', async () => {
    try {
      const { filePaths } = await dialog.showOpenDialog({
        title: '导入CSV',
        filters: [{ name: 'CSV文件', extensions: ['csv'] }],
        properties: ['openFile']
      })

      if (filePaths.length === 0) {
        return { success: false, error: '用户取消' }
      }

      const data = readFileSync(filePaths[0], 'utf-8')
      const lines = data.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        return { success: false, error: 'CSV文件格式错误' }
      }

      let imported = 0
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',')
        if (cols.length >= 4) {
          const event: CalendarEvent = {
            title: cols[1].replace(/^"|"$/g, '').replace(/""/g, '"'),
            description: cols[2].replace(/^"|"$/g, '').replace(/""/g, '"'),
            start_time: cols[3],
            end_time: cols[4] || undefined,
            location: cols[5]?.replace(/^"|"$/g, '').replace(/""/g, '"') || undefined,
            category: cols[6] || 'other',
            is_all_day: cols[7]?.trim() === '是'
          }
          database.createEvent(event)
          imported++
        }
      }

      return { success: true, count: imported }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
