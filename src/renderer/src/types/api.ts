export interface CalendarEvent {
  id?: number
  title: string
  description?: string
  start_time: string
  end_time?: string
  location?: string
  category?: string
  reminder_minutes?: number
  is_all_day?: boolean
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  color: string
}

export const CATEGORIES: Category[] = [
  { id: 'work', name: '工作', color: '#4a90e2' },
  { id: 'personal', name: '个人', color: '#52c41a' },
  { id: 'meeting', name: '会议', color: '#faad14' },
  { id: 'health', name: '健康', color: '#ff4d4f' },
  { id: 'study', name: '学习', color: '#722ed1' },
  { id: 'other', name: '其他', color: '#8c8c8c' }
]

export function getCategoryColor(categoryId: string): string {
  const category = CATEGORIES.find(c => c.id === categoryId)
  return category?.color || '#8c8c8c'
}

export function getCategoryName(categoryId: string): string {
  const category = CATEGORIES.find(c => c.id === categoryId)
  return category?.name || '其他'
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ReminderSettings {
  enableNotification: boolean
  enableEmail: boolean
  emailAddress: string
}

export interface EventApi {
  create: (event: CalendarEvent) => Promise<ApiResponse<CalendarEvent>>
  getAll: () => Promise<ApiResponse<CalendarEvent[]>>
  getById: (id: number) => Promise<ApiResponse<CalendarEvent>>
  getByDate: (date: string) => Promise<ApiResponse<CalendarEvent[]>>
  getByDateRange: (startDate: string, endDate: string) => Promise<ApiResponse<CalendarEvent[]>>
  update: (id: number, event: Partial<CalendarEvent>) => Promise<ApiResponse<CalendarEvent>>
  delete: (id: number) => Promise<ApiResponse<boolean>>
  search: (keyword: string) => Promise<ApiResponse<CalendarEvent[]>>
}

export interface SpeechApi {
  recognize: (audioBase64: string) => Promise<ApiResponse<string>>
  recognizeWithLength: (audioBase64: string, length: number) => Promise<ApiResponse<string>>
}

export interface SettingsApi {
  getReminder: () => Promise<ApiResponse<ReminderSettings>>
  updateReminder: (settings: Partial<ReminderSettings>) => Promise<ApiResponse<ReminderSettings>>
  testEmail: (emailAddress: string) => Promise<ApiResponse<boolean>>
  testNotification: () => Promise<ApiResponse<boolean>>
}

export interface ElectronApi {
  event: EventApi
  speech: SpeechApi
  settings: SettingsApi
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
