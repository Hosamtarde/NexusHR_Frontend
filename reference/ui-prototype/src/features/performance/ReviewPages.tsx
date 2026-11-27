import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ClipboardCheck, FileX2, Target } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useI18n } from '@/i18n'
import { formatDate, formatNumber } from '@/lib/format'
import { useViewer } from '@/app/viewer-context'
import { Badge, Button, ButtonLink, EmptyState, Field, PageHeader, Panel, Progress, Textarea, useToast } from '@/components/ui'
import { ListPanel, RowActions } from '@/components/shared/ListKit'
import { useList, type FilterDef } from '@/components/shared/useList'
import { PersonCell } from '@/components/shared/Person'
import { ActionBar, BackLink, DetailGrid, DetailHero, RichTimeline, type RichStep } from '@/components/shared/DetailLayout'
import { StatCard } from '@/components/shared/Cards'
import { reopenReviewAction, submitReviewAction } from '@/store'
import { useTick } from '@/store/collections'
import { employeeRow, userName } from '@/features/employees/data'
import type { PerformanceReview, Role } from '@/types/entities'
import { categories, commentText, getCategory, getPlan, getReview, percentageOf, plans, ratingLabel, reviews, reviewsOf } from './data'

const visible = (role: Role, userId: number) => reviews.filter((review) => role === 'hr_admin' || review.reviewed_by === userId)

function Rating({ value }: { value: number | null }) {
  const rating = ratingLabel(value)
  return value == null ? <span className="text-ink-400">—</span> : <span className="flex items-center gap-2"><span className="tabular font-medium">{formatNumber(value)}%</span><Badge tone={rating.tone}>{rating.label}</Badge></span>
}

export function ReviewsPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { role, userId } = useViewer()
  const tick = useTick('performance')
  void tick
  const rows = visible(role, userId)
  const filters: FilterDef<PerformanceReview>[] = [
    { key: 'plan', label: t('pf.rev.plan'), allLabel: t('pf.rev.allPlans'), options: plans.map((p) => ({ value: p.plan_id, label: p.plan_name })), test: (r, v) => String(r.plan_id) === v },
    { key: 'status', label: t('pf.rev.status'), allLabel: t('k.allStatuses'), options: [{ value: 'pending', label: t('pf.rev.pending') }, { value: 'submitted', label: t('pf.rev.submitted') }], test: (r, v) => r.review_status === v },
  ]
  const list = useList({
    rows,
    filters,
    search: (r) => employeeRow(r.reviewed_user_id)?.name ?? '',
    sorters: { name: (a, b) => (employeeRow(a.reviewed_user_id)?.name ?? '').localeCompare(employeeRow(b.reviewed_user_id)?.name ?? ''), score: (a, b) => (a.final_percentage ?? -1) - (b.final_percentage ?? -1) },
    initialSort: { key: 'name', dir: 'asc' },
  })
  const pending = rows.filter((r) => r.review_status === 'pending' && r.reviewed_by === userId).length
  return (
    <div>
      <PageHeader title={t('pf.rev.title')} meta={pending > 0 ? <Badge tone="warning">{t('pf.rev.pending')}: {pending}</Badge> : undefined} />
      <ListPanel
        noun="review"
        list={list}
        searchPlaceholder={t('pf.rev.search')}
        caption={t('pf.rev.title')}
        rowKey={(r) => r.review_id}
        rowHref={(r) => (r.review_status === 'pending' && r.reviewed_by === userId ? `/performance/reviews/${r.review_id}/fill` : `/performance/reviews/${r.review_id}`)}
        rowLabel={(r) => employeeRow(r.reviewed_user_id)?.name ?? ''}
        empty={<EmptyState icon={Target} title={t('pf.rev.empty')} />}
        columns={[
          { key: 'name', header: t('pf.rev.reviewee'), mobile: 'primary', sortable: true, cell: (r) => <PersonCell userId={r.reviewed_user_id} /> },
          { key: 'plan', header: t('pf.rev.plan'), mobile: 'hidden', cell: (r) => getPlan(r.plan_id)?.plan_name ?? '—' },
          { key: 'reviewer', header: t('pf.rev.reviewer'), mobile: 'hidden', cell: (r) => (r.reviewed_by ? <PersonCell userId={r.reviewed_by} compact /> : '—') },
          { key: 'score', header: t('pf.rev.score'), sortable: true, cell: (r) => <Rating value={r.final_percentage} /> },
          { key: 'status', header: t('pf.rev.status'), mobile: 'aside', cell: (r) => <Badge tone={r.review_status === 'submitted' ? 'success' : 'warning'} dot>{r.review_status === 'submitted' ? t('pf.rev.submitted') : t('pf.rev.pending')}</Badge> },
          {
            key: 'actions',
            header: <span className="sr-only">{t('k.actions')}</span>,
            mobile: 'hidden',
            align: 'end',
            cell: (r) => (
              <RowActions
                actions={[
                  ...(r.review_status === 'pending' && r.reviewed_by === userId ? [{ label: t('pf.rev.fill'), to: `/performance/reviews/${r.review_id}/fill` }] : []),
                  ...(r.review_status === 'submitted' ? [{ label: t('pf.rev.view'), to: `/performance/reviews/${r.review_id}` }] : []),
                  ...(role === 'hr_admin' && r.review_status === 'submitted' ? [{ label: t('pf.rev.reopen'), onSelect: () => { reopenReviewAction(r.review_id, userId); toast.success(t('pf.rev.reopened', { name: employeeRow(r.reviewed_user_id)?.name ?? '' })) } }] : []),
                ]}
              />
            ),
          },
        ]}
      />
    </div>
  )
}

