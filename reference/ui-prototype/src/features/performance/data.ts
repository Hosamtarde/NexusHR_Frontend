import type { CriteriaCategory, EvaluationPlan, PerformanceReview, PlanCriterion } from '@/types/entities'
import { activeEmployees, getProfile } from '@/features/employees/data'
import { seeded } from '@/lib/dates'
import { localize } from '@/i18n/localized'
import { tr } from '@/i18n'

const categorySeeds: CriteriaCategory[] = [
  { category_id: 1, category_name: 'جودة العمل', description: 'دقة المخرجات والالتزام بالمعايير المتفق عليها.', is_active: true, created_at: '2025-01-05T08:00:00Z' },
  { category_id: 2, category_name: 'الإنتاجية', description: 'حجم الإنجاز مقارنة بالأهداف والمواعيد.', is_active: true, created_at: '2025-01-05T08:00:00Z' },
  { category_id: 3, category_name: 'العمل الجماعي', description: 'التعاون مع الزملاء ومشاركة المعرفة.', is_active: true, created_at: '2025-01-05T08:00:00Z' },
  { category_id: 4, category_name: 'الالتزام والانضباط', description: 'الحضور واحترام سياسات العمل والمواعيد.', is_active: true, created_at: '2025-01-05T08:00:00Z' },
  { category_id: 5, category_name: 'المبادرة والتطوير', description: 'اقتراح التحسينات وتطوير المهارات ذاتيًا.', is_active: true, created_at: '2025-02-11T08:00:00Z' },
  { category_id: 6, category_name: 'خدمة العملاء', description: 'رضا العملاء وسرعة الاستجابة لهم.', is_active: false, created_at: '2025-04-02T08:00:00Z' },
]

const enCategories: Record<number, [string, string]> = {
  1: ['Work quality', 'Accuracy of output and adherence to agreed standards.'],
  2: ['Productivity', 'Volume of work against goals and deadlines.'],
  3: ['Teamwork', 'Collaboration with colleagues and knowledge sharing.'],
  4: ['Discipline', 'Attendance and respect for work policies and deadlines.'],
  5: ['Initiative and growth', 'Suggesting improvements and self-development.'],
  6: ['Customer service', 'Customer satisfaction and response speed.'],
}

export const categories: CriteriaCategory[] = categorySeeds.map((category) => localize(category, { category_name: { ar: category.category_name, en: enCategories[category.category_id]?.[0] ?? category.category_name }, description: { ar: category.description ?? '', en: enCategories[category.category_id]?.[1] ?? category.description ?? '' } }))

export const getCategory = (id: number) => categories.find((category) => category.category_id === id) ?? null

function criteria(planId: number, base: number, list: [number, string, number, number][], en: string[]): PlanCriterion[] {
  return list.map(([category, text, weight, max], index) => localize({
    criteria_id: base + index,
    plan_id: planId,
    category_id: category,
    criteria_text: text,
    weight,
    max_score: max,
    display_order: index,
  }, { criteria_text: { ar: text, en: en[index] ?? text } }))
}

const generalEn = [
  'Delivers accurate work with no repeated corrections',
  'Completes assigned tasks on time',
  'Collaborates with teammates and shares knowledge',
  'Keeps to working hours and company policies',
  'Proposes improvements and develops their skills',
]

const generalCriteria: [number, string, number, number][] = [
  [1, 'يسلّم عملًا دقيقًا ومراجعًا دون الحاجة لتصحيحات متكررة', 30, 5],
  [2, 'ينجز المهام المسندة إليه في مواعيدها', 25, 5],
  [3, 'يتعاون مع زملائه ويشارك المعرفة', 20, 5],
  [4, 'يلتزم بأوقات الدوام وسياسات الشركة', 15, 5],
  [5, 'يبادر باقتراح تحسينات ويطوّر مهاراته', 10, 5],
]

