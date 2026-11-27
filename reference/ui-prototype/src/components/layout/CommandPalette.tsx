import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { CornerDownLeft, FilePlus2, FileText, ListPlus, LogIn, LogOut, Search, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { canAccess } from '@/app/access'
import { accountPages, allItems, tabsFor } from '@/app/nav'
import { setPaletteOpen, usePaletteOpen } from '@/app/shell-state'
import { useViewer } from '@/app/viewer-context'
import { activeEmployees } from '@/features/employees/data'
import { useToast } from '@/components/ui'

type IconType = ComponentType<{ className?: string; strokeWidth?: number }>

interface Entry {
  id: string
  section: 'actions' | 'pages' | 'people'
  label: string
  hint?: string
  icon: IconType
  run: () => void
}

export function CommandPalette() {
  const open = usePaletteOpen()

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !window.location.pathname.startsWith('/messages')) {
        event.preventDefault()
        setPaletteOpen(!open)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null
  return createPortal(<PaletteBody onClose={() => setPaletteOpen(false)} />, document.body)
}

function PaletteBody({ onClose }: { onClose: () => void }) {
  const { t } = useI18n()
  const { role, today, checkIn, checkOut } = useViewer()
  const navigate = useNavigate()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const entries = useMemo<Entry[]>(() => {
    const go = (to: string) => () => navigate(to)
    const list: Entry[] = []
    list.push({ id: 'a-request', section: 'actions', label: t('palette.actionNewRequest'), icon: FilePlus2, run: go('/requests/new') })
    if (canAccess(role, '/tasks/new')) list.push({ id: 'a-task', section: 'actions', label: t('palette.actionNewTask'), icon: ListPlus, run: go('/tasks/new') })
    if (!today.checkIn) {
      list.push({ id: 'a-in', section: 'actions', label: t('palette.actionCheckIn'), icon: LogIn, run: () => { checkIn(); toast.success(t('attendance.checkedIn')) } })
    } else if (!today.checkOut) {
      list.push({ id: 'a-out', section: 'actions', label: t('palette.actionCheckOut'), icon: LogOut, run: () => { checkOut(); toast.success(t('attendance.checkedOut')) } })
    }
    for (const item of allItems(role)) {
      list.push({ id: `p-${item.to}`, section: 'pages', label: t(item.label), icon: item.icon, run: go(item.to) })
      for (const tab of tabsFor(item, role)) {
        if (tab.to !== item.to) list.push({ id: `p-${tab.to}`, section: 'pages', label: t(tab.label), hint: t(item.label), icon: FileText, run: go(tab.to) })
      }
    }
    for (const leaf of accountPages) list.push({ id: `p-${leaf.to}`, section: 'pages', label: t(leaf.label), icon: FileText, run: go(leaf.to) })
    for (const row of activeEmployees()) {
      list.push({
        id: `u-${row.user.user_id}`,
        section: 'people',
        label: row.name,
        hint: row.profile.position,
        icon: UserRound,
        run: go(role === 'hr_admin' ? `/employees/${row.user.user_id}` : `/org-chart/${row.user.user_id}`),
      })
    }
    return list
  }, [t, role, today.checkIn, today.checkOut, checkIn, checkOut, navigate, toast])

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return entries.filter((entry) => entry.section !== 'people').slice(0, 8)
    return entries.filter((entry) => `${entry.label} ${entry.hint ?? ''}`.toLowerCase().includes(needle)).slice(0, 12)
  }, [entries, query])

  const current = Math.min(index, Math.max(0, results.length - 1))

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [current])

  const choose = (entry: Entry | undefined) => {
    if (!entry) return
    onClose()
    entry.run()
  }

  const sections: Entry['section'][] = ['actions', 'pages', 'people']
  const sectionLabel = { actions: t('palette.actions'), pages: t('palette.pages'), people: t('palette.people') }

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label={t('palette.title')}>
      <div className="absolute inset-0 animate-fade-in bg-ink-900/30" onClick={onClose} aria-hidden />
      <div
        className="relative w-full max-w-xl animate-scale-in overflow-hidden rounded-dialog border border-ink-200 bg-white shadow-lg"
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setIndex((value) => Math.min(value + 1, results.length - 1))
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setIndex((value) => Math.max(value - 1, 0))
          }
          if (event.key === 'Enter') {
            event.preventDefault()
            choose(results[current])
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4">
          <Search className="size-5 shrink-0 text-ink-400" strokeWidth={1.75} aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setIndex(0)
            }}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            role="combobox"
            aria-expanded
            aria-controls="palette-list"
            className="h-14 flex-1 bg-transparent text-md text-ink-900 outline-none placeholder:text-ink-400"
          />
          <kbd className="rounded border border-ink-200 px-1.5 py-0.5 text-xs text-ink-500" dir="ltr">
            Esc
          </kbd>
        </div>
        {results.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-500">{t('palette.empty')}</p>
        ) : (
          <ul id="palette-list" ref={listRef} role="listbox" className="scrollbar-thin max-h-[50vh] overflow-y-auto p-2">
            {sections.map((section) => {
              const group = results.filter((entry) => entry.section === section)
              if (group.length === 0) return null
              return (
                <li key={section} role="presentation">
                  <p className="px-3 pt-2 pb-1 text-xs font-medium text-ink-500">{sectionLabel[section]}</p>
                  <ul role="presentation">
                    {group.map((entry) => {
                      const position = results.indexOf(entry)
                      const selected = position === current
                      const Icon = entry.icon
                      return (
                        <li
                          key={entry.id}
                          role="option"
                          aria-selected={selected}
                          onMouseMove={() => setIndex(position)}
                          onClick={() => choose(entry)}
                          className={cn('flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-sm', selected ? 'bg-brand-50 text-brand-800' : 'text-ink-800')}
                        >
                          <Icon className={cn('size-[18px] shrink-0', selected ? 'text-brand-600' : 'text-ink-500')} strokeWidth={1.75} />
                          <span className="flex-1 truncate">{entry.label}</span>
                          {entry.hint && <span className="truncate text-xs text-ink-500">{entry.hint}</span>}
                          {selected && <CornerDownLeft className="size-4 text-brand-600 rtl:-scale-x-100" strokeWidth={1.75} aria-hidden />}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
