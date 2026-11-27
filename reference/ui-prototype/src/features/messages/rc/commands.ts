import type { TKey } from '@/i18n'

export interface SlashCommand {
  name: string
  hint: TKey
  arg?: boolean
}

export const slashCommands: SlashCommand[] = [
  { name: 'shrug', hint: 'rc.cmd.shrug' },
  { name: 'tableflip', hint: 'rc.cmd.tableflip' },
  { name: 'unflip', hint: 'rc.cmd.unflip' },
  { name: 'lennyface', hint: 'rc.cmd.lenny' },
  { name: 'me', hint: 'rc.cmd.me', arg: true },
  { name: 'topic', hint: 'rc.cmd.topic', arg: true },
  { name: 'invite', hint: 'rc.cmd.invite', arg: true },
  { name: 'join', hint: 'rc.cmd.join', arg: true },
  { name: 'leave', hint: 'rc.cmd.leave' },
]

