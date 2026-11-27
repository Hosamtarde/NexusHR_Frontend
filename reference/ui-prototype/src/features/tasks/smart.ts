import type { AssignedTask, Role, Task } from '@/types/entities'
import { activeEmployees, teamIds, type EmployeeRow } from '@/features/employees/data'
import { employeeSkills, getSkill, type Skill } from '@/features/skills/data'

export interface Requirement {
  skillId: number
  level: number
}

export type Reason =
  | { kind: 'skill'; skill: Skill; level: number; required: number }
  | { kind: 'missing'; skill: Skill; required: number }
  | { kind: 'verified' }
  | { kind: 'free' }
  | { kind: 'busy'; open: number }
  | { kind: 'department' }

export interface Candidate {
  row: EmployeeRow
  score: number
  open: number
  reasons: Reason[]
}

export function openTasksOf(userId: number, tasks: Task[], assignments: AssignedTask[]) {
  return assignments.filter((item) => {
    if (item.user_id !== userId || item.completion_percentage >= 100) return false
    const task = tasks.find((entry) => entry.task_id === item.task_id)
    return task && task.task_status !== 'completed' && task.task_status !== 'cancelled'
  }).length
}

export function candidatePool(role: Role, userId: number) {
  const all = activeEmployees()
  if (role === 'hr_admin') return all
  const team = new Set([userId, ...teamIds(userId)])
  return all.filter((row) => team.has(row.user.user_id))
}

export function rankCandidates(requirements: Requirement[], pool: EmployeeRow[], tasks: Task[], assignments: AssignedTask[], departmentId: number | null): Candidate[] {
  return pool
    .map((row) => {
      const owned = employeeSkills.filter((item) => item.user_id === row.user.user_id)
      const reasons: Reason[] = []
      let coverage = 0
      let verified = 0
      for (const requirement of requirements) {
        const skill = getSkill(requirement.skillId)
        if (!skill) continue
        const match = owned.find((item) => item.skill_id === requirement.skillId)
        if (match) {
          coverage += Math.min(1, match.level / requirement.level)
          if (match.verified) verified += 1
          reasons.push({ kind: 'skill', skill, level: match.level, required: requirement.level })
        } else {
          reasons.push({ kind: 'missing', skill, required: requirement.level })
        }
      }
      const skillScore = requirements.length ? coverage / requirements.length : 0.5
      const open = openTasksOf(row.user.user_id, tasks, assignments)
      const availability = Math.max(0, 1 - open / 5)
      const sameDepartment = departmentId !== null && row.profile.department_id === departmentId
      const score = Math.round(100 * (0.65 * skillScore + 0.25 * availability + (sameDepartment ? 0.1 : 0)))
      if (verified > 0 && verified === requirements.length) reasons.push({ kind: 'verified' })
      reasons.push(open <= 1 ? { kind: 'free' } : { kind: 'busy', open })
      if (sameDepartment) reasons.push({ kind: 'department' })
      return { row, score: Math.min(100, score), open, reasons }
    })
    .sort((a, b) => b.score - a.score)
}
