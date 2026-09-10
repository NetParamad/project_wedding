'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hexToHsl, hslToString, getForegroundLightness } from '@/lib/color'

export const COLOR_THEMES = [
  { value: 'zinc', swatch: 'bg-zinc-500', swatches: ['bg-zinc-500', 'bg-zinc-400', 'bg-zinc-300'] },
  { value: 'rose', swatch: 'bg-rose-500', swatches: ['bg-rose-500', 'bg-rose-400', 'bg-rose-300'] },
  { value: 'blue', swatch: 'bg-blue-500', swatches: ['bg-blue-500', 'bg-blue-400', 'bg-blue-300'] },
  { value: 'green', swatch: 'bg-green-600', swatches: ['bg-green-600', 'bg-green-500', 'bg-green-400'] },
  { value: 'orange', swatch: 'bg-orange-500', swatches: ['bg-orange-500', 'bg-orange-400', 'bg-orange-300'] },
  { value: 'violet', swatch: 'bg-violet-500', swatches: ['bg-violet-500', 'bg-violet-400', 'bg-violet-300'] },
  { value: 'custom', swatch: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500', swatches: ['bg-gray-400', 'bg-gray-300', 'bg-gray-200'] },
] as const

export type ColorTheme = (typeof COLOR_THEMES)[number]['value']

interface ColorThemeContextType {
  theme: ColorTheme
  customColor: string
  setCustomColor: (hex: string) => void
  setTheme: (t: ColorTheme, customHex?: string) => void
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  theme: 'zinc',
  customColor: '#18181b',
  setCustomColor: () => {},
  setTheme: () => {},
})

export function useColorTheme() {
  return useContext(ColorThemeContext)
}

function clearCustomVariables() {
  const root = document.documentElement
  root.style.removeProperty('--primary')
  root.style.removeProperty('--primary-foreground')
  root.style.removeProperty('--ring')
}

function applyCustomVariables(hex: string) {
  const root = document.documentElement
  const { h, s, l } = hexToHsl(hex)
  const fg = getForegroundLightness(l)

  const hsl = hslToString(h, s, l)
  const fgHsl = hslToString(h, s, fg)

  root.style.setProperty('--primary', hsl)
  root.style.setProperty('--primary-foreground', fgHsl)
  root.style.setProperty('--ring', hsl)
}

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ColorTheme>('zinc')
  const [customColor, setCustomColorState] = useState('#18181b')
  const [, setMounted] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const cachedTheme = localStorage.getItem('color-theme')
      const cachedColor = localStorage.getItem('color-theme-custom')

      if (cachedTheme === 'custom' && cachedColor) {
        setThemeState('custom')
        setCustomColorState(cachedColor)
        document.documentElement.setAttribute('data-color-theme', 'custom')
        applyCustomVariables(cachedColor)
      } else if (cachedTheme && COLOR_THEMES.some(t => t.value === cachedTheme)) {
        setThemeState(cachedTheme as ColorTheme)
        clearCustomVariables()
        document.documentElement.setAttribute('data-color-theme', cachedTheme)
      }

      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('store_settings')
          .select('theme, theme_custom_color')
          .eq('id', 1)
          .single()

        if (data) {
          if (data.theme === 'custom' && data.theme_custom_color) {
            setThemeState('custom')
            setCustomColorState(data.theme_custom_color)
            document.documentElement.setAttribute('data-color-theme', 'custom')
            applyCustomVariables(data.theme_custom_color)
            localStorage.setItem('color-theme', 'custom')
            localStorage.setItem('color-theme-custom', data.theme_custom_color)
          } else if (data.theme && COLOR_THEMES.some(t => t.value === data.theme)) {
            setThemeState(data.theme as ColorTheme)
            clearCustomVariables()
            document.documentElement.setAttribute('data-color-theme', data.theme)
            localStorage.setItem('color-theme', data.theme)
            localStorage.removeItem('color-theme-custom')
          }
        }
      } catch {}
    }

    fetch()
    setMounted(true)
  }, [])

  function setTheme(newTheme: ColorTheme, customHex?: string) {
    setThemeState(newTheme)

    if (newTheme === 'custom') {
      const hex = customHex || customColor
      setCustomColorState(hex)
      document.documentElement.setAttribute('data-color-theme', 'custom')
      applyCustomVariables(hex)
      localStorage.setItem('color-theme', 'custom')
      localStorage.setItem('color-theme-custom', hex)
    } else {
      clearCustomVariables()
      document.documentElement.setAttribute('data-color-theme', newTheme)
      localStorage.setItem('color-theme', newTheme)
      localStorage.removeItem('color-theme-custom')
    }
  }

  function setCustomColor(hex: string) {
    setCustomColorState(hex)
    if (theme === 'custom') {
      applyCustomVariables(hex)
      localStorage.setItem('color-theme-custom', hex)
    }
  }

  return (
    <ColorThemeContext.Provider value={{ theme, customColor, setCustomColor, setTheme }}>
      {children}
    </ColorThemeContext.Provider>
  )
}
