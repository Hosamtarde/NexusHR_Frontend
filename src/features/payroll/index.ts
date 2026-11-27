import { defineFeature } from '@/app/feature'
import { defineBi } from '@/i18n'

export const dictionary = defineBi({})

export default defineFeature({
  id: 'payroll',
  routes: [],
  access: [],
  nav: [],
  dictionary,
})
