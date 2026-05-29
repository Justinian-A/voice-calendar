import { Notification } from 'electron'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  silent?: boolean
}

class NotificationService {
  // 发送系统通知
  async sendNotification(options: NotificationOptions): Promise<boolean> {
    try {
      // 检查系统是否支持通知
      if (!Notification.isSupported()) {
        console.warn('当前系统不支持通知')
        return false
      }

      const notification = new Notification({
        title: options.title,
        body: options.body,
        silent: options.silent || false
      })

      return new Promise((resolve) => {
        notification.on('show', () => {
          console.log('通知已显示')
          resolve(true)
        })

        notification.on('click', () => {
          console.log('通知被点击')
          // 可以在这里处理通知点击事件，比如打开主窗口
        })

        notification.on('close', () => {
          console.log('通知已关闭')
        })

        notification.show()
      })
    } catch (error) {
      console.error('发送通知失败:', error)
      return false
    }
  }

  // 发送事件提醒通知
  async sendEventReminder(
    eventTitle: string,
    eventTime: string,
    eventLocation?: string
  ): Promise<boolean> {
    let body = `时间：${eventTime}`
    if (eventLocation) {
      body += `\n地点：${eventLocation}`
    }

    return this.sendNotification({
      title: `📅 ${eventTitle}`,
      body
    })
  }

  // 测试通知
  async testNotification(): Promise<boolean> {
    return this.sendNotification({
      title: '🎤 语音日历',
      body: '通知功能测试成功！'
    })
  }
}

export const notificationService = new NotificationService()
