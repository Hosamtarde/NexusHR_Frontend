import { defineBi } from '@/i18n/bi'

export const leave2Dict = defineBi({
  'lt.errLength': ['الاسم بين 2 و100 حرف.', 'The name must be 2 to 100 characters.'],
  'lb.calc': ['احتساب الأرصدة', 'Calculate balances'],
  'lb.year': ['السنة', 'Year'],
  'lb.calcTitle': ['احتساب أرصدة {year}؟', 'Calculate balances for {year}?'],
  'lb.calcDesc': ['يُحدَّث الرصيد حسب أيام كل نوع إجازة، ولا تُمَس الأرصدة المعدَّلة يدويًا.', 'Balances follow each leave type days. Manually edited balances are not touched.'],
  'lb.calcDone': ['تم تحديث {n} رصيدًا', '{n} balances updated'],
  'lb.editTitle': ['تعديل رصيد {name}', 'Edit the balance of {name}'],
  'lb.editDesc': ['القيم من 0 إلى 365 بخانة عشرية واحدة. يُعلَّم الرصيد كمعدَّل يدويًا.', 'Values are 0 to 365 with one decimal. The balance is marked as manual.'],
  'lb.errRange': ['أدخل قيمة بين 0 و365.', 'Enter a value between 0 and 365.'],
  'lb.saved': ['تم تحديث رصيد {name}', 'Balance updated for {name}'],
})
