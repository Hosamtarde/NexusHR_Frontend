import type { Localized, TKey } from '@/i18n'

export const NEXA = 0

export type ConversationKind = 'nexa' | 'channel' | 'direct'

export interface Conversation {
  id: string
  kind: ConversationKind
  name: Localized | null
  members: number[]
  departmentId?: number
  ownerId?: number
  muted: boolean
  pinned: boolean
  readOnly?: boolean
  recordLink?: RecordRef
}

export type RecordType = 'task' | 'request' | 'employee'

export interface RecordRef {
  type: RecordType
  id: number
}

export type CardKind = 'payslip_ready' | 'interview_scheduled' | 'interview_reminder' | 'request_waiting' | 'request_reviewed' | 'task_assigned' | 'manager_changed'

export interface CardParams {
  actor?: number | Localized
  kind?: TKey
  decision?: TKey
  title?: Localized
  when?: string
}

export type AnswerIntent = 'greeting' | 'balance' | 'payslip' | 'requests' | 'tasks' | 'interviews' | 'notfound'

export interface Answer {
  intent: AnswerIntent
  data?: unknown
}

export type Body =
  | { kind: 'text'; text: string }
  | { kind: 'seed'; text: Localized }
  | { kind: 'file'; name: string; size: number }
  | { kind: 'system'; text: Localized }
  | { kind: 'card'; card: CardKind; params: CardParams; link: string; notificationId?: number }
  | { kind: 'answer'; answer: Answer }
  | { kind: 'record'; record: RecordRef; note?: string }

export interface Message {
  id: number
  convId: string
  senderId: number
  body: Body
  at: string
  readBy: number[]
  feedback?: 'up' | 'down'
  pinned?: boolean
  ackBy?: number[]
}

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString()

const channel = (id: string, name: Localized, members: number[], departmentId?: number): Conversation => ({ id, kind: 'channel', name, members, departmentId, muted: false, pinned: false })
const direct = (a: number, b: number): Conversation => ({ id: `dm-${a}-${b}`, kind: 'direct', name: null, members: [a, b], muted: false, pinned: false })
const nexa = (ownerId: number): Conversation => ({ id: `nexa-${ownerId}`, kind: 'nexa', name: { ar: 'نيكسا', en: 'Nexa' }, members: [ownerId], ownerId, muted: false, pinned: true })

const everyone = Array.from({ length: 24 }, (_, index) => index + 1)

export const seedConversations: Conversation[] = [
  nexa(1),
  nexa(2),
  nexa(5),
  { ...channel('announcements', { ar: 'إعلانات الشركة', en: 'Company announcements' }, everyone), readOnly: true, pinned: true },
  channel('all', { ar: 'كل الموظفين', en: 'All staff' }, everyone),
  channel('dept-1', { ar: 'الموارد البشرية', en: 'Human Resources' }, [1, 18, 20], 1),
  channel('dept-2', { ar: 'تقنية المعلومات', en: 'Information Technology' }, [2, 5, 6, 7, 19, 24], 2),
  channel('dept-3', { ar: 'الشؤون المالية', en: 'Finance' }, [3, 8, 9, 23], 3),
  channel('dept-4', { ar: 'المبيعات', en: 'Sales' }, [4, 10, 11, 21], 4),
  channel('dept-5', { ar: 'خدمة العملاء', en: 'Customer Service' }, [13, 12, 14, 22], 5),
  channel('dept-6', { ar: 'العمليات', en: 'Operations' }, [15, 16, 17], 6),
  direct(1, 2),
  direct(1, 3),
  direct(1, 18),
  direct(2, 5),
  direct(2, 6),
  direct(5, 6),
]

let counter = 1
const message = (convId: string, senderId: number, body: Body, hours: number, readBy: number[]): Message => ({ id: counter++, convId, senderId, body, at: hoursAgo(hours), readBy })
const seed = (convId: string, senderId: number, ar: string, en: string, hours: number, readBy: number[]) => message(convId, senderId, { kind: 'seed', text: { ar, en } }, hours, readBy)

