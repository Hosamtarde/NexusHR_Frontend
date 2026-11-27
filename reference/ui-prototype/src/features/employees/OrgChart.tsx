import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { GitBranch, LocateFixed, Minus, Network, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useSample, useTabParam } from '@/lib/sample'
import { useViewer } from '@/app/viewer-context'
import { Button, EmptyState, ErrorState, Field, IconButton, Modal, PageHeader, Panel, Segmented, Select, SkeletonRows, useToast } from '@/components/ui'
import { ListPanel, RowActions } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell, PersonStack } from '@/components/shared/Person'
import { useTick } from '@/store/collections'
import { changeManager } from '@/store'
import { activeEmployees, departmentOptions, directReports, employeeRow, type EmployeeRow } from './data'

const views = ['chart', 'list', 'me'] as const
type View = (typeof views)[number]

const rootRow = () => activeEmployees().find((row) => row.profile.reports_to === null) ?? null

const descendants = (id: number): Set<number> => {
  const out = new Set<number>()
  const walk = (current: number) => directReports(current).forEach((kid) => (out.has(kid.user.user_id) ? undefined : (out.add(kid.user.user_id), walk(kid.user.user_id))))
  walk(id)
  return out
}

const chainOf = (id: number): number[] => {
  const out = [id]
  let current = employeeRow(id)?.profile.reports_to ?? null
  while (current !== null && !out.includes(current)) {
    out.push(current)
    current = employeeRow(current)?.profile.reports_to ?? null
  }
  return out
}

const isActive = (id: number) => activeEmployees().some((row) => row.user.user_id === id)

function MeBadge() {
  const { t } = useI18n()
  return <span className="inline-flex shrink-0 items-center rounded-full bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">{t('em.org.you')}</span>
}

interface Marks {
  meId: number
  ancestors: Set<number>
  pulse: number
}

function NodeBox({ row, highlight, onOpen, depthLimit, marks }: { row: EmployeeRow; highlight?: boolean; onOpen?: (id: number) => void; depthLimit: boolean; marks: Marks }) {
  const { t } = useI18n()
  const { role } = useViewer()
  const reports = directReports(row.user.user_id).length
  const isMe = row.user.user_id === marks.meId
  const onPath = marks.ancestors.has(row.user.user_id)
  return (
    <div
      data-me={isMe ? 'true' : undefined}
      aria-current={isMe ? 'true' : undefined}
      key={isMe ? marks.pulse : undefined}
      className={cn(
        'relative flex w-64 flex-col gap-2.5 rounded-surface border p-4 shadow-card',
        isMe ? 'border-2 border-brand-600 bg-brand-50 ring-4 ring-brand-100 motion-safe:animate-[org-pulse_1.4s_ease-out_1]' : onPath ? 'border-ink-200/80 border-s-4 border-s-brand-500 bg-white' : highlight ? 'border-brand-400 bg-white ring-3 ring-brand-100' : 'border-ink-200/80 bg-white',
      )}
    >
      {isMe && <span className="absolute -top-3 end-4 rounded-full bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">{t('em.org.you')}</span>}
      <PersonCell userId={row.user.user_id} size="md" to={role === 'hr_admin' ? `/employees/${row.user.user_id}` : `/org-chart/${row.user.user_id}`} />
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate text-ink-500">{row.department?.department_name}</span>
        {reports > 0 && <span className="tabular shrink-0 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{t('em.org.reports', { n: reports })}</span>}
      </div>
      {depthLimit && reports > 0 && onOpen && (
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onOpen(row.user.user_id)} className="inline-flex items-center justify-center gap-1.5 rounded-control border border-ink-200 px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">
          <GitBranch className="size-3.5" strokeWidth={1.75} />
          {t('em.org.openBranch')}
        </button>
      )}
    </div>
  )
}

