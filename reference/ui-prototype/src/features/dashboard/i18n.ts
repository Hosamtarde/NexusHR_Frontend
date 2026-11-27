import { defineDict } from '@/i18n/define'

export const dashboardDict = defineDict(
  {
    'dash.morning': 'صباح الخير، {name}',
    'dash.afternoon': 'مساء الخير، {name}',
    'dash.evening': 'مساء الخير، {name}',
    'dash.summaryHr': 'لديك {pending} طلبات تنتظر قرارك و{interviews} مقابلات اليوم.',
    'dash.allClear': 'لا شيء ينتظر قرارك الآن.',
    'dash.addEmployee': 'إضافة موظف',

    'dash.m.employees': 'الموظفون النشطون',
    'dash.m.employeesHint': 'في {n} أقسام',
    'dash.m.present': 'الحاضرون اليوم',
    'dash.m.presentHint': '{n} من {total}',
    'dash.m.pending': 'طلبات معلّقة',
    'dash.m.pendingHint': 'الأقدم منذ {n} أيام',
    'dash.m.pendingNone': 'لا يوجد',
    'dash.m.interviews': 'مقابلات هذا الأسبوع',
    'dash.m.interviewsHint': 'اليوم: {n}',

    'dash.attendance.title': 'الحضور خلال الأسبوع',
    'dash.attendance.onTime': 'في الموعد',
    'dash.attendance.late': 'متأخر',
    'dash.attendance.day': 'اليوم',

    'dash.approvals.title': 'بانتظار قرارك',
    'dash.approvals.emptyTitle': 'لا توجد طلبات معلّقة',
    'dash.approvals.approved': 'تم اعتماد الطلب',
    'dash.approvals.rejected': 'تم رفض الطلب',
    'dash.approvals.notified': 'وصل إشعار لصاحب الطلب.',
    'dash.approvals.open': 'فتح الطلب',

    'dash.today.title': 'الأسبوع القادم',
    'dash.today.empty': 'لا توجد مواعيد هذا الأسبوع.',

    'dash.dept.title': 'الحضور حسب القسم',

    'dash.eyebrow': '{weekday}، {date}',
    'dash.reviewRequests': 'مراجعة الطلبات',
    'dash.undo': 'تراجع',
    'dash.ev.interview': 'مقابلة {name}، {job}',
    'dash.ev.deadline': 'موعد تسليم: {title}',
    'req.loanSummary': '{amount} على {n} أقساط',
    'req.days': '{n} أيام',
  },
  {
    'dash.morning': 'Good morning, {name}',
    'dash.afternoon': 'Good afternoon, {name}',
    'dash.evening': 'Good evening, {name}',
    'dash.summaryHr': '{pending} requests are waiting for your decision and {interviews} interviews are scheduled today.',
    'dash.allClear': 'Nothing is waiting for your decision right now.',
    'dash.addEmployee': 'Add employee',

    'dash.m.employees': 'Active employees',
    'dash.m.employeesHint': 'Across {n} departments',
    'dash.m.present': 'Present today',
    'dash.m.presentHint': '{n} of {total}',
    'dash.m.pending': 'Pending requests',
    'dash.m.pendingHint': 'Oldest is {n} days old',
    'dash.m.pendingNone': 'None',
    'dash.m.interviews': 'Interviews this week',
    'dash.m.interviewsHint': 'Today: {n}',

    'dash.attendance.title': 'Attendance this week',
    'dash.attendance.onTime': 'On time',
    'dash.attendance.late': 'Late',
    'dash.attendance.day': 'Day',

    'dash.approvals.title': 'Needs your decision',
    'dash.approvals.emptyTitle': 'No pending requests',
    'dash.approvals.approved': 'Request approved',
    'dash.approvals.rejected': 'Request rejected',
    'dash.approvals.notified': 'The requester has been notified.',
    'dash.approvals.open': 'Open request',

    'dash.today.title': 'Coming up',
    'dash.today.empty': 'Nothing scheduled this week.',

    'dash.dept.title': 'Presence by department',

    'dash.eyebrow': '{weekday}, {date}',
    'dash.reviewRequests': 'Review requests',
    'dash.undo': 'Undo',
    'dash.ev.interview': 'Interview with {name}, {job}',
    'dash.ev.deadline': 'Task due: {title}',
    'req.loanSummary': '{amount} over {n} installments',
    'req.days': '{n} days',
  },
)
