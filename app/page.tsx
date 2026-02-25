'use client'

import React, { useState, useEffect, useMemo } from 'react'

// Types
interface Stopwatch {
  id: string
  startTime: number
  elapsed: number
  running: boolean
}

interface TimeRecord {
  id: string
  duration: number
  startedAt: number
  endedAt: number
  name?: string
  category?: string
  summary?: string
  folderId?: string
  archivedAt?: number
  manual?: boolean
}

interface Folder {
  id: string
  name: string
  color: string
}

interface Goal {
  id: string
  name: string
  category: string
  hours: number
  period: 'daily' | 'weekly' | 'monthly'
}

// Colors - Light Luxury Theme
const Colors = {
  primary: '#1A1A1A',
  primaryLight: '#333333',
  primaryDark: '#000000',
  primaryGlow: 'rgba(26, 26, 26, 0.06)',
  bg: '#FFFFFF',
  bgSecondary: '#FAFAFA',
  bgTertiary: '#F5F5F5',
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',
  textLight: '#B5B5B5',
  success: '#2D6A4F',
  successLight: 'rgba(45, 106, 79, 0.08)',
  warning: '#9A7B4F',
  warningLight: 'rgba(154, 123, 79, 0.08)',
  danger: '#8B3A3A',
  dangerLight: 'rgba(139, 58, 58, 0.08)',
  purple: '#6B5B7A',
  purpleLight: 'rgba(107, 91, 122, 0.08)',
  pink: '#8B6B7A',
  pinkLight: 'rgba(139, 107, 122, 0.08)',
  teal: '#4A7A7A',
  tealLight: 'rgba(74, 122, 122, 0.08)',
  orange: '#9A6B4F',
  orangeLight: 'rgba(154, 107, 79, 0.08)',
  border: '#EBEBEB',
  borderLight: '#F5F5F5',
  accent: '#9A8B7A',
}

// Helpers
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatHours = (ms: number): string => {
  const hours = ms / 3600000
  if (hours === 0) return '0m'
  return hours >= 1 ? `${Math.round(hours * 10) / 10}h` : `${Math.round(ms / 60000)}m`
}

