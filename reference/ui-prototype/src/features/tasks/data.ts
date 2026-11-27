import type { AssignedTask, Role, Task, TaskPriority, TaskStatus } from '@/types/entities'
import { teamIds } from '@/features/employees/data'
import { TODAY } from '@/lib/dates'
import { localize } from '@/i18n/localized'
import { enTaskText } from './en'

type Seed = [
  id: number,
  by: number,
  title: string,
  description: string,
  deadline: string,
  priority: TaskPriority,
  status: TaskStatus,
  created: string,
  assignees: [number, number][],
]

const seeds: Seed[] = [
  [1, 2, 'إعادة تصميم صفحة الحضور', 'تحديث واجهة تسجيل الحضور لتعمل على الجوال، مع عرض حالة اليوم ووقت الدخول بوضوح وإضافة تأكيد قبل الانصراف.', '2026-11-26', 'high', 'in_progress', '2026-11-12T08:30:00Z', [[5, 15]]],
  [2, 2, 'توثيق واجهات البرمجة', 'كتابة توثيق كامل لواجهات وحدة الطلبات والإجازات مع أمثلة الطلب والاستجابة.', '2026-11-14', 'medium', 'in_progress', '2026-11-02T08:00:00Z', [[6, 60], [5, 40]]],
  [3, 2, 'ترقية خوادم البريد', 'نقل صناديق البريد إلى الخادم الجديد وتحديث سجلات DNS بأقل انقطاع ممكن.', '2026-11-10', 'high', 'completed', '2026-10-20T08:00:00Z', [[7, 100]]],
  [4, 3, 'إقفال حسابات أكتوبر', 'مطابقة الحسابات البنكية وإقفال دفاتر شهر أكتوبر قبل إعداد التقارير الشهرية.', '2026-11-08', 'high', 'in_progress', '2026-11-01T08:00:00Z', [[8, 80], [23, 65]]],
  [5, 2, 'اختبار نظام الحضور', 'كتابة حالات اختبار لتسجيل الحضور والانصراف وحساب التأخير، وتجربتها على بيانات حقيقية.', '2026-11-20', 'medium', 'in_progress', '2026-11-05T08:00:00Z', [[19, 30]]],
  [6, 4, 'خطة مبيعات الربع الأول', 'إعداد خطة المبيعات للربع الأول 2027 مع الأهداف لكل مندوب والعملاء المستهدفين.', '2026-12-05', 'medium', 'to-do', '2026-11-09T08:00:00Z', [[10, 0], [11, 0], [21, 0]]],
  [7, 13, 'تحديث قاعدة المعرفة', 'مراجعة مقالات الدعم الأكثر طلبًا وتحديثها حسب الأسئلة المتكررة في أكتوبر.', '2026-11-30', 'low', 'to-do', '2026-11-06T08:00:00Z', [[12, 10], [14, 0], [22, 20]]],
  [8, 15, 'جرد المستودع الرئيسي', 'جرد كامل للمستودع الرئيسي ومطابقته مع النظام قبل نهاية الربع.', '2026-12-15', 'medium', 'to-do', '2026-11-10T08:00:00Z', [[17, 0], [16, 0]]],
  [9, 1, 'تحديث دليل الموظف', 'إضافة سياسة العمل الهجين وتحديث سياسة الإجازات في دليل الموظف.', '2026-11-18', 'medium', 'in_progress', '2026-10-30T08:00:00Z', [[18, 50], [20, 35]]],
  [10, 1, 'تنظيم يوم التوظيف المفتوح', 'التنسيق مع جامعة بوليتكنك فلسطين لتنظيم يوم توظيف مفتوح لطلبة السنة الأخيرة.', '2026-12-10', 'low', 'to-do', '2026-11-11T08:00:00Z', [[18, 5]]],
  [11, 2, 'نقل النسخ الاحتياطية إلى السحابة', 'جدولة نسخ احتياطية ليلية لقاعدة البيانات إلى التخزين السحابي مع اختبار الاستعادة.', '2026-11-05', 'high', 'in_progress', '2026-10-15T08:00:00Z', [[7, 70]]],
  [12, 3, 'تقرير الموازنة التقديرية', 'إعداد مسودة الموازنة التقديرية لعام 2027 لعرضها على الإدارة.', '2026-10-25', 'medium', 'cancelled', '2026-10-01T08:00:00Z', [[9, 20]]],
  [13, 4, 'زيارات عملاء الخليل', 'زيارة العملاء الرئيسيين في منطقة الخليل وتوثيق ملاحظاتهم.', '2026-11-03', 'medium', 'completed', '2026-10-18T08:00:00Z', [[10, 100], [11, 100]]],
  [14, 13, 'تقليل زمن الرد على التذاكر', 'تحليل التذاكر المتأخرة واقتراح خطوات لتقليل زمن الرد الأول إلى أقل من ساعتين.', '2026-11-09', 'high', 'in_progress', '2026-10-25T08:00:00Z', [[12, 55], [14, 40]]],
]

export const tasks: Task[] = seeds.map(([id, by, title, description, deadline, priority, status, created]) =>
  localize(
    { task_id: id, assigned_by: by, task_title: title, description, deadline, task_priority: priority, task_status: status, created_at: created },
    { task_title: { ar: title, en: enTaskText[id]?.[0] ?? title }, description: { ar: description, en: enTaskText[id]?.[1] ?? description } },
  ),
)

export const assignments: AssignedTask[] = seeds.flatMap(([id, , , , , , , created, assignees]) =>
  assignees.map(([userId, completion]) => ({
    user_id: userId,
    task_id: id,
    assigned_at: created,
    completion_percentage: completion,
  })),
)

export const assigneesOf = (taskId: number, list: AssignedTask[] = assignments) => list.filter((item) => item.task_id === taskId)

export const progressOf = (taskId: number, source: AssignedTask[] = assignments) => {
  const list = assigneesOf(taskId, source)
  return list.length ? Math.round(list.reduce((sum, item) => sum + item.completion_percentage, 0) / list.length) : 0
}

export const isOverdue = (task: Task) =>
  task.deadline < TODAY && task.task_status !== 'completed' && task.task_status !== 'cancelled'

export const tasksAssignedTo = (userId: number, taskList: Task[] = tasks, source: AssignedTask[] = assignments) =>
  taskList.filter((task) => source.some((item) => item.task_id === task.task_id && item.user_id === userId))

export function visibleTasks(role: Role, userId: number, taskList: Task[] = tasks, source: AssignedTask[] = assignments) {
  if (role === 'hr_admin') return taskList
  if (role === 'manager') {
    const team = teamIds(userId)
    return taskList.filter(
      (task) =>
        task.assigned_by === userId ||
        source.some((item) => item.task_id === task.task_id && (item.user_id === userId || team.includes(item.user_id))),
    )
  }
  return tasksAssignedTo(userId, taskList, source)
}

export const requiredSkills: Record<number, [skillId: number, level: number][]> = {
  1: [[1, 3], [7, 2]],
  2: [[14, 3], [3, 3]],
  3: [[5, 4]],
  4: [[9, 4], [12, 3]],
  5: [[6, 3]],
  6: [[19, 3], [20, 3]],
  7: [[13, 3], [14, 2]],
  8: [[23, 3], [24, 3]],
  9: [[14, 3], [18, 3]],
  10: [[18, 3], [15, 3]],
  11: [[5, 3], [4, 3]],
  14: [[13, 3]],
}
