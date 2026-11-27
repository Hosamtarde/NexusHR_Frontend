import type { Department, EmployeeCard, EmployeeProfile, EmploymentType, Role, User } from '@/types/entities'
import { localize } from '@/i18n/localized'
import { enDepartments, enPeople } from './names'

const departmentSeeds: Department[] = [
  { department_id: 1, department_name: 'الموارد البشرية', manager_id: 1 },
  { department_id: 2, department_name: 'تقنية المعلومات', manager_id: 2 },
  { department_id: 3, department_name: 'الشؤون المالية', manager_id: 3 },
  { department_id: 4, department_name: 'المبيعات', manager_id: 4 },
  { department_id: 5, department_name: 'خدمة العملاء', manager_id: 13 },
  { department_id: 6, department_name: 'العمليات', manager_id: 15 },
]

type Seed = [
  id: number,
  first: string,
  last: string,
  email: string,
  role: Role,
  department: number,
  reportsTo: number | null,
  position: string,
  hire: string,
  type: EmploymentType,
  salary: number,
  active?: boolean,
]

const seeds: Seed[] = [
  [1, 'سارة', 'الخطيب', 'admin@hrms.com', 'hr_admin', 1, null, 'مديرة الموارد البشرية', '2019-03-10', 'full_time', 9200],
  [2, 'أحمد', 'أبو اسنينة', 'ahmad.s@nexushr.ps', 'manager', 2, 1, 'مدير تقنية المعلومات', '2020-01-15', 'full_time', 8800],
  [3, 'ليلى', 'الجعبري', 'layla.j@nexushr.ps', 'manager', 3, 1, 'مديرة الشؤون المالية', '2019-09-01', 'full_time', 8600],
  [4, 'محمد', 'التميمي', 'mohammad.t@nexushr.ps', 'manager', 4, 1, 'مدير المبيعات', '2021-02-07', 'full_time', 8100],
  [5, 'يوسف', 'القواسمة', 'yousef.q@nexushr.ps', 'employee', 2, 2, 'مطوّر واجهات', '2023-06-18', 'full_time', 5400],
  [6, 'رنا', 'الشرباتي', 'rana.s@nexushr.ps', 'employee', 2, 2, 'مهندسة برمجيات', '2022-04-03', 'full_time', 6100],
  [7, 'خالد', 'النتشة', 'khaled.n@nexushr.ps', 'employee', 2, 2, 'مسؤول أنظمة', '2021-11-21', 'full_time', 5800],
  [8, 'دينا', 'الزغير', 'dina.z@nexushr.ps', 'employee', 3, 3, 'محاسبة', '2022-08-14', 'full_time', 4900],
  [9, 'عمر', 'الرجبي', 'omar.r@nexushr.ps', 'employee', 3, 3, 'محلل مالي', '2023-01-09', 'full_time', 5200],
  [10, 'هبة', 'أبو منشار', 'heba.m@nexushr.ps', 'employee', 4, 4, 'مندوبة مبيعات', '2023-10-02', 'full_time', 4300],
  [11, 'سامي', 'الدويك', 'sami.d@nexushr.ps', 'employee', 4, 4, 'مندوب مبيعات', '2024-03-17', 'full_time', 4100],
  [12, 'نور', 'الحموري', 'nour.h@nexushr.ps', 'employee', 5, 13, 'موظفة خدمة عملاء', '2024-05-05', 'full_time', 3800],
  [13, 'طارق', 'سدر', 'tareq.s@nexushr.ps', 'manager', 5, 1, 'مدير خدمة العملاء', '2020-07-12', 'full_time', 7400],
  [14, 'آية', 'المحتسب', 'aya.m@nexushr.ps', 'employee', 5, 13, 'موظفة خدمة عملاء', '2025-02-23', 'full_time', 3700],
  [15, 'إياد', 'العويوي', 'iyad.a@nexushr.ps', 'manager', 6, 1, 'مدير العمليات', '2019-12-01', 'full_time', 7900],
  [16, 'مها', 'الجنيدي', 'maha.j@nexushr.ps', 'employee', 6, 15, 'منسقة عمليات', '2022-09-11', 'full_time', 4600],
  [17, 'باسل', 'غيث', 'basel.g@nexushr.ps', 'employee', 6, 15, 'مشرف مستودع', '2021-06-27', 'full_time', 4400],
  [18, 'فرح', 'الحرباوي', 'farah.h@nexushr.ps', 'hr_admin', 1, 1, 'أخصائية توظيف', '2022-02-13', 'full_time', 5600],
  [19, 'زياد', 'البطش', 'ziad.b@nexushr.ps', 'employee', 2, 2, 'مختبر جودة', '2025-07-01', 'contract', 4200],
  [20, 'ريم', 'أبو تركي', 'reem.t@nexushr.ps', 'employee', 1, 1, 'مسؤولة رواتب', '2021-04-19', 'full_time', 5300],
  [21, 'مراد', 'القيسي', 'murad.q@nexushr.ps', 'employee', 4, 4, 'مندوب مبيعات', '2025-09-14', 'part_time', 2600],
  [22, 'لينا', 'الهشلمون', 'lina.h@nexushr.ps', 'employee', 5, 13, 'موظفة خدمة عملاء', '2024-12-08', 'part_time', 2400],
  [23, 'وسام', 'الأطرش', 'wesam.a@nexushr.ps', 'employee', 3, 3, 'أمين صندوق', '2020-10-25', 'full_time', 4700],
  [24, 'جنى', 'الشويكي', 'jana.s@nexushr.ps', 'employee', 2, 2, 'مصممة واجهات', '2023-03-12', 'full_time', 5000, false],
]

