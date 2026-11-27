# Audit: prototype against the backend

Sources: API_MAP.md (read from ../backend/src). Phase D screens (skills catalog, skills matrix, smart assignment, messages) are excluded from the first table because they are labelled prototype-only.

## Orphan UI (a screen, control or field with no backend behind it)

| Item | Why it has no backend | What was done |
|---|---|---|
| Login SSO button | No SSO route | Removed |
| Forgot password and reset password pages, remember me, expired/reset notices | No such routes or DTO fields | Pages, routes and links removed; login is email and password only |
| Users and roles: "send reset link", activate/deactivate toggle | No such routes | Removed; status badge is display only |
| Settings > System, Chat, Notifications preferences | No routes | Pages, tabs, routes, data and types removed |
| Password page: sessions list, "sign out other devices", strength gate | No routes; backend only needs min 8 | Removed; validation is current password plus min 8 |
| Profile page: city, address, emergency contact, language, photo upload | DTO has first_name, last_name, phone_number, profile_image only | Replaced by those four fields with the DTO limits |
| Employee form: role and manager fields | CreateEmployeeDto has neither; role changes via PATCH /users/:id/role, manager via PUT /org-chart/:id/manager | Removed from the form; password (min 6) added for create |
| Employee list: activate action and reactivation | Soft delete only, no reactivation route | Reactivation removed; removal only from the employee screen with confirmation |
| Loans pages (list, detail, "mark installment paid") | No loans list route; installments are paid only by payroll generation | Pages and manual payment removed; schedule is shown in the loan request details (GET /loan-repayments/loan/:id, HR) |
| Payslip social-security split | Backend deductions are one number | Removed; one deductions line |
| Performance > Criteria page | No standalone criteria route; criteria live inside plans | Page, route and tab removed |
| Requests form: permission date, loan limits (100 to 10000, 24 months) | DTO: permission has no dates; loan amount min 1, period min 1 | Date field and extra limits removed; custom title 3 to 150 enforced |
| Interview scheduling: interviewer and editable meeting link | Backend only takes interview_at and creates the meeting link once | Fields removed; link is generated on first schedule and reused on reschedule |
| Application detail: "Convert to employee", Hired status | Not in the enum or routes | Never present; accepting only changes the status |
| Attendance history for employees | GET /attendance is manager or HR only | Employee sees check in/out and the result of the last action only; no summary strip or not-checked-in badge for employees |
| Task status dropdown for employees | PUT /tasks/:id/status is manager or HR only | Employees only update their completion percentage |
| Task statuses | All four enum values exist, including cancelled | Kept; cancelled needs confirmation, is shown muted, and completion updates are not blocked (the backend does not block them) |
| Careers page job catalogue (titles, departments, locations, summaries) | apply takes free text applied_position (max 100); no jobs route | Catalogue cards and apply modal removed; one form with a text input, catalogue titles kept only as suggestions |
| Dashboard deltas and sparklines, invented meeting and payroll-deadline events | Not computed from any data | Removed; the schedule lists only interviews and task deadlines |
| Assistant panel (Nexa quick answers) | No AI route | Separate panel removed; Nexa is a direct-message conversation with a bot inside Messages (prototype-only) |
| Lists with search, filter and sort | Only page and limit exist | Kept as client-side operations on the loaded page, as allowed in API_MAP.md |
| Request review note | review_notes is accepted by the DTO but never stored or notified | Optional note in the dialog, not stored and not shown back |
| Team page (manager) counts of open tasks and pending requests | Derived from org-chart/me, tasks and requests | Kept as derived columns |
| Employee attendance "not checked in today" badge, summary strips | Derived from GET /attendance | Kept as derived |


Also orphan (prototype only): default male/female/neutral avatar silhouettes picked from the first name (no gender field in the backend; cosmetic heuristic), and the hover popover on every person reference (uses only the card fields).

Also orphan: HR Set a new password (route planned, not built yet), CSV import screen (uses the planned create flow), temporary password banner.

Also orphan (prototype only): Messages presence dots and own status (derived from attendance for others), discussions (rooms with a parent channel), room hide, display preferences, forward message; task detail due-date chip (derived from the deadline); no invented data was added.

