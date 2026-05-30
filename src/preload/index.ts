import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

const eventApi = {
  create: (event: CalendarEvent) => ipcRenderer.invoke('event:create', event),
  getAll: () => ipcRenderer.invoke('event:getAll'),
  getById: (id: number) => ipcRenderer.invoke('event:getById', id),
  getByDate: (date: string) => ipcRenderer.invoke('event:getByDate', date),
  getByDateRange: (startDate: string, endDate: string) =>
    ipcRenderer.invoke('event:getByDateRange', startDate, endDate),
  update: (id: number, event: Partial<CalendarEvent>) =>
    ipcRenderer.invoke('event:update', id, event),
  delete: (id: number) => ipcRenderer.invoke('event:delete', id),
  search: (keyword: string) => ipcRenderer.invoke('event:search', keyword)
}

const speechApi = {
  recognize: (audioBase64: string) => ipcRenderer.invoke('speech:recognize', audioBase64),
  recognizeWithLength: (audioBase64: string, length: number) => ipcRenderer.invoke('speech:recognizeWithLength', audioBase64, length)
}

const settingsApi = {
  getReminder: () => ipcRenderer.invoke('settings:getReminder'),
  updateReminder: (settings: any) => ipcRenderer.invoke('settings:updateReminder', settings),
  testEmail: (emailAddress: string) => ipcRenderer.invoke('settings:testEmail', emailAddress),
  testNotification: () => ipcRenderer.invoke('settings:testNotification')
}

const api = {
  event: eventApi,
  speech: speechApi,
  settings: settingsApi
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
