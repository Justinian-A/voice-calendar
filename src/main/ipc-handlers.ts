import { ipcMain } from 'electron'
import { database, CalendarEvent } from './database'
import { baiduSpeech } from './baidu-speech'
import { emailService } from './email-service'
import { notificationService } from './notification-service'
import { reminderScheduler } from './reminder-scheduler'

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
      const result = await baiduSpeech.recognizeSpeech(audioBase64, 'wav', 16000)
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
}
