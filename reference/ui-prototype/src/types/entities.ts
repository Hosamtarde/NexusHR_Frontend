export type Role = 'hr_admin' | 'manager' | 'employee'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave'
export type EmploymentType = 'full_time' | 'part_time' | 'contract'
export type RequestType = 'leave' | 'loan' | 'permission' | 'custom'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type PaymentType = 'paid' | 'half_paid' | 'unpaid'
export type RecruitmentStatus = 'pending' | 'shortlisted' | 'interview_scheduled' | 'accepted' | 'rejected'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'to-do' | 'in_progress' | 'completed' | 'cancelled'
export type ActivityAction = 'create' | 'update' | 'delete'
export type RepaymentStatus = 'pending' | 'paid'
export type PlanStatus = 'draft' | 'active' | 'closed'
export type ReviewStatus = 'pending' | 'submitted'
export type NotificationType =
  | 'request_submitted'
  | 'request_reviewed'
  | 'request_cancelled'
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_completed'
  | 'task_due_soon'
  | 'review_pending'
  | 'review_submitted'
  | 'review_reopened'
  | 'payslip_generated'
  | 'loan_instalment_paid'
  | 'leave_balance_low'
  | 'application_status'
  | 'manager_changed'
  | 'interview_scheduled'

export interface User {
  user_id: number
  first_name: string
  last_name: string
  email: string
  role: Role
  phone_number: string | null
  profile_image: string | null
  status: boolean
  created_at: string
}

export interface Department {
  department_id: number
  department_name: string
  manager_id: number | null
}

export interface EmployeeProfile {
  user_id: number
  department_id: number | null
  reports_to: number | null
  position: string
  hire_date: string
  employment_type: EmploymentType
  basic_salary: number
}

export interface EmployeeCard {
  userId: number
  fullName: string
  email: string
  profileImage: string | null
  position: string | null
  department: string | null
  managerName: string | null
  directReports: number
  todayStatus: string | null
}

export interface Attendance {
  attendance_id: number
  user_id: number
  check_in_time: string | null
  check_out_time: string | null
  working_hours: number | null
  attendance_status: AttendanceStatus
  attendance_date: string
}

export interface LeaveType {
  leave_type_id: number
  type_name: string
  payment_type: PaymentType
  default_days: number
  uses_service_tiers: boolean
  created_at: string
}

export interface LeaveBalance {
  balance_id: number
  user_id: number
  leave_type_id: number
  year: number
  total_days: number
  carried_over: number
  used_days: number
  is_manual: boolean
}

export interface HrRequest {
  request_id: number
  user_id: number
  request_type: RequestType
  request_title: string | null
  leave_type_id: number | null
  start_date: string | null
  end_date: string | null
  loan_amount: number | null
  repayment_period: number | null
  reason: string
  attachment: string | null
  request_status: RequestStatus
  reviewed_by: number | null
  created_at: string
}

export interface LoanRepayment {
  repayment_id: number
  request_id: number
  installment_no: number
  due_date: string
  amount: number
  repayment_status: RepaymentStatus
  paid_at: string | null
  payroll_id: number | null
}

export interface Payroll {
  payroll_id: number
  user_id: number
  basic_salary: number
  bonuses: number
  deductions: number
  net_salary: number
  salary_month: string
  generated_at: string
}

export interface Task {
  task_id: number
  assigned_by: number
  task_title: string
  description: string
  deadline: string
  task_priority: TaskPriority
  task_status: TaskStatus
  created_at: string
}

export interface AssignedTask {
  user_id: number
  task_id: number
  assigned_at: string
  completion_percentage: number
}

export interface CriteriaCategory {
  category_id: number
  category_name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface PlanCriterion {
  criteria_id: number
  plan_id: number
  category_id: number
  criteria_text: string
  weight: number
  max_score: number
  display_order: number
}

export interface EvaluationPlan {
  plan_id: number
  plan_name: string
  description: string | null
  department_id: number | null
  created_by: number
  period_start: string
  period_end: string
  submission_start: string
  submission_end: string
  plan_status: PlanStatus
  criteria: PlanCriterion[]
  created_at: string
}

export interface EvaluationScore {
  review_id: number
  criteria_id: number
  score: number
  note: string | null
}

export interface PerformanceReview {
  review_id: number
  plan_id: number
  reviewed_user_id: number
  reviewed_by: number | null
  review_status: ReviewStatus
  total_score: number | null
  final_percentage: number | null
  reviewer_comment: string | null
  submitted_at: string | null
  scores: EvaluationScore[]
  created_at: string
}

export interface Application {
  application_id: number
  applicant_name: string
  email: string
  phone_number: string | null
  cv_file: string
  applied_position: string
  application_status: RecruitmentStatus
  interview_at: string | null
  meeting_url: string | null
  submission_date: string
}

export interface ActivityLog {
  log_id: number
  user_id: number | null
  action: ActivityAction
  entity: string
  entity_id: number | null
  method: string
  path: string
  created_at: string
}

export type ReportColumnType = 'text' | 'number' | 'percent' | 'currency' | 'date'

export interface ReportColumn {
  key: string
  label: string
  type: ReportColumnType
  width?: number
}

