# NexusHR API Map (contract for the prototype)

Source of truth: `../backend/src` (read only). Roles: `employee`, `manager`, `hr_admin` (`applicant` exists as an enum value but has no screen).
All routes need a JWT except `POST /auth/login`, `POST /auth/refresh` and `POST /recruitment/apply`.
Lists accept `page` and `limit` only (PaginationDto) unless a route says otherwise. There are no server-side search, sort or filter params except where listed. Client-side filtering is allowed only on already loaded pages.

## Enums
- Role: applicant, employee, manager, hr_admin
- AttendanceStatus: present, absent, late, on_leave
- EmploymentType: full_time, part_time, contract
- RequestType: leave, loan, permission, custom
- RequestStatus: pending, approved, rejected
- PaymentType: paid, half_paid, unpaid
- RecruitmentStatus: pending, shortlisted, interview_scheduled, accepted, rejected
- TaskPriority: low, medium, high
- TaskStatus: to-do, in_progress, completed, cancelled
- ActivityAction: create, update, delete
- RepaymentStatus: pending, paid
- PlanStatus: draft, active, closed
- ReviewStatus: pending, submitted
- ReportFormat: json, excel, pdf
- NotificationType: request_submitted, request_reviewed, request_cancelled, task_assigned, task_status_changed, task_completed, task_due_soon, review_pending, review_submitted, review_reopened, payslip_generated, loan_instalment_paid, leave_balance_low, application_status, manager_changed, interview_scheduled

## Auth
| Route | Roles | Notes | Screen |
|---|---|---|---|
| POST /auth/login | public | email (valid), password (required, min 6) | Login |
| POST /auth/refresh | public | refresh_token | silent, no screen |
| GET /auth/me | any | current user | app shell |
| POST /auth/logout | any | | user menu "Sign out" |

No forgot or reset password route exists.

## Users
| Route | Roles | Notes | Screen |
|---|---|---|---|
| GET /users/me | any | | Settings > Profile |
| PUT /users/me | any | first_name 2-100, last_name 2-100, phone_number, profile_image (1-255), all optional | Settings > Profile |
| PATCH /users/me/password | any | current_password, new_password min 8 | Settings > Password |
| PATCH /users/:id/role | hr_admin | role enum | Settings > Users and roles |

No users list route. Verified: GET /employees returns profiles with the user relation (role, status, email, names; password is select:false), so Settings > Users and roles is built from GET /employees (HR only, paginated) with PATCH /users/:id/role. Status is display only. User entity: user_id, first_name, last_name, email, role, phone_number, profile_image, status (boolean, display only), chat_user_id, created_at.

## Employees
| Route | Roles | Notes | Screen |
|---|---|---|---|
| GET /employees | hr_admin | paginated | Employees list |
| GET /employees/:id | hr_admin | | Employee detail |
| GET /employees/:id/card | any | EmployeeCard: userId, fullName, email, profileImage, position, department, managerName, directReports, todayStatus | PersonStack popovers, hover cards |
| POST /employees | hr_admin | first_name, last_name (max 100), email, password (min 6), phone_number?, department_id?, position (max 100), hire_date, basic_salary (>=0), employment_type | New employee |
| PUT /employees/:id | hr_admin | partial of create | Edit employee |
| DELETE /employees/:id | hr_admin | soft delete (user.status=false), no reactivation route | Employee detail, confirm dialog |

Profile entity: user_id, department_id, reports_to, position, hire_date, employment_type, basic_salary.

## Departments
GET /departments, GET /departments/:id (any role). POST, PUT /:id, DELETE /:id (hr_admin). Fields: department_name (required, max 100), manager_id? (int).

## Org chart (all roles)
- GET /org-chart: tree from root, depth 2. Node: person + directReports count + children.
- GET /org-chart/:userId: branch from that person (depth 2).
- GET /org-chart/me: my circle: self, manager, peers, directReports, chain (ancestors).
- GET /org-chart/list: query q (max 100), departmentId, managerId, page, limit (max 100). Row: user_id, name, role, position, department_name, reports_to, manager_name, direct_reports. Ordered root first then first name.
- PUT /org-chart/:userId/manager (hr_admin): body managerId (int or null). Rules: new manager needs a profile; a change that creates a cycle is rejected; null only if no other root exists. On change: manager_changed notification (employee and new manager). Person fields: no photo, no presence.