Messages visual pass (UI only): workspace in one bordered rounded container, tinted regions, selected room accent bar, global search hidden on /messages, tile letters skip the article, distinct male, female and neutral silhouettes. No data or behavior changes.

Layout pass (UI only): wider shared container, 40px controls, larger table rows and people cells, section-named H1 on tab roots, entity counts, outlined Reject. No data fields or behavior changed.

## Orphan backend (a route, field, enum or role with no UI)

| Backend item | Screen or reason absent |
|---|---|
| POST /auth/login | Login page |
| POST /auth/refresh | Intentionally absent: silent token refresh, no screen |
| GET /auth/me | App shell (viewer); not a screen |
| POST /auth/logout | Account menu "Sign out" |
| GET /users/me, PUT /users/me | Account menu > Profile (/account/profile) |
| PATCH /users/me/password | Account menu > Password (/account/password) |
| PATCH /users/:id/role | System administration > Users and roles (HR, /admin/users) |
| GET/POST/PUT/DELETE /employees, GET /employees/:id, /card | Employees list, form, detail, person card |
| Departments CRUD | Departments list, detail, create and edit, delete (HR) |
| GET /org-chart, /:userId, /me, /list, PUT /:userId/manager | Chart view, branch, My circle, List view, Change manager dialog |
| POST /attendance/check-in, check-out | Attendance page |
| GET /attendance, GET /attendance/employee/:id | Attendance (group tab) and employee attendance |
| Requests: POST, GET, GET/:id, PUT review, DELETE | New request, lists, detail with decision support, delete pending |
| Leave types CRUD | Requests and leave > Leave types (/leave-balances/types) |
| Leave balances: GET /me, list, PUT /:id, POST /calculate | My balance, Leave balances with year filter, edit dialog, calculate action |
| GET /leave-balances/:id, GET /leave-types/:id, GET /performance/categories/:id | Intentionally absent as separate screens; the list rows carry the same data |
| GET /loan-repayments/loan/:id | Loan request details (HR, approved loans) |
| Payroll: generate, list, employee/:id, me, :id, PUT, DELETE | Run wizard, runs, all payslips, employee profile payroll tab, My payslips, payslip detail with edit and delete |
| POST /payroll/generate (salary_month, user_id?, bonuses?) | Run wizard: month, scope all or one employee, optional bonuses; skipped employees are listed |
| Tasks: POST, GET, GET/:id, PUT, PUT status, PUT completion, DELETE | New task, lists, detail with edit, status, progress, delete |
| Performance categories CRUD | Categories page |
| Plans: GET, GET/:id, POST, PUT, activate, close, DELETE | Plans list, detail, form, status actions, delete (draft) |
| Reviews: pending, me, employee/:userId, :id, submit, reopen | Reviews lists, detail, fill form, reopen (HR) |
| Recruitment: apply, list, :id, :id/cv, status, interview, delete | Careers apply form, applications, detail, CV download button, status actions, schedule, delete |
| Notifications: list, count, read-all, :id/read, delete read, delete one | Notifications page and bell badge |
| Reports: dashboard, attendance, leave-balances, payroll, performance, tasks, recruitment | Dashboards, Reports hub and one page per report; Buttons labelled Excel and PDF that only show a toast (files are generated by the backend in the real app) |
| Activity logs | System administration > Activity log (HR, /admin/activity-logs), Reports hub card, Ctrl+K entry |
| Role applicant | Intentionally absent: no screen for applicants |
| Enum values (all) | Present in labels and filters; see seed check below |

## Seed data check against backend rules

Checked by loading the seed modules and testing: unique emails; name, position and title lengths; single hierarchy root and no cycles; department and manager existence; request type rules (leave type and dates, loan amount and period, custom title, reason required, permission without dates); review rules (own request, manager scope); loan schedules only for approved loans, instalment count and sum; task creator role, at least one assignee, creator not an assignee, manager assigning inside the subtree; application transitions (interview date and link only after scheduling, accepted only after an interview); payroll uniqueness per user and month and net equals basic plus bonuses minus deductions; leave balance range 0 to 365 with one decimal; plan weights total 100, max score 1 to 10, date order; reviews scored once per criterion within 1 to max, reviewer allowed; attendance late after 08:15; notification length limits.