const planSeeds: EvaluationPlan[] = [
  {
    plan_id: 1,
    plan_name: 'تقييم الربع الثالث 2026',
    description: 'التقييم الدوري لجميع الموظفين عن الفترة من يوليو إلى سبتمبر.',
    department_id: null,
    created_by: 1,
    period_start: '2026-07-01',
    period_end: '2026-09-30',
    submission_start: '2026-10-01',
    submission_end: '2026-10-15',
    plan_status: 'closed',
    criteria: criteria(1, 1, generalCriteria, generalEn),
    created_at: '2026-09-20T08:00:00Z',
  },
  {
    plan_id: 2,
    plan_name: 'تقييم الربع الرابع 2026',
    description: 'التقييم الدوري لجميع الموظفين عن الفترة من أكتوبر إلى ديسمبر.',
    department_id: null,
    created_by: 1,
    period_start: '2026-10-01',
    period_end: '2026-12-31',
    submission_start: '2026-11-01',
    submission_end: '2026-11-30',
    plan_status: 'active',
    criteria: criteria(2, 10, generalCriteria, generalEn),
    created_at: '2026-10-25T08:00:00Z',
  },
  {
    plan_id: 3,
    plan_name: 'تقييم أداء فريق المبيعات السنوي',
    description: 'تقييم خاص بفريق المبيعات يركّز على تحقيق الأهداف وعلاقات العملاء.',
    department_id: 4,
    created_by: 1,
    period_start: '2026-01-01',
    period_end: '2026-12-31',
    submission_start: '2027-01-03',
    submission_end: '2027-01-17',
    plan_status: 'draft',
    criteria: criteria(3, 20, [
      [2, 'يحقق الهدف الربعي للمبيعات', 40, 5],
      [6, 'يحافظ على رضا العملاء ويعالج شكاواهم بسرعة', 30, 5],
      [3, 'ينسّق مع فريق العمليات في تسليم الطلبات', 15, 5],
      [5, 'يجد فرص بيع جديدة', 15, 5],
    ], ['Hits the quarterly sales target', 'Keeps customers satisfied and resolves complaints quickly', 'Coordinates with operations on order delivery', 'Finds new sales opportunities']),
    created_at: '2026-11-08T08:00:00Z',
  },
]

const enPlans: Record<number, [string, string]> = {
  1: ['Q3 2026 review', 'Regular review of all employees for July to September.'],
  2: ['Q4 2026 review', 'Regular review of all employees for October to December.'],
  3: ['Annual sales team review', 'A dedicated review for the sales team focused on targets and customer relationships.'],
}

export const plans: EvaluationPlan[] = planSeeds.map((plan) => localize(plan, { plan_name: { ar: plan.plan_name, en: enPlans[plan.plan_id]?.[0] ?? plan.plan_name }, description: { ar: plan.description ?? '', en: enPlans[plan.plan_id]?.[1] ?? plan.description ?? '' } }))

export const getPlan = (id: number) => plans.find((plan) => plan.plan_id === id) ?? null

const reviewOrder = [2, 3, 4, 5, 13, 15, 6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23]

function reviewerOf(userId: number) {
  return getProfile(userId)?.reports_to ?? 1
}

function build(): PerformanceReview[] {
  const list: PerformanceReview[] = []
  let id = 1
  const active = new Set(activeEmployees().map((row) => row.user.user_id))
  for (const planId of [1, 2]) {
    const plan = getPlan(planId)!
    for (const userId of reviewOrder) {
      if (!active.has(userId)) continue
      const random = seeded(userId * 131 + planId * 7)
      const reviewId = id++
      const submitted = planId === 1 || [8, 9, 23, 16, 17].includes(userId)
      const scores = submitted
        ? plan.criteria.map((criterion) => ({
            review_id: reviewId,
            criteria_id: criterion.criteria_id,
            score: Math.max(2, Math.min(criterion.max_score, Math.round(3 + random() * 2.4))),
            note: random() > 0.6 ? 'steady' : null,
          }))
        : []
      const percentage = submitted
        ? Math.round(
            plan.criteria.reduce((sum, criterion) => {
              const score = scores.find((item) => item.criteria_id === criterion.criteria_id)?.score ?? 0
              return sum + (score / criterion.max_score) * criterion.weight
            }, 0) * 10,
          ) / 10
        : null
      list.push({
        review_id: reviewId,
        plan_id: planId,
        reviewed_user_id: userId,
        reviewed_by: reviewerOf(userId),
        review_status: submitted ? 'submitted' : 'pending',
        total_score: submitted ? scores.reduce((sum, item) => sum + item.score, 0) : null,
        final_percentage: percentage,
        reviewer_comment: submitted ? (percentage && percentage >= 85 ? 'strong' : 'good') : null,
        submitted_at: submitted ? (planId === 1 ? '2026-10-09T10:00:00Z' : '2026-11-08T10:00:00Z') : null,
        scores,
        created_at: plan.created_at,
      })
    }
  }
  return list
}

export const reviews = build()

export const getReview = (id: number) => reviews.find((review) => review.review_id === id) ?? null

export const reviewsOf = (userId: number) => reviews.filter((review) => review.reviewed_user_id === userId)

export const reviewsInPlan = (planId: number) => reviews.filter((review) => review.plan_id === planId)

export function percentageOf(plan: EvaluationPlan, scores: Record<number, number>) {
  return (
    Math.round(
      plan.criteria.reduce((sum, criterion) => sum + ((scores[criterion.criteria_id] ?? 0) / criterion.max_score) * criterion.weight, 0) * 10,
    ) / 10
  )
}

