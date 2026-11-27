# Prototype progress

Master instructions: standalone bilingual (ar/en) clickable prototype, in-memory store, no API, compact sample data, no code comments. Commit locally per finished section (with translations), no AI attribution. CLAUDE.md, PROGRESS.md and UI_GUIDE.md stay uncommitted.

Strings: `src/i18n/common.ts`, `kit.ts` plus one `i18n.ts` per feature (`defineBi` pairs). Sample data localized with `localize()` getters. Store: `src/store` (core) and `src/store/collections.ts` (generic collections and ticks).

## Build order
1. [x] Navigation fix: flat sidebar, section tabs below the page title, top bar zones
2. [x] Requests and leave
3. [x] Tasks with smart assignment
4. [x] Recruitment
5. [x] Messages with Nexa
6. [x] Employees, departments, org chart, team
7. [x] Manager and employee dashboards
8. [x] Skills (catalog, matrix, my skills)
9. [x] Attendance
10. [x] Payroll and loans
11. [x] Performance (reviews, fill, details, plans, criteria, categories)
12. [x] Reports (hub, attendance, leave, payroll, performance, CSV export)
13. [x] Settings (users, system, chat, notifications) and activity log
14. [x] Profile, change password, design system, remaining auth and system pages

## Done in the final pass
- `PersonCell` / `PersonStack` used in every list, detail and chat avatar; `PageHeader` renders section tabs under the title.
- All "soon" placeholders removed; unknown routes show the real 404.
- Dead-link scan (UI routes) clean; lint clean; build clean.
- Route sweep in English for all three roles: no 500/404, no missing keys, no Arabic text leaking into English screens.

## Decisions (made without asking)
- Payroll and loans are reachable for managers and employees through `/payroll/me` and `/payroll/loans` (links from dashboards, Nexa and notifications); the manager sidebar keeps the eight items in the master list.
- Employee, skill, payroll, loan, review and plan data mutate in memory and refresh on reload.
- `/settings/notifications`, `/settings/profile` and `/settings/password` are open to all roles; the rest of Settings is HR only.
- Reports export Excel as a real CSV download; PDF export is a toast.
- Activity log gets live entries from requests, tasks, recruitment, payroll, reviews, plans and user changes.

## Known limits
- Mobile and tablet were checked on representative screens only (dashboard, lists, forms), not every route.
- Notification titles that embed plan names are stored in the language active when created.

## Backend alignment rework (current)
- [x] Phase 0: API_MAP.md written from ../backend/src (routes, roles, DTOs, enums, transitions, deviations, open questions)
- [x] Phase A/B: API_MAP closed; overlay layer (floating.tsx, Popover, Select), permission map (src/app/access.ts), PersonStack, DetailLayout on request/task/application/payslip/employee/review, sidebar groups. Still open from B: PersonStack audit for bare people counts (org list, departments, channels)
- [x] Phase C: screens rebuilt against API_MAP.md
- [x] Phase D: skills catalog/matrix, smart assignment, Rocket.Chat style messages
- [x] Phase E: AUDIT.md written, seed data checked, sweeps run
Resume with "continue": start at the first unchecked phase.

## Follow-up pass
Done: optional review note, payroll wizard options, dashboard real events only, careers free-text position with limits, employee attendance without derived data, activity log shape, cancelled tasks not blocked, Nexa inside Messages (assistant panel and legacy chat state removed), Excel and PDF toast buttons. Not verified: every popover opened interactively in both languages; only changed pages were screenshotted.

## Third pass (items)
- [x] 1 small fixes (commit d4e86b8)
- [x] 2 task details redesign (f1ad41d)
- [x] 3 messages rebuild (toolbar, room list, panels, composer)
- [x] 4 remove unnecessary text (77 descriptions, 12 helper paragraphs, 486 unused keys)
- [x] 5 scale and polish (shared cards, empty state, hero, org chart node scale, request detail)
- [ ] 6 verification and docs (UI_GUIDE.md too)

## Entrance pass
- [x] A removals: design system page, top header avatar
- [x] B login panel simplified, brand panel on the physical left
- [x] C public landing page at / when signed out
- [x] D verification and docs

## Recruitment fix pass
- [x] careers form, HR transitions, detail page, docs
