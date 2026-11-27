# NexusHR UI guide

Reference for rebuilding the prototype by hand. Roles: HR = `hr_admin`, MGR = `manager`, EMP = `employee`. All screens are bilingual (ar RTL / en LTR) and support `?role=` and `?state=loading|empty|error`.

## Shared building blocks
- Tokens: `src/index.css` (`@theme`): `brand-50..950`, `ink-0..900`, `canvas`, `side-700..950`, `accent`, status `success|warning|danger|info` (+ `-bg`, `-border`), `chart-1..6`, text scale 12/13/14/16/18/22/28/36, radii `control` 6, `surface` 16, `dialog` 20, shadows `card`, `card-hover`, `md`, `lg`.
- Shell: `AppShell` = gradient `Sidebar` (flat items, 44px rows) + glass `Topbar` (breadcrumb, search Ctrl K, assistant, notifications, language, role switcher, account) + `PageHeader` (title, description, primary action, then `SectionTabs`).
- Lists: `useList` (search, filters, sort, pagination) + `ListPanel` (`FilterBar`, `DataTable` with `sortable` columns, `Pagination`) + `RowActions`. States: `SkeletonRows`, `EmptyState`, `ErrorState` via `useSample`.
- People: `PersonCell` (avatar + name + title; `compact`, `avatarOnly`, `presence`, `card` on by default, `to` to make the trigger a link) and `PersonHover` (shared hover/focus/tap card from the employee card fields; `Avatar` uses the photo or a name-based male, female or neutral silhouette via `getDefaultAvatar`), `PersonStack` (first person + overlapping avatars + `+N` popover).
- Cards: `HeroBanner`, `StatCard` (label, number, hint; no icon tile), `Panel`, `DescriptionList`, `Progress`, `Timeline`, `WorkdayRibbon`, charts in `ChartKit` (`RankedBars`, `SegmentedBar`, `BarsChart`, `TrendChart`).
- Forms: `Field` + `Input|Select|Textarea|Switch|Checkbox|Segmented`, inline errors, `useToast` success toasts (with undo where reversible).
- State: `src/store` (requests, notifications, balances, tasks, applications, messages) and `src/store/collections.ts` (generic in-memory collections and ticks for people, skills, payroll, loans, performance, settings, activity log).
- i18n: `defineBi({ key: [ar, en] })` per feature `i18n.ts`, registered in `src/i18n/dictionaries.ts`; sample data localized with `localize()`.