export function ratingLabel(percentage: number | null) {
  if (percentage == null) return { label: '—', tone: 'neutral' as const }
  if (percentage >= 90) return { label: tr('pf.rating.excellent'), tone: 'success' as const }
  if (percentage >= 75) return { label: tr('pf.rating.veryGood'), tone: 'brand' as const }
  if (percentage >= 60) return { label: tr('pf.rating.good'), tone: 'info' as const }
  return { label: tr('pf.rating.needs'), tone: 'warning' as const }
}

export const commentText = (value: string | null) => (value === 'strong' ? tr('pf.comment.strong') : value === 'good' ? tr('pf.comment.good') : value === 'steady' ? tr('pf.comment.steady') : (value ?? ''))

export function applyReview(reviewId: number, scores: Record<number, number>, notes: Record<number, string>, comment: string) {
  const review = getReview(reviewId)
  const plan = review ? getPlan(review.plan_id) : null
  if (!review || !plan) return null
  review.scores = plan.criteria.map((criterion) => ({ review_id: reviewId, criteria_id: criterion.criteria_id, score: scores[criterion.criteria_id] ?? 0, note: notes[criterion.criteria_id]?.trim() || null }))
  review.total_score = review.scores.reduce((sum, item) => sum + item.score, 0)
  review.final_percentage = percentageOf(plan, scores)
  review.reviewer_comment = comment.trim() || null
  review.review_status = 'submitted'
  review.submitted_at = new Date().toISOString()
  return review
}

export function reopenReviewData(reviewId: number) {
  const review = getReview(reviewId)
  if (review) {
    review.review_status = 'pending'
    review.submitted_at = null
  }
  return review ?? null
}

export function applyPlanStatus(planId: number, status: EvaluationPlan['plan_status']) {
  const plan = getPlan(planId)
  if (!plan) return []
  plan.plan_status = status
  const created: PerformanceReview[] = []
  if (status === 'active') {
    let id = Math.max(0, ...reviews.map((review) => review.review_id)) + 1
    for (const row of activeEmployees()) {
      const userId = row.user.user_id
      if (plan.department_id && row.profile.department_id !== plan.department_id) continue
      if (row.user.role === 'hr_admin' && !plan.department_id) continue
      if (reviews.some((review) => review.plan_id === planId && review.reviewed_user_id === userId)) continue
      const review: PerformanceReview = { review_id: id++, plan_id: planId, reviewed_user_id: userId, reviewed_by: reviewerOf(userId), review_status: 'pending', total_score: null, final_percentage: null, reviewer_comment: null, submitted_at: null, scores: [], created_at: new Date().toISOString() }
      reviews.push(review)
      created.push(review)
    }
  }
  return created
}

export interface PlanDraft {
  name: string
  description: string
  department: number | null
  periodStart: string
  periodEnd: string
  submissionStart: string
  submissionEnd: string
  criteria: { category: number; text: string; weight: number; max: number }[]
}

export function savePlanData(draft: PlanDraft, createdBy: number, id?: number) {
  const planId = id ?? Math.max(0, ...plans.map((plan) => plan.plan_id)) + 1
  const existing = getPlan(planId)
  const base = existing ?? ({ plan_id: planId, created_by: createdBy, plan_status: 'draft', created_at: new Date().toISOString() } as EvaluationPlan)
  Object.assign(base, { description: draft.description, department_id: draft.department, period_start: draft.periodStart, period_end: draft.periodEnd, submission_start: draft.submissionStart, submission_end: draft.submissionEnd })
  Object.defineProperty(base, 'plan_name', { value: draft.name, enumerable: true, configurable: true, writable: true })
  let criterionId = Math.max(0, ...plans.flatMap((plan) => plan.criteria.map((c) => c.criteria_id))) + 1
  base.criteria = draft.criteria.map((item, index) => ({ criteria_id: criterionId++, plan_id: planId, category_id: item.category, criteria_text: item.text, weight: item.weight, max_score: item.max, display_order: index }))
  if (!existing) plans.push(base)
  return planId
}

export function deleteCategoryData(id: number) {
  const index = categories.findIndex((category) => category.category_id === id)
  if (index >= 0) categories.splice(index, 1)
}

export function deletePlanData(id: number) {
  const index = plans.findIndex((plan) => plan.plan_id === id)
  if (index >= 0) plans.splice(index, 1)
}

export function saveCategoryData(name: string, description: string, active: boolean, id?: number) {
  const existing = categories.find((category) => category.category_id === id)
  if (existing) {
    for (const [key, value] of Object.entries({ category_name: name, description })) Object.defineProperty(existing, key, { value, enumerable: true, configurable: true, writable: true })
    existing.is_active = active
    return
  }
  categories.push({ category_id: Math.max(0, ...categories.map((category) => category.category_id)) + 1, category_name: name, description, is_active: active, created_at: new Date().toISOString() })
}