function Tree({ row, depth, onOpen, marks }: { row: EmployeeRow; depth: number; onOpen: (id: number) => void; marks: Marks }) {
  const kids = depth < 2 ? directReports(row.user.user_id) : []
  const onPathIndex = kids.findIndex((kid) => kid.user.user_id === marks.meId || marks.ancestors.has(kid.user.user_id))
  const center = (kids.length - 1) / 2
  const line = (on: boolean) => (on ? 'bg-brand-400' : 'bg-ink-300')
  const lowerOn = (j: number) => onPathIndex >= 0 && ((onPathIndex > center && j > center && j <= onPathIndex) || (onPathIndex < center && j <= center && j > onPathIndex))
  const higherOn = (j: number) => onPathIndex >= 0 && ((onPathIndex > center && j >= center && j < onPathIndex) || (onPathIndex < center && j < center && j >= onPathIndex))
  return (
    <div className="flex flex-col items-center">
      <NodeBox row={row} highlight={depth === 0} onOpen={onOpen} depthLimit={depth === 2} marks={marks} />
      {kids.length > 0 && (
        <>
          <span className={cn('h-6 w-px', line(onPathIndex >= 0))} aria-hidden />
          <div className="flex items-start">
            {kids.map((kid, index) => (
              <div key={kid.user.user_id} className="relative flex flex-col items-center px-2 pt-6">
                <span className={cn('absolute top-0 start-1/2 h-6 w-px', line(index === onPathIndex))} aria-hidden />
                {kids.length > 1 && index > 0 && <span className={cn('absolute top-0 h-px start-0 end-1/2', line(lowerOn(index)))} aria-hidden />}
                {kids.length > 1 && index < kids.length - 1 && <span className={cn('absolute top-0 h-px start-1/2 end-0', line(higherOn(index)))} aria-hidden />}
                <Tree row={kid} depth={depth + 1} onOpen={onOpen} marks={marks} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ChartView({ rootId, onOpen, auto }: { rootId: number | null; onOpen: (id: number | null) => void; auto: boolean }) {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const [zoom, setZoom] = useState(1)
  const [pulse, setPulse] = useState(0)
  const [focus, setFocus] = useState(0)
  const autoDone = useRef(false)
  const box = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const root = rootId ? employeeRow(rootId) : rootRow()
  const { status, data, retry } = useSample(() => root, null)
  const rootKey = data?.user.user_id
  const chain = chainOf(userId)
  const marks: Marks = { meId: isActive(userId) ? userId : -1, ancestors: new Set(isActive(userId) ? chain.slice(1) : []), pulse }

  useLayoutEffect(() => {
    const node = box.current
    if (node) node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2
  }, [rootKey, status])

  const centerOnMe = useCallback(() => {
    const node = box.current
    const me = node?.querySelector<HTMLElement>('[data-me]')
    if (!node || !me) return false
    const a = node.getBoundingClientRect()
    const b = me.getBoundingClientRect()
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    node.scrollTo({ left: node.scrollLeft + (b.left + b.width / 2) - (a.left + a.width / 2), top: node.scrollTop + (b.top + b.height / 2) - (a.top + a.height / 2), behavior: calm ? 'auto' : 'smooth' })
    setPulse((value) => value + 1)
    return true
  }, [])

  const reveal = useCallback(() => {
    const k = data ? chain.indexOf(data.user.user_id) : -1
    if (k < 0 || k > 2) onOpen(chain.length - 1 <= 2 ? null : chain[2]!)
  }, [chain, data, onOpen])

  const findMe = () => {
    if (!isActive(userId)) return void toast.info(t('em.org.notInChart'))
    reveal()
    setZoom(1)
    setFocus((value) => value + 1)
  }

  useEffect(() => {
    if (!focus || status !== 'ready') return
    const frame = window.requestAnimationFrame(() => centerOnMe())
    return () => window.cancelAnimationFrame(frame)
  }, [focus, rootKey, status, centerOnMe])

  useEffect(() => {
    if (!auto || autoDone.current || status !== 'ready' || !data || !isActive(userId)) return
    autoDone.current = true
    const node = box.current
    const me = node?.querySelector<HTMLElement>('[data-me]')
    if (!me) {
      reveal()
      setFocus((value) => value + 1)
      return
    }
    if (node) {
      const a = node.getBoundingClientRect()
      const b = me.getBoundingClientRect()
      const visible = b.left >= a.left && b.right <= a.right && b.top >= a.top && b.bottom <= a.bottom
      if (!visible) setFocus((value) => value + 1)
    }
  }, [auto, status, data, userId, reveal])

  const down = (event: PointerEvent<HTMLDivElement>) => {
    const node = box.current
    if (!node) return
    drag.current = { x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop }
    node.setPointerCapture(event.pointerId)
  }
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const node = box.current
    if (!drag.current || !node) return
    node.scrollLeft = drag.current.left - (event.clientX - drag.current.x)
    node.scrollTop = drag.current.top - (event.clientY - drag.current.y)
  }
  const up = () => {
    drag.current = null
  }
  const clamp = (value: number) => Math.min(1.6, Math.max(0.5, Math.round(value * 10) / 10))
  return (
    <Panel flush>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600">
          <Button size="sm" variant="secondary" icon={LocateFixed} onClick={findMe}>
            {t('em.org.myPlace')}
          </Button>
          {rootId && (
            <Button size="sm" variant="secondary" onClick={() => onOpen(null)}>
              {t('em.org.fromTop')}
            </Button>
          )}
          <span>{t('em.org.panHint')}</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton icon={Minus} label={t('em.org.zoomOut')} size="sm" onClick={() => setZoom((value) => clamp(value - 0.1))} />
          <span className="tabular w-12 text-center text-sm text-ink-700">{Math.round(zoom * 100)}%</span>
          <IconButton icon={Plus} label={t('em.org.zoomIn')} size="sm" onClick={() => setZoom((value) => clamp(value + 0.1))} />
          <IconButton icon={RotateCcw} label={t('em.org.zoomReset')} size="sm" onClick={() => setZoom(1)} />
        </div>
      </div>
      {status === 'loading' ? (
        <div className="p-5"><SkeletonRows rows={6} /></div>
      ) : status === 'error' ? (
        <ErrorState onRetry={retry} compact />
      ) : !data ? (
        <EmptyState icon={Network} title={t('k.noResults')} />
      ) : (
        <div ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} className="scrollbar-thin h-[min(72vh,760px)] min-h-[520px] cursor-grab touch-none overflow-auto bg-ink-25 active:cursor-grabbing" dir="ltr">
          <div className="inline-block min-w-full px-[35vw] pt-10 pb-[45vh]" style={{ zoom }}>
            <div className="flex justify-center" dir={document.documentElement.dir}>
              <Tree row={data} depth={0} onOpen={onOpen} marks={marks} />
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}

function ChangeManagerDialog({ row, onClose }: { row: EmployeeRow; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const blocked = descendants(row.user.user_id)
  const [manager, setManager] = useState(String(row.profile.reports_to ?? ''))
  const [error, setError] = useState('')
  const options = activeEmployees().filter((item) => item.user.user_id !== row.user.user_id && !blocked.has(item.user.user_id))
  const isRoot = row.profile.reports_to === null
  const save = () => {
    const next = manager ? Number(manager) : null
    if (next === null && !isRoot) return setError(t('em.org.errRoot'))
    if (next !== null && (next === row.user.user_id || blocked.has(next))) return setError(t('em.org.errCycle'))
    if (next === row.profile.reports_to) return onClose()
    changeManager(row.user.user_id, next, userId)
    toast.success(t('em.org.changed', { name: row.name }))
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={t('em.org.changeTitle', { name: row.name })}
      description={t('em.org.changeDesc')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('act.cancel')}</Button>
          <Button onClick={save}>{t('act.save')}</Button>
        </>
      }
    >
      <Field label={t('k.manager')} error={error || undefined} hint={t('em.org.cycleHint')}>
        <Select value={manager} onChange={(event) => { setManager(event.target.value); setError('') }} options={[...(isRoot ? [{ value: '', label: t('em.form.noManager') }] : []), ...options.map((item) => ({ value: item.user.user_id, label: item.name }))]} />
      </Field>
    </Modal>
  )
}

function ListView() {
  const { t } = useI18n()
  const toast = useToast()
  const { role, userId } = useViewer()
  const tick = useTick('people')
  void tick
  const [editing, setEditing] = useState<EmployeeRow | null>(null)
  const [want, setWant] = useState(0)
  const [flash, setFlash] = useState(false)
  const rows = activeEmployees().slice().sort((a, b) => Number(b.profile.reports_to === null) - Number(a.profile.reports_to === null) || a.user.first_name.localeCompare(b.user.first_name))
  const filters: FilterDef<EmployeeRow>[] = [
    { key: 'dept', label: t('k.department'), allLabel: t('k.allDepartments'), options: departmentOptions(), test: (row, value) => String(row.profile.department_id) === value },
    { key: 'manager', label: t('k.manager'), allLabel: t('em.org.allManagers'), options: [...new Set(rows.map((row) => row.profile.reports_to).filter((id): id is number => id !== null))].map((id) => ({ value: id, label: employeeRow(id)?.name ?? '' })), test: (row, value) => String(row.profile.reports_to ?? '') === value },
  ]
  const list = useList({ rows, filters, search: (row) => `${row.name} ${row.profile.position}`, sorters: { name: (a, b) => a.name.localeCompare(b.name), reports: (a, b) => directReports(a.user.user_id).length - directReports(b.user.user_id).length } })
  const meRow = rows.find((row) => row.user.user_id === userId)
  const { filtered, limit, setPage, setQ, setValue, q, values } = list

  const findMe = () => {
    if (!meRow) return void toast.info(t('em.org.notInChart'))
    if (q || Object.values(values).some(Boolean)) {
      setQ('')
      for (const filter of filters) setValue(filter.key, '')
    }
    setWant((value) => value + 1)
  }

  useEffect(() => {
    if (!want || !meRow) return
    const index = filtered.findIndex((row) => row.user.user_id === userId)
    if (index < 0) {
      if (!q) setQ(meRow.name)
      return
    }
    setPage(Math.floor(index / limit) + 1)
    const frame = window.requestAnimationFrame(() => {
      const target = [...document.querySelectorAll<HTMLElement>('[data-me]')].find((node) => node.offsetParent !== null)
      target?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      setFlash(true)
    })
    const stop = window.setTimeout(() => setFlash(false), 1800)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(stop)
    }
  }, [want, filtered, limit, meRow, userId, q, setPage, setQ])

  return (
    <>
      <ListPanel
        noun="employee"
        list={list}
        searchPlaceholder={t('em.org.search')}
        caption={t('em.org.title')}
        rowKey={(row) => row.user.user_id}
        rowLabel={(row) => row.name}
        markKey={meRow?.user.user_id}
        flashMark={flash}
        toolbar={
          <Button variant="secondary" icon={LocateFixed} onClick={findMe}>
            {t('em.org.myPlace')}
          </Button>
        }
        empty={<EmptyState icon={Network} title={t('k.noResults')} />}
        columns={[
          {
            key: 'name',
            header: t('k.employee'),
            mobile: 'primary',
            sortable: true,
            cell: (row) => (
              <div className="flex flex-wrap items-center gap-2">
                <PersonCell userId={row.user.user_id} card />
                {row.user.user_id === userId && <MeBadge />}
              </div>
            ),
          },
          { key: 'dept', header: t('k.department'), mobile: 'hidden', cell: (row) => row.department?.department_name ?? '—' },
          { key: 'manager', header: t('k.manager'), cell: (row) => (row.profile.reports_to ? <PersonCell userId={row.profile.reports_to} size="xs" compact /> : <span className="text-ink-500">{t('k.none')}</span>) },
          { key: 'reports', header: t('em.profile.reports'), mobile: 'aside', sortable: true, cell: (row) => <PersonStack userIds={directReports(row.user.user_id).map((item) => item.user.user_id)} size="xs" /> },
          ...(role === 'hr_admin'
            ? [{ key: 'actions', header: <span className="sr-only">{t('k.actions')}</span>, mobile: 'hidden' as const, align: 'end' as const, cell: (row: EmployeeRow) => <RowActions actions={[{ label: t('k.view'), to: `/employees/${row.user.user_id}` }, { label: t('em.org.change'), onSelect: () => setEditing(row) }]} /> }]
            : []),
        ]}
      />
      {editing && <ChangeManagerDialog key={editing.user.user_id} row={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function Circle({ id }: { id: number }) {
  const { t } = useI18n()
  const row = employeeRow(id)
  if (!row) return <EmptyState icon={Network} title={t('k.notFound')} />
  const chain: EmployeeRow[] = []
  let cursor = row.manager ? employeeRow(row.manager.user_id) : null
  while (cursor) {
    chain.unshift(cursor)
    cursor = cursor.manager ? employeeRow(cursor.manager.user_id) : null
  }
  const peers = row.profile.reports_to ? directReports(row.profile.reports_to).filter((peer) => peer.user.user_id !== id) : []
  const reports = directReports(id)
  const group = (title: string, people: EmployeeRow[]): ReactNode => (
    <Panel title={title}>
      {people.length === 0 ? (
        <p className="text-sm text-ink-500">{t('em.org.none')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {people.map((person) => (
            <li key={person.user.user_id}>
              <PersonCell userId={person.user.user_id} card />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
  return (
    <div className="flex flex-col gap-6">
      <Panel title={t('em.org.me')}>
        <div data-me="true" aria-current="true" className="flex flex-wrap items-center gap-3 rounded-surface border-2 border-brand-600 bg-brand-50 p-3">
          <PersonCell userId={id} size="md" card />
          <MeBadge />
        </div>
      </Panel>
      <div className="grid gap-6 md:grid-cols-3">
        {group(t('em.org.chain'), chain)}
        {group(t('em.org.peers'), peers)}
        {group(t('em.org.direct'), reports)}
      </div>
    </div>
  )
}

export function OrgChartPage({ forceView }: { forceView?: View }) {
  const { t } = useI18n()
  const { userId } = useViewer()
  const params = useParams()
  const tick = useTick('people')
  void tick
  const navigate = useNavigate()
  const [tab, setTab] = useTabParam(views, 'chart', 'view')
  const view = forceView ?? tab
  const change = (next: View) => {
    if (forceView) navigate(next === 'me' ? '/org-chart/me' : `/org-chart?view=${next}`)
    else setTab(next)
  }
  const [branch, setBranch] = useState<number | null>(params.userId ? Number(params.userId) : null)
  return (
    <div>
      <PageHeader
        title={t('em.org.title')}

        actions={
          <Segmented
            label={t('em.org.title')}
            value={view}
            onChange={change}
            options={[
              { value: 'chart', label: t('em.org.viewChart') },
              { value: 'list', label: t('em.org.viewList') },
              { value: 'me', label: t('em.org.viewMe') },
            ]}
          />
        }
      />
      {view === 'chart' && <ChartView rootId={branch} onOpen={setBranch} auto={!params.userId} />}
      {view === 'list' && <ListView />}
      {view === 'me' && <Circle id={userId} />}
    </div>
  )
}