export function MyReviewsPage() {
  const { t } = useI18n()
  const { userId } = useViewer()
  const tick = useTick('performance')
  void tick
  const mine = reviewsOf(userId).filter((r) => r.review_status === 'submitted')
  const waiting = reviewsOf(userId).filter((r) => r.review_status === 'pending').length
  const list = useList({ rows: mine, sorters: { score: (a, b) => (a.final_percentage ?? 0) - (b.final_percentage ?? 0), date: (a, b) => (a.submitted_at ?? '').localeCompare(b.submitted_at ?? '') }, initialSort: { key: 'date', dir: 'desc' } })
  const latest = mine.slice().sort((a, b) => (b.submitted_at ?? '').localeCompare(a.submitted_at ?? ''))[0]
  const avg = mine.length ? mine.reduce((sum, r) => sum + (r.final_percentage ?? 0), 0) / mine.length : 0
  return (
    <div>
      <PageHeader title={t('pf.rev.mine')} meta={waiting > 0 ? <Badge tone="info">{t('pf.rev.waiting')}: {waiting}</Badge> : undefined} />
      {latest && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label={t('pf.rev.latest')} value={Math.round(latest.final_percentage ?? 0)} suffix="%" to={`/performance/reviews/${latest.review_id}`} />
          <StatCard label={t('pf.rev.count')} value={mine.length} />
          <StatCard label={t('pf.rev.avg')} value={Math.round(avg)} suffix="%" />
        </div>
      )}
      <ListPanel
        noun="review"
        list={list}
        hideSearch
        caption={t('pf.rev.mine')}
        rowKey={(r) => r.review_id}
        rowHref={(r) => `/performance/reviews/${r.review_id}`}
        rowLabel={(r) => getPlan(r.plan_id)?.plan_name ?? ''}
        empty={<EmptyState icon={Target} title={t('pf.rev.noneMine')} />}
        columns={[
          { key: 'plan', header: t('pf.rev.plan'), mobile: 'primary', cell: (r) => <span className="font-medium text-ink-900">{getPlan(r.plan_id)?.plan_name}</span> },
          { key: 'date', header: t('k.date'), sortable: true, mobile: 'hidden', cell: (r) => <span className="tabular">{formatDate(r.submitted_at)}</span> },
          { key: 'reviewer', header: t('pf.rev.reviewer'), mobile: 'hidden', cell: (r) => (r.reviewed_by ? <PersonCell userId={r.reviewed_by} compact /> : '—') },
          { key: 'score', header: t('pf.rev.score'), sortable: true, mobile: 'aside', cell: (r) => <Rating value={r.final_percentage} /> },
        ]}
      />
    </div>
  )
}

