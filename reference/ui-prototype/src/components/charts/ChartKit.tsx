import { useState, type ReactNode } from 'react'
import { ChartColumn, Table2 } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { useI18n } from '@/i18n'
import type { LoadStatus } from '@/lib/sample'
import { ErrorState, Panel, Skeleton } from '@/components/ui'

const chartColors = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)']

export interface Series {
  key: string
  label: string
  color?: string
}

type Row = Record<string, string | number>

const axisTick = { fill: 'var(--color-ink-500)', fontSize: 12, fontFamily: 'inherit' }

function ChartTooltip({ active, payload, label, format }: TooltipContentProps<number, string> & { format?: (value: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-control border border-ink-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium text-ink-900">{label}</p>
      <ul className="flex flex-col gap-0.5">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-600">
              <span className="size-2 rounded-full" style={{ background: item.color }} aria-hidden />
              {item.name}
            </span>
            <span className="tabular font-medium text-ink-900">{format ? format(Number(item.value)) : formatNumber(Number(item.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChartLegend({ series }: { series: Series[] }) {
  if (series.length < 2) return null
  return (
    <ul className="flex flex-wrap items-center gap-2 text-sm text-ink-700">
      {series.map((item, index) => (
        <li key={item.key} className="flex items-center gap-2 rounded-full bg-ink-50 px-3 py-1">
          <span className="size-2.5 rounded-full" style={{ background: item.color ?? chartColors[index] }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

interface ChartProps {
  data: Row[]
  xKey: string
  series: Series[]
  height?: number
  format?: (value: number) => string
  stacked?: boolean
}

export function BarsChart({ data, xKey, series, height = 240, format, stacked }: ChartProps) {
  const { isRtl } = useI18n()
  return (
    <div style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={2} barCategoryGap="28%">
          <defs>
            {series.map((item, index) => (
              <linearGradient key={item.key} id={`bar-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.color ?? chartColors[index]} stopOpacity={1} />
                <stop offset="100%" stopColor={item.color ?? chartColors[index]} stopOpacity={0.72} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-chart-grid)" strokeDasharray="3 4" />
          <XAxis dataKey={xKey} reversed={isRtl} tick={axisTick} tickLine={false} axisLine={false} tickMargin={10} interval={0} />
          <YAxis orientation={isRtl ? 'right' : 'left'} tick={axisTick} tickLine={false} axisLine={false} width={44} tickFormatter={(value) => formatNumber(Number(value))} />
          <Tooltip content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} format={format} />} cursor={{ fill: 'var(--color-brand-50)' }} />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={`url(#bar-${item.key})`}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked ? (index === series.length - 1 ? [8, 8, 0, 0] : 0) : [8, 8, 0, 0]}
              stroke={stacked ? '#fff' : undefined}
              strokeWidth={stacked ? 2 : 0}
              maxBarSize={40}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface RankedItem {
  label: string
  value: number
  hint?: ReactNode
  href?: string
}

export function RankedBars({ items, format = formatNumber, max, color = 'var(--color-chart-1)' }: { items: RankedItem[]; format?: (value: number) => string; max?: number; color?: string }) {
  const top = max ?? Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-800">{item.label}</span>
            <span className="tabular shrink-0 font-medium text-ink-900">{format(item.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div className="h-full rounded-full" style={{ width: `${(item.value / top) * 100}%`, background: color }} />
          </div>
          {item.hint && <p className="mt-1 text-xs text-ink-500">{item.hint}</p>}
        </li>
      ))}
    </ul>
  )
}

export function SegmentedBar({ segments, label }: { segments: { label: string; value: number; color: string }[]; label: string }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0) || 1
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={label}>
        {segments
          .filter((item) => item.value > 0)
          .map((item) => (
            <div key={item.label} style={{ width: `${(item.value / total) * 100}%`, background: item.color }} title={`${item.label}: ${item.value}`} />
          ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-4">
        {segments.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-ink-600">
              <span className="size-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden />
              {item.label}
            </span>
            <span className="tabular font-medium text-ink-900">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

interface ChartPanelProps {
  title: string
  description?: string
  status?: LoadStatus
  onRetry?: () => void
  empty?: boolean
  series?: Series[]
  table?: { columns: string[]; rows: (string | number)[][] }
  actions?: ReactNode
  className?: string
  height?: number
  children: ReactNode
}

export function ChartPanel({ title, description, status = 'ready', onRetry, empty, series, table, actions, className, height = 240, children }: ChartPanelProps) {
  const { t } = useI18n()
  const [asTable, setAsTable] = useState(false)
  let body: ReactNode
  if (status === 'loading') {
    body = (
      <div className="flex items-end gap-2" style={{ height }} role="status" aria-label={t('state.chartLoading')}>
        {[45, 70, 55, 85, 60, 75, 50].map((value, index) => (
          <div key={index} className="flex-1" style={{ height: `${value}%` }}>
            <Skeleton className="size-full rounded-b-none" />
          </div>
        ))}
      </div>
    )
  } else if (status === 'error') {
    body = <ErrorState compact onRetry={onRetry} title={t('state.chartError')} />
  } else if (empty) {
    body = (
      <div className="grid place-items-center text-center text-base text-ink-500" style={{ height }}>
        <p>{t('state.chartEmpty')}</p>
      </div>
    )
  } else if (asTable && table) {
    body = (
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-ink-200 text-ink-500">
              {table.columns.map((column) => (
                <th key={column} scope="col" className="px-3 py-2.5 text-start font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {table.rows.map((row, index) => (
              <tr key={index} className="even:bg-ink-600/[0.035] hover:bg-brand-600/[0.08] hover:even:bg-brand-600/[0.08]">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={cn('px-3 py-2 text-ink-800', cellIndex > 0 && 'tabular')}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  } else {
    body = children
  }

  return (
    <Panel
      className={className}
      title={title}
      description={description}
      actions={
        <>
          {actions}
          {table && status === 'ready' && !empty && (
            <button
              type="button"
              onClick={() => setAsTable((value) => !value)}
              aria-pressed={asTable}
              className="inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-sm text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            >
              {asTable ? <ChartColumn className="size-4" strokeWidth={1.75} /> : <Table2 className="size-4" strokeWidth={1.75} />}
              {asTable ? t('state.asChart') : t('state.asTable')}
            </button>
          )}
        </>
      }
    >
      {series && series.length > 1 && status === 'ready' && !empty && !asTable && (
        <div className="mb-3">
          <ChartLegend series={series} />
        </div>
      )}
      {body}
    </Panel>
  )
}
