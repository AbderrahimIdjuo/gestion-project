'use client'

import { createContext, useContext, useState } from 'react'
import type { ThemeColors } from '@/lib/colors'
import { defaultColors } from '@/lib/colors'

type ThemeContextType = {
  colors: ThemeColors
  setColors: (colors: ThemeColors) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [colors, setColors] = useState<ThemeColors>(defaultColors)

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      <div className={`theme-${colors.primary}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