## Screens
| Route | Roles | Main pieces |
|---|---|---|
| `/login`, `/forgot-password`, `/reset-password` | public | `AuthLayout`, `PasswordInput`, `PasswordStrength` |
| `/careers` | public | job list, application form, `FileDrop` |
| `/system/403` `/system/404` `/system/500` | public | error pages |
| `/` | all | HR: `HrDashboard` (hero, 4 `StatCard`, quick actions, attendance chart, approvals, schedule, department bars). MGR: `ManagerDashboard`. EMP: `EmployeeDashboard` |
| `/notifications` | all | grouped list, mark read, filters |
| `/messages`, `/messages/:id`, `/messages/directory` | all | Rocket.Chat style: toolbar (user menu, back/forward, room search Ctrl+K, create, display, directory, home), collapsible room list, room header with seven panels, composer with plus menu; Nexa DM carries notifications |
| `/employees` | HR | `ListPanel`, filters (department, role, type, status), row actions |
| `/employees/new`, `/employees/:id/edit` | HR | two-panel form with validation |
| `/employees/:id` | HR | `Tabs`: info, attendance, leave, payroll, performance, skills |
| `/employees/departments`, `/employees/departments/:id` | HR, MGR | list, add/edit `Modal`, members list |
| `/org-chart`, `/org-chart/:userId`, `/org-chart/me` | all | collapsible tree with presence, reporting line |
| `/team` | MGR | team list with today status, open tasks, pending requests |
| `/employees/skills` | all | catalog, holders `Drawer`, add/edit (HR) |
| `/employees/skills/matrix` | HR, MGR | heat-map matrix per department, gaps |
| `/skills/me` | all | edit own skill levels |
| `/attendance` | all | `WorkdayRibbon` check card, own log, team/everyone tab (HR, MGR) |
| `/attendance/employee/:id` | HR, MGR | date range log |
| `/requests`, `/requests/new`, `/requests/:id` | all | own requests, form with leave/loan/permission/custom, details with decision |
| `/requests/approvals` | HR, MGR | pending queue with approve and reject |
| `/requests/all` | HR | all requests |
| `/leave-balances`, `/leave-balances/me`, `/leave-balances/types` | HR / all / HR | balances and leave type CRUD |
| `/payroll`, `/payroll/run`, `/payroll/runs/:month` | HR | runs table, three-step wizard, payslips of a run |
| `/payroll/me`, `/payroll/payslips/:id` | all | own payslips, printable payslip |
| `/payroll/loans`, `/payroll/loans/:id` | all (HR sees all) | loans and repayment schedule, mark paid (HR) |
| `/tasks`, `/tasks/mine`, `/tasks/team`, `/tasks/:id` | HR / all / MGR / all | task lists; details with breadcrumb, status, priority and due chips, four summary cards, assignees with You badge, My progress card (assignees only), Task log |
| `/tasks/new`, `/tasks/smart` | HR, MGR | composer with smart assignment score ring and reasons |
| `/recruitment`, `/recruitment/:id`, `/recruitment/:id/schedule`, `/recruitment/interviews` | HR | applications, CV preview, schedule, upcoming interviews |
| `/performance/reviews` | HR, MGR | reviews with fill/view/reopen |
| `/performance/reviews/me`, `/performance/reviews/:id` | all | own results, review details |
| `/performance/reviews/:id/fill` | HR, MGR | score buttons per criterion, live score |
| `/performance/plans`, `/performance/plans/:id` | HR, MGR | plans, criteria, review progress |
| `/performance/plans/new`, `/performance/plans/:id/edit` | HR | plan form with weighted criteria |
| `/performance/criteria`, `/performance/categories` | HR | criteria list, category CRUD |
| `/reports` | HR, MGR | KPI cards, charts, report cards |
| `/reports/attendance`, `/reports/leave`, `/reports/performance` | HR, MGR | filters, summary, ranked bars, sortable table, CSV export |
| `/reports/payroll` | HR | same pattern |
| `/admin/users`, `/admin/activity-logs` | HR | roles (no description cards), activity log |
| `/account/profile`, `/account/password` | all | profile, password with strength (opened from the sidebar user menu) |
| `/employees/import` | HR | CSV import with template, validation preview, progress and one-time temporary password sheet |

Notes: HR can set a new temporary password from the employee page or row menu (simulated, planned PATCH /users/:id/password). Page headers carry only a title; helper copy was removed on purpose.

Messages layout: one rounded bordered container inset from the page; room list and side panels use brand-50/50, room header brand-50/40, messages and composer white (composer is a bordered card with a stronger focus ring); selected room has brand-100 fill plus a 3px brand bar on the inline-start edge. The global header search is hidden on /messages. Avatar silhouettes: male (short hair, broad shoulders), female (long hair outline, narrower shoulders), neutral (plain bust).

Frame and density (shared): content container max 1440px (1600px from 1920px viewports) with 32px side padding; controls are 40px high (buttons md, inputs, selects, search); table body 15px, headers 13px semibold, rows about 76px with 40px people avatars (PersonCell default size md); H1 is 3xl bold and equals the section name on a tab root (the tab strip names the view); lists show entity counts through countOf (for example 5 requests, 5 طلبات); Reject uses the dangerOutline button next to a primary Approve; table headers scroll with the page (no inner scroll area).

Messages layout (supersedes the inset container above): full-bleed. AppShell marks /messages as full-bleed (h-dvh, overflow hidden, main without padding); MessagesPage is flex-1 with border-t ink-300 only. Dividers use ink-300; toolbar and side panels brand-50/50; composer border-t with ink-25.

Entrance screens: "/" is the public landing for signed-out visitors (SessionGate in src/app) and the dashboard for signed-in ones. Landing is one deep-blue screen: top bar (white logo at the physical left, language toggle, Careers link, white Sign in button), the nexus SVG (hub, 5 rings, 12 nodes from a polar table in LandingPage.tsx, motion disabled under reduced motion) and the wordmark with one tagline. Login uses AuthLayout: brand panel on the physical left (rtl:order-2 and mirrored columns), form on the right. Design tokens and shared components are documented here and in src/components/ui; there is no design-system page.

Messages connection states (dev switch): append `?chat=connecting`, `?chat=unavailable` or `?chat=expired` to any URL (for example `/messages/all?chat=unavailable`) to force a state; `expired` flips to the expired banner 2.5 s after load. Without the parameter the page connects normally. Try again and Reconnect both return to the normal state after a short delay. The switch has no UI; the state lives in src/features/messages/rc/connection.ts.

