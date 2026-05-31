import { database, CalendarEvent } from './database'
import { notificationService } from './notification-service'

interface ReminderSettings {
  enableNotification: boolean
}

class ReminderScheduler {
  private checkInterval: NodeJS.Timeout | null = null
  private remindedEvents: Set<number> = new Set()
  private settings: ReminderSettings = {
    enableNotification: true
  }

  // 初始化调度器
  init(): void {
    // 每分钟检查一次是否有需要提醒的事件
    this.checkInterval = setInterval(() => {
      this.checkReminders()
    }, 60000) // 60秒

    // 启动时立即检查一次
    this.checkReminders()
    console.log('提醒调度器已启动')
  }

  // 更新设置
  updateSettings(settings: Partial<ReminderSettings>): void {
    this.settings = { ...this.settings, ...settings }
    console.log('提醒设置已更新:', this.settings)
  }

  // 获取设置
  getSettings(): ReminderSettings {
    return { ...this.settings }
  }

  // 检查需要提醒的事件
  private async checkReminders(): Promise<void> {
    try {
      const now = new Date()
      const events = database.getAllEvents()

      for (const event of events) {
        // 跳过已提醒的事件
        if (this.remindedEvents.has(event.id!)) {
          continue
        }

        const eventTime = new Date(event.start_time)
        const reminderMinutes = event.reminder_minutes || 15
        const reminderTime = new Date(eventTime.getTime() - reminderMinutes * 60000)

        // 检查是否到了提醒时间
        if (now >= reminderTime && now < eventTime) {
          await this.sendReminder(event)
          this.remindedEvents.add(event.id!)
        }

        // 如果事件已过期，从已提醒列表中移除
        if (now > eventTime) {
          this.remindedEvents.delete(event.id!)
        }
      }
    } catch (error) {
      console.error('检查提醒失败:', error)
    }
  }

  // 发送提醒
  private async sendReminder(event: CalendarEvent): Promise<void> {
    const eventTime = new Date(event.start_time)
    const timeStr = eventTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })

    console.log(`发送提醒：${event.title} - ${timeStr}`)

    // 发送系统通知
    if (this.settings.enableNotification) {
      await notificationService.sendEventReminder(
        event.title,
        timeStr,
        event.location
      )
    }
  }

  // 手动触发提醒检查
  async triggerCheck(): Promise<void> {
    await this.checkReminders()
  }

  // 停止调度器
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    console.log('提醒调度器已停止')
  }
}

export const reminderScheduler = new ReminderScheduler()
