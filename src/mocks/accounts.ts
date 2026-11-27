import type { MeResponse, Role } from '@/types/auth'

export interface MockAccount extends MeResponse {
  password: string
}

export const mockAccounts: MockAccount[] = [
  {
    user_id: 1,
    first_name: 'سارة',
    last_name: 'الخطيب',
    email: 'admin@hrms.com',
    password: 'admin123',
    role: 'hr_admin',
    phone_number: '0599000001',
    profile_image: null,
    status: true,
  },
  {
    user_id: 2,
    first_name: 'أحمد',
    last_name: 'أبو اسنينة',
    email: 'manager@hrms.com',
    password: 'manager123',
    role: 'manager',
    phone_number: '0599000002',
    profile_image: null,
    status: true,
  },
  {
    user_id: 5,
    first_name: 'يوسف',
    last_name: 'القواسمة',
    email: 'employee@hrms.com',
    password: 'employee123',
    role: 'employee',
    phone_number: '0599000005',
    profile_image: null,
    status: true,
  },
  {
    user_id: 90,
    first_name: 'Applicant',
    last_name: 'Test',
    email: 'applicant@hrms.com',
    password: 'applicant123',
    role: 'applicant',
    phone_number: null,
    profile_image: null,
    status: true,
  },
]

export const demoAccounts = mockAccounts.filter((account) => account.role !== 'applicant')

export const findAccount = (userId: number) => mockAccounts.find((account) => account.user_id === userId)

export const findAccountByEmail = (email: string) =>
  mockAccounts.find((account) => account.email.toLowerCase() === email.trim().toLowerCase())

export function toMe({ password: _password, ...me }: MockAccount): MeResponse {
  return me
}

export const roleOf = (userId: number): Role | undefined => findAccount(userId)?.role
