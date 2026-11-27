const nodes: [number, number, number][] = [
  [90, 110, 5], [250, 60, 3.5], [420, 130, 6], [610, 70, 4], [730, 190, 5], [160, 290, 4], [340, 330, 7], [540, 300, 4.5],
  [700, 410, 3.5], [80, 480, 5], [260, 520, 4], [450, 560, 6], [640, 600, 4.5], [120, 720, 4], [330, 760, 5], [560, 800, 3.5], [730, 740, 5],
]
const links: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [2, 6], [6, 7], [3, 7], [7, 8], [4, 8], [5, 9], [9, 10], [6, 10], [10, 11], [7, 11], [11, 12], [8, 12], [9, 13], [13, 14], [10, 14], [14, 15], [11, 15], [15, 16], [12, 16],
]

export function Network({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const light = tone === 'light'
  return (
    <svg className="absolute inset-0 size-full" viewBox="0 0 800 880" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <radialGradient id="auth-glow" cx="0.7" cy="0.15" r="0.7">
          <stop stopColor="#5b93f0" stopOpacity="0.45" />
          <stop offset="1" stopColor="#5b93f0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="auth-glow2" cx="0.1" cy="0.95" r="0.6">
          <stop stopColor="#2f6bd8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#2f6bd8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {!light && <rect width="800" height="880" fill="url(#auth-glow)" />}
      {!light && <rect width="800" height="880" fill="url(#auth-glow2)" />}
      <g stroke={light ? '#2856bd' : '#bcd3f7'} strokeWidth="1" strokeLinecap="round">
        {links.map(([a, b], index) => (
          <line key={index} x1={nodes[a]![0]} y1={nodes[a]![1]} x2={nodes[b]![0]} y2={nodes[b]![1]} strokeOpacity={light ? 0.14 : 0.2} className="motion-safe:animate-[link-pulse_6s_ease-in-out_infinite]" style={{ animationDelay: `${(index % 7) * 0.8}s` }} />
        ))}
      </g>
      <g fill={light ? '#6a95e2' : '#e4eefd'}>
        {nodes.map(([x, y, r], index) => (
          <circle key={index} cx={x} cy={y} r={r} fillOpacity={light ? 0.3 + (index % 4) * 0.08 : 0.35 + (index % 4) * 0.12} className="motion-safe:animate-[node-drift_11s_ease-in-out_infinite]" style={{ animationDelay: `${index * -0.9}s` }} />
        ))}
      </g>
    </svg>
  )
}

