import { updateCollection, useCollection } from '@/store/collections'
import type { ActivityAction, ActivityLog } from '@/types/entities'

type Seed = [user: number | null, action: ActivityAction, entity: string, entityId: number | null, method: string, path: string, at: string]

const seeds: Seed[] = [
  [5, 'create', 'requests', 41, 'POST', '/requests', '2026-11-12T08:20:11Z'],
  [11, 'create', 'requests', 43, 'POST', '/requests', '2026-11-12T05:10:42Z'],
  [2, 'create', 'tasks', 1, 'POST', '/tasks', '2026-11-12T08:30:03Z'],
  [16, 'create', 'requests', 42, 'POST', '/requests', '2026-11-11T13:40:19Z'],
  [1, 'update', 'recruitment', 12, 'PUT', '/recruitment/12/interview', '2026-11-11T09:12:00Z'],
  [1, 'update', 'users', 20, 'PATCH', '/users/20/role', '2026-11-10T14:02:31Z'],
  [8, 'update', 'performance-reviews', 31, 'PUT', '/performance/reviews/31/submit', '2026-11-08T10:00:20Z'],
  [3, 'update', 'performance-reviews', 32, 'PUT', '/performance/reviews/32/submit', '2026-11-08T09:47:55Z'],
  [7, 'update', 'tasks', 3, 'PUT', '/tasks/3/completion', '2026-11-07T16:22:09Z'],
  [2, 'update', 'tasks', 3, 'PUT', '/tasks/3/status', '2026-11-07T16:40:44Z'],
  [1, 'create', 'evaluation-plans', 3, 'POST', '/performance/plans', '2026-11-08T08:00:00Z'],
  [2, 'update', 'requests', 38, 'PUT', '/requests/38/review', '2026-11-03T09:15:00Z'],
  [1, 'update', 'org-chart', 20, 'PUT', '/org-chart/20/manager', '2026-10-29T11:30:00Z'],
  [1, 'create', 'payroll', null, 'POST', '/payroll/generate', '2026-10-28T09:00:00Z'],
  [1, 'update', 'payroll', 105, 'PUT', '/payroll/105', '2026-10-28T09:20:00Z'],
  [1, 'update', 'leave-balances', 25, 'PUT', '/leave-balances/25', '2026-10-27T13:05:00Z'],
  [1, 'create', 'employees', 21, 'POST', '/employees', '2026-09-14T08:30:00Z'],
  [1, 'update', 'employees', 6, 'PUT', '/employees/6', '2026-10-20T10:10:00Z'],
  [1, 'delete', 'employees', 24, 'DELETE', '/employees/24', '2026-10-18T15:00:00Z'],
  [1, 'create', 'departments', 6, 'POST', '/departments', '2026-08-02T08:00:00Z'],
  [18, 'update', 'recruitment', 9, 'PUT', '/recruitment/9/status', '2026-10-29T12:00:00Z'],
  [18, 'delete', 'recruitment', 2, 'DELETE', '/recruitment/2', '2026-10-25T10:00:00Z'],
  [1, 'create', 'leave-types', 6, 'POST', '/leave-types', '2026-06-20T08:00:00Z'],
  [1, 'update', 'leave-types', 1, 'PUT', '/leave-types/1', '2026-07-01T08:00:00Z'],
  [4, 'create', 'tasks', 6, 'POST', '/tasks', '2026-11-09T08:00:00Z'],
  [13, 'update', 'requests', 32, 'PUT', '/requests/32/review', '2026-10-10T09:00:00Z'],
  [1, 'update', 'performance-reviews', 9, 'PATCH', '/performance/reviews/9/reopen', '2026-10-12T08:30:00Z'],
  [6, 'delete', 'requests', 44, 'DELETE', '/requests/44', '2026-11-06T12:00:00Z'],
]

export const activityLogs: ActivityLog[] = seeds
  .map(([user, action, entity, entityId, method, path, at], index) => ({
    log_id: index + 1,
    user_id: user,
    action,
    entity,
    entity_id: entityId,
    method,
    path,
    created_at: at,
  }))
  .sort((a, b) => b.created_at.localeCompare(a.created_at))

const seedLogs = () => activityLogs.slice()

export const useActivity = () => useCollection<ActivityLog>('activity', seedLogs)

let nextLogId = 1000

export function logActivity(userId: number | null, action: ActivityAction, entity: string, entityId: number | null, method: string, path: string) {
  updateCollection<ActivityLog>('activity', seedLogs, (list) => [{ log_id: nextLogId++, user_id: userId, action, entity, entity_id: entityId, method, path, created_at: new Date().toISOString() }, ...list])
}
