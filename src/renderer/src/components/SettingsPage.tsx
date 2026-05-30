import { useState, useEffect } from 'react'
import { ReminderSettings } from '../types/api'
import './SettingsPage.css'

export default function SettingsPage(): JSX.Element {
  const [settings, setSettings] = useState<ReminderSettings>({
    enableNotification: true,
    enableEmail: false,
    emailAddress: ''
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 加载设置
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const result = await window.api.settings.getReminder()
    if (result.success && result.data) {
      setSettings(result.data)
    }
  }

  // 保存设置
  const handleSave = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const result = await window.api.settings.updateReminder(settings)
      if (result.success) {
        setMessage({ type: 'success', text: '设置已保存' })
      } else {
        setMessage({ type: 'error', text: result.error || '保存失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  // 测试通知
  const handleTestNotification = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const result = await window.api.settings.testNotification()
      if (result.success) {
        setMessage({ type: 'success', text: '测试通知已发送，请查看系统通知' })
      } else {
        setMessage({ type: 'error', text: result.error || '通知发送失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '通知发送失败' })
    } finally {
      setLoading(false)
    }
  }

  // 测试邮件
  const handleTestEmail = async () => {
    if (!settings.emailAddress) {
      setMessage({ type: 'error', text: '请输入邮箱地址' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await window.api.settings.testEmail(settings.emailAddress)
      if (result.success) {
        setMessage({ type: 'success', text: '测试邮件已发送，请检查邮箱' })
      } else {
        setMessage({ type: 'error', text: result.error || '邮件发送失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '邮件发送失败' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="settings-page">
      <h2>⚙️ 设置</h2>

      <div className="settings-section">
        <h3>🔔 提醒设置</h3>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableNotification}
              onChange={(e) => setSettings({ ...settings, enableNotification: e.target.checked })}
            />
            <span>启用系统通知</span>
          </label>
          <p className="setting-desc">开启后，事件提醒将通过系统通知显示</p>
          <button
            className="test-btn"
            onClick={handleTestNotification}
            disabled={!settings.enableNotification || loading}
          >
            测试通知
          </button>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableEmail}
              onChange={(e) => setSettings({ ...settings, enableEmail: e.target.checked })}
            />
            <span>启用邮件提醒</span>
          </label>
          <p className="setting-desc">开启后，事件提醒将通过邮件发送</p>
        </div>

        {settings.enableEmail && (
          <div className="setting-item">
            <label className="setting-label-text">邮箱地址</label>
            <input
              type="email"
              value={settings.emailAddress}
              onChange={(e) => setSettings({ ...settings, emailAddress: e.target.value })}
              placeholder="请输入接收提醒的邮箱地址"
              className="email-input"
            />
            <button
              className="test-btn"
              onClick={handleTestEmail}
              disabled={!settings.emailAddress || loading}
            >
              测试邮件
            </button>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3>📧 邮件服务配置</h3>
        <div className="setting-item">
          <p className="setting-desc">
            邮件服务已配置为使用QQ邮箱SMTP发送。
            <br />
            发件邮箱：2388188947@qq.com
          </p>
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="settings-actions">
        <button className="save-btn" onClick={handleSave} disabled={loading}>
          {loading ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  )
}
