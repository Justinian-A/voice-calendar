import initSqlJs, { Database } from 'sql.js'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

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

class DatabaseManager {
  private db: Database | null = null
  private dbPath: string = ''

  async init(): Promise<void> {
    const SQL = await initSqlJs()
    this.dbPath = join(app.getPath('userData'), 'voice-calendar.db')

    if (existsSync(this.dbPath)) {
      const fileBuffer = readFileSync(this.dbPath)
      this.db = new SQL.Database(fileBuffer)
    } else {
      this.db = new SQL.Database()
    }

    this.createTables()
    this.save()
    console.log('Database initialized:', this.dbPath)
  }

  private createTables(): void {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT,
        location TEXT,
        reminder_minutes INTEGER DEFAULT 15,
        is_all_day INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now', 'localtime')),
        updated_at TEXT DEFAULT (datetime('now', 'localtime'))
      )
    `)
  }

  private save(): void {
    if (!this.db) return
    const data = this.db.export()
    const buffer = Buffer.from(data)
    writeFileSync(this.dbPath, buffer)
  }

  // 创建事件
  createEvent(event: CalendarEvent): CalendarEvent {
    if (!this.db) throw new Error('Database not initialized')

    this.db.run(
      `INSERT INTO events (title, description, start_time, end_time, location, reminder_minutes, is_all_day)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event.title,
        event.description || null,
        event.start_time,
        event.end_time || null,
        event.location || null,
        event.reminder_minutes || 15,
        event.is_all_day ? 1 : 0
      ]
    )

    const result = this.db.exec('SELECT last_insert_rowid() as id')
    const id = result[0].values[0][0] as number
    this.save()
    return this.getEventById(id)!
  }

  // 获取所有事件
  getAllEvents(): CalendarEvent[] {
    if (!this.db) throw new Error('Database not initialized')
    const result = this.db.exec('SELECT * FROM events ORDER BY start_time')
    return this.mapResult(result)
  }

  // 根据ID获取事件
  getEventById(id: number): CalendarEvent | null {
    if (!this.db) throw new Error('Database not initialized')
    const result = this.db.exec('SELECT * FROM events WHERE id = ?', [id])
    const events = this.mapResult(result)
    return events[0] || null
  }

  // 获取指定日期范围的事件
  getEventsByDateRange(startDate: string, endDate: string): CalendarEvent[] {
    if (!this.db) throw new Error('Database not initialized')
    const result = this.db.exec(
      'SELECT * FROM events WHERE start_time >= ? AND start_time <= ? ORDER BY start_time',
      [startDate, endDate]
    )
    return this.mapResult(result)
  }

  // 获取指定日期的事件
  getEventsByDate(date: string): CalendarEvent[] {
    const startDate = `${date} 00:00:00`
    const endDate = `${date} 23:59:59`
    return this.getEventsByDateRange(startDate, endDate)
  }

  // 更新事件
  updateEvent(id: number, event: Partial<CalendarEvent>): CalendarEvent | null {
    if (!this.db) throw new Error('Database not initialized')

    const fields: string[] = []
    const values: any[] = []

    if (event.title !== undefined) { fields.push('title = ?'); values.push(event.title) }
    if (event.description !== undefined) { fields.push('description = ?'); values.push(event.description) }
    if (event.start_time !== undefined) { fields.push('start_time = ?'); values.push(event.start_time) }
    if (event.end_time !== undefined) { fields.push('end_time = ?'); values.push(event.end_time) }
    if (event.location !== undefined) { fields.push('location = ?'); values.push(event.location) }
    if (event.reminder_minutes !== undefined) { fields.push('reminder_minutes = ?'); values.push(event.reminder_minutes) }
    if (event.is_all_day !== undefined) { fields.push('is_all_day = ?'); values.push(event.is_all_day ? 1 : 0) }

    fields.push("updated_at = datetime('now', 'localtime')")
    values.push(id)

    this.db.run(`UPDATE events SET ${fields.join(', ')} WHERE id = ?`, values)
    this.save()
    return this.getEventById(id)
  }

  // 删除事件
  deleteEvent(id: number): boolean {
    if (!this.db) throw new Error('Database not initialized')
    this.db.run('DELETE FROM events WHERE id = ?', [id])
    this.save()
    return true
  }

  // 搜索事件
  searchEvents(keyword: string): CalendarEvent[] {
    if (!this.db) throw new Error('Database not initialized')
    const result = this.db.exec(
      `SELECT * FROM events 
       WHERE title LIKE ? OR description LIKE ? OR location LIKE ?
       ORDER BY start_time`,
      [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
    )
    return this.mapResult(result)
  }

  // 映射查询结果
  private mapResult(result: any[]): CalendarEvent[] {
    if (!result || result.length === 0) return []

    const columns = result[0].columns
    return result[0].values.map((row: any[]) => {
      const event: any = {}
      columns.forEach((col: string, index: number) => {
        event[col] = row[index]
      })
      return event as CalendarEvent
    })
  }

  close(): void {
    if (this.db) {
      this.save()
      this.db.close()
      this.db = null
    }
  }
}

export const database = new DatabaseManager()
