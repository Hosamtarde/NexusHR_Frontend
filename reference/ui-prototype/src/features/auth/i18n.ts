import { defineDict } from '@/i18n/define'

export const authDict = defineDict(
  {
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.submit': 'تسجيل الدخول',
    'auth.errEmail': 'أدخل بريدًا إلكترونيًا صحيحًا.',
    'auth.errPassword': 'أدخل كلمة المرور.',
    'auth.invalidTitle': 'البريد أو كلمة المرور غير صحيحة',
    'auth.invalidMsg': 'تحقق من البيانات وحاول مرة أخرى.',
    'auth.throttledTitle': 'محاولات كثيرة',
    'auth.throttledMsg': 'أوقفنا الدخول مؤقتًا لحماية حسابك. حاول مرة أخرى بعد دقيقة.',
    'auth.careers': 'تبحث عن وظيفة؟',
    'auth.careersLink': 'اطّلع على الوظائف المتاحة وقدّم طلبك',



    'auth.reset.mismatch': 'كلمتا المرور غير متطابقتين.',

    'pw.show': 'إظهار كلمة المرور',
    'pw.hide': 'إخفاء كلمة المرور',
    'pw.rule.length': '8 أحرف على الأقل',
    'pw.rule.case': 'حرف كبير وحرف صغير',
    'pw.rule.digit': 'رقم واحد على الأقل',
    'pw.rule.symbol': 'رمز مثل ! أو @',
    'pw.met': '، متحقق',
    'pw.unmet': '، غير متحقق',
    'pw.strength': 'قوة كلمة المرور: {level}',
    'pw.level.0': 'ضعيفة جدًا',
    'pw.level.1': 'ضعيفة',
    'pw.level.2': 'متوسطة',
    'pw.level.3': 'جيدة',
    'pw.level.4': 'قوية',
  },
  {
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.submit': 'Sign in',
    'auth.errEmail': 'Enter a valid email address.',
    'auth.errPassword': 'Enter your password.',
    'auth.invalidTitle': 'Incorrect email or password',
    'auth.invalidMsg': 'Check your details and try again.',
    'auth.throttledTitle': 'Too many attempts',
    'auth.throttledMsg': 'We paused sign-in to protect your account. Try again in a minute.',
    'auth.careers': 'Looking for a job?',
    'auth.careersLink': 'See open positions and apply',



    'auth.reset.mismatch': 'The passwords do not match.',

    'pw.show': 'Show password',
    'pw.hide': 'Hide password',
    'pw.rule.length': 'At least 8 characters',
    'pw.rule.case': 'An uppercase and a lowercase letter',
    'pw.rule.digit': 'At least one number',
    'pw.rule.symbol': 'A symbol such as ! or @',
    'pw.met': ', met',
    'pw.unmet': ', not met',
    'pw.strength': 'Password strength: {level}',
    'pw.level.0': 'Very weak',
    'pw.level.1': 'Weak',
    'pw.level.2': 'Fair',
    'pw.level.3': 'Good',
    'pw.level.4': 'Strong',
  },
)
