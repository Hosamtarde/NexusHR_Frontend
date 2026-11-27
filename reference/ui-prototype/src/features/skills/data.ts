import { allEmployees, getProfile } from '@/features/employees/data'
import { localize } from '@/i18n/localized'
import { tr, type TKey } from '@/i18n'

export type SkillCategory = 'technical' | 'finance' | 'communication' | 'leadership' | 'sales' | 'languages' | 'operations'
export type SkillLevel = 1 | 2 | 3 | 4 | 5

export interface Skill {
  skill_id: number
  skill_name: string
  category: SkillCategory
  description: string
}

export interface EmployeeSkill {
  user_id: number
  skill_id: number
  level: SkillLevel
  years: number
  verified: boolean
  updated_at: string
}

const catKeys: Record<SkillCategory, TKey> = {
  technical: 'sk.cat.technical',
  finance: 'sk.cat.finance',
  communication: 'sk.cat.communication',
  leadership: 'sk.cat.leadership',
  sales: 'sk.cat.sales',
  languages: 'sk.cat.languages',
  operations: 'sk.cat.operations',
}

export const skillCategoryLabels = {} as Record<SkillCategory, string>
for (const key of Object.keys(catKeys) as SkillCategory[]) Object.defineProperty(skillCategoryLabels, key, { enumerable: true, get: () => tr(catKeys[key]) })

export const levelLabels = {} as Record<SkillLevel, string>
for (const level of [1, 2, 3, 4, 5] as const) Object.defineProperty(levelLabels, level, { enumerable: true, get: () => tr(('sk.lvl.' + level) as TKey) })

type SkillSeed = [id: number, name: string, category: SkillCategory, description: string]

const skillSeeds: SkillSeed[] = [
  [1, 'React', 'technical', 'بناء واجهات الويب التفاعلية بمكونات قابلة لإعادة الاستخدام.'],
  [2, 'TypeScript', 'technical', 'كتابة كود JavaScript آمن الأنواع وقابل للصيانة.'],
  [3, 'NestJS', 'technical', 'بناء خدمات خلفية وواجهات برمجة على Node.js.'],
  [4, 'قواعد بيانات MySQL', 'technical', 'تصميم الجداول وكتابة الاستعلامات وتحسين أدائها.'],
  [5, 'إدارة الخوادم Linux', 'technical', 'تشغيل الخوادم ومراقبتها وتأمينها.'],
  [6, 'اختبار البرمجيات', 'technical', 'كتابة حالات الاختبار وأتمتتها وتتبّع العيوب.'],
  [7, 'تصميم واجهات Figma', 'technical', 'تصميم الشاشات والنماذج التفاعلية وأنظمة التصميم.'],
  [8, 'الشبكات والأمن', 'technical', 'إعداد الشبكات والجدران النارية وصلاحيات الوصول.'],
  [9, 'المحاسبة المالية', 'finance', 'القيود اليومية والقوائم المالية والتسويات.'],
  [10, 'إعداد الرواتب', 'finance', 'احتساب الرواتب والاستقطاعات والضمان الاجتماعي.'],
  [11, 'التحليل المالي', 'finance', 'تحليل التكاليف والموازنات وإعداد التقارير.'],
  [12, 'Excel المتقدم', 'finance', 'الجداول المحورية والمعادلات والتقارير الآلية.'],
  [13, 'خدمة العملاء', 'communication', 'التعامل مع الاستفسارات والشكاوى بلباقة وسرعة.'],
  [14, 'الكتابة المهنية', 'communication', 'كتابة المراسلات والتقارير بلغة واضحة.'],
  [15, 'العرض والتقديم', 'communication', 'تقديم الأفكار والنتائج أمام الفرق والعملاء.'],
  [16, 'إدارة الفرق', 'leadership', 'توزيع العمل ومتابعة الأداء وتطوير الأفراد.'],
  [17, 'إدارة المشاريع', 'leadership', 'التخطيط والجدولة وإدارة المخاطر والموارد.'],
  [18, 'التوظيف والمقابلات', 'leadership', 'فرز المتقدمين وإجراء المقابلات وتقييمها.'],
  [19, 'التفاوض', 'sales', 'إدارة الصفقات والوصول إلى اتفاقات رابحة.'],
  [20, 'إدارة علاقات العملاء CRM', 'sales', 'متابعة العملاء المحتملين في أنظمة CRM.'],
  [21, 'اللغة الإنجليزية', 'languages', 'التواصل الكتابي والشفهي بالإنجليزية.'],
  [22, 'اللغة العبرية', 'languages', 'التواصل مع الموردين والجهات الرسمية.'],
  [23, 'إدارة المخزون', 'operations', 'الجرد وتتبّع الأصناف وإعادة الطلب.'],
  [24, 'سلاسل الإمداد', 'operations', 'التنسيق مع الموردين والنقل والتوزيع.'],
]

