import { useState } from 'react'
import { Users } from 'lucide-react'
import { useI18n } from '@/i18n'
import { TODAY } from '@/lib/dates'
import { Badge, Button, ButtonLink, DataTable, EmptyState, FileDrop, PageHeader, Panel, Progress, useToast } from '@/components/ui'
import { useViewer } from '@/app/viewer-context'
import { downloadFile, randomPassword, setPassword } from '@/features/auth/credentials'
import { logActivity } from '@/features/settings/data'
import { bump } from '@/store/collections'
import type { EmploymentType } from '@/types/entities'
import { departments, savePerson, users } from './data'

const columns = ['first_name', 'last_name', 'email', 'phone_number', 'department', 'position', 'hire_date', 'basic_salary', 'employment_type'] as const
const types: EmploymentType[] = ['full_time', 'part_time', 'contract']

interface ParsedRow {
  line: number
  values: Record<(typeof columns)[number], string>
  errors: string[]
}

type Outcome = { email: string; password: string } | { error: string }

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const source = text.replace(/^﻿/, '')
  for (let i = 0; i < source.length; i++) {
    const char = source[i]!
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"'
        i++
      } else if (char === '"') quoted = false
      else cell += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(cell)
      cell = ''
      if (row.some((value) => value.trim())) rows.push(row)
      row = []
    } else cell += char
  }
  row.push(cell)
  if (row.some((value) => value.trim())) rows.push(row)
  return rows
}

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

