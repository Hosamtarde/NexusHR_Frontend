import { defineBi } from './define'

export const systemDict = defineBi({
  'err.home': ['العودة إلى لوحة التحكم', 'Back to the dashboard'],
  'err.404.title': ['لم نجد هذه الصفحة', "We couldn't find this page"],
  'err.404.desc': [
    'ربما تغيّر الرابط أو حُذف المحتوى. تحقق من العنوان أو ارجع إلى لوحة التحكم.',
    'The link may have changed or the content was removed. Check the address or go back to the dashboard.',
  ],
  'err.403.title': ['لا تملك صلاحية الوصول لهذه الصفحة', "You don't have access to this page"],
  'err.403.desc': [
    'هذه الصفحة متاحة لأدوار أخرى. إذا كنت تحتاجها في عملك فاطلب الصلاحية من مسؤول الموارد البشرية.',
    'This page is available to other roles. If you need it for your work, ask your HR administrator for access.',
  ],
  'err.403.noRole': [
    'حسابك لا يملك دورًا يسمح باستخدام النظام. تواصل مع مسؤول الموارد البشرية.',
    "Your account doesn't have a role that can use the system. Contact your HR administrator.",
  ],
  'err.500.title': ['حدث خطأ غير متوقع', 'Something went wrong'],
  'err.500.desc': [
    'لم تكتمل العملية. أعد تحميل الصفحة، وإذا تكررت المشكلة فتواصل مع مسؤول النظام.',
    "The action didn't complete. Reload the page, and if it keeps happening contact your system administrator.",
  ],
  'auth.signOut': ['تسجيل الخروج', 'Sign out'],
  'auth.signIn': ['تسجيل الدخول', 'Sign in'],
  'auth.signingIn': ['جارٍ تسجيل الدخول', 'Signing in'],
  'auth.email': ['البريد الإلكتروني', 'Email'],
  'auth.password': ['كلمة المرور', 'Password'],
  'auth.demo': ['حسابات تجريبية (Mock)', 'Demo accounts (mock)'],
  'auth.placeholder': ['صفحة دخول مؤقتة إلى أن تُبنى feat/auth-login.', 'Temporary sign-in page until feat/auth-login is built.'],
  'auth.loadingSession': ['جارٍ تحميل الجلسة', 'Loading your session'],
  'role.hr_admin': ['مسؤول الموارد البشرية', 'HR administrator'],
  'role.manager': ['مدير', 'Manager'],
  'role.employee': ['موظف', 'Employee'],
  'role.applicant': ['متقدّم لوظيفة', 'Applicant'],
  'lang.switch': ['English', 'العربية'],
})
