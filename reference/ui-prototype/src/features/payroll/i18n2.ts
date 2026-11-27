import { defineBi } from '@/i18n/bi'

export const payroll2Dict = defineBi({
  'pr.all.title': ['كل القسائم', 'All payslips'],
  'pr.f.allMonths': ['كل الأشهر', 'All months'],
  'pr.slip.editTitle': ['تعديل القسيمة', 'Edit payslip'],
  'pr.slip.editDesc': ['يُعاد احتساب الصافي = الأساسي + العلاوات − الاستقطاعات.', 'The net is recalculated as basic + bonuses − deductions.'],
  'pr.slip.errMoney': ['أدخل مبلغًا موجبًا بخانتين عشريتين كحد أقصى.', 'Enter a non-negative amount with up to two decimals.'],
  'pr.slip.saved': ['تم تحديث القسيمة', 'Payslip updated'],
  'pr.slip.deleted': ['تم حذف القسيمة', 'Payslip deleted'],
  'pr.slip.deleteTitle': ['حذف هذه القسيمة؟', 'Delete this payslip?'],
  'pr.slip.deleteDesc': ['لا يمكن التراجع عن الحذف.', 'This cannot be undone.'],
  'pr.run.scope': ['نطاق التوليد', 'Scope'],
  'pr.run.scopeAll': ['كل الموظفين النشطين', 'All active employees'],
  'pr.run.scopeOne': ['موظف واحد', 'One employee'],
  'pr.run.bonusAll': ['علاوات (لكل قسيمة)', 'Bonuses (per payslip)'],
  'pr.run.bonusHint': ['مبلغ اختياري يساوي صفرًا أو أكثر.', 'Optional amount, zero or more.'],
  'pr.run.rules': ['قسيمة واحدة لكل موظف في الشهر. الموظف الذي يتعذر إصدار قسيمته يُتخطى ولا يوقف الباقي.', 'One payslip per employee per month. An employee whose payslip cannot be issued is skipped and does not stop the others.'],
  'pr.run.skipped': ['سيُتخطى', 'Will be skipped'],
  'pr.run.skippedNote': ['{n} موظفًا لديهم قسيمة لهذا الشهر وسيُتخطون.', '{n} employees already have a payslip for this month and will be skipped.'],
  'pr.run.existsOne': ['هذا الموظف لديه قسيمة لهذا الشهر بالفعل.', 'This employee already has a payslip for this month.'],
  'pr.run.skippedN': ['تم تخطي {n}', '{n} skipped'],
  'pr.slip.owner': ['صاحب القسيمة', 'Payslip owner'],
})