## Attendance
| Route | Roles | Notes |
|---|---|---|
| POST /attendance/check-in | any | once per day; status late if after 08:15 (work start 08:00, grace 15 min) else present |
| POST /attendance/check-out | any | needs check-in, once per day; working_hours = out - in |
| GET /attendance | manager (own subtree), hr_admin (all) | paginated |
| GET /attendance/employee/:id | manager (in scope), hr_admin | paginated |

Entity: attendance_id, user_id, check_in_time, check_out_time, working_hours, attendance_status, attendance_date. The service scopes findAll by role (employee falls back to own rows, manager to subtree, hr all) but the route decorator `@Roles(MANAGER, HR_ADMIN)` overrides the class and RolesGuard uses getAllAndOverride, so an employee gets 403. Verified: there is no "My attendance" history for employees; their screen shows only today's check in/out and the result of the last action. Managers see their own rows plus subtree in GET /attendance.

## Requests
| Route | Roles | Notes |
|---|---|---|
| POST /requests | any | request_type; custom: request_title 3-150 required; leave: leave_type_id, start_date, end_date (end >= start; balance check unless unpaid type; blocked with "no balance calculated" or "insufficient balance"); loan: loan_amount >=1, repayment_period >=1 (months); reason required; attachment? |
| GET /requests | any | employee: own; manager: own subtree; hr: all. Includes user and reviewer |
| GET /requests/:id | owner, manager in scope, hr | |
| PUT /requests/:id/review | manager, hr_admin | status approved or rejected, review_notes?. Only pending. Cannot review own request (even HR? HR may). Manager only for subtree. Approve leave: consumes balance (unless unpaid). Approve loan: generates repayment schedule |
| DELETE /requests/:id | owner, manager in scope, hr | only pending; notifies request_cancelled |

Entity: request_id, user_id, request_type, request_title, leave_type_id, start_date, end_date, loan_amount, repayment_period, reason, attachment, request_status, reviewed_by, created_at. Rejection reason is optional (review_notes), not stored on the entity as a separate field in the DTO list: kept as review_notes in the review body.

## Leave types
GET /leave-types (any, paginated). GET /:id, POST, PUT /:id, DELETE /:id (hr_admin). Fields: type_name 2-100, payment_type, default_days int 0-365, uses_service_tiers? boolean.

## Leave balances
GET /leave-balances/me (any; query year?). GET /leave-balances (hr; query year 2000-2100, page, limit). GET /:id, PUT /:id (hr: total_days, carried_over, used_days, 0-365 with one decimal; marks is_manual). POST /leave-balances/calculate?year= (hr). Entity: balance_id, user_id, leave_type_id, year, total_days, carried_over, used_days, is_manual. Low-balance threshold notification (leave_balance_low) after an approval.

## Loans
The controller has exactly one route: GET /loan-repayments/loan/:id (hr_admin), keyed by the loan request id (there is no per-user route). Response: {request_id, loan_amount, installments_total, installments_paid, paid_amount, remaining_amount, is_settled, next_due_date, installments:[{installment_no, due_date, amount, repayment_status, paid_at, payroll_id}]}; 404 when the request has no schedule (not approved yet). Screen: shown inside the details of a loan request (HR only) once approved. Entity: repayment_id, request_id, installment_no, due_date, amount, repayment_status (pending|paid), paid_at, payroll_id. A loan is a request with request_type loan. Installments are paid only by payroll generation (consumeNextInstallment). No manual "pay installment" action. No loans list route: HR gets loans from the requests list (type loan, approved).

## Payroll
| Route | Roles | Notes |
|---|---|---|
| POST /payroll/generate | hr_admin | salary_month (date string), user_id? (single) , bonuses? (>=0). Without user_id: all active users, skipped on error. One payslip per user per month |
| GET /payroll | hr_admin | paginated, includes user |
| GET /payroll/employee/:id | hr_admin | paginated; 404 when none |
| GET /payroll/me | any | paginated; 404 when none |
| GET /payroll/:id | hr_admin only | employees open a payslip from the /me list data |
| PUT /payroll/:id | hr_admin | bonuses?, deductions? (>=0, 2 decimals); net = basic + bonuses - deductions |
| DELETE /payroll/:id | hr_admin | |

