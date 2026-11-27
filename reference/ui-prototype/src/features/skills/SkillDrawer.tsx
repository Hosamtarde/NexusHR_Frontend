import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Pencil, Plus, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { canAccess } from '@/app/access'
import { Badge, Button, Drawer, Field, SearchInput, Select, useToast } from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { bump, useTick } from '@/store/collections'
import { activeEmployees, userName } from '@/features/employees/data'
import { holdersOf, levelLabels, setSkillLevel, skillCategoryLabels, type Skill, type SkillLevel } from './data'
import { LevelDots } from './LevelDots'

const levels: SkillLevel[] = [1, 2, 3, 4, 5]

interface SkillDrawerProps {
  skill: Skill | null
  onClose: () => void
  onEdit?: (skill: Skill) => void
}

export function SkillDrawer({ skill, onClose, onEdit }: SkillDrawerProps) {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { role } = useViewer()
  const tick = useTick('skills')
  void tick
  const [level, setLevel] = useState('')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(false)
  const [newOwner, setNewOwner] = useState('')
  const [newLevel, setNewLevel] = useState('3')
  const holders = skill ? holdersOf(skill.skill_id) : []
  const avg = holders.length ? holders.reduce((sum, item) => sum + item.level, 0) / holders.length : 0
  const distribution = levels.map((value) => ({ value, count: holders.filter((item) => item.level === value).length }))
  const peak = Math.max(1, ...distribution.map((item) => item.count))
  const shown = holders
    .filter((item) => (!level || String(item.level) === level) && (!q.trim() || userName(item.user_id).toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => b.level - a.level)
  const owners = new Set(holders.map((item) => item.user_id))
  const candidates = activeEmployees().filter((row) => !owners.has(row.user.user_id))
  const staff = role !== 'employee'

  const addOwner = () => {
    if (!skill || !newOwner) return
    setSkillLevel(Number(newOwner), skill.skill_id, Number(newLevel) as SkillLevel)
    bump('skills')
    toast.success(t('sk.drawer.added', { name: userName(Number(newOwner)) }))
    setAdding(false)
    setNewOwner('')
  }

  return (
    <Drawer
      open={skill !== null}
      onClose={onClose}
      title={skill?.skill_name ?? ''}
      description={skill ? skillCategoryLabels[skill.category] : undefined}
      footer={
        skill && (
          <>
            {role === 'hr_admin' && onEdit && (
              <Button variant="secondary" icon={Pencil} onClick={() => onEdit(skill)}>
                {t('sk.drawer.edit')}
              </Button>
            )}
            {staff && canAccess(role, '/tasks/smart') && (
              <Button icon={Sparkles} onClick={() => navigate('/tasks/smart')}>
                {t('sk.drawer.use')}
              </Button>
            )}
          </>
        )
      }
    >
      {skill && (
        <div className="flex flex-col gap-6 p-5">
          <p className="text-base text-ink-700">{skill.description || '—'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-surface border border-ink-200/80 p-3">
              <p className="text-sm text-ink-500">{t('sk.cat.category')}</p>
              <Badge className="mt-1">{skillCategoryLabels[skill.category]}</Badge>
            </div>
            <div className="rounded-surface border border-ink-200/80 p-3">
              <p className="text-sm text-ink-500">{t('sk.cat.avg')}</p>
              <p className="mt-1 flex items-center gap-2 text-base font-semibold text-ink-900">
                {holders.length ? <LevelDots level={Math.round(avg)} label={levelLabels[Math.max(1, Math.round(avg)) as SkillLevel]} /> : '—'}
                {holders.length > 0 && <span className="tabular">{avg.toFixed(1)}</span>}
              </p>
            </div>
          </div>
          <section aria-label={t('sk.drawer.distribution')}>
            <h3 className="mb-2 text-sm font-semibold text-ink-900">{t('sk.drawer.distribution')}</h3>
            <ul className="flex flex-col gap-1.5">
              {distribution.map((item) => (
                <li key={item.value} className="flex items-center gap-3 text-sm">
                  <span className="w-24 shrink-0 text-ink-600">{item.value} · {levelLabels[item.value]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(item.count / peak) * 100}%` }} />
                  </span>
                  <span className="tabular w-6 text-end text-ink-700">{item.count}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-label={t('sk.cat.holders')}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-ink-900">{t('sk.cat.holders')}</h3>
              {staff && (
                <Button size="sm" variant="secondary" icon={Plus} onClick={() => setAdding((value) => !value)}>
                  {t('sk.drawer.add')}
                </Button>
              )}
            </div>
            {adding && (
              <div className="mb-4 grid gap-3 rounded-surface border border-ink-200 bg-ink-25 p-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
                <Field label={t('k.employee')}>
                  <Select value={newOwner} placeholder={t('em.form.choose')} onChange={(event) => setNewOwner(event.target.value)} options={candidates.map((row) => ({ value: row.user.user_id, label: row.name }))} />
                </Field>
                <Field label={t('sk.drawer.level')}>
                  <Select value={newLevel} onChange={(event) => setNewLevel(event.target.value)} options={levels.map((value) => ({ value, label: `${value} · ${levelLabels[value]}` }))} />
                </Field>
                <Button onClick={addOwner} disabled={!newOwner}>{t('act.save')}</Button>
              </div>
            )}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <SearchInput value={q} onChange={setQ} placeholder={t('sk.drawer.search')} className="min-w-0 flex-1" />
              <Select aria-label={t('sk.drawer.level')} value={level} onChange={(event) => setLevel(event.target.value)} options={[{ value: '', label: t('sk.drawer.allLevels') }, ...levels.map((value) => ({ value, label: `${value} · ${levelLabels[value]}` }))]} />
            </div>
            {shown.length === 0 ? (
              <p className="text-sm text-ink-500">{t('sk.cat.noHolders')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {shown.map((item) => (
                  <li key={item.user_id} className="flex items-center justify-between gap-3">
                    <PersonCell userId={item.user_id} card />
                    <span className={cn('flex shrink-0 items-center gap-2')}>
                      <LevelDots level={item.level} label={levelLabels[item.level]} />
                      {item.verified && <Badge tone="success">{t('em.profile.verified')}</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  )
}