Result: one class of record failed and was fixed (permission requests carried dates). All other checks pass.

Not verified: the exact report response shapes and plan activation side effects (see Open questions in API_MAP.md).

Messages full-bleed pass (UI only): the workspace now fills the whole content area under the app header, flush with the sidebar and screen edges, with no outer margin, rounded corners or shadow. The shell is h-dvh with no page scroll on /messages; only the room list and message list scroll. Regions are separated by 1px ink-300 lines; toolbar and room list use brand-50/50, messages white, composer has a top border and ink-25 tint, side panels match the room list. Home content is centred (max 960px, larger heading and cards). Checked at 1920, 1440, 820 and 390 in Arabic and English: no horizontal overflow, no page scroll. Headless screenshots at 390 crop the right edge (browser minimum window width), so mobile was confirmed with measured overflow instead.

Entrance pass (UI only): the design system showcase page and its route, menu entry, strings and command-palette link are removed (shared components and tokens kept). The header no longer shows the account avatar; the sidebar user card and its menu remain. Login: the blue brand panel is physically on the left in both languages and holds the white logo, the network line art, one headline, one sentence and a copyright line; the form side keeps email, password, sign in, language toggle, the prototype role-entry box and the careers link. New public landing page at "/" when signed out (hand-built SVG nexus diagram, wordmark, tagline; Sign in and Careers in the top bar). Prototype session: a signed-in flag in sessionStorage (also set by the preview ?role= parameter); signed-out visits to any app path go to "/"; sign out returns to the landing page. Verified at 1920, 1440, 820 and 390 in Arabic and English with no horizontal overflow; the sign-in, quick entry and sign-out flow was exercised in a browser. Not done: forgot and reset password screens (never built in this prototype), no create-account action by design.

Messages connection states (UI only, simulated): connecting (workspace frame with skeleton toolbar and room list and one "Connecting…" line; shown briefly on first load), chat unavailable (frame plus one centred message, a Try again button and a quiet line that the rest of the system works; the sidebar Messages badge is hidden in this state), session expired (non-blocking warning banner above the workspace with Reconnect; the open room and any draft stay in place, so the previous room is restored by simply keeping it). Nothing else was added to Messages. Checked at 1440 in Arabic (unavailable) and English (expired, connecting); the narrower widths were not screenshotted, the frame uses the same grid as the workspace.

Entrance redesign (second take): the landing page is now a full public page on white and light blue: sticky white header (logo, anchors, language toggle, Sign in), a light hero with the nexus diagram redrawn in blue on white, a ten-module list (real modules only, one factual line each), a three-column "what each role gets" block, a solid blue call-to-action band and a footer. No statistics or invented claims. Login is now one centred card on a light canvas with faint network line art instead of two split panels; the prototype role-entry box stays inside the card as a dashed section, and the careers link sits under the card. No horizontal overflow at 390 and 820 in both languages; screenshots reviewed at 1440 (landing in Arabic and English, login in English).

Landing signature art: the hero now ends in a hand-drawn line illustration (TeamArt.tsx) tied to the product name and the HR domain: a row of people of different heights standing on a full-width baseline, a second fainter row behind them, and thin lines rising from every head to the N monogram hub above, like an org chart drawn as a skyline. Blue line art on white and brand-50 with two amber accents; the lines fade in staggered and the motion is disabled under reduced motion. On narrow screens the art is cropped to its centre instead of shrinking. The earlier ring diagram was removed with its strings. Checked at 1440 in Arabic and at 390 in Arabic and English (no overflow); the English desktop view and tablet were not screenshotted.

