import { common } from './common'
import { dashboardDict } from '@/features/dashboard/i18n'
import { notificationsDict } from '@/features/notifications/i18n'
import { sharedDict } from '@/components/shared/i18n'
import { authDict } from '@/features/auth/i18n'
import { systemDict } from '@/features/system/i18n'
import { requestsDict } from '@/features/requests/i18n'
import { tasksDict } from '@/features/tasks/i18n'
import { recruitmentDict } from '@/features/recruitment/i18n'
import { messagesDict } from '@/features/messages/i18n'
import { kitDict } from './kit'
import { employeesDict } from '@/features/employees/i18n'
import { skillsDict } from '@/features/skills/i18n'
import { attendanceDict } from '@/features/attendance/i18n'
import { payrollDict } from '@/features/payroll/i18n'
import { performanceDict } from '@/features/performance/i18n'
import { dashboard2Dict } from '@/features/dashboard/i18n2'
import { reportsDict } from '@/features/reports/i18n'
import { settingsDict } from '@/features/settings/i18n'
import { messages2Dict } from '@/features/messages/i18n2'
import { auth2Dict } from '@/features/auth/i18n2'
import { auth3Dict } from '@/features/auth/i18n3'
import { requests2Dict } from '@/features/requests/i18n2'
import { tasks2Dict } from '@/features/tasks/i18n2'
import { recruitment2Dict } from '@/features/recruitment/i18n2'
import { payroll2Dict } from '@/features/payroll/i18n2'
import { employees2Dict } from '@/features/employees/i18n2'
import { employees3Dict } from '@/features/employees/i18n3'
import { attendance2Dict } from '@/features/attendance/i18n2'
import { leave2Dict } from '@/features/leave/i18n2'
import { performance2Dict } from '@/features/performance/i18n2'
import { skills2Dict } from '@/features/skills/i18n2'
import { rcDict } from '@/features/messages/rc/i18n'
import { rc3Dict } from '@/features/messages/rc/i18n3'
import { settings2Dict } from '@/features/settings/i18n2'
import type { Lang } from './runtime'

const sources = [common, dashboardDict, notificationsDict, sharedDict, authDict, systemDict, requestsDict, tasksDict, recruitmentDict, messagesDict, kitDict, employeesDict, skillsDict, attendanceDict, payrollDict, performanceDict, dashboard2Dict, reportsDict, settingsDict, messages2Dict, auth2Dict, auth3Dict, requests2Dict, tasks2Dict, recruitment2Dict, payroll2Dict, employees2Dict, employees3Dict, attendance2Dict, leave2Dict, performance2Dict, skills2Dict, rcDict, rc3Dict, settings2Dict] as const

type KeysOf<T> = T extends { ar: infer A } ? keyof A : never

export type TKey = KeysOf<(typeof sources)[number]>

export const dictionaries: Record<Lang, Record<string, string>> = {
  ar: Object.assign({}, ...sources.map((dict) => dict.ar)),
  en: Object.assign({}, ...sources.map((dict) => dict.en)),
}
