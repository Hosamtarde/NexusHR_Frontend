import assert from 'node:assert/strict'
import { getDefaultAvatar } from '../src/lib/avatar.ts'

const cases: [string | null | undefined, string][] = [
  ['أحمد', 'male'],
  ['Ahmad', 'male'],
  ['  Mohammad ', 'male'],
  ['إبراهيم', 'male'],
  ['سارة', 'female'],
  ['ساره', 'female'],
  ['Sara', 'female'],
  ['ليلى', 'female'],
  ['ليلي', 'female'],
  ['آية', 'female'],
  ['اية', 'female'],
  ['Farah', 'neutral'],
  ['نُور', 'neutral'],
  ['Nour', 'neutral'],
  ['Xyzzy', 'neutral'],
  ['', 'neutral'],
  [null, 'neutral'],
  [undefined, 'neutral'],
]

for (const [name, expected] of cases) assert.equal(getDefaultAvatar(name), expected, `${String(name)} -> ${expected}`)

const seedNames = ['سارة', 'أحمد', 'ليلى', 'محمد', 'يوسف', 'رنا', 'خالد', 'دينا', 'عمر', 'هبة', 'سامي', 'نور', 'طارق', 'آية', 'إياد', 'مها', 'باسل', 'فرح', 'زياد', 'ريم', 'مراد', 'لينا', 'وسام', 'جنى']
const neutral = seedNames.filter((name) => getDefaultAvatar(name) === 'neutral')
console.log(`${cases.length} cases passed`)
console.log(`seed users falling to neutral: ${neutral.join(', ') || 'none'}`)