Landing name art and content: the hero illustration is now the name itself (NameArt.tsx): "NEXUS" in deep blue and "HR" in light blue drawn as monoline letters with a node at every joint and end, thin links rising to small floating nodes above, an amber node where the two strokes of the X cross (the nexus point), all standing on the full-width baseline. The letters draw in once and the links fade in; reduced motion shows it static. The people illustration was removed. New content, all taken from screens that exist in the prototype: each module row lists its real capabilities, a "How it helps" block (six points) and a four-step "How work flows" block. No numbers or claims beyond what the screens do. Checked at 1440 in Arabic and English and at 390 in both languages for overflow (none); the 390 screenshots of the new sections were not reviewed.

Landing name art resized: the lettering is capped at 720px wide and centred (it was full width); the baseline is now a separate full-width line aligned with the lettering's ground, and on phones the whole name fits the screen instead of being cropped. Checked at 1440 in Arabic and at 390 in Arabic; 390 English was only measured for overflow (none).

Landing without decorative art: the lettering illustration and its constellation lines were removed because they read as generated. The page now shows the real product: three screenshots of the actual screens (dashboard, a leave request with decision support, smart task assignment) captured from the prototype in each language and stored in public/landing (name-lang.png; the prototype role chip is hidden in them). The hero is left-aligned text beside the dashboard screenshot, followed by two screenshot-and-text rows, the module list (text only, no icons), roles, the call-to-action band and the footer. The "How it helps" and "How work flows" blocks were removed as generic copy. The screenshots contain the prototype's sample data and must be recaptured when those screens change (see UI_GUIDE.md). Checked at 1440 in English (full page) and Arabic (top of page) and at 390 for overflow in both languages (none); the 390 screenshots were not re-reviewed after this change.

Recruitment fix pass (UI only): careers position field is a shared SuggestInput on the overlay layer (same width as the input, below it, arrow keys, Enter, Esc, "Other (type your own)" last row, short hint above the field, placeholder inside); name and position max 100, phone max 20, CV PDF only and max 5 MB; stale file errors now clear when a valid file is chosen (a shared FileDrop bug that blocked submitting after one bad pick); rate limit and success messages reworded. HR side: only allowed transitions are offered and enforced in the store, interview scheduling is refused outside shortlisted or interview_scheduled, the fake CV preview became a file card, the header and the applicant card no longer repeat position or date, Discuss was removed, the action bar is a card aligned with the content columns with Delete application at its end in red, and the timeline ends at Rejected (stages shown for a rejected application are inferred: all three when an interview time exists, otherwise only the submission step, because the prototype does not store which stage it was rejected from). Verified by script in English and Arabic: all validation errors, combobox keyboard use, file type and size errors, the fourth submission blocked; detail pages for new, shortlisted, interview scheduled, accepted and rejected at 1440, with no horizontal overflow at 390 and 820 on the recruitment routes. Not exercised: clicking each status action and the delete dialog by hand, and the past-time rejection on the schedule form (read from code only).

Landing hero (revised again): the first screen no longer shows a product screenshot. It is back to centred text with the NexusHR name as the art, now drawn as marker lettering (a small turbulence displacement gives the strokes an uneven hand wobble, alternating stroke widths, an amber dot at the crossing of the X) and without the nodes, joints and constellation lines that made the previous version look generated. The two screenshot rows below the hero stay; the dashboard screenshots were deleted. Checked at 1440 in Arabic and at 390 for overflow in both languages (none).

Landing page restructured after the OrangeHRM homepage pattern (structure only, no text or assets copied): top bar (logo, anchors, language, Careers, primary Sign in), centred hero with a small label, two-line headline, short text, two buttons and a large product screenshot cropped at the bottom; a facts strip (10 modules, 3 roles, 2 languages, all true of the prototype); four alternating feature blocks, each a heading, one paragraph, four hairline-separated capabilities and a real screenshot (people, requests with decision support, payroll runs, smart task assignment); a three-card row for the remaining modules; roles; a native-details FAQ with six answers that only state what the prototype does; the blue call-to-action band; the hand-drawn name lettering above a plain footer. Left out on purpose: client logos, testimonials, award badges, statistics and integrations, because there is no real data for them. Screenshots are recaptured per language in public/landing (dash 1280x800, others 1000x700, 2x). Checked at 1440 (English top, Arabic full page) and 390 overflow in both languages (none).