export function FillReviewPage() {
  const { t } = useI18n()
  const toast = useToast()
  const navigate = useNavigate()
  const { userId } = useViewer()
  const review = getReview(Number(useParams().id))
  const plan = review ? getPlan(review.plan_id) : null
  const [scores, setScores] = useState<Record<number, number>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  if (!review || !plan || review.reviewed_by !== userId || review.review_status !== 'pending') {
    return <EmptyState icon={FileX2} title={t('k.notFound')} description={review ? t('pf.fill.denied') : t('k.notFoundDesc')} action={<ButtonLink to="/performance/reviews" variant="secondary">{t('pf.det.back')}</ButtonLink>} />
  }
  const name = employeeRow(review.reviewed_user_id)?.name ?? ''
  const max = plan.criteria[0]?.max_score ?? 5
  const live = percentageOf(plan, scores)
  const complete = plan.criteria.every((c) => scores[c.criteria_id])
  const submit = () => {
    if (!complete) return setError(t('pf.fill.missing'))
    submitReviewAction(review.review_id, scores, notes, comment, userId)
    toast.success(t('pf.fill.done', { name }))
    navigate('/performance/reviews')
  }
  return (
    <div>
      <PageHeader title={t('pf.fill.title', { name })} description={t('pf.fill.desc', { plan: plan.plan_name, max })} actions={<ButtonLink to="/performance/reviews" variant="secondary">{t('pf.det.back')}</ButtonLink>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {plan.criteria.map((criterion) => (
            <Panel key={criterion.criteria_id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-ink-900">{criterion.criteria_text}</p>
                  <p className="text-xs text-ink-500">{getCategory(criterion.category_id)?.category_name} · {t('pf.fill.weight', { n: criterion.weight })}</p>
                </div>
              </div>
              <div role="radiogroup" aria-label={criterion.criteria_text} className="mt-3 flex flex-wrap gap-2">
                {Array.from({ length: criterion.max_score }, (_, index) => index + 1).map((value) => (
                  <button key={value} type="button" role="radio" aria-checked={scores[criterion.criteria_id] === value} aria-label={t('pf.fill.score', { n: value, max: criterion.max_score })} onClick={() => { setScores((old) => ({ ...old, [criterion.criteria_id]: value })); setError('') }} className={cn('tabular grid size-11 place-items-center rounded-xl border text-base font-semibold transition-colors', scores[criterion.criteria_id] === value ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50')}>
                    {value}
                  </button>
                ))}
              </div>
              <Field label={t('pf.fill.note')} className="mt-3"><Textarea rows={2} value={notes[criterion.criteria_id] ?? ''} onChange={(e) => setNotes((old) => ({ ...old, [criterion.criteria_id]: e.target.value }))} /></Field>
            </Panel>
          ))}
          <Panel>
            <Field label={t('pf.fill.comment')} optional><Textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
          </Panel>
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel title={t('pf.fill.live')}>
            <p className="tabular text-4xl font-bold text-ink-900">{formatNumber(live)}%</p>
            <div className="mt-2"><Badge tone={ratingLabel(complete ? live : null).tone}>{complete ? ratingLabel(live).label : '—'}</Badge></div>
            <Progress value={live} className="mt-4" label={t('pf.fill.live')} />
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
            <Button className="mt-5 w-full" onClick={submit}>{t('pf.fill.submit')}</Button>
          </Panel>
        </div>
      </div>
    </div>
  )
}

export function ReviewDetailPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { role, userId } = useViewer()
  const tick = useTick('performance')
  void tick
  const review = getReview(Number(useParams().id))
  const plan = review ? getPlan(review.plan_id) : null
  const allowed = review && (role === 'hr_admin' || review.reviewed_by === userId || review.reviewed_user_id === userId)
  if (!review || !plan || !allowed) return <EmptyState icon={FileX2} title={t('k.notFound')} description={review ? t('pf.det.denied') : t('k.notFoundDesc')} action={<ButtonLink to="/performance/reviews/me" variant="secondary">{t('pf.det.back')}</ButtonLink>} />
  const name = employeeRow(review.reviewed_user_id)?.name ?? ''
  const byCategory = categories.map((category) => {
    const items = plan.criteria.filter((c) => c.category_id === category.category_id)
    const got = items.reduce((sum, c) => sum + ((review.scores.find((s) => s.criteria_id === c.criteria_id)?.score ?? 0) / c.max_score) * c.weight, 0)
    const weight = items.reduce((sum, c) => sum + c.weight, 0)
    return { category, pct: weight ? (got / weight) * 100 : 0, has: items.length > 0 }
  }).filter((item) => item.has)
  const emp = employeeRow(review.reviewed_user_id)
  const rating = ratingLabel(review.final_percentage)
  const submitted = review.review_status === 'submitted'
  const steps: RichStep[] = [
    { title: plan.plan_name, time: `${formatDate(plan.submission_start)} – ${formatDate(plan.submission_end)}`, state: 'done' },
    submitted
      ? { title: t('pf.rev.reviewer'), time: review.submitted_at ? formatDate(review.submitted_at) : undefined, userId: review.reviewed_by ?? undefined, name: userName(review.reviewed_by), state: 'done', tone: 'success' }
      : { title: t('pf.det.pending'), userId: review.reviewed_by ?? undefined, name: userName(review.reviewed_by), state: 'current' },
    ...(submitted ? [] : [{ title: t('pf.det.result'), state: 'next' as const }]),
  ]
  return (
    <div>
      <BackLink to={role === 'employee' ? '/performance/reviews/me' : '/performance/reviews'} label={t('pf.det.back')} />
      <DetailHero
        heading={t('pf.det.title', { name })}
        name={name}
        src={emp?.user.profile_image}
        userId={review.reviewed_user_id}
        eyebrow={plan.plan_name}
        position={emp?.profile.position}
        badge={submitted ? <Badge tone={rating.tone}>{rating.label}</Badge> : <Badge tone="warning" dot>{t('pf.det.pending')}</Badge>}
        stats={[
          { label: t('pf.det.result'), value: submitted ? `${formatNumber(review.final_percentage)}%` : '—' },
          { label: t('pf.rev.reviewer'), value: <PersonCell userId={review.reviewed_by ?? undefined} size="xs" /> },
          { label: t('pf.det.submittedAt', { date: '' }).replace(/[:：]s*$/, ''), value: review.submitted_at ? formatDate(review.submitted_at) : '—' },
        ]}
      />
      {!submitted ? (
        <EmptyState icon={ClipboardCheck} title={t('pf.det.pending')} action={review.reviewed_by === userId ? <ButtonLink to={`/performance/reviews/${review.review_id}/fill`}>{t('pf.rev.fill')}</ButtonLink> : undefined} />
      ) : (
        <DetailGrid
          main={
            <>
              <Panel title={t('pf.det.criteria')}>
                <ul className="divide-y divide-ink-100">
                  {plan.criteria.map((criterion) => {
                    const score = review.scores.find((s) => s.criteria_id === criterion.criteria_id)
                    return (
                      <li key={criterion.criteria_id} className="flex items-start justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <p className="text-ink-900">{criterion.criteria_text}</p>
                          <p className="text-xs text-ink-500">{getCategory(criterion.category_id)?.category_name} · {t('pf.fill.weight', { n: criterion.weight })}</p>
                          {score?.note && <p className="mt-1 text-sm text-ink-600">{score.note === 'steady' ? commentText('steady') : score.note}</p>}
                        </div>
                        <span className="tabular shrink-0 rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-800">{score?.score ?? 0} / {criterion.max_score}</span>
                      </li>
                    )
                  })}
                </ul>
              </Panel>
              {review.reviewer_comment && <Panel title={t('pf.det.comment')}><p className="text-ink-700">{commentText(review.reviewer_comment)}</p></Panel>}
            </>
          }
          side={
            <>
              <Panel title={t('pf.det.byCategory')}>
                <ul className="flex flex-col gap-3">
                  {byCategory.map((item) => (
                    <li key={item.category.category_id}>
                      <div className="mb-1 flex justify-between text-sm"><span className="text-ink-700">{item.category.category_name}</span><span className="tabular text-ink-600">{Math.round(item.pct)}%</span></div>
                      <Progress value={item.pct} label={item.category.category_name} />
                    </li>
                  ))}
                </ul>
              </Panel>
              <Panel title={t('rq.detail.status')}>
                <RichTimeline steps={steps} />
              </Panel>
            </>
          }
        />
      )}
      {role === 'hr_admin' && submitted && (
        <ActionBar>
          <Button variant="secondary" onClick={() => { reopenReviewAction(review.review_id, userId); toast.success(t('pf.rev.reopened', { name })) }}>{t('pf.rev.reopen')}</Button>
        </ActionBar>
      )}
    </div>
  )
}
