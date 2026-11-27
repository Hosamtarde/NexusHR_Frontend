import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CalendarClock, CalendarPlus, CheckCircle2, Download, ExternalLink, FileText, Inbox, Trash2, UserCheck, Video, XCircle } from 'lucide-react'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/cn'
import { NOW_TIME, TODAY, addDays } from '@/lib/dates'
import { formatDate, formatDateTime, formatShortDate, formatTime, formatWeekday } from '@/lib/format'
import { recruitmentStatusLabels } from '@/lib/labels'
import { paginate, useAction, usePageParam, useQueryParam, useSample } from '@/lib/sample'
import type { RecruitmentStatus } from '@/types/entities'
import { useViewer } from '@/app/viewer-context'
import { ActionBar, BackLink, DetailGrid, DetailHero, RichTimeline, type RichStep } from '@/components/shared/DetailLayout'
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  EmptyState,
  Field,
  FilterBar,
  Input,
  PageHeader,
  Pagination,
  Panel,
  SearchInput,
  Select,
  StatusBadge,
  useToast,
} from '@/components/ui'
import { PersonCell } from '@/components/shared/Person'
import { removeApplication, scheduleInterview, setApplicationStatus, useStore } from '@/store'
import { nextStatuses, type AppRecord } from './data'

const limit = 10
const stages: RecruitmentStatus[] = ['pending', 'shortlisted', 'interview_scheduled']

function CvCard({ app }: { app: AppRecord }) {
  const { t } = useI18n()
  const toast = useToast()
  const file = `cv-${app.application_id}.pdf`
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-surface border border-ink-200 bg-ink-25 p-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-control bg-danger-bg text-danger">
        <FileText className="size-6" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-900" dir="ltr">{file}</p>
        <p className="text-sm text-ink-500">PDF</p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" icon={ExternalLink} onClick={() => toast.info(t('rc.detail.opened'), file)}>
          {t('rc.detail.open')}
        </Button>
        <Button icon={Download} onClick={() => toast.info(t('rc.detail.downloaded'), file)}>
          {t('rc.detail.download')}
        </Button>
      </div>
    </div>
  )
}

export function ApplicationsPage() {
  const { t } = useI18n()
  const applications = useStore((state) => state.applications)
  const [q, setQ] = useQueryParam('q')
  const [statusFilter, setStatusFilter] = useQueryParam('status')
  const [jobFilter, setJobFilter] = useQueryParam('job')
  const [page, setPage] = usePageParam()
  const sorted = useMemo(() => applications.slice().sort((a, b) => b.submission_date.localeCompare(a.submission_date)), [applications])
  const { status, data, retry } = useSample(() => sorted, [])
  const needle = q.trim().toLowerCase()
  const rows = data.filter((item) => (!statusFilter || item.application_status === statusFilter) && (!jobFilter || item.applied_position === jobFilter) && (!needle || `${item.applicant_name} ${item.email}`.toLowerCase().includes(needle)))
  const paged = paginate(rows, page, limit)

  return (
    <div>
      <PageHeader
        title={t('rc.list.title')}
       
        actions={
          <ButtonLink to="/careers" variant="secondary" iconEnd={ExternalLink}>
            {t('rc.list.openCareers')}
          </ButtonLink>
        }
      />
      <Panel flush>
        <FilterBar>
          <SearchInput value={q} onChange={setQ} placeholder={t('rc.list.search')} className="sm:max-w-xs sm:flex-1" />
          <Select
            aria-label={t('rc.col.status')}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[{ value: '', label: t('rc.list.allStatuses') }, ...(['pending', 'shortlisted', 'interview_scheduled', 'accepted', 'rejected'] as const).map((value) => ({ value, label: recruitmentStatusLabels[value].label }))]}
          />
          <Select aria-label={t('rc.col.job')} value={jobFilter} onChange={(event) => setJobFilter(event.target.value)} options={[{ value: '', label: t('rc.list.allJobs') }, ...[...new Set(applications.map((item) => item.applied_position))].map((position) => ({ value: position, label: position }))]} />
        </FilterBar>
        <DataTable
          status={status}
          onRetry={retry}
          rows={paged.items}
          rowKey={(row) => row.application_id}
          rowHref={(row) => `/recruitment/${row.application_id}`}
          rowLabel={(row) => row.applicant_name}
          caption={t('rc.list.title')}
          empty={<EmptyState icon={Inbox} title={t('rc.empty.title')} />}
          columns={[
            {
              key: 'applicant',
              header: t('rc.col.applicant'),
              mobile: 'primary',
              cell: (row) => (
                <PersonCell name={row.applicant_name} subtitle={row.email} />
              ),
            },
            { key: 'job', header: t('rc.col.job'), cell: (row) => row.applied_position },
            { key: 'date', header: t('rc.col.date'), cell: (row) => <span className="tabular text-ink-600">{formatDate(row.submission_date)}</span> },
            { key: 'interview', header: t('rc.col.interview'), cell: (row) => (row.interview_at ? <span className="tabular text-ink-700">{formatDateTime(row.interview_at)}</span> : <span className="text-ink-400">—</span>) },
            { key: 'status', header: t('rc.col.status'), mobile: 'aside', cell: (row) => <StatusBadge value={recruitmentStatusLabels[row.application_status]} /> },
          ]}
        />
        {status === 'ready' && <Pagination noun="application" page={paged.page} limit={limit} total={paged.total} onChange={setPage} />}
      </Panel>
    </div>
  )
}