export const seedMessages: Message[] = [
  message('nexa-1', NEXA, { kind: 'answer', answer: { intent: 'greeting' } }, 30, [1]),
  message('nexa-1', NEXA, { kind: 'card', card: 'request_waiting', params: { actor: 5, kind: 'rtype.leave' }, link: '/requests/41', notificationId: 100 }, 1, []),
  message('nexa-1', NEXA, { kind: 'card', card: 'interview_reminder', params: { actor: { ar: 'ملك الصالحي', en: 'Malak Al-Salhi' }, title: { ar: 'محاسب أول', en: 'Senior Accountant' }, when: new Date().toISOString().slice(0, 10) + 'T13:00:00' }, link: '/recruitment/interviews', notificationId: 101 }, 2, []),
  message('nexa-2', NEXA, { kind: 'answer', answer: { intent: 'greeting' } }, 30, [2]),
  message('nexa-2', NEXA, { kind: 'card', card: 'request_waiting', params: { actor: 5, kind: 'rtype.leave' }, link: '/requests/41', notificationId: 200 }, 1, []),
  message('nexa-5', NEXA, { kind: 'answer', answer: { intent: 'greeting' } }, 30, [5]),
  message('nexa-5', NEXA, { kind: 'card', card: 'task_assigned', params: { actor: 2, title: { ar: 'إعادة تصميم صفحة الحضور', en: 'Redesign the attendance page' } }, link: '/tasks/1', notificationId: 300 }, 2, []),
  message('nexa-5', NEXA, { kind: 'card', card: 'request_reviewed', params: { actor: 2, kind: 'rtype.permission', decision: 'rstatus.approved' }, link: '/requests/38', notificationId: 301 }, 30, [5]),
  message('nexa-5', NEXA, { kind: 'card', card: 'manager_changed', params: { actor: 2 }, link: '/org-chart/me', notificationId: 306 }, 900, [5]),

  { ...seed('announcements', 1, 'يبدأ الدوام الشتوي اعتبارًا من الأحد: من 8:00 صباحًا حتى 4:00 مساءً.', 'The winter schedule starts on Sunday: 8:00 AM to 4:00 PM.', 70, everyone), pinned: true, ackBy: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 15] },
  { ...seed('announcements', 1, 'يرجى تحديث بياناتكم الشخصية في الملف الشخصي قبل نهاية الشهر.', 'Please update your personal details in your profile before the end of the month.', 30, everyone), pinned: true, ackBy: [1, 2, 3, 5] },
  seed('announcements', 1, 'تهنئة لفريق المبيعات على تحقيق هدف الربع الثالث.', 'Congratulations to the sales team on hitting the Q3 target.', 6, everyone),
  seed('all', 1, 'نذكّركم بأن إقفال حسابات أكتوبر يتم هذا الأسبوع، يرجى تسليم المستندات المالية قبل الخميس.', 'A reminder that the October accounts close this week. Please submit your financial documents by Thursday.', 50, everyone),
  seed('all', 3, 'شكرًا سارة، فريق الشؤون المالية جاهز.', 'Thanks Sara, the finance team is ready.', 48, everyone),
  seed('all', 1, 'يوم التوظيف المفتوح بتاريخ 10 ديسمبر، سنحتاج متطوعين من كل قسم.', 'The open hiring day is on December 10. We will need volunteers from every department.', 5, [1, 2, 3, 4]),
  seed('dept-2', 2, 'صباح الخير فريق، موعد تسليم توثيق الواجهات يوم الجمعة.', 'Good morning team, the API documentation is due on Friday.', 26, [2, 5, 6, 7, 19, 24]),
  seed('dept-2', 6, 'أنهيت وحدة الطلبات، سأرفع المراجعة اليوم.', 'I finished the requests module and will push the review today.', 24, [2, 5, 6, 7, 19, 24]),
  seed('dept-2', 5, 'ممتاز، سأراجعها بعد صفحة الحضور.', 'Great, I will review it after the attendance page.', 3, [5, 6]),
  seed('dept-1', 18, 'وصل 3 طلبات توظيف جديدة هذا الصباح.', '3 new job applications arrived this morning.', 4, [1, 18, 20]),
  seed('dept-3', 3, 'اجتماع المطابقة البنكية غدًا الساعة 10.', 'The bank reconciliation meeting is tomorrow at 10.', 20, [3, 8, 9, 23]),
  seed('dm-1-2', 2, 'هل يمكنك اعتماد إجازة يوسف قبل نهاية اليوم؟', 'Can you approve Yousef’s leave before the end of the day?', 3, [2]),
  seed('dm-1-2', 1, 'سأراجعها الآن.', 'I will review it now.', 2, [1, 2]),
  seed('dm-1-3', 3, 'أرسلت لك ملخص الرواتب المقترح.', 'I sent you the proposed payroll summary.', 22, [1, 3]),
  seed('dm-1-18', 18, 'جدولت مقابلتين لهذا الأسبوع.', 'I scheduled two interviews for this week.', 6, [18]),
  seed('dm-2-5', 2, 'تابع صفحة الحضور وأخبرني إذا احتجت مراجعة.', 'Keep going on the attendance page and tell me if you need a review.', 8, [2, 5]),
  seed('dm-2-5', 5, 'تمام، سأرسل لك النسخة التجريبية غدًا.', 'Sure, I will send you the preview build tomorrow.', 7, [2, 5]),
  seed('dm-5-6', 6, 'هل جربت المكوّن الجديد للجداول؟', 'Have you tried the new table component?', 12, [5, 6]),
  seed('dm-5-6', 6, 'أعتقد أنه يحتاج تعديلًا بسيطًا في الجوال.', 'I think it needs a small fix on mobile.', 11, [6]),
  message('dm-2-6', 2, { kind: 'file', name: 'api-review.pdf', size: 482000 }, 30, [2, 6]),
  message('dm-2-6', 6, { kind: 'seed', text: { ar: 'استلمت الملف، شكرًا.', en: 'Got the file, thanks.' } }, 29, [2, 6]),
]

