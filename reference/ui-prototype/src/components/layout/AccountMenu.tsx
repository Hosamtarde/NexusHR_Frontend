import { useState } from 'react'
import { useNavigate } from 'react-router'
import { KeyRound, LogOut, Network, UserRound } from 'lucide-react'
import { cn } from '@/lib/cn'
import { roleLabels } from '@/lib/labels'
import { useI18n } from '@/i18n'
import { useViewer } from '@/app/viewer-context'
import { Avatar, ConfirmDialog, MenuDivider, MenuItem, Popover } from '@/components/ui'

type Variant = 'sidebar' | 'rail'

export function AccountMenu({ variant }: { variant: Variant }) {
  const { t } = useI18n()
  const { user, row, role, signOut } = useViewer()
  const navigate = useNavigate()
  const [confirm, setConfirm] = useState(false)
  const name = `${user.first_name} ${user.last_name}`

  return (
    <>
      <Popover
        placement="top"
        align="start"
        className="w-64 p-1.5"
        trigger={({ toggle, open, id }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-controls={id}
              aria-label={t('top.userMenu')}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors duration-150 hover:bg-white/10',
                variant === 'rail' && 'justify-center p-1.5',
              )}
            >
              <span className="relative shrink-0">
                <Avatar src={user.profile_image} firstName={user.first_name} size="sm" className="ring-2 ring-white/40" />
                <span className="absolute -end-0.5 -bottom-0.5 size-3 rounded-full bg-success ring-2 ring-side-900" aria-hidden />
              </span>
              {variant === 'sidebar' && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-sm font-medium text-white">{name}</span>
                  <span className="block truncate text-xs text-white/60">{roleLabels[role].label}</span>
                </span>
              )}
            </button>
        )}
      >
        {(close) => (
          <div role="menu">
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <Avatar src={user.profile_image} firstName={user.first_name} size="md" />
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{name}</p>
                <p className="truncate text-sm text-ink-500">{row.profile.position}</p>
              </div>
            </div>
            <MenuDivider />
            <MenuItem icon={UserRound} to="/account/profile" onSelect={close}>
              {t('nav.profile')}
            </MenuItem>
            <MenuItem icon={KeyRound} to="/account/password" onSelect={close}>
              {t('nav.password')}
            </MenuItem>
            <MenuItem icon={Network} to="/org-chart/me" onSelect={close}>
              {t('top.myOrgPosition')}
            </MenuItem>
            <MenuDivider />
            <MenuItem
              icon={LogOut}
              tone="danger"
              onSelect={() => {
                close()
                setConfirm(true)
              }}
            >
              {t('top.signOut')}
            </MenuItem>
          </div>
        )}
      </Popover>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          signOut()
          navigate('/')
        }}
        title={t('top.signOutTitle')}
        description={t('top.signOutDesc')}
        confirmLabel={t('top.signOut')}
        tone="danger"
      />
    </>
  )
}