export function ApplicationDetailPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { id } = useParams()
  const { userId } = useViewer()
  const applications = useStore((state) => state.applications)
  const [dialog, setDialog] = useState<'rejected' | 'accepted' | 'delete' | null>(null)
  const app = applications.find((item) => item.application_id === Number(id))

  if (!app) {
    return (
      <Panel>
        <EmptyState icon={Inbox} title={t('rc.detail.notFound')} action={<ButtonLink to="/recruitment" variant="secondary">{t('rc.detail.back')}</ButtonLink>} />
      </Panel>
    )
  }

  const available = nextStatuses[app.application_status]
  const finished = app.application_status === 'accepted' || app.application_status === 'rejected'
  const change = (status: RecruitmentStatus) => {
    setApplicationStatus(app.application_id, status)
    toast.success(t(`rc.act.done.${status}` as 'rc.act.done.rejected'))
  }
  const rejected = app.application_status === 'rejected'
  const accepted = app.application_status === 'accepted'
  const reached = rejected ? (app.interview_at ? stages : stages.slice(0, 1)) : stages
  const index = stages.indexOf(app.application_status)
  const stageTime = (stage: RecruitmentStatus) => (stage === 'pending' ? formatDate(app.submission_date) : stage === 'interview_scheduled' && app.interview_at ? formatDateTime(app.interview_at) : undefined)
  const steps: RichStep[] = [
    ...reached.map((stage, position): RichStep => ({
      title: recruitmentStatusLabels[stage].label,
      state: rejected || accepted || index > position ? 'done' : index === position ? 'current' : 'next',
      tone: 'success',
      time: stageTime(stage),
    })),
    ...(rejected || accepted ? [{ title: recruitmentStatusLabels[app.application_status].label, state: 'done' as const, tone: accepted ? ('success' as const) : ('danger' as const) }] : []),
  ]

  return (
    <div>
      <BackLink to="/recruitment" label={t('rc.detail.back')} />
      <DetailHero
        name={app.applicant_name}
        eyebrow={t('rc.detail.title', { id: app.application_id })}
        position={app.applied_position}
        badge={<StatusBadge value={recruitmentStatusLabels[app.application_status]} />}
        stats={[
          { label: t('rc.detail.submitted'), value: formatDate(app.submission_date) },
          { label: t('rc.detail.interview'), value: app.interview_at ? formatDateTime(app.interview_at) : t('rc.detail.noInterview') },
        ]}
      />
      <DetailGrid
        main={
          <>
            <Panel title={t('rc.detail.info')}>
              <DescriptionList
                columns={2}
                items={[
                  { label: t('rc.detail.email'), value: <span dir="ltr" className="break-all">{app.email}</span> },
                  { label: t('rc.detail.phone'), value: app.phone_number ? <span dir="ltr">{app.phone_number}</span> : '—' },
                  ...(app.meeting_url
                    ? [
                        {
                          label: finished ? t('rc.detail.meetingDone') : t('rc.detail.meeting'),
                          wide: true,
                          value: finished ? (
                            <span className="inline-flex items-center gap-1.5 text-ink-500" dir="ltr">
                              <Video className="size-4" strokeWidth={1.75} />
                              {app.meeting_url}
                            </span>
                          ) : (
                            <a href={app.meeting_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline" dir="ltr">
                              <Video className="size-4" strokeWidth={1.75} />
                              {app.meeting_url}
                            </a>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </Panel>
            <Panel title={t('rc.detail.cv')}>
              <CvCard app={app} />
            </Panel>
          </>
        }
        side={
          <Panel title={t('rc.detail.stage')}>
            <RichTimeline steps={steps} />
          </Panel>
        }
      />
      <ActionBar
        aside={
          <Button variant="ghost" icon={Trash2} className="text-danger hover:bg-danger-bg hover:text-danger" onClick={() => setDialog('delete')}>
            {t('rc.detail.delete')}
          </Button>
        }
      >
        {app.application_status === 'pending' && (
          <Button icon={UserCheck} onClick={() => change('shortlisted')}>
            {t('rc.act.shortlist')}
          </Button>
        )}
        {app.application_status === 'shortlisted' && (
          <ButtonLink to={`/recruitment/${app.application_id}/schedule`} icon={CalendarPlus}>
            {t('rc.act.schedule')}
          </ButtonLink>
        )}
        {app.application_status === 'interview_scheduled' && (
          <>
            <ButtonLink to={`/recruitment/${app.application_id}/schedule`} variant="secondary" icon={CalendarClock}>
              {t('rc.act.reschedule')}
            </ButtonLink>
            <Button icon={CheckCircle2} onClick={() => setDialog('accepted')}>
              {t('rc.act.accept')}
            </Button>
          </>
        )}
        {available.includes('rejected') && (
          <Button variant="dangerOutline" icon={XCircle} onClick={() => setDialog('rejected')}>
            {t('rc.act.reject')}
          </Button>
        )}
      </ActionBar>
      <ConfirmDialog
        open={dialog !== null}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          if (dialog === 'delete') {
            removeApplication(app.application_id, userId)
            toast.success(t('rc.detail.deleted'))
            navigate('/recruitment')
          } else if (dialog) change(dialog)
          setDialog(null)
        }}
        title={dialog === 'delete' ? t('rc.detail.deleteTitle') : t(dialog === 'accepted' ? 'rc.act.acceptTitle' : 'rc.act.rejectTitle')}
        description={dialog === 'delete' ? t('rc.detail.deleteDesc') : t(dialog === 'accepted' ? 'rc.act.acceptDesc' : 'rc.act.rejectDesc', { name: app.applicant_name })}
        confirmLabel={dialog === 'delete' ? t('act.delete') : t(dialog === 'accepted' ? 'act.confirm' : 'act.reject')}
        tone={dialog === 'accepted' ? 'primary' : 'danger'}
      />
    </div>
  )
}

export function ScheduleInterviewPage() {
  const { t } = useI18n()
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { userId } = useViewer()
  const applications = useStore((state) => state.applications)
  const { pending, run } = useAction()
  const app = applications.find((item) => item.application_id === Number(id))
  const [date, setDate] = useState(app?.interview_at?.slice(0, 10) ?? addDays(TODAY, 3))
  const [time, setTime] = useState(app?.interview_at?.slice(11, 16) ?? '10:00')
  const [touched, setTouched] = useState(false)

  if (!app) {
    return (
      <Panel>
        <EmptyState icon={Inbox} title={t('rc.detail.notFound')} action={<ButtonLink to="/recruitment" variant="secondary">{t('rc.detail.back')}</ButtonLink>} />
      </Panel>
    )
  }

  if (app.application_status !== 'shortlisted' && app.application_status !== 'interview_scheduled') {
    return (
      <Panel>
        <EmptyState icon={CalendarClock} title={t('rc.sch.notAllowed')} action={<ButtonLink to={`/recruitment/${app.application_id}`} variant="secondary">{t('rc.detail.back')}</ButtonLink>} />
      </Panel>
    )
  }

  const errors = {
    date: !date || !time ? t('rc.sch.errDate') : `${date}T${time}` <= `${TODAY}T${NOW_TIME}` ? t('rc.sch.errPast') : undefined,
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTouched(true)
    if (errors.date) return
    void run(() => {
      scheduleInterview(app.application_id, `${date}T${time}:00`, userId)
      toast.success(t('rc.sch.done'), t('rc.sch.doneDesc'))
      navigate('/recruitment/interviews')
    })
  }

  return (
    <div>
      <PageHeader title={t('rc.sch.title')} description={t('rc.sch.desc', { name: app.applicant_name })} />
      <form onSubmit={submit} noValidate className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t('rc.sch.date')} error={touched ? errors.date : undefined}>
              <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </Field>
            <Field label={t('rc.sch.time')}>
              <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium text-ink-800">{t('rc.sch.link')}</p>
              <p className="mt-1 text-sm text-ink-500" dir="ltr">{app.meeting_url ?? t('rc.sch.linkAuto')}</p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2 border-t border-ink-100 pt-5">
            <ButtonLink to={`/recruitment/${app.application_id}`} variant="secondary">
              {t('act.cancel')}
            </ButtonLink>
            <Button type="submit" loading={pending}>
              {t('rc.sch.save')}
            </Button>
          </div>
        </Panel>
        <Panel title={t('rc.sch.summary')}>
          <DescriptionList
            columns={1}
            items={[
              { label: t('rc.col.applicant'), value: app.applicant_name },
              { label: t('rc.col.job'), value: app.applied_position },
              { label: t('rc.detail.interview'), value: date && time ? `${formatDate(date)} · ${formatTime(time)}` : '—' },
            ]}
          />
        </Panel>
      </form>
    </div>
  )
}

export function InterviewsPage() {
  const { t } = useI18n()
  const applications = useStore((state) => state.applications)
  const { status, data, retry } = useSample(() => applications, [])
  const now = `${TODAY}T${NOW_TIME}`
  const scheduled = data.filter((item) => item.interview_at).sort((a, b) => (a.interview_at ?? '').localeCompare(b.interview_at ?? ''))
  const upcoming = scheduled.filter((item) => (item.interview_at ?? '') >= now)
  const past = scheduled.filter((item) => (item.interview_at ?? '') < now).reverse().slice(0, 5)
  const days = [...new Set(upcoming.map((item) => (item.interview_at ?? '').slice(0, 10)))]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('rc.int.title')} />
      {status === 'loading' ? (
        <Panel flush>
          <DataTable status="loading" rows={[]} rowKey={() => 0} columns={[]} />
        </Panel>
      ) : status === 'error' ? (
        <Panel>
          <DataTable status="error" onRetry={retry} rows={[]} rowKey={() => 0} columns={[]} />
        </Panel>
      ) : upcoming.length === 0 ? (
        <Panel>
          <EmptyState icon={CalendarClock} title={t('rc.int.emptyTitle')} action={<ButtonLink to="/recruitment" variant="secondary">{t('rc.list.title')}</ButtonLink>} />
        </Panel>
      ) : (
        days.map((day) => (
          <section key={day} aria-label={formatDate(day)}>
            <h2 className="mb-3 text-md font-semibold text-ink-900">
              {day === TODAY ? t('rc.int.today') : formatWeekday(day)} <span className="ms-1 text-sm font-normal text-ink-500">{formatShortDate(day)}</span>
            </h2>
            <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
              {upcoming.filter((item) => (item.interview_at ?? '').startsWith(day)).map((item) => (
                <InterviewCard key={item.application_id} app={item} />
              ))}
            </ul>
          </section>
        ))
      )}
      {status === 'ready' && past.length > 0 && (
        <section>
          <h2 className="mb-3 text-md font-semibold text-ink-900">{t('rc.int.past')}</h2>
          <ul className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
            {past.map((item) => (
              <InterviewCard key={item.application_id} app={item} muted />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function InterviewCard({ app, muted }: { app: AppRecord; muted?: boolean }) {
  const { t } = useI18n()
  return (
    <li className={cn('rounded-surface border border-ink-200/80 bg-white p-5 shadow-card', muted && 'opacity-75')}>
      <div className="flex items-start gap-4">
        <div className="grid w-[88px] shrink-0 place-items-center rounded-xl bg-brand-50 py-2 text-brand-700">
          <span className="tabular whitespace-nowrap text-md font-bold">{formatTime(app.interview_at)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <Link to={`/recruitment/${app.application_id}`} className="font-semibold text-ink-900 hover:text-brand-700 hover:underline">
            {app.applicant_name}
          </Link>
          <p className="text-sm text-ink-600">{app.applied_position}</p>
        </div>
        <StatusBadge value={recruitmentStatusLabels[app.application_status]} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
        {app.meeting_url && !muted && app.application_status === 'interview_scheduled' && (
          <a href={app.meeting_url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-control bg-brand-600 px-3.5 text-base font-medium text-white shadow-sm hover:bg-brand-700">
            <Video className="size-[18px]" strokeWidth={1.75} />
            {t('rc.int.join')}
          </a>
        )}
        <ButtonLink to={`/recruitment/${app.application_id}`} variant="secondary">
          {t('rc.int.open')}
        </ButtonLink>
      </div>
    </li>
  )
}
