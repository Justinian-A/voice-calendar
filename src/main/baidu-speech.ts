import axios from 'axios'

interface TokenResponse {
  access_token: string
  expires_in: number
  scope: string
  session_key: string
  refresh_token: string
}

interface SpeechRecognitionResult {
  err_no: number
  err_msg: string
  result: string[]
}

class BaiduSpeechService {
  private apiKey: string
  private secretKey: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.apiKey = 'VGpEn5TakDr68iU9Ted3yWHS'
    this.secretKey = 'YO3hv9rRpmRoo3dsFnoFLBNdSXnLtL3v'
  }

  // 获取访问令牌
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this.apiKey}&client_secret=${this.secretKey}`
      const response = await axios.post<TokenResponse>(url)
      
      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in - 86400) * 1000
      
      return this.accessToken
    } catch (error) {
      console.error('获取百度access_token失败:', error)
      throw new Error('获取访问令牌失败')
    }
  }

  // 语音识别
  async recognizeSpeech(audioBase64: string, format: string = 'pcm', rate: number = 16000, len?: number): Promise<string> {
    try {
      const token = await this.getAccessToken()
      const url = 'https://vop.baidu.com/server_api'

      // 计算音频长度（如果没有传入）
      const audioLen = len || Math.floor(audioBase64.length * 3 / 4)

      const data = {
        format: format,
        rate: rate,
        channel: 1,
        cuid: 'voice-calendar-app',
        token: token,
        speech: audioBase64,
        len: audioLen
      }

      console.log('发送语音识别请求:', { format, rate, len: audioLen })

      const response = await axios.post<SpeechRecognitionResult>(url, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.data.err_no === 0) {
        return response.data.result[0] || ''
      } else {
        throw new Error(`语音识别失败: ${response.data.err_msg}`)
      }
    } catch (error) {
      console.error('语音识别错误:', error)
      throw error
    }
  }

  // 语音识别（文件路径方式）
  async recognizeAudioFile(audioBuffer: Buffer, format: string = 'pcm', rate: number = 16000): Promise<string> {
    const base64 = audioBuffer.toString('base64')
    return this.recognizeSpeech(base64, format, rate, audioBuffer.length)
  }
}

export const baiduSpeech = new BaiduSpeechService()
