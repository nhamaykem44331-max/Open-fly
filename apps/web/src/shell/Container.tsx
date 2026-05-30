import type { CSSProperties, ReactNode } from 'react'

// Desktop layout container — centered, max-width, 40px gutters.
export function Container({ children, max = 1200, style }: { children: ReactNode; max?: number; style?: CSSProperties }) {
  return (
    <div style={{ maxWidth: max, margin: '0 auto', padding: '0 40px', width: '100%', ...style }}>
      {children}
    </div>
  )
}
