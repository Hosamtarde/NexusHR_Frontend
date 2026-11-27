import { useState, type FormEvent } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useQueryParam, useSample } from '@/lib/sample'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, EmptyState, ErrorState, Field, IconButton, Input, MenuDivider, MenuItem, Modal, PageHeader, Panel, Popover, Select, SkeletonRows, Textarea, useToast } from '@/components/ui'
import { ListPanel } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell, PersonStack } from '@/components/shared/Person'
import { SkillDrawer } from './SkillDrawer'
import { LevelDots } from './LevelDots'
import { bump, useTick } from '@/store/collections'
import { departments, getProfile } from '@/features/employees/data'
import { departmentMatrix, holdersOf, levelLabels, removeSkillFrom, saveSkill, setSkillLevel, skillCategoryLabels, skills, skillsOf, type Skill, type SkillCategory, type SkillLevel } from './data'

const categories = Object.keys(skillCategoryLabels) as SkillCategory[]
const levels: SkillLevel[] = [1, 2, 3, 4, 5]

function SkillModal({ skill, onClose }: { skill: Skill | null; onClose: () => void }) {
  const { t } = useI18n()
  const toast = useToast()
  const [name, setName] = useState(skill?.skill_name ?? '')
  const [category, setCategory] = useState<SkillCategory>(skill?.category ?? 'technical')
  const [description, setDescription] = useState(skill?.description ?? '')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return setError(t('k.required'))
    saveSkill(name.trim(), category, description.trim(), skill?.skill_id)
    bump('skills')
    toast.success(skill ? t('sk.cat.saved') : t('sk.cat.added', { name: name.trim() }))
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={skill ? t('sk.cat.edit') : t('sk.cat.add')} footer={<><Button variant="secondary" onClick={onClose}>{t('k.cancel')}</Button><Button type="submit" form="skill-form">{t('act.save')}</Button></>}>
      <form id="skill-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label={t('sk.cat.skill')} required error={error}><Input value={name} onChange={(e) => { setName(e.target.value); setError('') }} /></Field>
        <Field label={t('sk.cat.category')}><Select value={category} onChange={(e) => setCategory(e.target.value as SkillCategory)} options={categories.map((c) => ({ value: c, label: skillCategoryLabels[c] }))} /></Field>
        <Field label={t('sk.cat.description')} optional><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </form>
    </Modal>
  )
}

export function SkillCatalogPage() {
  const { t } = useI18n()
  const { role } = useViewer()
  const tick = useTick('skills')
  void tick
  const [editing, setEditing] = useState<Skill | null | undefined>(undefined)
  const [selected, setSelected] = useQueryParam('skill')
  const rows = skills.map((skill) => {
    const holders = holdersOf(skill.skill_id)
    return { skill, holders, count: holders.length, avg: holders.length ? holders.reduce((sum, item) => sum + item.level, 0) / holders.length : 0 }
  })
  const filters: FilterDef<(typeof rows)[number]>[] = [{ key: 'cat', label: t('sk.cat.category'), allLabel: t('sk.cat.allCats'), options: categories.map((c) => ({ value: c, label: skillCategoryLabels[c] })), test: (row, v) => row.skill.category === v }]
  const list = useList({
    rows,
    search: (row) => `${row.skill.skill_name} ${row.skill.description}`,
    filters,
    sorters: { name: (a, b) => a.skill.skill_name.localeCompare(b.skill.skill_name), count: (a, b) => a.count - b.count, avg: (a, b) => a.avg - b.avg },
    initialSort: { key: 'name', dir: 'asc' },
  })
  const viewing = selected ? (skills.find((skill) => String(skill.skill_id) === selected) ?? null) : null
  return (
    <div>
      <PageHeader title={t('sk.cat.title')} actions={role === 'hr_admin' && <Button icon={Plus} onClick={() => setEditing(null)}>{t('sk.cat.add')}</Button>} />
      <ListPanel
        noun="skill"
        list={list}
        searchPlaceholder={t('sk.cat.search')}
        caption={t('sk.cat.title')}
        rowKey={(row) => row.skill.skill_id}
        rowHref={(row) => `/employees/skills?skill=${row.skill.skill_id}`}
        rowLabel={(row) => row.skill.skill_name}
        empty={<EmptyState icon={Sparkles} title={t('sk.cat.empty')} />}
        columns={[
          { key: 'name', header: t('sk.cat.skill'), mobile: 'primary', sortable: true, cell: (row) => <span><span className="block font-medium text-ink-900">{row.skill.skill_name}</span><span className="block max-w-sm truncate text-xs text-ink-500">{row.skill.description}</span></span> },
          { key: 'cat', header: t('sk.cat.category'), mobile: 'hidden', cell: (row) => <Badge>{skillCategoryLabels[row.skill.category]}</Badge> },
          { key: 'count', header: t('sk.cat.holders'), sortable: true, cell: (row) => <PersonStack userIds={row.holders.map((item) => item.user_id)} size="xs" /> },
          { key: 'avg', header: t('sk.cat.avg'), mobile: 'aside', sortable: true, cell: (row) => (row.count ? <span className="flex items-center gap-2"><LevelDots level={Math.round(row.avg)} label={levelLabels[Math.max(1, Math.round(row.avg)) as SkillLevel]} /><span className="tabular text-xs text-ink-500">{row.avg.toFixed(1)}</span></span> : '—') },
          { key: 'view', header: <span className="sr-only">{t('k.actions')}</span>, mobile: 'hidden', align: 'end', cell: (row) => <Button size="sm" variant="secondary" onClick={() => setSelected(String(row.skill.skill_id))}>{t('k.view')}</Button> },
        ]}
      />
      {editing !== undefined && <SkillModal key={editing?.skill_id ?? 'new'} skill={editing} onClose={() => setEditing(undefined)} />}
      <SkillDrawer skill={viewing} onClose={() => setSelected('')} onEdit={(skill) => { setSelected(''); setEditing(skill) }} />
    </div>
  )
}