const formatDate = (ts: number): string => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
const formatDateFull = (ts: number): string => new Date(ts).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const formatTimeOfDay = (ts: number): string => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2)

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Storage
const STORAGE_KEY = 'tempo_app_data'
const loadFromStorage = (): { stopwatches: Stopwatch[], inbox: TimeRecord[], archive: TimeRecord[], folders: Folder[], goals: Goal[] } | null => {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : null
  } catch { return null }
}
const saveToStorage = (data: object): void => {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

// Icons
const Icons = {
  Timer: ({ size = 24 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Inbox: ({ size = 24 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Archive: ({ size = 24 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>,
  Target: ({ size = 24 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  BarChart: ({ size = 24 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
  Plus: ({ size = 24 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Play: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Check: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  X: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Trash: ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  Folder: ({ size = 16 }: { size?: number }) => <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  FolderPlus: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>,
  Search: ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ChevronLeft: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  ChevronDown: ({ size = 18 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
  Flame: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  TrendingUp: ({ size = 20 }: { size?: number }) => <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
}

// Category colors - Muted luxury tones
const categoryColors: Record<string, { bg: string; text: string; solid: string }> = {
  'Deep Work': { bg: 'rgba(26, 26, 26, 0.06)', text: '#1A1A1A', solid: '#1A1A1A' },
  'Learning': { bg: 'rgba(107, 91, 122, 0.08)', text: '#6B5B7A', solid: '#6B5B7A' },
  'Creative': { bg: 'rgba(139, 107, 122, 0.08)', text: '#8B6B7A', solid: '#8B6B7A' },
  'Meetings': { bg: 'rgba(154, 107, 79, 0.08)', text: '#9A6B4F', solid: '#9A6B4F' },
  'Health': { bg: 'rgba(45, 106, 79, 0.08)', text: '#2D6A4F', solid: '#2D6A4F' },
  'Personal': { bg: 'rgba(74, 122, 122, 0.08)', text: '#4A7A7A', solid: '#4A7A7A' },
}

export default function TempoApp() {
  const [activeTab, setActiveTab] = useState('timers')
  const [stopwatches, setStopwatches] = useState<Stopwatch[]>([])
  const [inbox, setInbox] = useState<TimeRecord[]>([])
  const [archive, setArchive] = useState<TimeRecord[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories] = useState(['Deep Work', 'Learning', 'Creative', 'Meetings', 'Health', 'Personal'])
  const [isLoaded, setIsLoaded] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null)
  const [formData, setFormData] = useState({ name: '', category: '', summary: '', folderId: '' })

  const [goalModalOpen, setGoalModalOpen] = useState(false)
  const [goalForm, setGoalForm] = useState<{ name: string; category: string; hours: string; period: 'daily' | 'weekly' | 'monthly' }>({ name: '', category: '', hours: '', period: 'daily' })

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const [manualEntryModal, setManualEntryModal] = useState(false)
  const [manualEntry, setManualEntry] = useState({ name: '', category: '', hours: '', minutes: '', summary: '', date: new Date().toISOString().split('T')[0] })

  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [recordToMove, setRecordToMove] = useState<TimeRecord | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [foldersExpanded, setFoldersExpanded] = useState(false)

  const [insightsMonth, setInsightsMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      setStopwatches(saved.stopwatches || [])
      setInbox(saved.inbox || [])
      setArchive(saved.archive || [])
      setFolders(saved.folders || [])
      setGoals(saved.goals || [])
    }
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    if (isLoaded) saveToStorage({ stopwatches, inbox, archive, folders, goals })
  }, [stopwatches, inbox, archive, folders, goals, isLoaded])

  useEffect(() => {
    const interval = setInterval(() => forceUpdate(n => n + 1), 100)
    return () => clearInterval(interval)
  }, [])

  const getElapsed = (sw: Stopwatch): number => sw.running ? sw.elapsed + (Date.now() - sw.startTime) : sw.elapsed

  const addStopwatch = () => setStopwatches(prev => [...prev, { id: generateId(), startTime: Date.now(), elapsed: 0, running: true }])
  
  const toggleStopwatch = (id: string) => setStopwatches(prev => prev.map(sw => {
    if (sw.id !== id) return sw
    return sw.running 
      ? { ...sw, elapsed: sw.elapsed + (Date.now() - sw.startTime), running: false }
      : { ...sw, startTime: Date.now(), running: true }
  }))
  
  const saveStopwatch = (id: string) => {
    const sw = stopwatches.find(s => s.id === id)
    if (!sw) return
    const elapsed = getElapsed(sw)
    setInbox(prev => [{ id: generateId(), duration: elapsed, startedAt: Date.now() - elapsed, endedAt: Date.now() }, ...prev])
    setStopwatches(prev => prev.filter(s => s.id !== id))
  }
  
  const deleteStopwatch = (id: string) => setStopwatches(prev => prev.filter(s => s.id !== id))
  
  const openOrganize = (record: TimeRecord) => {
    setSelectedRecord(record)
    setFormData({ name: '', category: '', summary: '', folderId: '' })
    setModalOpen(true)
  }
  
  const saveRecord = () => {
    if (!selectedRecord) return
    setArchive(prev => [{ ...selectedRecord, ...formData, archivedAt: Date.now() }, ...prev])
    setInbox(prev => prev.filter(r => r.id !== selectedRecord.id))
    setModalOpen(false)
  }
  
  const openMoveModal = (record: TimeRecord) => {
    setRecordToMove(record)
    setMoveModalOpen(true)
  }
  
  const moveRecordToFolder = (folderId: string | null) => {
    if (!recordToMove) return
    setArchive(prev => prev.map(r => r.id === recordToMove.id ? { ...r, folderId: folderId || '' } : r))
    setMoveModalOpen(false)
    setRecordToMove(null)
  }

  const addManualEntry = () => {
    const hours = parseFloat(manualEntry.hours) || 0
    const minutes = parseFloat(manualEntry.minutes) || 0
    const duration = (hours * 60 + minutes) * 60 * 1000
    if (duration <= 0) return
    const entryDate = new Date(manualEntry.date)
    entryDate.setHours(12, 0, 0, 0)
    setArchive(prev => [{ id: generateId(), duration, startedAt: entryDate.getTime() - duration, endedAt: entryDate.getTime(), name: manualEntry.name, category: manualEntry.category, summary: manualEntry.summary, archivedAt: Date.now(), manual: true }, ...prev].sort((a, b) => b.endedAt - a.endedAt))
    setManualEntryModal(false)
    setManualEntry({ name: '', category: '', hours: '', minutes: '', summary: '', date: new Date().toISOString().split('T')[0] })
  }

  const createFolder = () => {
    if (!newFolderName.trim()) return
    const folderColors = [Colors.primary, Colors.purple, Colors.pink, Colors.teal, Colors.orange, Colors.success]
    setFolders(prev => [...prev, { id: generateId(), name: newFolderName.trim(), color: folderColors[prev.length % 6] }])
    setNewFolderName('')
    setFolderModalOpen(false)
  }
  
  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id))
    setArchive(prev => prev.map(r => r.folderId === id ? { ...r, folderId: '' } : r))
    if (selectedFolderId === id) setSelectedFolderId(null)
  }
  
  const addGoal = () => {
    if (!goalForm.name || !goalForm.hours) return
    setGoals(prev => [...prev, { id: generateId(), name: goalForm.name, category: goalForm.category, hours: parseFloat(goalForm.hours), period: goalForm.period }])
    setGoalModalOpen(false)
    setGoalForm({ name: '', category: '', hours: '', period: 'daily' })
  }
  
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id))

  const getGoalProgress = (goal: Goal) => {
    const now = new Date()
    let start: Date
    if (goal.period === 'daily') { start = new Date(now); start.setHours(0,0,0,0) }
    else if (goal.period === 'weekly') { start = new Date(now); start.setDate(start.getDate() - start.getDay()); start.setHours(0,0,0,0) }
    else { start = new Date(now.getFullYear(), now.getMonth(), 1) }
    const periodRecords = archive.filter(r => (!goal.category || r.category === goal.category) && r.endedAt >= start.getTime())
    const totalHours = periodRecords.reduce((sum, r) => sum + r.duration, 0) / 3600000
    return { progress: Math.min(totalHours / goal.hours, 1), current: totalHours }
  }

  const filteredArchive = useMemo(() => {
    let records = [...archive].sort((a, b) => b.endedAt - a.endedAt)
    if (selectedFolderId) records = records.filter(r => r.folderId === selectedFolderId)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      records = records.filter(r => r.name?.toLowerCase().includes(q) || r.category?.toLowerCase().includes(q) || r.summary?.toLowerCase().includes(q))
    }
    return records
  }, [archive, selectedFolderId, searchQuery])

  const getCalendarDays = (date: Date): (Date | null)[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  const getRecordsForDay = (date: Date | null): TimeRecord[] => {
    if (!date) return []
    const start = new Date(date); start.setHours(0,0,0,0)
    const end = new Date(date); end.setHours(23,59,59,999)
    return archive.filter(r => r.endedAt >= start.getTime() && r.endedAt <= end.getTime())
  }

  const getDayTotal = (date: Date | null): number => getRecordsForDay(date).reduce((sum, r) => sum + r.duration, 0)

  const insights = useMemo(() => {
    const now = new Date()
    const today = new Date(now); today.setHours(0,0,0,0)
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const todayTotal = archive.filter(r => r.endedAt >= today.getTime()).reduce((s, r) => s + r.duration, 0)
    const weekTotal = archive.filter(r => r.endedAt >= weekStart.getTime()).reduce((s, r) => s + r.duration, 0)
    const monthTotal = archive.filter(r => r.endedAt >= monthStart.getTime()).reduce((s, r) => s + r.duration, 0)
    const monthRecords = archive.filter(r => r.endedAt >= monthStart.getTime())
    const categoryTotals: Record<string, number> = {}
    monthRecords.forEach(r => { if (r.category) categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.duration })
    const categoryBreakdown = Object.entries(categoryTotals).map(([name, ms]) => ({ name, ms, hours: Math.round(ms / 3600000 * 10) / 10 })).sort((a, b) => b.ms - a.ms)
    const daysTracked = new Set(archive.map(r => new Date(r.endedAt).toDateString())).size
    const avgDaily = daysTracked > 0 ? archive.reduce((s, r) => s + r.duration, 0) / daysTracked : 0
    let streak = 0
    const checkDate = new Date(today)
    while (getRecordsForDay(checkDate).length > 0) { streak++; checkDate.setDate(checkDate.getDate() - 1) }
    return { todayTotal, weekTotal, monthTotal, categoryBreakdown, avgDaily, streak, totalSessions: archive.length, totalHours: archive.reduce((s, r) => s + r.duration, 0) }
  }, [archive])

  const calendarDays = useMemo(() => getCalendarDays(insightsMonth), [insightsMonth])
  const selectedDayRecords = useMemo(() => selectedDay ? getRecordsForDay(selectedDay) : [], [selectedDay, archive])

  const tabs = [
    { id: 'timers', icon: Icons.Timer, label: 'Timers' },
    { id: 'inbox', icon: Icons.Inbox, label: 'Inbox', badge: inbox.length },
    { id: 'archive', icon: Icons.Archive, label: 'Archive' },
    { id: 'goals', icon: Icons.Target, label: 'Goals' },
    { id: 'insights', icon: Icons.BarChart, label: 'Insights' },
  ]

  const buttonStyle: React.CSSProperties = { border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease', WebkitTapHighlightColor: 'transparent' }
  const cardStyle: React.CSSProperties = { background: Colors.bg, borderRadius: 16, border: `1px solid ${Colors.border}`, overflow: 'hidden' }
  const inputStyle: React.CSSProperties = { width: '100%', padding: '14px 16px', background: Colors.bgSecondary, border: `1px solid ${Colors.border}`, borderRadius: 12, color: Colors.text, fontSize: 16, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }

  if (!isLoaded) {
    return (
      <div style={{ background: Colors.bgSecondary, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff' }}>
            <Icons.Timer size={24} />
          </div>
          <div style={{ color: Colors.textMuted, fontSize: 15 }}>Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: Colors.bgSecondary, minHeight: '100vh', maxWidth: 480, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif', color: Colors.text, WebkitFontSmoothing: 'antialiased' }}>
      
      {/* Header */}
      <div style={{ background: Colors.bg, borderBottom: `1px solid ${Colors.border}`, padding: '56px 24px 20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px', color: Colors.text }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            {activeTab === 'timers' && <p style={{ fontSize: 14, color: Colors.textMuted, margin: '4px 0 0', fontWeight: 400 }}>Track your focused time</p>}
            {activeTab === 'insights' && <p style={{ fontSize: 14, color: Colors.textMuted, margin: '4px 0 0', fontWeight: 400 }}>Your productivity overview</p>}
          </div>
          {(activeTab === 'timers' || activeTab === 'goals' || activeTab === 'insights') && (
            <button onClick={() => activeTab === 'timers' ? addStopwatch() : activeTab === 'goals' ? setGoalModalOpen(true) : setManualEntryModal(true)} style={{ ...buttonStyle, width: 44, height: 44, borderRadius: 22, background: Colors.primary, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'none' }}>
              <Icons.Plus size={22} />
            </button>
          )}
          {activeTab === 'archive' && (
            <button onClick={() => setFolderModalOpen(true)} style={{ ...buttonStyle, width: 44, height: 44, borderRadius: 12, background: Colors.bgSecondary, color: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${Colors.border}` }}>
              <Icons.FolderPlus size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '20px 20px 120px' }}>
        
        {/* TIMERS */}
        {activeTab === 'timers' && (
          stopwatches.length === 0 ? (
            <div style={{ ...cardStyle, padding: '80px 40px', textAlign: 'center', marginTop: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: Colors.primaryGlow, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: Colors.primary }}>
                <Icons.Timer size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: Colors.text }}>No active timers</h3>
              <p style={{ fontSize: 15, color: Colors.textMuted, margin: 0, lineHeight: 1.5 }}>Start a timer to begin tracking your focused work sessions</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
              {stopwatches.map(sw => (
                <div key={sw.id} style={{ ...cardStyle, padding: 24, border: sw.running ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`, background: sw.running ? Colors.primaryGlow : Colors.bg }}>
                  <div style={{ fontSize: 56, fontWeight: 200, fontVariantNumeric: 'tabular-nums', textAlign: 'center', marginBottom: 28, color: sw.running ? Colors.primary : Colors.text, letterSpacing: '-2px', fontFamily: 'SF Mono, Menlo, monospace' }}>
                    {formatTime(getElapsed(sw))}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => toggleStopwatch(sw.id)} style={{ ...buttonStyle, flex: 1, height: 52, borderRadius: 14, background: sw.running ? Colors.bg : Colors.primary, color: sw.running ? Colors.text : '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: sw.running ? `1px solid ${Colors.border}` : 'none', boxShadow: sw.running ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)' }}>
                      {sw.running ? <><Icons.Pause size={18} /> Pause</> : <><Icons.Play size={16} /> Resume</>}
                    </button>
                    <button onClick={() => saveStopwatch(sw.id)} style={{ ...buttonStyle, flex: 1, height: 52, borderRadius: 14, background: Colors.success, color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)' }}>
                      <Icons.Check size={18} /> Save
                    </button>
                    <button onClick={() => deleteStopwatch(sw.id)} style={{ ...buttonStyle, width: 52, height: 52, borderRadius: 14, background: Colors.dangerLight, color: Colors.danger, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* INBOX */}
        {activeTab === 'inbox' && (
          inbox.length === 0 ? (
            <div style={{ ...cardStyle, padding: '80px 40px', textAlign: 'center', marginTop: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: Colors.success }}>
                <Icons.Check size={32} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>All caught up</h3>
              <p style={{ fontSize: 15, color: Colors.textMuted, margin: 0 }}>Completed timers will appear here for organizing</p>
            </div>
          ) : (
            <div style={cardStyle}>
              {inbox.map((record, idx) => (
                <div key={record.id}>
                  <div onClick={() => openOrganize(record)} style={{ padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 600, color: Colors.text, fontVariantNumeric: 'tabular-nums' }}>{formatTime(record.duration)}</div>
                      <div style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4 }}>{formatDate(record.endedAt)} at {formatTimeOfDay(record.startedAt)}</div>
                    </div>
                    <button style={{ ...buttonStyle, padding: '10px 16px', borderRadius: 10, background: Colors.primary, color: '#fff', fontSize: 13, fontWeight: 600 }}>Organize</button>
                  </div>
                  {idx < inbox.length - 1 && <div style={{ height: 1, background: Colors.borderLight, marginLeft: 20 }} />}
                </div>
              ))}
            </div>
          )
        )}

        {/* ARCHIVE */}
        {activeTab === 'archive' && (
          <div>
            <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', marginBottom: 16 }}>
              <Icons.Search size={18} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search records..." style={{ ...inputStyle, background: 'transparent', border: 'none', padding: 0, fontSize: 15 }} />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ ...buttonStyle, background: 'none', padding: 4, color: Colors.textMuted }}><Icons.X size={16} /></button>}
            </div>

            {folders.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <button onClick={() => setFoldersExpanded(!foldersExpanded)} style={{ ...buttonStyle, ...cardStyle, width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: Colors.text }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Icons.Folder size={18} />
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : 'All Records'}</span>
                    <span style={{ fontSize: 13, color: Colors.textMuted, background: Colors.bgSecondary, padding: '2px 8px', borderRadius: 6 }}>{selectedFolderId ? archive.filter(r => r.folderId === selectedFolderId).length : archive.length}</span>
                  </div>
                  <div style={{ transform: foldersExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', color: Colors.textMuted }}><Icons.ChevronDown /></div>
                </button>
                {foldersExpanded && (
                  <div style={{ ...cardStyle, marginTop: 8, padding: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      <button onClick={() => { setSelectedFolderId(null); setFoldersExpanded(false) }} style={{ ...buttonStyle, padding: 14, borderRadius: 12, textAlign: 'center', background: !selectedFolderId ? Colors.primary : Colors.bgSecondary, color: !selectedFolderId ? '#fff' : Colors.text, border: `1px solid ${!selectedFolderId ? Colors.primary : Colors.border}` }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>All</div>
                        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{archive.length}</div>
                      </button>
                      {folders.map(folder => {
                        const count = archive.filter(r => r.folderId === folder.id).length
                        const isSelected = selectedFolderId === folder.id
                        return (
                          <button key={folder.id} onClick={() => { setSelectedFolderId(isSelected ? null : folder.id); setFoldersExpanded(false) }} style={{ ...buttonStyle, padding: 14, borderRadius: 12, textAlign: 'center', background: isSelected ? folder.color : Colors.bgSecondary, color: isSelected ? '#fff' : Colors.text, border: `1px solid ${isSelected ? folder.color : Colors.border}` }}>
                            <Icons.Folder size={14} />
                            <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{folder.name}</div>
                            <div style={{ fontSize: 11, opacity: 0.7 }}>{count}</div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {filteredArchive.length === 0 ? (
              <div style={{ ...cardStyle, padding: '60px 40px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: Colors.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: Colors.textMuted }}><Icons.Archive size={28} /></div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px' }}>{searchQuery ? 'No results found' : 'No records yet'}</h3>
                <p style={{ fontSize: 14, color: Colors.textMuted, margin: 0 }}>{searchQuery ? 'Try a different search term' : 'Save and organize your timers here'}</p>
              </div>
            ) : (
              <div style={cardStyle}>
                {filteredArchive.map((record, idx) => {
                  const folder = folders.find(f => f.id === record.folderId)
                  const catColor = categoryColors[record.category || ''] || { bg: Colors.bgSecondary, text: Colors.textMuted }
                  return (
                    <div key={record.id}>
                      <div style={{ padding: '18px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 600, color: Colors.text }}>{record.name || 'Untitled'}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                              {record.category && <span style={{ fontSize: 11, background: catColor.bg, color: catColor.text, padding: '4px 10px', borderRadius: 6, fontWeight: 600 }}>{record.category}</span>}
                              {folder && <span style={{ fontSize: 11, background: `${folder.color}15`, color: folder.color, padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>{folder.name}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18, fontWeight: 700, color: Colors.primary, fontVariantNumeric: 'tabular-nums' }}>{formatTime(record.duration)}</span>
                            <button onClick={() => openMoveModal(record)} style={{ ...buttonStyle, background: Colors.bgSecondary, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted, border: `1px solid ${Colors.border}` }}><Icons.Folder size={14} /></button>
                          </div>
                        </div>
                        {record.summary && <p style={{ fontSize: 14, color: Colors.textMuted, margin: '10px 0 0', lineHeight: 1.5 }}>{record.summary}</p>}
                        <div style={{ fontSize: 12, color: Colors.textLight, marginTop: 10 }}>{formatDate(record.endedAt)}</div>
                      </div>
                      {idx < filteredArchive.length - 1 && <div style={{ height: 1, background: Colors.borderLight, marginLeft: 20 }} />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* GOALS */}
        {activeTab === 'goals' && (
          goals.length === 0 ? (
            <div style={{ ...cardStyle, padding: '80px 40px', textAlign: 'center', marginTop: 20 }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: Colors.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: Colors.purple }}><Icons.Target size={32} /></div>
              <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>Set your first goal</h3>
              <p style={{ fontSize: 15, color: Colors.textMuted, margin: 0 }}>Create time goals to stay accountable</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
              {goals.map(goal => {
                const { progress, current } = getGoalProgress(goal)
                const pct = Math.round(progress * 100)
                const isComplete = pct >= 100
                return (
                  <div key={goal.id} style={{ ...cardStyle, padding: 20, background: isComplete ? Colors.successLight : Colors.bg, border: isComplete ? `1px solid ${Colors.success}` : `1px solid ${Colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 17, fontWeight: 600 }}>{goal.name}</div>
                        <div style={{ fontSize: 13, color: Colors.textMuted, marginTop: 4 }}>{goal.category && `${goal.category} · `}{goal.period === 'daily' ? 'Today' : goal.period === 'weekly' ? 'This week' : 'This month'}</div>
                      </div>
                      <button onClick={() => deleteGoal(goal.id)} style={{ ...buttonStyle, background: 'none', padding: 4, color: Colors.textMuted }}><Icons.X size={18} /></button>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, color: Colors.textMuted }}>{Math.round(current * 10) / 10}h of {goal.hours}h</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: isComplete ? Colors.success : Colors.primary }}>{pct}%</span>
                      </div>
                      <div style={{ height: 8, background: Colors.bgSecondary, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isComplete ? Colors.success : Colors.primary, borderRadius: 4, transition: 'width 0.3s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* INSIGHTS */}
        {activeTab === 'insights' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              {[{ label: 'Today', value: insights.todayTotal, color: Colors.primary }, { label: 'This week', value: insights.weekTotal, color: Colors.success }, { label: 'This month', value: insights.monthTotal, color: Colors.purple }].map(stat => (
                <div key={stat.label} style={{ ...cardStyle, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{formatHours(stat.value)}</div>
                  <div style={{ fontSize: 12, color: Colors.textMuted, marginTop: 4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: Colors.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.orange }}><Icons.Flame size={22} /></div>
                <div><div style={{ fontSize: 22, fontWeight: 700 }}>{insights.streak}</div><div style={{ fontSize: 12, color: Colors.textMuted }}>Day streak</div></div>
              </div>
              <div style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: Colors.purpleLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.purple }}><Icons.TrendingUp size={22} /></div>
                <div><div style={{ fontSize: 22, fontWeight: 700 }}>{formatHours(insights.avgDaily)}</div><div style={{ fontSize: 12, color: Colors.textMuted }}>Daily avg</div></div>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <button onClick={() => setInsightsMonth(new Date(insightsMonth.getFullYear(), insightsMonth.getMonth() - 1))} style={{ ...buttonStyle, width: 36, height: 36, borderRadius: 10, background: Colors.bgSecondary, color: Colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${Colors.border}` }}><Icons.ChevronLeft size={18} /></button>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{MONTHS[insightsMonth.getMonth()]} {insightsMonth.getFullYear()}</span>
                <button onClick={() => setInsightsMonth(new Date(insightsMonth.getFullYear(), insightsMonth.getMonth() + 1))} style={{ ...buttonStyle, width: 36, height: 36, borderRadius: 10, background: Colors.bgSecondary, color: Colors.text, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${Colors.border}` }}><Icons.ChevronRight size={18} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {WEEKDAYS.map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 11, color: Colors.textLight, padding: '6px 0', fontWeight: 600 }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />
                  const total = getDayTotal(day)
                  const hasRecords = total > 0
                  const isToday = day.toDateString() === new Date().toDateString()
                  const isSelected = selectedDay?.toDateString() === day.toDateString()
                  const intensity = Math.min(total / (4 * 3600000), 1)
                  return (
                    <button key={day.toISOString()} onClick={() => setSelectedDay(isSelected ? null : day)} style={{ ...buttonStyle, aspectRatio: '1', borderRadius: 10, background: isSelected ? Colors.primary : hasRecords ? `rgba(37, 99, 235, ${0.1 + intensity * 0.3})` : Colors.bgSecondary, border: isToday && !isSelected ? `2px solid ${Colors.primary}` : `1px solid ${isSelected ? Colors.primary : 'transparent'}`, color: isSelected ? '#fff' : Colors.text, fontWeight: isToday ? 700 : 500, fontSize: 14 }}>
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedDay && (
              <div style={{ ...cardStyle, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{formatDateFull(selectedDay.getTime())}</span>
                  <span style={{ fontSize: 16, color: Colors.primary, fontWeight: 700 }}>{formatHours(getDayTotal(selectedDay))}</span>
                </div>
                {selectedDayRecords.length === 0 ? (
                  <p style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', padding: 20 }}>No activity recorded</p>
                ) : (
                  selectedDayRecords.map((record, idx) => (
                    <div key={record.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 500 }}>{record.name || 'Untitled'}</div>
                          {record.category && <span style={{ fontSize: 12, color: categoryColors[record.category]?.text || Colors.textMuted }}>{record.category}</span>}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: Colors.primary }}>{formatTime(record.duration)}</span>
                      </div>
                      {idx < selectedDayRecords.length - 1 && <div style={{ height: 1, background: Colors.borderLight }} />}
                    </div>
                  ))
                )}
              </div>
            )}

            {insights.categoryBreakdown.length > 0 && (
              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>This month by category</div>
                {insights.categoryBreakdown.map((cat, i) => {
                  const colors = [Colors.primary, Colors.success, Colors.purple, Colors.pink, Colors.orange, Colors.teal]
                  const maxHours = insights.categoryBreakdown[0].hours
                  return (
                    <div key={cat.name} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.hours}h</span>
                      </div>
                      <div style={{ height: 6, background: Colors.bgSecondary, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(cat.hours / maxHours) * 100}%`, background: colors[i % colors.length], borderRadius: 3 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: Colors.bg, borderTop: `1px solid ${Colors.border}`, display: 'flex', padding: '8px 8px 28px' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedDay(null) }} style={{ ...buttonStyle, flex: 1, background: 'none', color: activeTab === tab.id ? Colors.primary : Colors.textMuted, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 0', position: 'relative' }}>
            <tab.icon size={22} />
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2px' }}>{tab.label}</span>
            {tab.badge && tab.badge > 0 && <span style={{ position: 'absolute', top: 2, right: '24%', background: Colors.danger, color: '#fff', fontSize: 10, minWidth: 16, height: 16, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      {/* MODALS */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(250, 250, 250, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: Colors.bg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 -4px 40px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ padding: '16px 0 8px', display: 'flex', justifyContent: 'center' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: Colors.border }} /></div>
            <div style={{ padding: '0 24px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Organize session</h2>
                <button onClick={() => setModalOpen(false)} style={{ ...buttonStyle, background: Colors.bgSecondary, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted }}><Icons.X size={18} /></button>
              </div>
              {selectedRecord && (
                <>
                  <div style={{ background: Colors.primaryGlow, borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 40, fontWeight: 300, color: Colors.primary, fontVariantNumeric: 'tabular-nums', fontFamily: 'SF Mono, Menlo, monospace' }}>{formatTime(selectedRecord.duration)}</div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Name</label>
                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="What were you working on?" style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Category</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {categories.map(cat => {
                        const cc = categoryColors[cat]
                        return <button key={cat} onClick={() => setFormData({ ...formData, category: cat })} style={{ ...buttonStyle, padding: '10px 14px', borderRadius: 10, background: formData.category === cat ? cc.solid : cc.bg, color: formData.category === cat ? '#fff' : cc.text, fontSize: 13, fontWeight: 600, border: `1px solid ${formData.category === cat ? cc.solid : 'transparent'}` }}>{cat}</button>
                      })}
                    </div>
                  </div>
                  {folders.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Folder</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        <button onClick={() => setFormData({ ...formData, folderId: '' })} style={{ ...buttonStyle, padding: '10px 14px', borderRadius: 10, background: !formData.folderId ? Colors.primary : Colors.bgSecondary, color: !formData.folderId ? '#fff' : Colors.text, fontSize: 13, fontWeight: 500, border: `1px solid ${!formData.folderId ? Colors.primary : Colors.border}` }}>None</button>
                        {folders.map(folder => <button key={folder.id} onClick={() => setFormData({ ...formData, folderId: folder.id })} style={{ ...buttonStyle, padding: '10px 14px', borderRadius: 10, background: formData.folderId === folder.id ? folder.color : Colors.bgSecondary, color: formData.folderId === folder.id ? '#fff' : Colors.text, fontSize: 13, fontWeight: 500, border: `1px solid ${formData.folderId === folder.id ? folder.color : Colors.border}` }}>{folder.name}</button>)}
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Notes</label>
                    <textarea value={formData.summary} onChange={e => setFormData({ ...formData, summary: e.target.value })} placeholder="What did you accomplish?" style={{ ...inputStyle, minHeight: 100, resize: 'none' }} />
                  </div>
                  <button onClick={saveRecord} style={{ ...buttonStyle, width: '100%', padding: 16, background: Colors.primary, borderRadius: 14, color: '#fff', fontSize: 16, fontWeight: 600, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}>Save to Archive</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {moveModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(250, 250, 250, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: Colors.bg, borderRadius: 20, width: '100%', maxWidth: 340, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ padding: 20, borderBottom: `1px solid ${Colors.border}` }}><h3 style={{ fontSize: 17, fontWeight: 600, margin: 0, textAlign: 'center' }}>Move to folder</h3></div>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <button onClick={() => moveRecordToFolder(null)} style={{ ...buttonStyle, width: '100%', padding: '16px 20px', background: 'transparent', color: Colors.text, display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${Colors.borderLight}`, textAlign: 'left' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: Colors.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted }}><Icons.X size={16} /></div>
                <span style={{ fontWeight: 500 }}>No folder</span>
                {!recordToMove?.folderId && <span style={{ marginLeft: 'auto', color: Colors.primary }}><Icons.Check size={18} /></span>}
              </button>
              {folders.map(folder => (
                <button key={folder.id} onClick={() => moveRecordToFolder(folder.id)} style={{ ...buttonStyle, width: '100%', padding: '16px 20px', background: 'transparent', color: Colors.text, display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${Colors.borderLight}`, textAlign: 'left' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${folder.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: folder.color }}><Icons.Folder size={16} /></div>
                  <span style={{ fontWeight: 500 }}>{folder.name}</span>
                  {recordToMove?.folderId === folder.id && <span style={{ marginLeft: 'auto', color: Colors.primary }}><Icons.Check size={18} /></span>}
                </button>
              ))}
            </div>
            <div style={{ padding: 16 }}><button onClick={() => { setMoveModalOpen(false); setRecordToMove(null) }} style={{ ...buttonStyle, width: '100%', padding: 14, background: Colors.bgSecondary, borderRadius: 12, color: Colors.text, fontSize: 15, fontWeight: 600, border: `1px solid ${Colors.border}` }}>Cancel</button></div>
          </div>
        </div>
      )}

      {goalModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(250, 250, 250, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: Colors.bg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, boxShadow: '0 -4px 40px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ padding: '16px 0 8px', display: 'flex', justifyContent: 'center' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: Colors.border }} /></div>
            <div style={{ padding: '0 24px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Create goal</h2>
                <button onClick={() => setGoalModalOpen(false)} style={{ ...buttonStyle, background: Colors.bgSecondary, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted }}><Icons.X size={18} /></button>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Goal name</label>
                <input value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })} placeholder="e.g. Daily deep work" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Category (optional)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  <button onClick={() => setGoalForm({ ...goalForm, category: '' })} style={{ ...buttonStyle, padding: '10px 14px', borderRadius: 10, background: !goalForm.category ? Colors.primary : Colors.bgSecondary, color: !goalForm.category ? '#fff' : Colors.text, fontSize: 13, fontWeight: 500, border: `1px solid ${!goalForm.category ? Colors.primary : Colors.border}` }}>All</button>
                  {categories.map(cat => {
                    const cc = categoryColors[cat]
                    return <button key={cat} onClick={() => setGoalForm({ ...goalForm, category: cat })} style={{ ...buttonStyle, padding: '10px 14px', borderRadius: 10, background: goalForm.category === cat ? cc.solid : cc.bg, color: goalForm.category === cat ? '#fff' : cc.text, fontSize: 13, fontWeight: 500, border: `1px solid ${goalForm.category === cat ? cc.solid : 'transparent'}` }}>{cat}</button>
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Target hours</label>
                <input type="number" value={goalForm.hours} onChange={e => setGoalForm({ ...goalForm, hours: e.target.value })} placeholder="e.g. 2" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Period</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['daily', 'weekly', 'monthly'] as const).map(p => <button key={p} onClick={() => setGoalForm({ ...goalForm, period: p })} style={{ ...buttonStyle, flex: 1, padding: 14, borderRadius: 12, background: goalForm.period === p ? Colors.primary : Colors.bgSecondary, color: goalForm.period === p ? '#fff' : Colors.text, fontSize: 14, fontWeight: 600, textTransform: 'capitalize', border: `1px solid ${goalForm.period === p ? Colors.primary : Colors.border}` }}>{p}</button>)}
                </div>
              </div>
              <button onClick={addGoal} disabled={!goalForm.name || !goalForm.hours} style={{ ...buttonStyle, width: '100%', padding: 16, background: (!goalForm.name || !goalForm.hours) ? Colors.bgTertiary : Colors.primary, borderRadius: 0, color: (!goalForm.name || !goalForm.hours) ? Colors.textMuted : '#FFFFFF', fontSize: 14, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', border: 'none' }}>Create Goal</button>
            </div>
          </div>
        </div>
      )}

      {folderModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(250, 250, 250, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: Colors.bg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 -4px 40px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ padding: '16px 0 8px', display: 'flex', justifyContent: 'center' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: Colors.border }} /></div>
            <div style={{ padding: '0 24px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Folders</h2>
                <button onClick={() => setFolderModalOpen(false)} style={{ ...buttonStyle, background: Colors.bgSecondary, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted }}><Icons.X size={18} /></button>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Create new folder</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="Folder name" style={{ ...inputStyle, flex: 1 }} onKeyDown={e => e.key === 'Enter' && createFolder()} />
                  <button onClick={createFolder} style={{ ...buttonStyle, width: 48, borderRadius: 12, background: Colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icons.Plus size={20} /></button>
                </div>
              </div>
              {folders.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 12, fontWeight: 600 }}>Your folders</label>
                  <div style={cardStyle}>
                    {folders.map((folder, idx) => {
                      const count = archive.filter(r => r.folderId === folder.id).length
                      return (
                        <div key={folder.id}>
                          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${folder.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: folder.color }}><Icons.Folder size={16} /></div>
                              <div><div style={{ fontSize: 15, fontWeight: 500 }}>{folder.name}</div><div style={{ fontSize: 12, color: Colors.textMuted }}>{count} records</div></div>
                            </div>
                            <button onClick={() => deleteFolder(folder.id)} style={{ ...buttonStyle, background: Colors.dangerLight, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.danger }}><Icons.Trash size={14} /></button>
                          </div>
                          {idx < folders.length - 1 && <div style={{ height: 1, background: Colors.borderLight, marginLeft: 64 }} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {manualEntryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(250, 250, 250, 0.9)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: Colors.bg, borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 -4px 40px rgba(0, 0, 0, 0.08)' }}>
            <div style={{ padding: '16px 0 8px', display: 'flex', justifyContent: 'center' }}><div style={{ width: 40, height: 4, borderRadius: 2, background: Colors.border }} /></div>
            <div style={{ padding: '0 24px 40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Add time manually</h2>
                <button onClick={() => setManualEntryModal(false)} style={{ ...buttonStyle, background: Colors.bgSecondary, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.textMuted }}><Icons.X size={18} /></button>
              </div>
              <p style={{ fontSize: 14, color: Colors.textMuted, marginBottom: 20 }}>Forgot to start the timer? Add the session here.</p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Date</label>
                <input type="date" value={manualEntry.date} onChange={e => setManualEntry({ ...manualEntry, date: e.target.value })} style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Duration</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}><input type="number" value={manualEntry.hours} onChange={e => setManualEntry({ ...manualEntry, hours: e.target.value })} placeholder="0" style={inputStyle} /><div style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 6 }}>Hours</div></div>
                  <div style={{ flex: 1 }}><input type="number" value={manualEntry.minutes} onChange={e => setManualEntry({ ...manualEntry, minutes: e.target.value })} placeholder="0" style={inputStyle} /><div style={{ fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 6 }}>Minutes</div></div>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Name</label>
                <input value={manualEntry.name} onChange={e => setManualEntry({ ...manualEntry, name: e.target.value })} placeholder="What were you working on?" style={inputStyle} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map(cat => {
                    const cc = categoryColors[cat]
                    return <button key={cat} onClick={() => setManualEntry({ ...manualEntry, category: cat })} style={{ ...buttonStyle, padding: '10px 14px', borderRadius: 10, background: manualEntry.category === cat ? cc.solid : cc.bg, color: manualEntry.category === cat ? '#fff' : cc.text, fontSize: 13, fontWeight: 500, border: `1px solid ${manualEntry.category === cat ? cc.solid : 'transparent'}` }}>{cat}</button>
                  })}
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, color: Colors.textMuted, marginBottom: 8, fontWeight: 600 }}>Notes (optional)</label>
                <textarea value={manualEntry.summary} onChange={e => setManualEntry({ ...manualEntry, summary: e.target.value })} placeholder="What did you accomplish?" style={{ ...inputStyle, minHeight: 80, resize: 'none' }} />
              </div>
              <button onClick={addManualEntry} disabled={!manualEntry.hours && !manualEntry.minutes} style={{ ...buttonStyle, width: '100%', padding: 16, background: (!manualEntry.hours && !manualEntry.minutes) ? Colors.bgTertiary : Colors.primary, borderRadius: 0, color: (!manualEntry.hours && !manualEntry.minutes) ? Colors.textMuted : '#FFFFFF', fontSize: 14, fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase', border: 'none' }}>Add to Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
