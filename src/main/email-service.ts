import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private config: EmailConfig

  constructor() {
    this.config = {
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '2388188947@qq.com',
        pass: 'cqxoajrwuezpdigb'
      }
    }
  }

  // 初始化邮件服务
  async init(): Promise<boolean> {
    try {
      // 禁用代理
      this.transporter = nodemailer.createTransport({
        ...this.config,
        tls: {
          rejectUnauthorized: false
        },
        // 强制不使用代理
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      })
      
      // 验证连接
      await this.transporter.verify()
      console.log('邮件服务初始化成功')
      return true
    } catch (error) {
      console.error('邮件服务初始化失败:', error)
      return false
    }
  }

  // 发送邮件
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      const initialized = await this.init()
      if (!initialized) {
        throw new Error('邮件服务未初始化')
      }
    }

    try {
      const mailOptions = {
        from: `"语音日历" <${this.config.auth.user}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      }

      const info = await this.transporter!.sendMail(mailOptions)
      console.log('邮件发送成功:', info.messageId)
      return true
    } catch (error) {
      console.error('邮件发送失败:', error)
      throw error
    }
  }

  // 发送事件提醒邮件
  async sendEventReminder(
    to: string,
    eventTitle: string,
    eventTime: string,
    eventLocation?: string
  ): Promise<boolean> {
    const locationHtml = eventLocation
      ? `<p><strong>📍 地点：</strong>${eventLocation}</p>`
      : ''

    const html = `
      <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4a90e2, #357abd); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📅 事件提醒</h1>
        </div>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #e8e8e8;">
          <h2 style="color: #333; margin-top: 0;">${eventTitle}</h2>
          <p><strong>⏰ 时间：</strong>${eventTime}</p>
          ${locationHtml}
          <hr style="border: none; border-top: 1px solid #e8e8e8; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">此邮件由语音日历应用自动发送</p>
        </div>
      </div>
    `

    return this.sendEmail({
      to,
      subject: `📅 提醒：${eventTitle}`,
      html
    })
  }

  // 测试邮件发送
  async testEmail(to: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: '🎤 语音日历 - 测试邮件',
      html: `
        <div style="font-family: 'Microsoft YaHei', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4a90e2;">✅ 邮件配置成功！</h2>
          <p>您的语音日历邮件提醒功能已正常工作。</p>
          <p>后续日程提醒将通过此邮箱发送给您。</p>
        </div>
      `
    })
  }
}

export const emailService = new EmailService()