Entity: payroll_id, user_id, basic_salary, bonuses, deductions, net_salary, salary_month, generated_at. No payslip status field. Deductions = loan installment + unpaid leave days + half of half-paid days + absence days, each at daily rate. Payslip generation emits payslip_generated (and loan_instalment_paid).

## Tasks
| Route | Roles | Notes |
|---|---|---|
| POST /tasks | manager, hr_admin | task_title (max 150), description, deadline (date), task_priority, assigned_user_ids (array min 1). Status starts to-do, completion 0 |
| GET /tasks | any | hr: all; manager: created by me or any assignee in subtree; employee: only tasks assigned to me |
| GET /tasks/:id | hr, creator, assignee, manager with assignee in subtree | |
| PUT /tasks/:id | manager, hr | title, description, deadline, priority (not assignees); needs manage right |
| PUT /tasks/:id/status | manager, hr | TaskStatus incl. cancelled; no transition rules in backend; notifies assignees (task_status_changed) |
| PUT /tasks/:id/completion | any assignee | completion_percentage 0-100 for the caller's own assignment; when everyone is 100 the creator gets task_completed |
| DELETE /tasks/:id | manager, hr | needs manage right |

Manage right: hr, creator, or manager with an assignee in their subtree. Entity: task_id, assigned_by, task_title, description, deadline, task_priority, task_status, created_at; assignment: user_id, task_id, assigned_at, completion_percentage.

## Performance
Categories: GET list/:id... GET / (any), GET /:id, POST, PUT, DELETE (hr). Fields: category_name max 100, description max 255, is_active.
Plans: GET /performance/plans and /:id (hr, manager); POST, PUT /:id, DELETE /:id, PATCH /:id/activate, PATCH /:id/close (hr). Fields: plan_name max 150, description?, department_id?, period_start, period_end, submission_start, submission_end (YYYY-MM-DD), criteria array min 1 {category_id, criteria_text max 255, weight 0.01-100, max_score 1-10 default, display_order}. Status draft -> active -> closed. Weights must total 100 (TOTAL_WEIGHT).
Reviews: GET /reviews/pending (manager, hr), GET /reviews/me (any), GET /reviews/employee/:userId (manager, hr), GET /reviews/:id (any with visibility rules), PUT /reviews/:id/submit (manager, hr), PATCH /reviews/:id/reopen (hr).
Rules: submit needs an active plan and today inside submission_start..submission_end; scores array min 1 {criteria_id, score >=1 and <= criterion max_score, note max 255}; every criterion scored once; total_score = sum, final_percentage = sum(score/max*weight); reviewer_comment optional. Reviewer: hr any; manager only for their department's employees; manager cannot review themselves (HR reviews the department manager). Visibility: hr all; employee only their own and only when submitted; manager for people they manage.
Entities: plan_id, plan_name, department_id, created_by, period dates, plan_status; review_id, plan_id, reviewed_user_id, reviewed_by, review_status, total_score, final_percentage, reviewer_comment, submitted_at, scores[{criteria_id, score, note}].

## Recruitment
| Route | Roles | Notes |
|---|---|---|
| POST /recruitment/apply | public | multipart: applicant_name max 100, email, phone_number?, applied_position max 100, cv_file PDF max 5 MB; limit 3 per hour |
| GET /recruitment | hr | paginated, newest first |
| GET /recruitment/:id, GET /:id/cv | hr | cv download |
| PUT /recruitment/:id/status | hr | transitions below; interview_scheduled is refused here |
| PUT /recruitment/:id/interview | hr | interview_at (date string, must be future); allowed from shortlisted or interview_scheduled (reschedule); creates meeting_url (Jitsi room) once and keeps it |
| DELETE /recruitment/:id | hr | deletes CV file |

Transitions: pending -> shortlisted | rejected; shortlisted -> interview_scheduled (via interview route) | rejected; interview_scheduled -> accepted | rejected; accepted and rejected are final. Entity: application_id, applicant_name, email, phone_number, cv_file, applied_position, application_status, interview_at, meeting_url, reminder_sent_at, submission_date. Accepting does not create an employee. An interview reminder is sent when the interview is within the reminder window.

