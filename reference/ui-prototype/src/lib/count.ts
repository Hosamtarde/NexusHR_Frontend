import { getLang } from '@/i18n'
import { formatNumber } from './format'

const nouns = {
  item: { en: ['item', 'items'], ar: ['عنصر', 'عنصران', 'عناصر'] },
  request: { en: ['request', 'requests'], ar: ['طلب', 'طلبان', 'طلبات'] },
  employee: { en: ['employee', 'employees'], ar: ['موظف', 'موظفان', 'موظفين'] },
  department: { en: ['department', 'departments'], ar: ['قسم', 'قسمان', 'أقسام'] },
  task: { en: ['task', 'tasks'], ar: ['مهمة', 'مهمتان', 'مهام'] },
  payslip: { en: ['payslip', 'payslips'], ar: ['قسيمة', 'قسيمتان', 'قسائم'] },
  run: { en: ['payroll run', 'payroll runs'], ar: ['دفعة', 'دفعتان', 'دفعات'] },
  loan: { en: ['loan', 'loans'], ar: ['قرض', 'قرضان', 'قروض'] },
  application: { en: ['application', 'applications'], ar: ['طلب توظيف', 'طلبا توظيف', 'طلبات توظيف'] },
  review: { en: ['review', 'reviews'], ar: ['تقييم', 'تقييمان', 'تقييمات'] },
  plan: { en: ['plan', 'plans'], ar: ['خطة', 'خطتان', 'خطط'] },
  category: { en: ['category', 'categories'], ar: ['فئة', 'فئتان', 'فئات'] },
  balance: { en: ['balance', 'balances'], ar: ['رصيد', 'رصيدان', 'أرصدة'] },
  skill: { en: ['skill', 'skills'], ar: ['مهارة', 'مهارتان', 'مهارات'] },
  user: { en: ['user', 'users'], ar: ['مستخدم', 'مستخدمان', 'مستخدمين'] },
  log: { en: ['log entry', 'log entries'], ar: ['سجل', 'سجلان', 'سجلات'] },
  record: { en: ['record', 'records'], ar: ['سجل', 'سجلان', 'سجلات'] },
}

export type CountNoun = keyof typeof nouns

export function countOf(noun: CountNoun, n: number) {
  if (getLang() === 'ar') {
    const [one, two, many] = nouns[noun].ar
    if (n === 2) return two!
    return `${formatNumber(n)} ${n >= 3 && n <= 10 ? many : one}`
  }
  const [one, many] = nouns[noun].en
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}
