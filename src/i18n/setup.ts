import { defineBi } from './define'

export const setupDict = defineBi({
  'setup.title': ['الأساس جاهز', 'Foundation ready'],
  'setup.desc': ['هذه صفحة مؤقتة إلى أن تُسجِّل ميزة المسار /.', 'This is a placeholder until a feature registers the / route.'],
  'setup.features': ['الميزات المسجّلة', 'Registered features'],
  'setup.mock': ['وضع البيانات', 'Data mode'],
  'setup.mockOn': ['Mock (MSW)', 'Mock (MSW)'],
  'setup.mockOff': ['الباك الحقيقي', 'Real backend'],
  'setup.api': ['عنوان الـ API', 'API URL'],
  'setup.switchLang': ['English', 'العربية'],
  'setup.user': ['المستخدم الحالي', 'Signed in as'],
  'setup.role': ['الدور', 'Role'],
  'setup.chat': ['جلسة الرسائل', 'Chat session'],
  'setup.chatOn': ['متوفرة', 'Available'],
  'setup.chatOff': ['غير متوفرة', 'Unavailable'],
})