## Notifications (any role)
GET /notifications (page, limit, unreadOnly), GET /count, PATCH /read-all, PATCH /:id/read, DELETE /read (all read ones), DELETE /:id. Entity: notification_id, type, title (max 150), message (max 500), link (max 255), is_read, created_at. No preferences route: Settings > Notifications is not a screen.

## Reports (hr_admin, manager; manager is scoped to subtree)
GET /reports/dashboard, /attendance, /leave-balances, /performance, /tasks (hr, manager); /payroll, /recruitment (hr). Query: from, to (dates, required), departmentId?, format (json|excel|pdf). Excel and PDF exports are real backend features.

## Activity logs
GET /activity-logs (hr, paginated). Entity: log_id, user_id, action (create|update|delete), entity, entity_id, method, path, created_at. Written automatically by an interceptor for writes.

## Role access summary (drives routes, sidebar, tabs, palette)
- employee: dashboard, my attendance (check in/out), requests (own), leave balance (me), payslips (me), tasks (assigned), my reviews, org chart (chart, list, my circle), notifications, profile, password, careers page (public).
- manager: employee set plus team requests and review, attendance (subtree), tasks (create, manage), pending reviews, plans (read), reports (not payroll/recruitment).
- hr_admin: everything, including employees, departments, leave types and balances, loans, payroll, recruitment, plans/categories, reports, activity log, role change, change manager.

## Prototype-only screens
Not backed by the API (planned later, labeled in the UI): Skills catalog, Skills matrix, Smart assignment on the new task form, Messages (Rocket.Chat style; `chat_user_id` exists on users).

## Deviations
- Task status `cancelled` exists in the backend enum (migration AddCancelledTaskStatus); the prompt asked to remove it. Code wins: Cancelled stays, with no cancel reason field.
- Task status change (including setting `cancelled`) is allowed only for manager and hr_admin (route `@Roles(MANAGER, HR_ADMIN)` plus manage right: hr, creator, or manager with an assignee in subtree); an employee gets 403. Employees only update their own completion percentage via PUT /tasks/:id/completion. Task status change is manager/HR only; employees may only update their own completion percentage. The employee status dropdown is therefore not available.
- Reports Excel and PDF exports are real backend features (format=excel|pdf). The prototype cannot produce files, so the buttons are labelled exactly "Excel" and "PDF" and only show the toast "Generated by the backend in the real app".
- `review_notes` is accepted by ReviewRequestDto but requests.service.ts never reads it: it is not stored and not put in any notification. The prototype collects it as an optional note ("Note (optional)") for approve and reject, and never shows it back.
- Completion updates (PUT /tasks/:id/completion) are not blocked on a cancelled or completed task, and they never change task_status. The prototype follows this: cancelled tasks are only shown muted, and completion changes do not flip the status.
- Careers: `applied_position` is free text (max 100) with no jobs route. The apply form uses a text input; the static catalogue only feeds the input suggestions. The 3 applications per hour limit (throttle on POST /recruitment/apply) and the PDF max 5 MB rule are enforced in the form.
- Payslip detail `GET /payroll/:id` is HR only; an employee payslip page renders from the /payroll/me list item.
- No attendance history route for employees.
- No forgot or reset password, no SSO, no users list, no notification preferences, no skills, no messaging routes.
- Loans have no list or create route of their own; they are requests of type loan plus the repayment schedule route.
- Org chart returns no photo or presence; chart depth is 2 per call.
- Review of an HR user's own request: backend allows HR to review any request, including their own (own-request denial applies only to non-HR).

## Open questions
- Plan activation rules (department scope, auto-creation of pending reviews) were not read in detail; the prototype creates one pending review per department member on activate.
- Exact report result shapes per report were not mapped; the prototype keeps its current chart/table shapes.
- Whether PUT /tasks/:id can change assignees: the DTO lacks assignee changes on update, so the prototype does not allow it.