Landing first screen: the dashboard screenshot was removed from the hero (screenshots live only in the feature blocks lower down); the hero is centred text with the hand-drawn NexusHR lettering and its baseline. The lettering moved from above the footer to the hero. Checked at 1440 in Arabic.

Permission map audit (UI only), checked by driving the real app in a browser as Employee, Manager and HR in Arabic and English: every route against the backend rules (56 routes per role and language), every link reachable from the sidebar, tabs and pages (a crawl of up to 160 pages per role), and the org chart tabs by clicking.

| Screen or action | Role | Backend rule | Before | After |
|---|---|---|---|---|
| Org chart: Chart, List, My circle tabs | Employee, Manager, HR | all three roles may read /org-chart, /me, /list, /:userId | opened from "My org position" (/org-chart/me) the tabs did nothing: the forced view overrode the clicked one | each tab navigates; verified by clicking from /org-chart, /org-chart/me and a branch view |
| Org chart entry in the sidebar | Employee | allowed | none (only reachable from the account menu) | "Organization" item with Org chart and Departments tabs |
| Org chart node links | Employee, Manager | /employees/:id is HR only | linked to /employees/:id and landed on 403 | link to the person's branch (/org-chart/:id); HR keeps the profile link |
| Change manager | Employee, Manager | HR only | HR only | unchanged, verified: the actions column and menu exist only for HR |
| Departments list and detail | Employee, Manager | GET /departments any role | blocked for Employee (and the route rule was for staff only) | open to all, add and edit stay HR only |
| Person hover card, Attendance button | Manager | /attendance/employee/:id only inside the subtree, HR all | shown for anyone, 403/empty outside the team | shown only for HR or for people in the manager's subtree |
| Manager scope everywhere (requests, tasks, attendance, review) | Manager | own subtree | direct reports only | whole subtree (teamIds is recursive) |
| Reports scope | Manager | own subtree | the manager's own department | the manager and their subtree |
| All requests tab | Manager | GET /requests returns the subtree, all statuses | HR only | "Team requests" tab for managers, scoped to the subtree |
| Review a request | HR | HR may review any pending request, own included | own requests hidden and refused | allowed |
| Review a request | Manager | only requests of the subtree | direct reports only | subtree |
| Delete a pending request | Manager | owner, manager in scope, HR | owner and HR only | adds managers for their subtree |
| Task create cancel link | Manager | /tasks (all tasks) is the HR view | linked to /tasks and landed on 403 | links to /tasks/team (HR keeps /tasks) |
| My leave balance tab | HR | GET /leave-balances/me any role | missing | tab added |
| My payslips tab | HR | GET /payroll/me any role | missing | tab added under Payroll |
| My reviews tab | HR | GET /reviews/me any role | missing | tab added under Performance |
| Performance categories | Manager | GET categories any role | blocked | read-only tab for managers (add, edit, delete stay HR) |
| Everything else checked | all | see API_MAP.md | matched | no change |

Checked by clicking or loading the real screens: all tabs, sidebar items and links per role in both languages, the org chart view buttons from three entry points per role and language, and that Employee and Manager are refused another person's request, review, attendance and task (denied or not found, never shown). Only verified by reading code: the exact button sets inside each detail page (for example plan activate and close, review reopen, balance edit, role change, which are HR only in the code), leave types as a management screen (Employee and Manager never see it although the backend lets everyone read leave types), and the loan schedule panel (HR only). Intentionally not changed: the all-tasks tab stays HR only because Manager and Employee have Team tasks and My tasks, which are the same endpoint scoped by role.