export function EmployeeImportPage() {
  const { t } = useI18n()
  const toast = useToast()
  const { userId: actor } = useViewer()
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [fileError, setFileError] = useState('')
  const [progress, setProgress] = useState<number | null>(null)
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({})
  const [exported, setExported] = useState(false)

  const template = () => downloadFile('employees-template.csv', `${columns.join(',')}\nSara,Ali,sara.ali@example.com,0599000000,${csvCell(departments[0]?.department_name ?? '')},Accountant,${TODAY},3500,full_time\n`)

  const read = async (next: File | null) => {
    setFile(next)
    setRows(null)
    setOutcomes({})
    setProgress(null)
    setExported(false)
    setFileError('')
    if (!next) return
    const table = parseCsv(await next.text())
    const header = (table[0] ?? []).map((value) => value.trim())
    if (!columns.every((name) => header.includes(name))) {
      setFileError(t('em.imp.badHeader'))
      return
    }
    const seen = new Set(users.map((user) => user.email.toLowerCase()))
    const parsed = table.slice(1).map((cells, index): ParsedRow => {
      const values = Object.fromEntries(columns.map((name) => [name, (cells[header.indexOf(name)] ?? '').trim()])) as ParsedRow['values']
      const errors: string[] = []
      if (!values.first_name || values.first_name.length > 100) errors.push(t('em.imp.err.first'))
      if (!values.last_name || values.last_name.length > 100) errors.push(t('em.imp.err.last'))
      if (!/^\S+@\S+\.\S+$/.test(values.email)) errors.push(t('k.invalidEmail'))
      else if (seen.has(values.email.toLowerCase())) errors.push(t('em.form.emailTaken'))
      else seen.add(values.email.toLowerCase())
      if (!departments.some((item) => item.department_name === values.department)) errors.push(t('em.imp.err.department'))
      if (!values.position || values.position.length > 100) errors.push(t('em.imp.err.position'))
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.hire_date)) errors.push(t('em.imp.err.hire'))
      if (values.basic_salary === '' || !(Number(values.basic_salary) >= 0)) errors.push(t('k.invalidNumber'))
      if (!types.includes(values.employment_type as EmploymentType)) errors.push(t('em.imp.err.type'))
      return { line: index + 2, values, errors }
    })
    setRows(parsed)
  }

  const valid = rows?.filter((row) => row.errors.length === 0) ?? []
  const created = Object.values(outcomes).filter((item): item is { email: string; password: string } => 'password' in item)

  const run = async () => {
    const done: Record<number, Outcome> = {}
    setProgress(0)
    for (const [index, row] of valid.entries()) {
      await new Promise((resolve) => window.setTimeout(resolve, 140))
      const department = departments.find((item) => item.department_name === row.values.department)!
      try {
        const id = savePerson({ first: row.values.first_name, last: row.values.last_name, email: row.values.email, phone: row.values.phone_number, role: 'employee', department: department.department_id, reportsTo: department.manager_id, position: row.values.position, hire: row.values.hire_date, type: row.values.employment_type as EmploymentType, salary: Number(row.values.basic_salary) })
        const password = randomPassword()
        setPassword(id, password, true)
        logActivity(actor, 'create', 'employees', id, 'POST', '/employees')
        done[row.line] = { email: row.values.email, password }
      } catch {
        done[row.line] = { error: t('em.imp.err.failed') }
      }
      setOutcomes({ ...done })
      setProgress(Math.round(((index + 1) / valid.length) * 100))
    }
    bump('people')
    toast.success(t('em.imp.finished', { n: Object.values(done).filter((item) => 'password' in item).length }))
  }

  const exportSheet = () => {
    downloadFile('temporary-passwords.csv', `email,temporary_password\n${created.map((item) => `${csvCell(item.email)},${csvCell(item.password)}`).join('\n')}\n`)
    setExported(true)
  }

  return (
    <div>
      <PageHeader title={t('em.imp.title')} actions={<><Button variant="secondary" onClick={template}>{t('em.imp.template')}</Button><ButtonLink to="/employees" variant="secondary">{t('k.backToList')}</ButtonLink></>} />
      <Panel className="mb-6" title={t('em.imp.upload')}>
        <FileDrop file={file} onChange={(next) => void read(next)} accept=".csv" hint={t('em.imp.hint', { columns: columns.join(', ') })} error={fileError} onError={(message) => setFileError(message ?? "")} />
      </Panel>
      {rows && (
        <Panel title={t('em.imp.preview')} description={t('em.imp.summary', { ok: valid.length, bad: rows.length - valid.length })} flush actions={progress === null && valid.length > 0 ? <Button onClick={() => void run()}>{t('em.imp.run', { n: valid.length })}</Button> : undefined}>
          {rows.length === 0 ? (
            <EmptyState compact icon={Users} title={t('em.imp.empty')} />
          ) : (
            <DataTable
              rows={rows}
              rowKey={(row) => row.line}
              caption={t('em.imp.preview')}
              columns={[
                { key: 'line', header: '#', cell: (row) => <span className="tabular text-ink-500">{row.line}</span> },
                { key: 'name', header: t('k.employee'), mobile: 'primary', cell: (row) => `${row.values.first_name} ${row.values.last_name}` },
                { key: 'email', header: t('k.email'), cell: (row) => <span dir="ltr">{row.values.email}</span> },
                { key: 'dept', header: t('k.department'), mobile: 'hidden', cell: (row) => row.values.department },
                {
                  key: 'state',
                  header: t('k.status'),
                  mobile: 'aside',
                  cell: (row) => {
                    const outcome = outcomes[row.line]
                    if (row.errors.length) return <span className="text-sm text-danger">{row.errors.join(' · ')}</span>
                    if (!outcome) return <Badge tone="neutral">{t('em.imp.ready')}</Badge>
                    return 'error' in outcome ? <span className="text-sm text-danger">{outcome.error}</span> : <Badge tone="success" dot>{t('em.imp.created')}</Badge>
                  },
                },
              ]}
            />
          )}
          {progress !== null && (
            <div className="border-t border-ink-100 p-5">
              <Progress value={progress} showValue label={t('em.imp.progress')} tone={progress === 100 ? 'success' : 'brand'} />
              {progress === 100 && created.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button onClick={exportSheet} disabled={exported}>{t('em.imp.export')}</Button>
                  <p className="text-sm text-warning">{t('em.imp.warn')}</p>
                </div>
              )}
            </div>
          )}
        </Panel>
      )}
    </div>
  )
}