const enSkills: Record<number, [string, string]> = {
  1: ['React', 'Building interactive web interfaces with reusable components.'],
  2: ['TypeScript', 'Writing type-safe, maintainable JavaScript.'],
  3: ['NestJS', 'Building backend services and APIs on Node.js.'],
  4: ['MySQL databases', 'Designing tables, writing queries and tuning performance.'],
  5: ['Linux server administration', 'Running, monitoring and securing servers.'],
  6: ['Software testing', 'Writing, automating and tracking test cases.'],
  7: ['Figma UI design', 'Designing screens, interactive prototypes and design systems.'],
  8: ['Networking and security', 'Configuring networks, firewalls and access control.'],
  9: ['Financial accounting', 'Journal entries, financial statements and reconciliations.'],
  10: ['Payroll preparation', 'Calculating salaries, deductions and social security.'],
  11: ['Financial analysis', 'Analysing costs and budgets and building reports.'],
  12: ['Advanced Excel', 'Pivot tables, formulas and automated reports.'],
  13: ['Customer service', 'Handling questions and complaints politely and quickly.'],
  14: ['Professional writing', 'Writing clear correspondence and reports.'],
  15: ['Presentation', 'Presenting ideas and results to teams and clients.'],
  16: ['Team management', 'Assigning work, tracking performance and developing people.'],
  17: ['Project management', 'Planning, scheduling and managing risks and resources.'],
  18: ['Hiring and interviews', 'Screening candidates and running interviews.'],
  19: ['Negotiation', 'Managing deals and reaching winning agreements.'],
  20: ['CRM', 'Following prospects in CRM systems.'],
  21: ['English', 'Written and spoken communication in English.'],
  22: ['Hebrew', 'Communicating with suppliers and official bodies.'],
  23: ['Inventory management', 'Counting, tracking items and reordering.'],
  24: ['Supply chain', 'Coordinating suppliers, transport and distribution.'],
}

export const skills: Skill[] = skillSeeds.map(([skill_id, skill_name, category, description]) =>
  localize({ skill_id, skill_name, category, description }, { skill_name: { ar: skill_name, en: enSkills[skill_id]?.[0] ?? skill_name }, description: { ar: description, en: enSkills[skill_id]?.[1] ?? description } }),
)

export const getSkill = (id: number) => skills.find((skill) => skill.skill_id === id) ?? null

type Profile = [skillId: number, level: SkillLevel, years: number][]

