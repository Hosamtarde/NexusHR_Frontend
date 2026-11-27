import type { Application, RecruitmentStatus } from '@/types/entities'
import type { Localized } from '@/i18n'
import { localize } from '@/i18n/localized'

export interface Job {
  id: number
  title: Localized
  department: Localized
  type: Localized
  location: Localized
  summary: Localized
}

const fullTime: Localized = { ar: 'دوام كامل', en: 'Full time' }
const hebron: Localized = { ar: 'الخليل', en: 'Hebron' }

export const jobs: Job[] = [
  { id: 1, title: { ar: 'مطوّر واجهات', en: 'Frontend Developer' }, department: { ar: 'تقنية المعلومات', en: 'Information Technology' }, type: fullTime, location: hebron, summary: { ar: 'بناء واجهات الويب لأنظمة الشركة بـ React وTypeScript.', en: 'Build web interfaces for company systems with React and TypeScript.' } },
  { id: 2, title: { ar: 'مطوّر خلفيات', en: 'Backend Developer' }, department: { ar: 'تقنية المعلومات', en: 'Information Technology' }, type: fullTime, location: hebron, summary: { ar: 'تطوير خدمات وواجهات برمجية بـ NestJS وقواعد بيانات MySQL.', en: 'Develop services and APIs with NestJS and MySQL databases.' } },
  { id: 3, title: { ar: 'محاسب أول', en: 'Senior Accountant' }, department: { ar: 'الشؤون المالية', en: 'Finance' }, type: fullTime, location: hebron, summary: { ar: 'إعداد القوائم المالية والتسويات وإقفال الحسابات الشهرية.', en: 'Prepare financial statements, reconciliations and monthly closings.' } },
  { id: 4, title: { ar: 'مندوب مبيعات', en: 'Sales Representative' }, department: { ar: 'المبيعات', en: 'Sales' }, type: { ar: 'دوام جزئي', en: 'Part time' }, location: { ar: 'بيت لحم', en: 'Bethlehem' }, summary: { ar: 'إدارة علاقات العملاء الحاليين وفتح حسابات جديدة.', en: 'Manage existing customers and open new accounts.' } },
  { id: 5, title: { ar: 'موظف خدمة عملاء', en: 'Customer Service Agent' }, department: { ar: 'خدمة العملاء', en: 'Customer Service' }, type: fullTime, location: hebron, summary: { ar: 'الرد على استفسارات العملاء وحل مشكلاتهم بسرعة ولباقة.', en: 'Answer customer questions and solve their problems quickly and politely.' } },
  { id: 6, title: { ar: 'مسؤول أنظمة', en: 'Systems Administrator' }, department: { ar: 'تقنية المعلومات', en: 'Information Technology' }, type: fullTime, location: hebron, summary: { ar: 'تشغيل الخوادم والشبكات ومراقبتها وتأمينها.', en: 'Run, monitor and secure servers and networks.' } },
  { id: 7, title: { ar: 'مصمم واجهات', en: 'UI Designer' }, department: { ar: 'تقنية المعلومات', en: 'Information Technology' }, type: { ar: 'عقد', en: 'Contract' }, location: { ar: 'عن بُعد', en: 'Remote' }, summary: { ar: 'تصميم الشاشات وأنظمة التصميم وتجارب الاستخدام.', en: 'Design screens, design systems and user experiences.' } },
]

export const positionSuggestions = jobs.map((job) => job.title)

export interface AppRecord extends Application {
  name_l: Localized
  position_l: Localized
}

type Seed = [id: number, name: [string, string], email: string, phone: string | null, job: number, status: RecruitmentStatus, submitted: string, interview?: string]