Entrance screens (current): landing at "/" is sectioned (header, hero with NexusDiagram tone="light", modules, roles, call-to-action band, footer) and uses white, brand-50 and brand-700 only; login is a single centred card (AuthLayout) over the light Network line art. The earlier deep-blue single screen and the split login are replaced.

Landing hero art: TeamArt.tsx replaces the ring diagram (people on a baseline connected to the N hub). It is drawn in a fixed LTR box (dir="ltr" wrapper) so it is identical in both languages; keep it symmetric when editing.

Landing sections in order: header, hero with NameArt, inside the system (modules with capabilities), how it helps, how work flows, roles, call-to-action band, footer. White and brand-50 alternate; only the call-to-action band is solid brand-700. Copy lives in src/features/auth/i18n3.ts (lp.*); when a module gains or loses a capability, update its lp.mf.* line.

Landing screenshots: public/landing/{dash,req,smart}-{ar,en}.png are real captures (dash 1100x720, req 900x700 scrolled 330, smart 1280x760, all at 2x, role chip hidden) of /?role=hr_admin, /requests/41 and /tasks/smart. Recapture them whenever those screens change; the page reads width and height from LandingPage.tsx (Shot), so update those numbers if the capture size changes.

Suggestion field: SuggestInput (src/components/ui/Suggest.tsx) is a free-text input with an optional suggestion list on the shared Floating layer; the last row is always the "other" row and only closes the list. Use it for any free-text field with examples; the hint goes above the field so the list never covers it. ActionBar takes an optional aside prop: the children sit at the start and the aside (for example a red Delete) at the end inside a card with the same edges as the content columns.

Landing screenshots (current): public/landing/{people,req,pay,smart}-{ar,en}.png from /employees, /requests/41 (scrolled 330), /payroll and /tasks/smart (1000x700), all at 2x with the role chip hidden. Shot in LandingPage.tsx assumes 2000x1400. The first screen carries no screenshot, only the hand-drawn name.

Permissions in the UI: access.ts is the single route table and mirrors API_MAP.md; nav.ts tabs are filtered through it (tabsFor), the command palette is built from the same nav, so a route opened or closed in access.ts changes the tab and the palette with it. Pages with HR-only actions (departments, plans, categories, org chart row actions) gate those controls by role, not the whole page. Links to /employees/:id must only be built for HR; use /org-chart/:id for everyone else. teamIds(managerId) returns the whole subtree and is the one scope helper for manager data. The org chart view buttons navigate when the page was opened as /org-chart/me.

Marking the current user in tables: DataTable and ListPanel take markKey (row key of the current user) and flashMark; the row gets data-me, aria-current, a tint and an inline-start accent bar. The org chart uses the same data-me attribute for the node so "My place" can find it. The "You" badge is MeBadge in OrgChart.tsx (text, never colour alone).

Navigation groups: `NavItem.parent` adds a breadcrumb prefix for items that have no tabs (used by System administration). The sidebar has no pinned item any more; HR administration is the last regular group in `src/app/nav.ts`. Old `/settings/*` URLs are redirect routes in `src/app/router.tsx`.

Messages toolbar tint: `MessagesToolbar` in `src/features/messages/rc/Toolbar.tsx` uses `bg-brand-600/5`, `border-brand-200` and a scoped hover `[&_button[title]:hover]:bg-brand-600/10`; the search input keeps `bg-white`. Tokens only, no new colors.

Toolbar accent: `MessagesToolbar` adds `after:` utilities (`after:h-0.5 after:bg-gradient-to-r after:from-brand-600 after:via-brand-300 after:to-transparent rtl:after:bg-gradient-to-l`) on a `relative` strip. Tokens only.

Zebra rows: do not style row backgrounds per page. `DataTable` (and `ListPanel` through it) applies `rowPlain` (even rows `bg-ink-600/[0.035]`, hover `bg-brand-600/[0.08]`, with `hover:even:` so hover wins on tinted rows) and `rowSelected` (`bg-brand-100/70`). A hand-built `<table>` must reuse the same classes; sticky cells need an opaque `color-mix` of the same tokens.

Logo: `Logo` renders the mark plus the `Wordmark` only; there is no tagline prop. Do not add a subtitle under the name.
