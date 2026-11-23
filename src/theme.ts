import { createTheme, type MantineColorsTuple } from '@mantine/core'

const terracotta: MantineColorsTuple = [
  '#fdf1ec',
  '#f8e1d7',
  '#f0c0ab',
  '#e89d7c',
  '#e17f55',
  '#dd6c3c',
  '#db622f',
  '#c25222',
  '#ad481d',
  '#983c15',
]

export const theme = createTheme({
  primaryColor: 'terracotta',
  primaryShade: { light: 7, dark: 5 },
  colors: { terracotta },
  fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif",
  headings: {
    fontFamily: "'Atkinson Hyperlegible Next Variable', system-ui, -apple-system, sans-serif",
    fontWeight: '700',
  },
  fontSizes: {
    xs: '0.8125rem',
    sm: '0.9375rem',
    md: '1.0625rem',
    lg: '1.1875rem',
    xl: '1.375rem',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
})
