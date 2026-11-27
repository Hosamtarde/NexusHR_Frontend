import { useI18n } from '@/i18n'

const T = 121
const M = 196
const B = 271
const W = 110
const step = 150
const start = 95

type Point = [number, number]
interface Letter {
  char: string
  d: string
  nodes: Point[]
  tone: 'dark' | 'light'
  amber?: Point
}

const letters: Letter[] = [
  { char: 'N', d: `M0 ${B}V${T}L${W} ${B}V${T}`, nodes: [[0, B], [0, T], [W, B], [W, T]], tone: 'dark' },
  { char: 'E', d: `M${W} ${T}H0V${B}H${W}M0 ${M}H85`, nodes: [[W, T], [0, T], [0, B], [W, B], [85, M]], tone: 'dark' },
  { char: 'X', d: `M0 ${T}L${W} ${B}M${W} ${T}L0 ${B}`, nodes: [[0, T], [W, T], [0, B], [W, B]], tone: 'dark', amber: [W / 2, M] },
  { char: 'U', d: `M0 ${T}V${B - 55}A55 55 0 0 0 ${W} ${B - 55}V${T}`, nodes: [[0, T], [W, T], [W / 2, B]], tone: 'dark' },
  { char: 'S', d: `M${W - 6} ${T + 26}C${W - 14} ${T - 8} 10 ${T - 8} 6 ${T + 40}C2 ${M - 4} ${W - 2} ${M + 4} ${W - 6} ${B - 40}C${W - 10} ${B + 8} 14 ${B + 8} 4 ${B - 26}`, nodes: [[W - 6, T + 26], [W / 2, M], [4, B - 26]], tone: 'dark' },
  { char: 'H', d: `M0 ${T}V${B}M0 ${M}H${W}M${W} ${T}V${B}`, nodes: [[0, T], [0, B], [0, M], [W, M], [W, T], [W, B]], tone: 'light' },
  { char: 'R', d: `M0 ${B}V${T}H65A37.5 37.5 0 0 1 65 ${M}H0M55 ${M}L${W} ${B}`, nodes: [[0, B], [0, T], [0, M], [W, B]], tone: 'light' },
]

const colors = { dark: '#1f4499', light: '#6a95e2' }
export function NameArt() {
  const { t } = useI18n()
  return (
    <div className="relative w-full max-w-[760px] px-4 sm:px-0">
      <div className="absolute bottom-[3.9%] left-1/2 h-0.5 w-screen -translate-x-1/2 bg-brand-700" aria-hidden />
      <svg viewBox="0 0 1200 282" role="img" aria-label="NexusHR" className="relative block h-auto w-full">
        <title>{t('lp.art')}</title>
        <defs>
          <filter id="hand" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018 0.026" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
        <g filter="url(#hand)">
          {letters.map((letter, index) => {
            const color = colors[letter.tone]
            return (
              <g key={letter.char} transform={`translate(${start + index * step} 0)`}>
                <path d={letter.d} pathLength={1} fill="none" stroke={color} strokeWidth={index % 2 === 0 ? 11 : 13} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1" className="motion-safe:animate-[nexus-draw_1300ms_ease-out_both]" style={{ animationDelay: `${index * 150}ms` }} />
                {letter.amber && <circle cx={letter.amber[0]} cy={letter.amber[1]} r="11" fill="#f5a524" />}
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
