import { forwardRef, type ButtonHTMLAttributes, type ComponentType, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'dangerOutline'
export type ButtonSize = 'sm' | 'md' | 'lg'

type IconType = ComponentType<{ className?: string; strokeWidth?: number; 'aria-hidden'?: boolean }>

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-[0_1px_2px_rgb(15_35_80/0.2),inset_0_1px_0_rgb(255_255_255/0.14)] hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300 disabled:shadow-none',
  secondary:
    'bg-white text-ink-800 border border-ink-200 shadow-sm hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100 disabled:text-ink-400',
  ghost: 'text-ink-700 hover:bg-ink-100 active:bg-ink-200 disabled:text-ink-400',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:text-brand-300',
  dangerOutline: 'border border-danger-border bg-white text-danger hover:bg-danger-bg active:bg-danger-bg disabled:opacity-50',
  danger: 'bg-danger text-white shadow-sm hover:bg-danger-hover disabled:opacity-50',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-10 px-4 text-base gap-2',
  lg: 'h-11 px-5 text-md gap-2',
}

const iconSizes: Record<ButtonSize, string> = { sm: 'size-4', md: 'size-[18px]', lg: 'size-5' }

function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-150 select-none active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
    variants[variant],
    sizes[size],
    className,
  )
}

interface ContentProps {
  icon?: IconType
  iconEnd?: IconType
  size: ButtonSize
  loading?: boolean
  children?: ReactNode
}

function Content({ icon: Icon, iconEnd: IconEnd, size, loading, children }: ContentProps) {
  return (
    <>
      {loading ? (
        <Spinner className={iconSizes[size]} />
      ) : Icon ? (
        <Icon className={iconSizes[size]} strokeWidth={1.75} aria-hidden />
      ) : null}
      {children}
      {IconEnd && <IconEnd className={iconSizes[size]} strokeWidth={1.75} aria-hidden />}
    </>
  )
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconType
  iconEnd?: IconType
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconEnd, loading, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...rest}
    >
      <Content icon={icon} iconEnd={iconEnd} size={size} loading={loading}>
        {children}
      </Content>
    </button>
  )
})

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconType
  iconEnd?: IconType
}

export function ButtonLink({ variant = 'primary', size = 'md', icon, iconEnd, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, typeof className === 'string' ? className : undefined)} {...rest}>
      <Content icon={icon} iconEnd={iconEnd} size={size}>
        {children as ReactNode}
      </Content>
    </Link>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconType
  label: string
  variant?: 'ghost' | 'secondary'
  size?: 'sm' | 'md'
  badge?: number
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: Icon, label, variant = 'ghost', size = 'md', badge, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-control text-ink-600 transition-[color,background-color,transform] duration-150 hover:text-ink-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'ghost' ? 'hover:bg-ink-100 active:bg-ink-200' : 'border border-ink-200 bg-white shadow-sm hover:bg-ink-50',
        size === 'sm' ? 'size-8' : 'size-9',
        className,
      )}
      {...rest}
    >
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} strokeWidth={1.75} aria-hidden />
      {badge != null && badge > 0 && (
        <span className="tabular absolute -top-0.5 -end-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-brand-600 px-1 text-xs font-semibold leading-none text-white ring-2 ring-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
})