const seeds: Seed[] = [
  [16, ['سلمى أبو شرخ', 'Salma Abu Sharekh'], 'salma.sh@gmail.com', '0598123456', 1, 'pending', '2026-11-12T07:15:00Z'],
  [15, ['عبد الرحمن الشلالدة', 'Abdulrahman Al-Shalalda'], 'abd.shalaldeh@gmail.com', '0569876543', 2, 'pending', '2026-11-11T21:40:00Z'],
  [14, ['تسنيم الطيطي', 'Tasneem Al-Titi'], 'tasneem.t@outlook.com', null, 5, 'pending', '2026-11-11T09:05:00Z'],
  [13, ['معتز الزرو', 'Motaz Al-Zaro'], 'motaz.zro@gmail.com', '0597001122', 2, 'shortlisted', '2026-11-08T11:20:00Z'],
  [12, ['ملك الصالحي', 'Malak Al-Salhi'], 'malak.salhi@gmail.com', '0599334455', 3, 'interview_scheduled', '2026-11-04T10:00:00Z', '2026-11-12T13:00:00'],
  [11, ['أنس الحروب', 'Anas Al-Haroub'], 'anas.harroub@yahoo.com', '0568445566', 1, 'interview_scheduled', '2026-11-03T14:30:00Z', '2026-11-16T10:30:00'],
  [10, ['هديل عمرو', 'Hadeel Amro'], 'hadeel.amro@gmail.com', '0595667788', 3, 'interview_scheduled', '2026-11-02T08:45:00Z', '2026-11-12T15:30:00'],
  [9, ['مصطفى الجعبة', 'Mustafa Al-Jaba'], 'mustafa.j@gmail.com', '0597889900', 4, 'accepted', '2026-10-21T09:10:00Z', '2026-10-28T11:00:00'],
  [8, ['رهف السلايمة', 'Rahaf Al-Salaymeh'], 'rahaf.s@gmail.com', null, 5, 'rejected', '2026-10-19T12:00:00Z'],
  [7, ['بلال المحاريق', 'Bilal Al-Maharyeq'], 'bilal.mh@gmail.com', '0599112233', 2, 'rejected', '2026-10-15T15:30:00Z', '2026-10-22T09:00:00'],
  [6, ['ديما أبو حديد', 'Dima Abu Hadid'], 'dima.ah@gmail.com', '0566223344', 7, 'pending', '2026-10-30T10:00:00Z'],
  [5, ['كريم الفاخوري', 'Karim Al-Fakhouri'], 'karim.f@gmail.com', '0598334455', 4, 'shortlisted', '2026-10-27T09:00:00Z'],
  [4, ['شهد النمورة', 'Shahd Al-Namoura'], 'shahd.n@gmail.com', '0597445566', 3, 'rejected', '2026-10-10T08:00:00Z'],
  [3, ['حمزة الرجوب', 'Hamza Al-Rajoub'], 'hamza.r@gmail.com', '0569556677', 6, 'accepted', '2026-09-25T08:00:00Z', '2026-10-02T12:00:00'],
]

export function makeApplication(base: Omit<AppRecord, 'applicant_name' | 'applied_position' | 'name_l' | 'position_l'>, name: Localized, position: Localized): AppRecord {
  return localize({ ...base, name_l: name, position_l: position, applicant_name: name.ar, applied_position: position.ar } as AppRecord, { applicant_name: name, applied_position: position })
}

export function updateApplication(item: AppRecord, patch: Partial<Pick<AppRecord, 'application_status' | 'interview_at' | 'meeting_url'>>): AppRecord {
  const { applicant_name: ignoredName, applied_position: ignoredPosition, name_l, position_l, ...rest } = item
  void ignoredName
  void ignoredPosition
  return makeApplication({ ...rest, ...patch }, name_l, position_l)
}

export const applications: AppRecord[] = seeds.map(([id, name, email, phone, job, status, submitted, interview]) =>
  makeApplication(
    {
      application_id: id,
      email,
      phone_number: phone,
      cv_file: `${id}-cv.pdf`,
      application_status: status,
      interview_at: interview ?? null,
      meeting_url: interview ? `https://meet.jit.si/nexushr-interview-${id}` : null,
      submission_date: submitted,
    },
    { ar: name[0], en: name[1] },
    jobs.find((item) => item.id === job)!.title,
  ),
)

export const nextStatuses: Record<RecruitmentStatus, RecruitmentStatus[]> = {
  pending: ['shortlisted', 'rejected'],
  shortlisted: ['interview_scheduled', 'rejected'],
  interview_scheduled: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
}
