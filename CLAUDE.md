# NexusHR Frontend — قواعد الشغل (لـ Claude)

الريبو: فرونت مستقل. شخصين بيشتغلوا (بهاء وحسام) كل واحد بحسابه ومحادثته. الريبو هو المصدر الوحيد للحقيقة، مش المحادثة.

## ملفات لازم تعرفها
- `PLAN.md` الخطة: البرانشات والمسارات والـ endpoints والخطوات.
- `PROGRESS.md` الحالة: شو خلص، شو شغال، وملاحظات بتهم الثاني.
- `reference/ui-prototype` التصميم المطلوب (شاشات، tokens، بيانات تجريبية، نصوص عربي/إنجليزي).
- `reference/API_MAP.md` العقد مع الباك، و`reference/openapi.json` مرجع إضافي. الباك الحقيقي مش متوفر، فنشتغل على Mock.
- `reference/UI_GUIDE.md` و`reference/AUDIT.md` و`reference/NexusHR_UIUX_Notes.md` قواعد وملاحظات التصميم.

## طقس البداية (كل مرة بتبدأ برانش)
1. `git switch main && git pull`
2. اقرأ `PROGRESS.md` كامل، وصف البرانش من `PLAN.md`.
3. `git switch -c feat/<ميزة>`
4. اتأكد إن البرانش مش شغّال عليه الثاني (جدول PROGRESS.md) وإن اللي قبله بالمرحلة مدموج.

## قواعد البناء
- ستاك: React + Vite + TypeScript strict + Tailwind v4 + react-router + react-query + axios + MSW.
- كل ميزة مجلد `src/features/<اسم>` فيه: `index.ts` (routes, access, nav, dictionary) و`types.ts` و`api.ts` و`hooks.ts` و`mocks.ts` و`pages/` و`components/`.
- الترتيب: `types.ts` ← `api.ts` ← `mocks.ts` ← `hooks.ts` ← الشاشات (قائمة، تفاصيل، نموذج، إجراءات).
- التصميم مطابق لـ `reference/ui-prototype` بالأدوار الثلاثة (hr_admin, manager, employee).
- كل شاشة بيانات: loading وempty وerror، وعربي RTL وإنجليزي LTR، والأزرار حسب الدور.
- أنواع الطلبات والردود بتنكتب بكل ميزة بملف `types.ts` من `reference/API_MAP.md`. `openapi.json` مرجع إضافي بس (بعض الـ DTO فاضية فيه). الكود ما بيعرف إذا mock أو حقيقي.
- ممنوع تلمس أي ملف خارج `src/features/<اسم>`. لو لزم تعديل مشترك (`app` `components` `lib` `i18n` `types`) أو مكتبة جديدة: برانش `chore/...` صغير مستقل.
- دور `applicant` موجود بالباك وما إله واجهة. الـ RoleGuard لازم ما ينهار لو وصل هالدور (أو أي دور مش معروف): بيتعامل معه كممنوع من الوصول، مش كخطأ.
- ما في تعليقات بالكود. ما ترفع `.env`.

## قواعد الباك
- الباك ما بنلمسه ولا بنعدّل عليه ولا بنطلب تعديل.
- أي فرق بين الـ mock والباك بنصلحه بالفرونت.
- المهارات والتعيين الذكي وNexa بتضل Mock ومخفية بـ `VITE_ENABLE_PLANNED=false`.

## بنية المشروع (من `chore/project-setup`)
- اسم مجلد الميزة = اسم البرانش بعد `feat/` (مثلاً `src/features/org-chart`). المجلدات موجودة من البداية، وكل واحد فيه `index.ts`.
- `index.ts` بيعمل `export default defineFeature({ id, planned?, routes, publicRoutes, access, nav, dictionary })` من `@/app/feature`. التسجيل تلقائي عبر `import.meta.glob` بـ `src/app/registry.ts`، فما في داعي تعدّل أي ملف مشترك عشان تضيف مسار أو قائمة أو ترجمة أو mock.
  - `routes` داخل التطبيق (المسار نسبي بدون `/` بالأول، مثلاً `employees/:id`)، و`publicRoutes` للصفحات العامة (`/login` `/careers`). أول ميزة بتسجّل `/` بتلغي الصفحة المؤقتة.
  - `access`: صفوف `['/employees/:id', ['hr_admin']]`، وبيقرأها `canAccess` من `@/app/access`.
  - `planned: true` بيخفي الميزة كلها إلا إذا `VITE_ENABLE_PLANNED=true`.
- الترجمة: `export const dictionary = defineBi({ 'employees.title': ['الموظفون', 'Employees'] })` بالـ `index.ts`، وبالشاشات `const { t } = useI18n(dictionary)` (المفاتيح typed). مفاتيح الميزة بتبدأ باسمها. النصوص العامة (`act.*` `state.*` `k.*`) جاهزة بـ `@/i18n`.
- الـ API: `http.get/post/put/patch/delete/blob` من `@/lib/http` بيرجّع `data` مباشرة (بيفك `{ success, data, timestamp }`)، والأخطاء `ApiError` فيها `status` و`messages`. الأنواع العامة `Role` `Paginated<T>` `PageParams` بـ `@/types/common`.
- الـ Mock: `mocks.ts` بيعمل `export const handlers = [...]` بـ `http` من `msw`، مع `api('/path')` و`ok(data)` و`fail(status, message)` و`paginate(items, request)` من `@/mocks/utils`. بيتسجّل تلقائياً.
- `src/types/api.d.ts` مولّد من `openapi.json` (`npm run gen:types`) للرجوع إليه بس، لا تعدّله بإيدك ولا تعتمد عليه كمصدر للأنواع. المصدر هو `types.ts` بالميزة.
- `reference/` مستثنى من lint وbuild وTailwind.

## قاعدة الـ commits
- commit صغير ومستقل لكل خطوة منطقية: types، api وhooks، mocks، صفحة، مكوّن، تسجيل المسارات.
- الرسالة بالإنجليزي بصيغة conventional: `feat(<ميزة>): وصف`، `fix(...)`، `docs(...)`، `chore(...)`.
- كل commit لحاله لازم يمر `npm run lint` و`npm run build`.
- `git add` للملفات المعنية بالخطوة بس (مش `git add .`).
- ما بنعمل commits تافهة لتكبير العدد، وما بنعمل squash.

## طقس النهاية (قبل ما تعتبر البرانش خلص)
1. `npm run lint` و`npm run build` بدون أخطاء.
2. حدّث `PROGRESS.md` بنفس البرانش: الحالة ✅ والتاريخ، وبقسم "ملاحظات للثاني" أي شي بيتأثر فيه: مكوّن مشترك احتجته، فرق بين الـ mock و`API_MAP.md`، قرار اتخذته.
3. commit أخير لـ `PROGRESS.md` لحاله: `docs(<ميزة>): ...` (حسب "قاعدة الـ commits").
4. `git pull --rebase origin main` ثم `git push -u origin feat/<ميزة>`، ولا تدمج بنفسك: بيراجع الثاني وبيعمل Squash and merge.

## لو المحادثة جديدة وما معك Claude Code
المستخدم بيلصق لك: هذا الملف، وصف البرانش من `PLAN.md`، وجدول `PROGRESS.md`، وملفات `reference` المطلوبة للميزة. اشتغل ملف ملف، وقول له أي أمر يشغّله.
