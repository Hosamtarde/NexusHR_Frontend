# NexusHR Frontend — الخطة

## الفكرة
- ريبو فرونت منفصل. الباك والدوكر عند حسام فقط، فبهاء بيشتغل على Mock بنفس شكل ردود الباك الحقيقي.
- الدمج مع الباك الحقيقي آخر شي، وحسام بس بيعمله.
- فرع واحد دائم: `main` (محمي، PR فقط). ما في `develop`.
- 26 برانش، 71 مسار، حوالي 60 واجهة، 5 مراحل. ما بننتقل لمرحلة جديدة إلا لما تندمج كل برانشات المرحلة الحالية.
- الحالة الحالية بـ `PROGRESS.md`.

## الخطوات الخمسة لكل برانش
1. افتح برانش من `main`.
2. Claude بيبني: types ← api.ts ← mocks.ts ← hooks.ts ← الشاشات، بحسب `CLAUDE.md`، مع commit صغير لكل خطوة (شوف "قاعدة الـ commits").
3. افحص: `npm run lint` و`npm run build` وجرّب الأدوار الثلاثة بالـ mock.
4. ارفع: `git pull --rebase origin main` ثم push وافتح PR على `main`، واكتب سطرين: شو بنيت، وإنك جرّبت الأدوار الثلاثة بالعربي والإنجليزي.
5. ادمج: ما في مراجعة من الثاني. استنى الـ CI (check) ✅ وادمج بنفسك بزر Create a merge commit (و`PROGRESS.md` متحدّث بنفس الـ PR).

برومت بداية أي ميزة:

```text
ابنِ ميزة <اسم> على برانش feat/<اسم>:
- المسارات والـ endpoints: (الصق صف الميزة من PLAN.md)
- التصميم من reference/ui-prototype (نفس الشاشات والأدوار الثلاثة)
- ابدأ بـ api.ts وmocks.ts وhooks.ts، وبعدين الشاشات، مع loading وempty وerror وعربي/إنجليزي
- لا تلمس أي ملف خارج src/features/<اسم>
- commit صغير لكل خطوة، وفي الآخر شغّل lint وbuild وحدّث PROGRESS.md بـ commit لحاله
```

## قاعدة الـ commits
- commit صغير ومستقل لكل خطوة منطقية: types، api وhooks، mocks، صفحة، مكوّن، تسجيل المسارات.
- بالإنجليزي بصيغة conventional، وكل commit لحاله بيمر lint وbuild.
- ما بنعمل commits تافهة لتكبير العدد، وما بنعمل squash.

## الـ Mock
| الشي | وين |
|---|---|
| العقد | `reference/API_MAP.md` (و`reference/openapi.json` مرجع إضافي بس، بعض الـ DTO فاضية فيه) |
| الأنواع | `src/features/<ميزة>/types.ts` (الطلبات والردود، من `API_MAP.md`) |
| عميل الـ API | `src/lib/http.ts` (axios، بيفك الغلاف `{ success, data, timestamp }`) |
| الـ Mock | `src/features/<ميزة>/mocks.ts` (MSW) |
| المفتاح | `.env`: `VITE_USE_MOCK=true` (بيصير false وقت الدمج) |

## قواعد منع التعارض
1. مجلد `src/features/<اسم>` ملك صاحب البرانش.
2. تسجيل الميزة بـ `features/<اسم>/index.ts` فقط (routes, access, nav, dictionary).
3. المجلدات المشتركة (`app` `components` `lib` `i18n` `types`) والمكتبات: برانش `chore/...` صغير مستقل، ودمجه نفس اليوم.
4. عمر البرانش لا يزيد عن 5 أيام.
5. قبل الرفع `git pull --rebase origin main`، والـ CI لازم يكون أخضر قبل الدمج.

## إعداد الريبو (حسام، مرة وحدة)
- Settings ← Branches: حماية `main` (PR + status check `check` إجباري + منع force push، بدون موافقات مطلوبة).
- Settings ← General: Merge commit فقط (بدون squash) + حذف البرانش بعد الدمج.
- `.github/workflows/ci.yml`: `npm ci` ثم `npm run lint` ثم `npm run build`.