const cellTone: Record<number, string> = {
  0: 'bg-ink-50 text-ink-300',
  1: 'bg-brand-50 text-brand-800',
  2: 'bg-brand-100 text-brand-800',
  3: 'bg-brand-300 text-brand-950',
  4: 'bg-brand-500 text-white',
  5: 'bg-brand-700 text-white',
}

export function SkillMatrixPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { role, userId } = useViewer()
  const tick = useTick('skills')
  void tick
  const own = getProfile(userId)?.department_id ?? departments[0]?.department_id ?? 1
  const [dept, setDept] = useState(String(own))
  const [focus, setFocus] = useState<number | null>(null)
  const [drawer, setDrawer] = useState<Skill | null>(null)
  const departmentId = role === 'hr_admin' ? Number(dept) : own
  const { status, data, retry } = useSample(() => departmentMatrix(departmentId), null)
  const members = data ? (role === 'employee' ? data.members.filter((m) => m.user.user_id === userId) : data.members) : []
  const gaps = data ? data.columns.filter((skill) => Math.max(0, ...data.members.map((m) => data.level(m.user.user_id, skill.skill_id))) <= 3) : []
  const editable = role !== 'employee'
  const set = (memberId: number, skillId: number, level: SkillLevel, name: string) => {
    setSkillLevel(memberId, skillId, level)
    bump('skills')
    toast.success(t('sk.matrix.saved', { name }))
  }
  const clear = (memberId: number, skillId: number, name: string) => {
    removeSkillFrom(memberId, skillId)
    bump('skills')
    toast.success(t('sk.matrix.removed', { name }))
  }
  return (
    <div>
      <PageHeader title={t('sk.matrix.title')} actions={role === 'hr_admin' && <Select aria-label={t('sk.matrix.department')} value={dept} onChange={(e) => setDept(e.target.value)} options={departments.map((d) => ({ value: d.department_id, label: d.department_name }))} />} />
      <Panel flush>
        {status === 'loading' ? <SkeletonRows rows={6} /> : status === 'error' ? <ErrorState onRetry={retry} /> : !data || data.columns.length === 0 ? <EmptyState icon={Sparkles} title={t('sk.matrix.empty')} /> : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t('sk.matrix.title')}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky start-0 z-[2] bg-brand-50 px-4 py-3 text-start font-medium text-ink-500">{t('k.employee')}</th>
                  {data.columns.map((skill) => (
                    <th key={skill.skill_id} scope="col" className="bg-brand-50/70 px-2 py-3 text-center text-xs font-medium text-ink-600">
                      <button type="button" onClick={() => setDrawer(skill)} className="mx-auto block max-w-24 rounded text-brand-700 hover:underline">{skill.skill_name}</button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.user.user_id} className="group border-t border-ink-100 even:bg-ink-600/[0.035] hover:bg-brand-600/[0.08] hover:even:bg-brand-600/[0.08]">
                    <th scope="row" className="sticky start-0 z-[1] bg-white px-4 py-2 text-start font-normal group-even:bg-[color-mix(in_srgb,var(--color-ink-600)_3.5%,white)] group-hover:bg-[color-mix(in_srgb,var(--color-brand-600)_8%,white)]">
                      <PersonCell userId={member.user.user_id} subtitle={null} to={role === 'hr_admin' ? `/employees/${member.user.user_id}` : `/org-chart/${member.user.user_id}`} />
                    </th>
                    {data.columns.map((skill) => {
                      const level = data.level(member.user.user_id, skill.skill_id)
                      const dim = focus !== null && level !== focus
                      const tile = (
                        <span className={cn('tabular mx-auto grid h-9 w-12 place-items-center rounded-md text-sm font-semibold transition-opacity', cellTone[level], dim && 'opacity-25')}>
                          {level || '·'}
                        </span>
                      )
                      const label = t('sk.matrix.cell', { name: member.name, skill: skill.skill_name, level: level ? levelLabels[level as SkillLevel] : t('sk.matrix.none') })
                      return (
                        <td key={skill.skill_id} className="p-1 text-center">
                          {editable ? (
                            <Popover
                              align="start"
                              minWidth={176}
                              className="p-1.5"
                              trigger={({ toggle, open, id }) => (
                                <button type="button" aria-label={label} title={label} aria-expanded={open} aria-controls={id} onClick={toggle} className="rounded-md focus-visible:ring-2 focus-visible:ring-brand-500">
                                  {tile}
                                </button>
                              )}
                            >
                              {(close) => (
                                <div role="menu">
                                  {levels.map((value) => (
                                    <MenuItem key={value} onSelect={() => { set(member.user.user_id, skill.skill_id, value, member.name); close() }}>
                                      <span className={cn('tabular grid size-6 place-items-center rounded text-xs font-semibold', cellTone[value])}>{value}</span>
                                      {levelLabels[value]}
                                    </MenuItem>
                                  ))}
                                  {level > 0 && (
                                    <>
                                      <MenuDivider />
                                      <MenuItem tone="danger" onSelect={() => { clear(member.user.user_id, skill.skill_id, member.name); close() }}>{t('act.remove')}</MenuItem>
                                    </>
                                  )}
                                </div>
                              )}
                            </Popover>
                          ) : (
                            <span title={label}>{tile}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {data && data.columns.length > 0 && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Panel title={t('sk.matrix.legend')}>
            <ul className="flex flex-wrap gap-2">
              {levels.map((level) => (
                <li key={level}>
                  <button type="button" aria-pressed={focus === level} onClick={() => setFocus(focus === level ? null : level)} className={cn('flex items-center gap-2 rounded-control border px-2 py-1 text-sm', focus === level ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:bg-ink-50')}>
                    <span className={cn('tabular grid size-6 place-items-center rounded-md font-semibold', cellTone[level])}>{level}</span>
                    {levelLabels[level]}
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={t('sk.matrix.gap')}>
            {gaps.length === 0 ? <p className="text-sm text-ink-500">{t('sk.matrix.noGaps')}</p> : <div className="flex flex-wrap gap-2">{gaps.map((skill) => <button key={skill.skill_id} type="button" onClick={() => setDrawer(skill)} className="rounded-full"><Badge tone="warning">{skill.skill_name}</Badge></button>)}</div>}
          </Panel>
        </div>
      )}
      <SkillDrawer skill={drawer} onClose={() => setDrawer(null)} />
    </div>
  )
}

export function MySkillsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { userId } = useViewer()
  const tick = useTick('skills')
  void tick
  const [pick, setPick] = useState('')
  const [level, setLevel] = useState<string>('3')
  const mine = skillsOf(userId)
  const { status, data, retry } = useSample(() => mine, [])
  const taken = new Set(mine.map((item) => item.skill_id))
  const add = (event: FormEvent) => {
    event.preventDefault()
    const skill = skills.find((item) => String(item.skill_id) === pick)
    if (!skill) return
    setSkillLevel(userId, skill.skill_id, Number(level) as SkillLevel)
    bump('skills')
    toast.success(t('sk.me.added', { name: skill.skill_name }))
    setPick('')
  }
  return (
    <div>
      <PageHeader title={t('sk.me.title')} meta={<span className="text-sm text-ink-500">{t('sk.me.summary', { n: mine.length, v: mine.filter((item) => item.verified).length })}</span>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel>
          {status === 'loading' ? <SkeletonRows rows={5} /> : status === 'error' ? <ErrorState onRetry={retry} /> : data.length === 0 ? <EmptyState icon={Sparkles} title={t('sk.me.empty')} /> : (
            <ul className="divide-y divide-ink-100">
              {data.map((item) => (
                <li key={item.skill_id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink-900">{item.skill.skill_name}</p>
                    <p className="text-xs text-ink-500">{skillCategoryLabels[item.skill.category]} · {item.verified ? t('sk.me.verified') : t('sk.me.pending')}</p>
                  </div>
                  <Select aria-label={t('sk.me.level')} value={String(item.level)} onChange={(e) => { setSkillLevel(userId, item.skill_id, Number(e.target.value) as SkillLevel); bump('skills'); toast.success(t('sk.me.saved', { name: item.skill.skill_name })) }} options={levels.map((value) => ({ value, label: `${value} · ${levelLabels[value]}` }))} className="w-44" />
                  <IconButton icon={Trash2} label={t('act.remove')} onClick={() => { removeSkillFrom(userId, item.skill_id); bump('skills'); toast.success(t('sk.me.removed', { name: item.skill.skill_name })) }} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={t('sk.me.add')}>
          <form onSubmit={add} className="flex flex-col gap-4">
            <Field label={t('sk.cat.skill')}><Select value={pick} placeholder={t('sk.me.pick')} onChange={(e) => setPick(e.target.value)} options={skills.filter((s) => !taken.has(s.skill_id)).map((s) => ({ value: s.skill_id, label: s.skill_name }))} /></Field>
            <Field label={t('sk.me.level')}><Select value={level} onChange={(e) => setLevel(e.target.value)} options={levels.map((value) => ({ value, label: `${value} · ${levelLabels[value]}` }))} /></Field>
            <Button type="submit" icon={Plus} disabled={!pick}>{t('sk.me.add')}</Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
