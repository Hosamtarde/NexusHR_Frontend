export type DefaultAvatar = 'male' | 'female' | 'neutral'

const maleNames = [
  'أحمد', 'محمد', 'يوسف', 'خالد', 'عمر', 'سامي', 'طارق', 'إياد', 'باسل', 'زياد', 'مراد', 'وسام', 'علي', 'حسن', 'حسين', 'إبراهيم', 'عبدالله', 'عبدالرحمن', 'مصطفى', 'محمود', 'ماجد', 'فادي', 'رامي', 'أسامة', 'كريم', 'نبيل', 'هاني', 'سعيد', 'سليمان', 'صالح', 'ياسر', 'وليد', 'ماهر', 'مازن', 'بشار', 'جمال', 'رائد', 'ناصر', 'فيصل', 'عادل', 'إسماعيل', 'داود', 'سمير', 'مهند', 'أنس', 'آدم', 'نور', 'فرح',
  'ahmad', 'ahmed', 'mohammad', 'mohammed', 'muhammad', 'yousef', 'yusuf', 'joseph', 'khaled', 'omar', 'sami', 'tareq', 'tarek', 'iyad', 'basel', 'ziad', 'murad', 'wesam', 'ali', 'hassan', 'hussein', 'ibrahim', 'abdullah', 'mustafa', 'mahmoud', 'majed', 'fadi', 'rami', 'osama', 'karim', 'nabil', 'hani', 'said', 'suleiman', 'saleh', 'yasser', 'waleed', 'maher', 'mazen', 'bashar', 'jamal', 'raed', 'nasser', 'faisal', 'adel', 'ismail', 'dawood', 'samir', 'muhanad', 'anas', 'adam', 'john', 'michael', 'david', 'daniel', 'james', 'robert', 'william', 'thomas', 'peter', 'mark', 'paul', 'nour', 'farah',
]

const femaleNames = [
  'سارة', 'ليلى', 'رنا', 'دينا', 'هبة', 'آية', 'مها', 'ريم', 'لينا', 'جنى', 'فرح', 'فاطمة', 'مريم', 'نورة', 'سلمى', 'هدى', 'أمل', 'رشا', 'إسراء', 'سمر', 'ميساء', 'نادين', 'يارا', 'لمى', 'دانا', 'ديما', 'رولا', 'هالة', 'منى', 'سناء', 'خديجة', 'عائشة', 'زينب', 'رغد', 'تالا', 'شهد', 'بتول', 'حنان', 'وفاء', 'ولاء', 'نهى', 'ريما', 'لانا', 'سوسن', 'نور', 'وسام',
  'sara', 'sarah', 'layla', 'leila', 'rana', 'dina', 'heba', 'hiba', 'aya', 'maha', 'reem', 'rim', 'lina', 'jana', 'farah', 'fatima', 'maryam', 'mariam', 'mary', 'noura', 'salma', 'huda', 'amal', 'rasha', 'esraa', 'samar', 'maysa', 'nadine', 'yara', 'lama', 'dana', 'dima', 'rola', 'hala', 'mona', 'sanaa', 'khadija', 'aisha', 'zeinab', 'tala', 'shahd', 'batoul', 'hanan', 'wafa', 'walaa', 'nuha', 'lana', 'sawsan', 'nour', 'wesam', 'anna', 'emma', 'olivia', 'sophia', 'laura', 'julia',
]

const normalize = (value: string) =>
  value
    .trim()
    .split(/\s+/)[0]!
    .replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()

const male = new Set(maleNames.map(normalize))
const female = new Set(femaleNames.map(normalize))

export function getDefaultAvatar(firstName: string | null | undefined): DefaultAvatar {
  if (!firstName) return 'neutral'
  const key = normalize(firstName)
  const isMale = male.has(key)
  const isFemale = female.has(key)
  if (isMale === isFemale) return 'neutral'
  return isMale ? 'male' : 'female'
}
