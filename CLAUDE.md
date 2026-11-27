# NexusHR Frontend — قواعد الشغل (لـ Claude)

الريبو: فرونت مستقل. شخصين بيشتغلوا (بهاء وحسام) كل واحد بحسابه ومحادثته. الريبو هو المصدر الوحيد للحقيقة، مش المحادثة.

## ملفات لازم تعرفها
- `PLAN.md` الخطة: البرانشات والمسارات والـ endpoints والخطوات.
- `PROGRESS.md` الحالة: شو خلص، شو شغال، وملاحظات بتهم الثاني.
- `reference/ui-prototype` التصميم المطلوب (شاشات، tokens، بيانات تجريبية، نصوص عربي/إنجليزي).
- `reference/API_MAP.md` و`reference/openapi.json` العقد مع الباك. الباك الحقيقي مش متوفر، فنشتغل على Mock.

## طقس البداية (كل مرة بتبدأ برانش)
1. `git switch main && git pull`
2. اقرأ `PROGRESS.md` كامل، وصف البرانش من `PLAN.md`.
3. `git switch -c feat/<ميزة>`
4. اتأكد إن البرانش مش شغّال عليه الثاني (جدول PROGRESS.md) وإن اللي قبله بالمرحلة مدموج.

## قواعد البناء
- ستاك: React + Vite + TypeScript strict + Tailwind v4 + react-router + react-query + axios + MSW.
- كل ميزة مجلد `src/features/<اسم>` فيه: `index.ts` (routes, access, nav, dictionary) و`api.ts` و`hooks.ts` و`mocks.ts` و`pages/` و`components/`.
- الترتيب: الأنواع من `src/types/api.d.ts` ← `api.ts` ← `mocks.ts` ← `hooks.ts` ← الشاشات (قائمة، تفاصيل، نموذج، إجراءات).
- التصميم مطابق لـ `reference/ui-prototype` بالأدوار الثلاثة (hr_admin, manager, employee).
- كل شاشة بيانات: loading وempty وerror، وعربي RTL وإنجليزي LTR، والأزرار حسب الدور.
- شكل رد الـ Mock لازم يطابق `openapi.json`. الكود ما بيعرف إذا mock أو حقيقي.
- ممنوع تلمس أي ملف خارج `src/features/<اسم>`. لو لزم تعديل مشترك (`app` `components` `lib` `i18n` `types`) أو مكتبة جديدة: برانش `chore/...` صغير مستقل.
- ميزات الباك ما سوّاها (skills, smart-assign, nexa-bot): Mock فقط ومخفية بـ `VITE_ENABLE_PLANNED=false`.
- ما في تعليقات بالكود. ما ترفع `.env`.

## طقس النهاية (قبل ما تعتبر البرانش خلص)
1. `npm run lint` و`npm run build` بدون أخطاء.
2. حدّث `PROGRESS.md` بنفس البرانش: الحالة ✅ والتاريخ، وبقسم "ملاحظات للثاني" أي شي بيتأثر فيه: مكوّن مشترك احتجته، فرق بين الـ mock والـ openapi، قرار اتخذته.
3. `git add src/features/<ميزة> PROGRESS.md` (مش `git add .`)، وcommit بالإنجليزي: `feat(<ميزة>): وصف`.
4. `git pull --rebase origin main` ثم `git push -u origin feat/<ميزة>`، ولا تدمج بنفسك: بيراجع الثاني وبيعمل Squash and merge.

## لو المحادثة جديدة وما معك Claude Code
المستخدم بيلصق لك: هذا الملف، وصف البرانش من `PLAN.md`، وجدول `PROGRESS.md`، وملفات `reference` المطلوبة للميزة. اشتغل ملف ملف، وقول له أي أمر يشغّله.