## Decisions (Phase C to E)
- Lists keep search, filter and sort as client-side operations on the loaded page, because the endpoints only take page and limit.
- Request review note is optional for both decisions and is only sent in the review body in the real app (see Deviations).
- Payroll wizard exposes the real POST /payroll/generate options: month (salary_month), scope all active employees or one employee (user_id), and one optional bonuses amount (>= 0) applied to each generated payslip. In bulk mode employees with an error (for example an existing payslip for that month) are skipped and counted; for a single employee the same case is an error. One payslip per user per month is enforced.
- Dashboard: the schedule panel lists only real events (interviews and task deadlines in the next 7 days); invented meeting and payroll-deadline events, deltas and sparklines were removed. The payroll shortcut shows the employee count of the latest real run.
- Employee attendance: employees see only check in and check out and the result of their last action. Their own today state stands for GET /employees/:id/card todayStatus. No GET /attendance data, summary strip or "not checked in" badge is shown to employees; those stay for managers and HR.
- Activity log shows only stored fields (user, action, entity, entity_id, method, path, time) and every record the prototype writes has the same shape.
- Nexa is a plain direct-message conversation with a bot inside Messages. The top bar sparkle button and the sidebar button open /messages/nexa-<userId>; the separate assistant drawer was removed.
- Messages is a Rocket.Chat style prototype with its own in-memory store (src/features/messages/rc); system notifications appear as Nexa bot messages with links.
- Forgot/reset password, SSO, remember me, settings for system/chat/notifications, loans pages and the performance criteria page were removed.
- Reports: Excel and PDF buttons only show the backend toast; no file is produced.
- See AUDIT.md for the orphan tables and the seed check.
- Person hover card: every person name or avatar opens one shared popover (hover 250ms, keyboard focus, tap on touch) built only from GET /employees/:id/card fields: photo, full name, position, department, manager name, direct reports count, email, today status. Org chart nodes keep click to open the profile; no native title tooltip.
- Avatars: users have only profile_image (no gender field anywhere in the contract, and none is shown). Without a photo the prototype draws a male, female or neutral silhouette chosen by getDefaultAvatar(firstName), a cosmetic name-based heuristic over a local name list (Arabic normalised, English lowercased). Names in both lists or in neither give the neutral silhouette. A real app should not infer anything from this.
- Departments is only a tab inside the Employees section (List, Departments, Org chart, Skills, Skills matrix); no standalone sidebar item. Breadcrumb reads Employees > Departments, also on department details.
- Approve and reject dialogs have no note field: review_notes is ignored by the backend (requests) and recruitment has no note at all.
- Change password (all roles): PATCH /users/me/password with current and new password (min 8). The prototype keeps passwords in memory; a wrong current password is an error. A temporary password (new employee, CSV import, HR reset) shows a non-blocking banner suggesting a change.
- Employee edit form: first name, last name, phone, department, position, hire date, basic salary, employment type. Email is read only; password, role and manager are not edited there.
- CSV import (HR only) creates employees one by one like POST /employees with a random temporary password per row, then offers an email and temporary password sheet once.
- HR reset password: planned route PATCH /users/:id/password (HR only, body new_password min 8), part of an approved backend change that will be built separately. Simulated in memory in the prototype: random temporary password shown once, activity log entry.
- Messages (prototype only, no backend): toolbar with user menu, room search (Ctrl+K), create menu (direct message, discussion, channel), display menu that changes the room list, collapsible sections, room header with topic and seven icons, side panels (members, mentions, search, threads, discussions, info, pinned, files). Presence dots: for other people online means checked in today and not checked out (from attendance), otherwise offline; the current user chooses online, away, busy or offline for themselves only. Department channels (dept-id) are managed automatically by the backend: no add or remove of members there. Discussions are rooms with a parent channel.

## Recruitment screens (fix pass)
- Careers form limits follow POST /recruitment/apply exactly: applicant_name required max 100, valid email, phone_number optional max 20 (input maxlength), applied_position free text required max 100 (suggestions only help typing, with an "Other (type your own)" row), cv_file PDF only max 5 MB, 3 applications per hour with a friendly message. The success screen only confirms receipt. There is no applicant-facing status or tracking page: applicants have no accounts.
- HR status actions follow the transition table: pending -> shortlisted or rejected; shortlisted -> interview (schedule action only) or rejected; interview_scheduled -> accepted or rejected, or reschedule (same meeting link); accepted and rejected are final. The store refuses any other transition and refuses scheduling from other statuses.
- The detail page shows only stored data: name, position, status, submitted date, interview time, email, phone, meeting link and a file card for the PDF (cv-<id>.pdf, Open and Download). No parsed resume fields. Discuss was removed from this page because applicants have no chat accounts.
