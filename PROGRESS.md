# NexusHR Frontend — الحالة

آخر تحديث: 2026-11-27

الحالة: ⬜ لم يبدأ · 🔄 شغال عليه · 👀 PR مفتوح · ✅ مدموج على main
كل برانش بيحدّث هذا الملف بنفس الـ PR تبعه.

| # | البرانش | المنفّذ | الحالة | التاريخ | دمج الباك |
|---|---|---|---|---|---|
| 0.1 | chore/project-setup | حسام | ✅ | 2026-11-27 | — |
| 0.2 | feat/ui-kit | بهاء | ⬜ | | — |
| 0.3 | feat/core-api-auth | حسام | ✅ | 2026-11-27 | ⬜ |
| 0.4 | feat/app-shell | بهاء | ⬜ | | — |
| 0.5 | feat/shared-components | حسام | ⬜ | | ⬜ |
| 1.1 | feat/auth-login | بهاء | ⬜ | | ⬜ |
| 1.2 | feat/account | بهاء | ⬜ | | ⬜ |
| 1.3 | feat/notifications | بهاء | ⬜ | | ⬜ |
| 1.4 | feat/employees | حسام | ⬜ | | ⬜ |
| 1.5 | feat/departments | حسام | ⬜ | | ⬜ |
| 2.1 | feat/requests | بهاء | ⬜ | | ⬜ |
| 2.2 | feat/leave | بهاء | ⬜ | | ⬜ |
| 2.3 | feat/admin | بهاء | ⬜ | | ⬜ |
| 2.4 | feat/org-chart | حسام | ⬜ | | ⬜ |
| 2.5 | feat/attendance | حسام | ⬜ | | ⬜ |
| 2.6 | feat/tasks | حسام | ⬜ | | ⬜ |
| 3.1 | feat/recruitment | بهاء | ⬜ | | ⬜ |
| 3.2 | feat/performance | بهاء | ⬜ | | ⬜ |
| 3.3 | feat/payroll | حسام | ⬜ | | ⬜ |
| 3.4 | feat/reports | حسام | ⬜ | | ⬜ |
| 4.1 | feat/dashboard | بهاء | ⬜ | | ⬜ |
| 4.2 | feat/messages | بهاء | ⬜ | | ⬜ (يحتاج Rocket.Chat) |
| 4.3 | feat/landing | حسام | ⬜ | | — |
| 4.4 | feat/nexa-bot | بهاء | ⬜ | | لا يوجد باك |
| 4.5 | feat/skills | حسام | ⬜ | | لا يوجد باك |
| 4.6 | feat/smart-assign | حسام | ⬜ | | لا يوجد باك |

## ملاحظات للثاني
سطر لكل ملاحظة: التاريخ — البرانش — الملاحظة.

- 2026-11-27 — chore/project-setup — كل ميزة بتتسجّل من `index.ts` تبعها بس (routes, access, nav, dictionary, planned) والـ mocks من `mocks.ts`، بدون لمس ملفات مشتركة. التفاصيل بقسم "بنية المشروع" بـ CLAUDE.md.
- 2026-11-27 — chore/project-setup — `openapi.json` ما فيه أشكال الردود (DTOs الطلبات بس)، فـ `gen:types` بيعطي أنواع الطلبات بس. أنواع الردود بتنكتب بالميزة من `API_MAP.md`.
- 2026-11-27 — chore/project-setup — MSW نسخة 3: `onUnhandledRequest` صار اسمه `onUnhandledFrame`. `gen:types` بيشغّل `openapi-typescript` عبر npx لأنه بيحتاج TypeScript 5 والمشروع على 7.
- 2026-11-27 — chore/project-setup — `components/ui` فاضي لـ `feat/ui-kit`. الصفحة المؤقتة و404 بـ `src/app/SetupPages.tsx` بيتبدّلوا بـ `feat/core-api-auth`.
- 2026-11-27 — feat/core-api-auth — كل شي من `@/app/auth`: `useAuth()` (status, user, role, chat, login, logout, can) و`RequireAuth` و`RoleGuard` (بدون props بيقرأ `access` من الـ registry، أو `roles={[...]}`) و`RedirectIfAuthenticated`. صفحات 403/404/500 بـ `@/app/ErrorPages`، ومسار `/403` موجود.
- 2026-11-27 — feat/core-api-auth — الأنواع بـ `@/types/auth` و`@/types/users`. `Role` فيه `applicant`، و`AppRole` للأدوار الثلاثة. `canAccess` بيرفض أي دور مش من الثلاثة، فـ applicant أو دور غريب بيشوف 403 مع زر تسجيل خروج بدل ما ينهار.
- 2026-11-27 — feat/core-api-auth — `chat` من login وrefresh هو `{ user_id: string, auth_token: string } | null` (`user_id` نص من Rocket.Chat، مش رقم)، محفوظ بالجلسة ومتاح بـ `useAuth().chat` أو `getChatSession()` من `@/lib/session`.
- 2026-11-27 — feat/core-api-auth — refresh عند 401: محاولة وحدة لكل طلب، وكل الـ 401 المتزامنة بتستنى refresh واحد، لأن الباك بيدوّر الـ refresh token وإعادة استخدامه بتلغي كل الجلسات. لو فشل الـ refresh بتنمسح الجلسة وبيتحوّل لـ `/login`.
- 2026-11-27 — feat/core-api-auth — حسابات الـ Mock (`src/mocks/accounts.ts`): `admin@hrms.com`/`admin123` و`manager@hrms.com`/`manager123` و`employee@hrms.com`/`employee123`، و`applicant@hrms.com`/`applicant123` لتجربة الحماية بس. الـ admin والـ employee نفس seed الباك، والـ manager مش موجود بالباك.
- 2026-11-27 — feat/core-api-auth — لبهاء (`feat/auth-login`): سجّل `/login` بـ `publicRoutes` ولفّه بـ `RedirectIfAuthenticated`، وصفحة الدخول المؤقتة (`src/app/auth/LoginFallback.tsx`) بتختفي لحالها. بعد الدخول ارجع لـ `location.state.from`. الـ mock بيرجّع رسائل الباك نفسها (400 مصفوفة، 401، 429 بعد 5 محاولات بالدقيقة).
- 2026-11-27 — feat/core-api-auth — لـ mocks الميزات: `authenticate(request, roles?)` من `@/mocks/session` بيرجّع الحساب أو رد 401/403 جاهز بنفس رسائل الباك (`Unauthorized`، `Forbidden resource`).
- 2026-11-27 — feat/core-api-auth — لبهاء (`feat/app-shell`): التطبيق محمي بـ `RequireAuth` ثم `RoleGuard` بـ `src/app/router.tsx`. الـ AppShell بينحط مكان `<RoleGuard />` (أو حوله) بنفس الملف.
