import { Fragment, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { LoadStatus } from '@/lib/sample'
import { DataTable, FilterBar, IconButton, MenuDivider, MenuItem, Pagination, Panel, Popover, SearchInput, Select, type Column } from '@/components/ui'
import type { CountNoun } from '@/lib/count'
import type { useList } from './useList'

type List<T> = ReturnType<typeof useList<T>>

interface ListPanelProps<T> {
  list: List<T>
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  rowHref?: (row: T) => string
  rowLabel?: (row: T) => string
  empty: ReactNode
  caption: string
  searchPlaceholder?: string
  toolbar?: ReactNode
  hideSearch?: boolean
  noun?: CountNoun
  markKey?: string | number
  flashMark?: boolean
}

export function ListPanel<T>({ list, columns, rowKey, rowHref, rowLabel, empty, caption, searchPlaceholder, toolbar, hideSearch, noun, markKey, flashMark }: ListPanelProps<T>) {
  return (
    <Panel flush>
      <FilterBar>
        {!hideSearch && <SearchInput value={list.q} onChange={list.setQ} placeholder={searchPlaceholder} className="sm:max-w-xs sm:flex-1" />}
        {list.filters.map((filter) => (
          <Select key={filter.key} aria-label={filter.label} value={list.values[filter.key] ?? ''} onChange={(event) => list.setValue(filter.key, event.target.value)} options={[{ value: '', label: filter.allLabel }, ...filter.options]} />
        ))}
        {toolbar}
      </FilterBar>
      <DataTable status={list.status as LoadStatus} onRetry={list.retry} rows={list.items} rowKey={rowKey} rowHref={rowHref} rowLabel={rowLabel} markKey={markKey} flashMark={flashMark} caption={caption} empty={empty} columns={columns} sort={list.sort} onSort={list.toggleSort} />
      {list.status === 'ready' && <Pagination page={list.page} limit={list.limit} total={list.total} onChange={list.setPage} noun={noun} />}
    </Panel>
  )
}

export interface RowAction {
  label: string
  to?: string
  onSelect?: () => void
  tone?: 'default' | 'danger'
}

export function RowActions({ actions, label }: { actions: RowAction[]; label?: string }) {
  const { t } = useI18n()
  const safe = actions.filter((action) => action.tone !== 'danger')
  const danger = actions.filter((action) => action.tone === 'danger')
  return (
    <Popover
      trigger={({ toggle, open, id }) => <IconButton icon={MoreHorizontal} label={label ?? t('k.more')} onClick={toggle} aria-expanded={open} aria-controls={id} />}
      className="p-1.5"
      minWidth={192}
    >
      {(close) => (
        <div role="menu">
          {[...safe, ...danger].map((action, index) => (
            <Fragment key={action.label}>
              {action.tone === 'danger' && index === safe.length && safe.length > 0 && <MenuDivider />}
              <MenuItem to={action.to} tone={action.tone} onSelect={() => { action.onSelect?.(); close() }}>
                {action.label}
              </MenuItem>
            </Fragment>
          ))}
        </div>
      )}
    </Popover>
  )
}
