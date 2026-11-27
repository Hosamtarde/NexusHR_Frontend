import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Check, Plus, Sparkles, X } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { TODAY, addDays } from '@/lib/dates'
import { taskPriorityLabels } from '@/lib/labels'
import { useAction } from '@/lib/sample'
import type { TaskPriority } from '@/types/entities'
import { useViewer } from '@/app/viewer-context'
import { PersonCell, PersonStack } from '@/components/shared/Person'
import { Badge, Button, ButtonLink, EmptyState, Field, IconButton, InfoTip, Input, PageHeader, Panel, Select, Textarea, useToast } from '@/components/ui'
import { createTask, useStore } from '@/store'
import { levelLabels, skills } from '@/features/skills/data'
import { candidatePool, rankCandidates, type Candidate, type Reason, type Requirement } from './smart'

function ScoreRing({ value }: { value: number }) {
  const radius = 20
  const circumference = 2 * Math.PI * radius
  const tone = value >= 75 ? 'var(--color-success)' : value >= 50 ? 'var(--color-brand-600)' : 'var(--color-ink-400)'
  return (
    <span className="relative grid size-14 shrink-0 place-items-center" role="img" aria-label={`${value}%`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r={radius} fill="none" stroke="var(--color-ink-100)" strokeWidth="4" />
        <circle cx="24" cy="24" r={radius} fill="none" stroke={tone} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - value / 100)} />
      </svg>
      <span className="tabular text-sm font-bold text-ink-900">{value}</span>
    </span>
  )
}

function ReasonChip({ reason }: { reason: Reason }) {
  const { t } = useI18n()
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'
  if (reason.kind === 'skill') {
    const good = reason.level >= reason.required
    return <span className={cn(base, good ? 'bg-success-bg text-success' : 'bg-accent-soft text-warning')}>{t('ts.reason.skill', { skill: reason.skill.skill_name, level: reason.level, required: reason.required })}</span>
  }
  if (reason.kind === 'missing') return <span className={cn(base, 'bg-danger-bg text-danger')}>{t('ts.reason.missing', { skill: reason.skill.skill_name })}</span>
  if (reason.kind === 'verified') return <span className={cn(base, 'bg-brand-50 text-brand-700')}>{t('ts.reason.verified')}</span>
  if (reason.kind === 'free') return <span className={cn(base, 'bg-ink-100 text-ink-700')}>{t('ts.reason.free')}</span>
  if (reason.kind === 'busy') return <span className={cn(base, 'bg-accent-soft text-warning')}>{t('ts.reason.busy', { n: reason.open })}</span>
  return <span className={cn(base, 'bg-ink-100 text-ink-700')}>{t('ts.reason.department')}</span>
}

function CandidateCard({ candidate, selected, onToggle }: { candidate: Candidate; selected: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  const name = candidate.row.name
  return (
    <li className={cn('rounded-xl border p-4 transition-colors duration-150', selected ? 'border-brand-300 bg-brand-50/60' : 'border-ink-200/80 bg-white hover:border-brand-200')}>
      <div className="flex items-start gap-3">
        <ScoreRing value={candidate.score} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <PersonCell userId={candidate.row.user.user_id} subtitle={null} />
          </div>
          <p className="mt-0.5 truncate text-sm text-ink-500">{candidate.row.profile.position} · {t('ts.suggest.openTasks', { n: candidate.open })}</p>
        </div>
        <Button size="sm" variant={selected ? 'subtle' : 'secondary'} icon={selected ? Check : Plus} onClick={onToggle} aria-pressed={selected} aria-label={t('ts.suggest.select', { name })}>
          {selected ? t('ts.suggest.selected') : t('act.add')}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.reasons.map((reason, index) => (
          <ReasonChip key={index} reason={reason} />
        ))}
      </div>
    </li>
  )
}

