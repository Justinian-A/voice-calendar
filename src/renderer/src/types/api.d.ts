export interface CalendarEvent {
  id?: number
  title: string
  description?: string
  start_time: string
  end_time?: string
  location?: string
  reminder_minutes?: number
  is_all_day?: boolean
  created_at?: string
  updated_at?: string
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
