import { defineDict } from '@/i18n/define'

export const systemDict = defineDict(
  {
    'err.home': 'العودة إلى لوحة التحكم',
    'err.404.title': 'لم نجد هذه الصفحة',
    'err.404.desc': 'ربما تغيّر الرابط أو حُذف المحتوى. تحقق من العنوان أو ارجع إلى لوحة التحكم.',
    'err.403.title': 'لا تملك صلاحية الوصول لهذه الصفحة',
    'err.403.desc': 'هذه الصفحة متاحة لأدوار أخرى. إذا كنت تحتاجها في عملك فاطلب الصلاحية من مسؤول الموارد البشرية.',
    'err.500.title': 'حدث خطأ غير متوقع',
    'err.500.desc': 'لم تكتمل العملية. أعد تحميل الصفحة، وإذا تكررت المشكلة فتواصل مع مسؤول النظام.',

    'notifs.title': 'الإشعارات',
    'notifs.all': 'الكل',
    'notifs.unread': 'غير المقروءة',
    'notifs.markAll': 'تعليم الكل كمقروء',
    'notifs.clearRead': 'حذف المقروءة',
    'notifs.open': 'فتح',
    'notifs.markRead': 'تعليم كمقروء',
    'notifs.delete': 'حذف الإشعار',
    'notifs.emptyTitle': 'لا توجد إشعارات',
    'notifs.emptyUnreadTitle': 'قرأت كل شيء',
  },
  {
    'err.home': 'Back to the dashboard',
    'err.404.title': "We couldn't find this page",
    'err.404.desc': 'The link may have changed or the content was removed. Check the address or go back to the dashboard.',
    'err.403.title': "You don't have access to this page",
    'err.403.desc': 'This page is available to other roles. If you need it for your work, ask your HR administrator for access.',
    'err.500.title': 'Something went wrong',
    'err.500.desc': "The action didn't complete. Reload the page, and if it keeps happening contact your system administrator.",

    'notifs.title': 'Notifications',
    'notifs.all': 'All',
    'notifs.unread': 'Unread',
    'notifs.markAll': 'Mark all as read',
    'notifs.clearRead': 'Delete read',
    'notifs.open': 'Open',
    'notifs.markRead': 'Mark as read',
    'notifs.delete': 'Delete notification',
    'notifs.emptyTitle': 'No notifications',
    'notifs.emptyUnreadTitle': "You're all caught up",
  },
)