const profilesByUser: Record<number, Profile> = {
  1: [[16, 5, 9], [18, 5, 8], [14, 4, 10], [15, 4, 7], [21, 4, 12], [10, 3, 5]],
  2: [[16, 4, 6], [17, 5, 7], [3, 4, 6], [4, 4, 8], [5, 3, 5], [21, 4, 10]],
  3: [[9, 5, 12], [11, 5, 9], [12, 5, 10], [16, 4, 6], [10, 4, 7]],
  4: [[19, 5, 9], [20, 4, 6], [16, 4, 5], [15, 4, 6], [21, 3, 5]],
  5: [[1, 4, 3], [2, 4, 3], [7, 3, 2], [6, 2, 1], [21, 3, 6]],
  6: [[3, 5, 4], [2, 5, 4], [4, 4, 4], [1, 3, 2], [17, 2, 1], [21, 4, 7]],
  7: [[5, 5, 6], [8, 4, 5], [4, 3, 4], [3, 2, 1]],
  8: [[9, 4, 4], [12, 4, 4], [10, 3, 2]],
  9: [[11, 4, 3], [12, 5, 4], [9, 3, 3], [15, 3, 2]],
  10: [[19, 3, 2], [20, 4, 2], [13, 4, 3], [21, 3, 4]],
  11: [[19, 3, 2], [20, 3, 1], [22, 4, 5]],
  12: [[13, 4, 2], [14, 3, 2], [21, 2, 2]],
  13: [[13, 5, 8], [16, 4, 5], [14, 4, 6], [22, 3, 4]],
  14: [[13, 3, 1], [21, 3, 3]],
  15: [[24, 5, 9], [23, 5, 10], [16, 4, 6], [17, 4, 5]],
  16: [[24, 3, 3], [23, 3, 3], [12, 3, 2], [22, 4, 4]],
  17: [[23, 4, 5], [24, 3, 4], [16, 2, 1]],
  18: [[18, 4, 4], [14, 4, 4], [15, 3, 2], [21, 4, 5]],
  19: [[6, 4, 2], [2, 2, 1], [1, 2, 1]],
  20: [[10, 5, 5], [12, 4, 5], [9, 3, 3]],
  21: [[19, 2, 1], [13, 3, 1]],
  22: [[13, 3, 1], [14, 2, 1]],
  23: [[9, 3, 4], [12, 3, 3], [10, 2, 2]],
  24: [[7, 5, 4], [1, 3, 2]],
}

export const employeeSkills: EmployeeSkill[] = Object.entries(profilesByUser).flatMap(([userId, list]) =>
  list.map(([skill_id, level, years], index) => ({
    user_id: Number(userId),
    skill_id,
    level,
    years,
    verified: (Number(userId) + index) % 3 !== 0,
    updated_at: `2026-${String(((Number(userId) + index) % 10) + 1).padStart(2, '0')}-1${index % 9}`,
  })),
)

export const skillsOf = (userId: number) =>
  employeeSkills
    .filter((item) => item.user_id === userId)
    .map((item) => ({ ...item, skill: getSkill(item.skill_id)! }))
    .sort((a, b) => b.level - a.level)

export const holdersOf = (skillId: number) => employeeSkills.filter((item) => item.skill_id === skillId)

export function departmentMatrix(departmentId: number) {
  const members = allEmployees().filter((row) => row.user.status && getProfile(row.user.user_id)?.department_id === departmentId)
  const ids = new Set(members.map((row) => row.user.user_id))
  const skillIds = [...new Set(employeeSkills.filter((item) => ids.has(item.user_id)).map((item) => item.skill_id))]
  const columns = skillIds
    .map((id) => getSkill(id)!)
    .sort((a, b) => holdersOf(b.skill_id).filter((item) => ids.has(item.user_id)).length - holdersOf(a.skill_id).filter((item) => ids.has(item.user_id)).length)
  const level = (userId: number, skillId: number) =>
    employeeSkills.find((item) => item.user_id === userId && item.skill_id === skillId)?.level ?? 0
  return { members, columns, level }
}

export function setSkillLevel(userId: number, skillId: number, level: SkillLevel) {
  const existing = employeeSkills.find((item) => item.user_id === userId && item.skill_id === skillId)
  if (existing) {
    existing.level = level
    existing.verified = false
    return
  }
  employeeSkills.push({ user_id: userId, skill_id: skillId, level, years: 1, verified: false, updated_at: '2026-11-12' })
}

export function removeSkillFrom(userId: number, skillId: number) {
  const index = employeeSkills.findIndex((item) => item.user_id === userId && item.skill_id === skillId)
  if (index >= 0) employeeSkills.splice(index, 1)
}

export function saveSkill(name: string, category: SkillCategory, description: string, id?: number) {
  const existing = skills.find((skill) => skill.skill_id === id)
  if (existing) {
    for (const [key, value] of Object.entries({ skill_name: name, description })) Object.defineProperty(existing, key, { value, enumerable: true, configurable: true, writable: true })
    existing.category = category
    return
  }
  skills.push({ skill_id: Math.max(...skills.map((skill) => skill.skill_id)) + 1, skill_name: name, category, description })
}