Org chart: finding yourself (UI only, no new fields). The logged-in user is marked everywhere in the section: in the chart my node has a tinted background, a 2px accent border and a "You" / "أنت" badge, my management chain has a thin accent edge on its nodes and an accent colour on the connecting lines (the stretch of horizontal line between the parent centre and the branch that leads to me), in the list my row has the same tint, an accent bar on the inline-start edge (mirrored in RTL, a start border on mobile cards) and the badge next to my name, and in My circle my card is marked the same way; the badge text and aria-current carry the meaning, not colour. A "My place" button sits in the toolbar of the chart and of the list: in the chart it opens the branch that contains me when I am deeper than two levels, resets zoom, centres my node and plays one short ring pulse (no pulse animation under reduced motion); on first opening the chart it centres on me when I am not visible; in the list it clears search and filters if they hide me, goes to the page that contains my row using the existing page state, scrolls it to the middle and flashes the row once. If the account is inactive (not in the data) a short toast says so. The chart canvas got side padding so any node can be centred. Verified by script as HR (top of the tree), Manager (middle) and Employee (leaf) in Arabic and English at 1440, 820 and 390: auto-centre, the button, the badge and the list row; top and middle nodes cannot be centred vertically because the canvas starts at the top, they stay fully visible instead. Only checked by reading code: opening a branch for someone deeper than two levels below the root (the seed tree is only three levels deep), and the inactive-account message. Screenshots reviewed: employee EN 1440 (chart and list), manager AR 1440, employee AR 390, HR EN 820 list.

Navigation cleanup: the Settings section and the gear item are gone. Before removing it, what each role saw: HR had two tabs (Users and roles, Activity log); managers and employees saw nothing under it. Nothing useful was lost. Personal actions (profile, password, my place, sign out) stay in the sidebar user menu. HR gets a "System administration" group at the end of the sidebar with two direct items (Users and roles, Activity log); managers and employees do not see it and direct URLs still return 403. Paths moved: /settings/users and /settings/activity-logs to /admin/*, /settings/profile and /settings/password to /account/*, /settings/leave-types to /leave-balances/types (same tab inside Requests and leave, name, tabs and behavior unchanged). The old /settings/* paths redirect. Breadcrumb for the new items reads System administration > Users and roles or Activity log. The three role description cards above the users table were removed.

Messages home: a branded header (logo mark, "NexusHR Communication" / "NexusHR للتواصل", one welcome line) sits at the top of the content area, followed by the Home label, the welcome title and the two unchanged cards in a 960px column, on a faint brand-tinted gradient. No counters or data.

Messages top toolbar: the strip above the room list and conversation now has a light brand tint (brand-600 at 5% over white) and a 1px brand-200 bottom border. The search field is explicitly white with its own border. Order and structure are unchanged. Icon colors are unchanged; hover on the toolbar icon buttons is a brand tint (brand-600 at 10%) instead of grey. The sidebar, room list and conversation header keep their existing brand-50 tints (about 2 to 3%), so the toolbar is the slightly stronger band on top.

Messages toolbar accent line: the strip's bottom edge has a 2px line (brand-600 to brand-300 to transparent, a pseudo-element, no shadow or glow). It runs from the start edge and fades toward the end, flipping in RTL (checked from the computed gradient direction: to right in English, to left in Arabic). The tint, white search field and blue hover from the previous change are unchanged.

Row striping: every data table now has zebra rows (first row white, second tinted with ink-600 at 3.5%). It lives in the shared table styles: `rowPlain` and `rowSelected` in `src/components/ui/DataTable.tsx` (desktop table rows and the mobile card rows), plus the two hand-built tables, the chart data table in `ChartKit.tsx` and the skills matrix (its sticky first column uses an opaque mix of the same tokens so scrolled cells do not show through). Hover is a stronger blue tint (brand-600 at 8%), selected rows use brand-100, and the "me" row in the org chart keeps its own brand-50 tint, bar and badge, so none of them looks like a stripe. Row separators, headers and pagination are unchanged. Not striped on purpose: the My skills list, dashboard lists and key-value detail blocks, which are not tables.

Sidebar header: the subtitle ("Human Resources Management" / "إدارة الموارد البشرية") is removed everywhere the shared `Logo` is used. The `tagline` prop and the `app.tagline` strings are deleted; the logo's accessible name is now just "NexusHR". The mark and the name are centred on the same line (measured: both centre at the same y in a 60px header, 12px gap, collapse button on the same centre), in RTL and LTR, expanded sidebar and mobile drawer. The collapsed rail keeps the mark only.
