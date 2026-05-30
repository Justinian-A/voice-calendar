import { useState, useRef, useCallback } from 'react'
import './VoiceInput.css'

interface VoiceInputProps {
  onResult: (text: string) => void
  onError?: (error: string) => void
}

type RecordingState = 'idle' | 'recording' | 'processing'

export default function VoiceInput({ onResult, onError }: VoiceInputProps): JSX.Element {
  const [state, setState] = useState<RecordingState>('idle')
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcript, setTranscript] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      streamRef.current = stream
      audioChunksRef.current = []

      // 创建音频上下文
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(100)

      setState('recording')
      setRecordingTime(0)
      setTranscript('')

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error('录音启动失败:', error)
      onError?.('无法访问麦克风，请检查权限设置')
    }
  }, [onError])

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('processing')

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [state])

  // 取消录音
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setState('idle')
    setRecordingTime(0)
    audioChunksRef.current = []
  }, [])

  // 将webm转换为PCM base64
  const convertToPCM = async (audioBlob: Blob): Promise<{ base64: string; length: number }> => {
    const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 16000 })
    const arrayBuffer = await audioBlob.arrayBuffer()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // 获取单声道数据
    const channelData = audioBuffer.getChannelData(0)
    
    // 转换为16bit PCM
    const pcmData = new Int16Array(channelData.length)
    for (let i = 0; i < channelData.length; i++) {
      const s = Math.max(-1, Math.min(1, channelData[i]))
      pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    // 转换为base64
    const uint8Array = new Uint8Array(pcmData.buffer)
    let binary = ''
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i])
    }
    const base64 = btoa(binary)

    return { base64, length: uint8Array.length }
  }

  // 处理音频
  const processAudio = async (audioBlob: Blob) => {
    try {
      // 转换为PCM格式
      const { base64, length } = await convertToPCM(audioBlob)

      // 调用语音识别
      const result = await window.api.speech.recognizeWithLength(base64, length)

      if (result.success && result.data) {
        setTranscript(result.data)
        onResult(result.data)
      } else {
        onError?.(result.error || '语音识别失败')
      }
    } catch (error) {
      console.error('音频处理失败:', error)
      onError?.('音频处理失败，请重试')
    } finally {
      setState('idle')
      setRecordingTime(0)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="voice-input-container">
      <div className="voice-controls">
        {state === 'idle' && (
          <button className="voice-btn start" onClick={startRecording} title="开始录音">
            🎙️
          </button>
        )}

        {state === 'recording' && (
          <>
            <div className="recording-indicator">
              <span className="pulse-dot"></span>
              <span className="recording-time">{formatTime(recordingTime)}</span>
            </div>
            <button className="voice-btn stop" onClick={stopRecording} title="停止录音">
              ⏹️
            </button>
            <button className="voice-btn cancel" onClick={cancelRecording} title="取消">
              ❌
            </button>
          </>
        )}

        {state === 'processing' && (
          <div className="processing">
            <span className="spinner"></span>
            <span>识别中...</span>
          </div>
        )}
      </div>

      {transcript && (
        <div className="transcript">
          <p>{transcript}</p>
        </div>
      )}

      <div className="voice-tips">
        <p>💡 试试说：</p>
        <ul>
          <li>"添加明天下午三点开会"</li>
          <li>"删除明天的会议"</li>
          <li>"查看今天的日程"</li>
        </ul>
      </div>
    </div>
  )
}