export function TaskComposer({ smart }: { smart?: boolean }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const toast = useToast()
  const { role, userId, row } = useViewer()
  const tasks = useStore((state) => state.tasks)
  const assignments = useStore((state) => state.assignments)
  const { pending, run } = useAction()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState(addDays(TODAY, 14))
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [requirements, setRequirements] = useState<Requirement[]>(smart ? [{ skillId: 1, level: 3 }, { skillId: 2, level: 3 }] : [])
  const [selected, setSelected] = useState<number[]>([])
  const [touched, setTouched] = useState(false)

  const pool = useMemo(() => candidatePool(role, userId), [role, userId])
  const ranked = useMemo(() => rankCandidates(requirements, pool, tasks, assignments, row.profile.department_id), [requirements, pool, tasks, assignments, row.profile.department_id])
  const top = ranked.slice(0, 6)
  const extra = selected.filter((id) => !top.some((item) => item.row.user.user_id === id))
  const toggle = (id: number) => setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))

  const errors = {
    title: !title.trim() ? t('ts.form.errTitle') : undefined,
    deadline: !deadline ? t('ts.form.errDeadline') : undefined,
    assignees: selected.length === 0 ? t('ts.form.errAssignees') : undefined,
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (errors.title || errors.deadline || errors.assignees) return
    void run(() => {
      const task = createTask({ title: title.trim(), description: description.trim(), deadline, priority }, selected, userId)
      toast.success(t('ts.form.done'), t('ts.form.doneDesc'))
      navigate(`/tasks/${task.task_id}`)
    })
  }

  return (
    <div>
      <PageHeader title={t(smart ? 'ts.smart.title' : 'ts.form.title')} />
      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('ts.form.name')} error={touched ? errors.title : undefined} className="sm:col-span-2">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label={t('ts.form.description')} optional className="sm:col-span-2">
              <Textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <Field label={t('ts.form.deadline')} error={touched ? errors.deadline : undefined}>
              <Input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
            </Field>
            <Field label={t('ts.form.priority')}>
              <Select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)} options={(['low', 'medium', 'high'] as const).map((value) => ({ value, label: taskPriorityLabels[value].label }))} />
            </Field>
            <div className="sm:col-span-2">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink-800">{t('ts.form.skills')}<InfoTip label={t('ts.form.levelInfoLabel')}>{t('ts.form.levelInfo')}</InfoTip></p>
              <ul className="flex flex-col gap-2">
                {requirements.map((requirement) => {
                  const skill = skills.find((item) => item.skill_id === requirement.skillId)
                  if (!skill) return null
                  return (
                    <li key={requirement.skillId} className="flex items-center gap-3 rounded-xl border border-ink-200/80 bg-ink-25 px-3 py-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">{skill.skill_name}</span>
                      <span className="hidden shrink-0 text-xs text-ink-500 sm:block">{t('ts.form.minLevel')}</span>
                      <Select
                        aria-label={t('ts.form.minLevel')}
                        value={requirement.level}
                        onChange={(event) => setRequirements((list) => list.map((item) => (item.skillId === requirement.skillId ? { ...item, level: Number(event.target.value) } : item)))}
                        options={([1, 2, 3, 4, 5] as const).map((value) => ({ value, label: `${value} · ${levelLabels[value]}` }))}
                        className="w-44"
                      />
                      <IconButton icon={X} size="sm" label={t('ts.form.removeSkill', { name: skill.skill_name })} onClick={() => setRequirements((list) => list.filter((item) => item.skillId !== requirement.skillId))} />
                    </li>
                  )
                })}
              </ul>
              <Select
                aria-label={t('ts.form.addSkill')}
                value=""
                placeholder={t('ts.form.addSkill')}
                onChange={(event) => {
                  const skillId = Number(event.target.value)
                  if (skillId) setRequirements((list) => [...list, { skillId, level: 3 }])
                }}
                options={skills.filter((skill) => !requirements.some((item) => item.skillId === skill.skill_id)).map((skill) => ({ value: skill.skill_id, label: skill.skill_name }))}
                className="mt-3"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between gap-3 border-t border-ink-100 pt-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink-800">{t('ts.form.assignees')}</p>
              {touched && errors.assignees ? <p className="text-sm text-danger">{errors.assignees}</p> : selected.length === 0 ? <p className="text-sm text-ink-500">{t('ts.form.noneChosen')}</p> : <PersonStack userIds={selected} size="xs" showName />}
            </div>
            <div className="flex gap-2">
              <ButtonLink to={role === 'hr_admin' ? '/tasks' : '/tasks/team'} variant="secondary">
                {t('act.cancel')}
              </ButtonLink>
              <Button type="submit" loading={pending}>
                {t('ts.form.create')}
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title={t('ts.suggest.title')} actions={<Badge tone="brand"><Sparkles className="me-1 size-3.5" strokeWidth={2} />{requirements.length}</Badge>}>
          <details className="mb-4 rounded-xl border border-ink-200/80 bg-ink-25 p-3 text-sm text-ink-700">
            <summary className="cursor-pointer font-medium text-ink-900">{t('ts.legend.title')}</summary>
            <ul className="mt-3 flex flex-col gap-2">
              <li>{t('ts.legend.ring')}</li>
              <li><span className="me-2 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">{t('ts.legend.good')}</span>{t('ts.legend.goodDesc')}</li>
              <li><span className="me-2 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-warning">{t('ts.legend.below')}</span>{t('ts.legend.belowDesc')}</li>
              <li><span className="me-2 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">{t('ts.legend.missing')}</span>{t('ts.legend.missingDesc')}</li>
              <li><span className="me-2 rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">{t('ts.legend.avail')}</span>{t('ts.legend.availDesc')}</li>
            </ul>
          </details>
          {requirements.length === 0 ? (
            <EmptyState compact icon={Sparkles} title={t('ts.suggest.empty')} />
          ) : (
            <ul className="flex flex-col gap-3">
              {top.map((candidate) => (
                <CandidateCard key={candidate.row.user.user_id} candidate={candidate} selected={selected.includes(candidate.row.user.user_id)} onToggle={() => toggle(candidate.row.user.user_id)} />
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-ink-100 pt-4">
            <Select
              aria-label={t('ts.form.otherEmployee')}
              value=""
              placeholder={t('ts.form.otherEmployee')}
              onChange={(event) => {
                const id = Number(event.target.value)
                if (id) setSelected((list) => (list.includes(id) ? list : [...list, id]))
              }}
              options={ranked.filter((item) => !selected.includes(item.row.user.user_id) && !top.some((entry) => entry.row.user.user_id === item.row.user.user_id)).map((item) => ({ value: item.row.user.user_id, label: item.row.name }))}
            />
            {extra.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {extra.map((id) => {
                  const person = ranked.find((item) => item.row.user.user_id === id)
                  return (
                    <li key={id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1 ps-3 pe-1 text-sm font-medium text-brand-800">
                      {person?.row.name}
                      <IconButton icon={X} size="sm" label={t('act.remove')} onClick={() => toggle(id)} className="size-6" />
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Panel>
      </form>
    </div>
  )
}