## البرانشات

### مرحلة 0 — الأساس
| # | البرانش | المحتوى |
|---|---|---|
| 0.1 | `chore/project-setup` (حسام) | Vite وTS وTailwind والـ tokens والخطوط، الترجمة، lint، مجلدات features مع index.ts، axios وreact-query وMSW وgen:types، CI، CLAUDE.md، reference مستثنى من lint وbuild |
| 0.2 | `feat/ui-kit` (بهاء) | مكوّنات `components/ui` (حوالي 20): Button، Field، Menu، Overlay، Avatar، DataTable، Tabs، Toast، States، Pagination... |
| 0.3 | `feat/core-api-auth` (حسام) | refresh التوكن، الجلسة، RequireRole وaccess (ما ينهار مع دور `applicant` أو أي دور مش معروف، بيعامله كممنوع)، الـ router، 403/404/500، 3 حسابات mock. `POST /auth/login` `POST /auth/refresh` `GET /auth/me` `POST /auth/logout` |
| 0.4 | `feat/app-shell` (بهاء) | Sidebar وTopbar وAppShell ولوحة الأوامر وSectionTabs وقائمة الحساب وتبديل اللغة |
| 0.5 | `feat/shared-components` (حسام) | useList وListKit وPersonCell وPersonHover وCards وDetailLayout وWorkdayRibbon. `GET /employees/:id/card` |

### موجة 1
| # | البرانش | المسارات | الـ endpoints |
|---|---|---|---|
| 1.1 | `feat/auth-login` | `/login` | `POST /auth/login` (رد `chat` بينحفظ للرسائل) |
| 1.2 | `feat/account` | `/account/profile` `/account/password` | `GET` و`PUT /users/me`، `PATCH /users/me/password` |
| 1.3 | `feat/notifications` | `/notifications` + جرس الشريط | `GET /notifications`، `/notifications/count`، `PATCH /notifications/read-all`، `PATCH /notifications/:id/read`، `DELETE /notifications/read`، `DELETE /notifications/:id` |
| 1.4 | `feat/employees` | `/employees` `/employees/new` `/employees/import` `/employees/:id` `/employees/:id/edit` | `GET`/`POST /employees`، `GET`/`PUT`/`DELETE /employees/:id`، `PATCH /users/:id/password` |
| 1.5 | `feat/departments` | `/employees/departments` `/employees/departments/:id` | `/departments` (CRUD) |

### موجة 2
| # | البرانش | المسارات | الـ endpoints |
|---|---|---|---|
| 2.1 | `feat/requests` | `/requests` `/requests/new` `/requests/:id` `/requests/approvals` `/requests/all` | `GET`/`POST /requests`، `GET /requests/:id`، `PUT /requests/:id/review`، `DELETE /requests/:id`، `GET /loan-repayments/loan/:id` |
| 2.2 | `feat/leave` | `/leave-balances` `/leave-balances/me` `/leave-balances/types` | `/leave-types` (CRUD)، `GET /leave-balances`، `/leave-balances/me`، `PUT /leave-balances/:id`، `POST /leave-balances/calculate` |
| 2.3 | `feat/admin` | `/admin/users` `/admin/activity-logs` | `GET /employees`، `PATCH /users/:id/role`، `GET /activity-logs` |
| 2.4 | `feat/org-chart` | `/org-chart` `/org-chart/me` `/org-chart/:userId` `/team` | `GET /org-chart`، `/org-chart/me`، `/org-chart/list`، `/org-chart/:userId`، `PUT /org-chart/:userId/manager` |
| 2.5 | `feat/attendance` | `/attendance` `/attendance/employee/:id` | `POST /attendance/check-in`، `/attendance/check-out`، `GET /attendance`، `GET /attendance/employee/:id` |
| 2.6 | `feat/tasks` | `/tasks` `/tasks/mine` `/tasks/team` `/tasks/new` `/tasks/:id` | `GET`/`POST /tasks`، `GET`/`PUT`/`DELETE /tasks/:id`، `PUT /tasks/:id/status`، `PUT /tasks/:id/completion` (إسناد يدوي فقط، مكان فاضي للترشيح الذكي) |