export const departments: Department[] = departmentSeeds.map((department) =>
  localize(department, { department_name: { ar: department.department_name, en: enDepartments[department.department_id] ?? department.department_name } }),
)

export const users: User[] = seeds.map(([id, first, last, email, role, , , , hire, , , active = true]) => localize({
  user_id: id,
  first_name: first,
  last_name: last,
  email,
  role,
  phone_number: `059${String(2000000 + id * 37131).slice(0, 7)}`,
  profile_image: null,
  status: active,
  created_at: `${hire}T08:00:00.000Z`,
}, { first_name: { ar: first, en: enPeople[id]?.[0] ?? first }, last_name: { ar: last, en: enPeople[id]?.[1] ?? last } }))

export const profiles: EmployeeProfile[] = seeds.map(([id, , , , , department, reportsTo, position, hire, type, salary]) => localize({
  user_id: id,
  department_id: department,
  reports_to: reportsTo,
  position,
  hire_date: hire,
  employment_type: type,
  basic_salary: salary,
}, { position: { ar: position, en: enPeople[id]?.[2] ?? position } }))

export const viewerIds: Record<Role, number> = { hr_admin: 1, manager: 2, employee: 5 }

export interface EmployeeRow {
  user: User
  profile: EmployeeProfile
  department: Department | null
  manager: User | null
  name: string
}

const byId = new Map(users.map((user) => [user.user_id, user]))
const profileById = new Map(profiles.map((profile) => [profile.user_id, profile]))

export const getUser = (id: number | null | undefined) => (id == null ? null : (byId.get(id) ?? null))
export const getProfile = (id: number) => profileById.get(id) ?? null
export const getDepartment = (id: number | null | undefined) =>
  departments.find((department) => department.department_id === id) ?? null
export const userName = (id: number | null | undefined) => {
  const user = getUser(id)
  return user ? `${user.first_name} ${user.last_name}` : '—'
}

export function employeeRow(id: number): EmployeeRow | null {
  const user = getUser(id)
  const profile = getProfile(id)
  if (!user || !profile) return null
  return {
    user,
    profile,
    department: getDepartment(profile.department_id),
    manager: getUser(profile.reports_to),
    name: `${user.first_name} ${user.last_name}`,
  }
}

export const allEmployees = (): EmployeeRow[] =>
  users.map((user) => employeeRow(user.user_id)).filter((row): row is EmployeeRow => row !== null)

export const activeEmployees = () => allEmployees().filter((row) => row.user.status)

export function directReports(managerId: number) {
  return allEmployees().filter((row) => row.profile.reports_to === managerId && row.user.status)
}

export function teamIds(managerId: number) {
  const found = new Set<number>()
  const queue = [managerId]
  while (queue.length > 0) {
    for (const row of directReports(queue.shift()!)) {
      if (row.user.user_id !== managerId && !found.has(row.user.user_id)) {
        found.add(row.user.user_id)
        queue.push(row.user.user_id)
      }
    }
  }
  return [...found]
}

export function departmentMembers(departmentId: number) {
  return allEmployees().filter((row) => row.profile.department_id === departmentId)
}

export function employeeCard(id: number, todayStatus: string | null): EmployeeCard | null {
  const row = employeeRow(id)
  if (!row) return null
  return {
    userId: id,
    fullName: row.name,
    email: row.user.email,
    profileImage: row.user.profile_image,
    position: row.profile.position,
    department: row.department?.department_name ?? null,
    managerName: row.manager ? `${row.manager.first_name} ${row.manager.last_name}` : null,
    directReports: directReports(id).length,
    todayStatus,
  }
}

export const departmentOptions = () =>
  departments.map((department) => ({ value: department.department_id, label: department.department_name }))

export interface PersonDraft {
  first: string
  last: string
  email: string
  phone: string
  role: Role
  department: number
  reportsTo: number | null
  position: string
  hire: string
  type: EmploymentType
  salary: number
}

export const nextUserId = () => Math.max(...users.map((user) => user.user_id)) + 1

export function savePerson(draft: PersonDraft, id?: number) {
  const userId = id ?? nextUserId()
  const existing = byId.get(userId)
  const user = existing ?? ({ user_id: userId, profile_image: null, status: true, created_at: new Date().toISOString() } as User)
  Object.assign(user, { first_name: draft.first, last_name: draft.last, email: draft.email, phone_number: draft.phone, role: draft.role })
  const profile = profileById.get(userId) ?? ({ user_id: userId } as EmployeeProfile)
  Object.assign(profile, { department_id: draft.department, reports_to: draft.reportsTo, position: draft.position, hire_date: draft.hire, employment_type: draft.type, basic_salary: draft.salary })
  if (!existing) {
    users.push(user)
    profiles.push(profile)
    byId.set(userId, user)
    profileById.set(userId, profile)
  }
  return userId
}

export function setPersonActive(id: number, active: boolean) {
  const user = byId.get(id)
  if (user) user.status = active
}

export function deleteDepartment(id: number) {
  const index = departments.findIndex((department) => department.department_id === id)
  if (index >= 0) departments.splice(index, 1)
}

export function saveDepartment(name: string, managerId: number | null, id?: number) {
  const existing = departments.find((department) => department.department_id === id)
  if (existing) {
    Object.defineProperty(existing, 'department_name', { value: name, enumerable: true, configurable: true, writable: true })
    existing.manager_id = managerId
    return existing.department_id
  }
  const created = { department_id: Math.max(...departments.map((department) => department.department_id)) + 1, department_name: name, manager_id: managerId }
  departments.push(created)
  return created.department_id
}