### موجة 3
| # | البرانش | المسارات | الـ endpoints |
|---|---|---|---|
| 3.1 | `feat/recruitment` | `/careers` (عامة) `/recruitment` `/recruitment/:id` `/recruitment/:id/schedule` `/recruitment/interviews` | `POST /recruitment/apply`، `GET /recruitment`، `GET /recruitment/:id`، `GET /recruitment/:id/cv`، `PUT /recruitment/:id/status`، `PUT /recruitment/:id/interview`، `DELETE /recruitment/:id` |
| 3.2 | `feat/performance` | `/performance/categories` `/performance/plans` (+ `new` `:id` `:id/edit`) `/performance/reviews` (+ `me` `:id` `:id/fill`) | `/performance/categories` (CRUD)، `/performance/plans` (CRUD + activate وclose)، `/performance/reviews` (pending وme وemployee/:userId و:id وsubmit وreopen) |
| 3.3 | `feat/payroll` | `/payroll` `/payroll/run` `/payroll/runs/:month` `/payroll/payslips` `/payroll/payslips/:id` `/payroll/me` | `POST /payroll/generate`، `GET /payroll`، `GET /payroll/me`، `GET /payroll/:id`، `GET /payroll/employee/:id`، `PUT`/`DELETE /payroll/:id` |
| 3.4 | `feat/reports` | `/reports` + `/reports/<attendance|leave|payroll|tasks|recruitment|performance>` | `GET /reports/dashboard`، `/attendance`، `/leave-balances`، `/performance`، `/tasks`، `/payroll`، `/recruitment` (مع `format=json|excel|pdf`) |

### موجة 4
| # | البرانش | المسارات | الـ endpoints |
|---|---|---|---|
| 4.1 | `feat/dashboard` | `/` (HR وmanager وemployee) | `GET /reports/dashboard` + بيانات الطلبات والمهام والحضور |
| 4.2 | `feat/messages` | `/messages` `/messages/:id` | Mock بالذاكرة مثل الـ prototype. الحقيقي: Rocket.Chat بتوكن `chat` من login |
| 4.3 | `feat/landing` | `/` للزائر غير المسجّل | لا يوجد |
| 4.4 | `feat/nexa-bot` ⚠️ | `/messages/nexa-<userId>` | لا يوجد باك، Mock فقط |
| 4.5 | `feat/skills` ⚠️ | `/employees/skills` `/employees/skills/matrix` `/skills/me` | لا يوجد باك، Mock فقط |
| 4.6 | `feat/smart-assign` ⚠️ | `/tasks/smart` + لوحة ترشيح داخل `/tasks/new` | لا يوجد باك، Mock فقط |

⚠️ بتضل Mock ومخفية بـ `VITE_ENABLE_PLANNED=false` (شوف "قواعد الباك" بـ `CLAUDE.md`).

## الدمج مع الباك الحقيقي (حسام، آخر شي، بعد موجة 3 على الأقل)
1. يشغّل الباك والدوكر زي ما هم، ويقارن الردود الحقيقية مع `types.ts` بكل ميزة. أي اختلاف بين الـ mock والباك بيتصلح بالفرونت، والباك ما بيتعدّل.
2. `.env`: `VITE_USE_MOCK=false` و`VITE_API_URL=http://localhost:3000`.
3. يمر على الميزات بترتيب الجدول، يجرّبها بالأدوار الثلاثة، ويعلّم ✅ بعمود "دمج الباك" بـ `PROGRESS.md`. أي اختلاف بينصلح ببرانش `fix/<ميزة>-integrate`.
4. الرسائل: يشغّل Rocket.Chat بالدوكر ويربطها بتوكن `chat`.
5. المهارات والتعيين الذكي وNexa بتضل Mock ومخفية.
