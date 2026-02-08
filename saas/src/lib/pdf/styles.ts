import { StyleSheet } from '@react-pdf/renderer'

export interface BrandColours {
  primary: string
  secondary: string
  accent: string
}

const DEFAULT_COLOURS: BrandColours = {
  primary: '#1a365d',
  secondary: '#2d4a7a',
  accent: '#c9a84c',
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export function createStyles(colours?: Partial<BrandColours>) {
  const c: BrandColours = {
    primary: colours?.primary || DEFAULT_COLOURS.primary,
    secondary: colours?.secondary || DEFAULT_COLOURS.secondary,
    accent: colours?.accent || DEFAULT_COLOURS.accent,
  }

  return StyleSheet.create({
    // Page
    page: {
      fontFamily: 'Inter',
      fontSize: 10,
      color: '#1a202c',
      paddingTop: 60,
      paddingBottom: 50,
      paddingHorizontal: 40,
    },

    // Cover page
    coverPage: {
      backgroundColor: c.primary,
      paddingHorizontal: 50,
      paddingVertical: 0,
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
    },
    coverTitle: {
      fontFamily: 'Playfair Display',
      fontSize: 36,
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: 8,
      fontWeight: 700,
    },
    coverSubtitle: {
      fontFamily: 'Inter',
      fontSize: 14,
      color: hexToRgba('#ffffff', 0.85),
      textAlign: 'center',
      marginBottom: 24,
      fontWeight: 400,
    },
    coverDivider: {
      width: 60,
      height: 3,
      backgroundColor: c.accent,
      marginBottom: 24,
    },
    coverMeta: {
      fontFamily: 'Inter',
      fontSize: 11,
      color: hexToRgba('#ffffff', 0.7),
      textAlign: 'center',
      marginBottom: 4,
    },
    coverBrand: {
      fontFamily: 'Inter',
      fontSize: 12,
      color: '#ffffff',
      textAlign: 'center',
      fontWeight: 600,
      marginTop: 40,
    },
    coverConfidential: {
      fontFamily: 'Inter',
      fontSize: 8,
      color: hexToRgba('#ffffff', 0.5),
      textAlign: 'center',
      marginTop: 8,
    },

    // Header / footer
    header: {
      position: 'absolute',
      top: 20,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: '#e2e8f0',
    },
    headerText: {
      fontFamily: 'Inter',
      fontSize: 7,
      color: '#a0aec0',
      fontWeight: 500,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 40,
      right: 40,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: '#e2e8f0',
    },
    footerText: {
      fontFamily: 'Inter',
      fontSize: 7,
      color: '#a0aec0',
    },
    pageNumber: {
      fontFamily: 'Inter',
      fontSize: 7,
      color: '#a0aec0',
    },

    // Section headings
    sectionTitle: {
      fontFamily: 'Playfair Display',
      fontSize: 20,
      fontWeight: 700,
      color: c.primary,
      marginBottom: 6,
    },
    sectionUnderline: {
      width: 40,
      height: 2,
      backgroundColor: c.accent,
      marginBottom: 20,
    },

    // Subsection headings
    subsectionTitle: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 700,
      color: c.primary,
      marginTop: 14,
      marginBottom: 6,
    },
    subsectionHeading: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 600,
      color: c.secondary,
      marginTop: 10,
      marginBottom: 4,
    },

    // Paragraphs
    paragraph: {
      fontFamily: 'Inter',
      fontSize: 10,
      color: '#2d3748',
      lineHeight: 1.7,
      marginBottom: 8,
    },

    // Bullet points
    bulletRow: {
      flexDirection: 'row',
      paddingLeft: 12,
      marginBottom: 3,
    },
    bulletDot: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: c.accent,
      width: 12,
    },
    bulletText: {
      fontFamily: 'Inter',
      fontSize: 9.5,
      color: '#2d3748',
      flex: 1,
      lineHeight: 1.5,
    },

    // Divider
    divider: {
      height: 1,
      backgroundColor: '#e2e8f0',
      marginVertical: 12,
    },

    // Markdown table
    table: {
      marginVertical: 8,
      borderWidth: 0.5,
      borderColor: '#e2e8f0',
      borderRadius: 4,
      overflow: 'hidden',
    },
    tableHeaderRow: {
      flexDirection: 'row',
      backgroundColor: hexToRgba(c.primary, 0.08),
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      paddingVertical: 5,
      paddingHorizontal: 4,
    },
    tableHeaderCell: {
      fontFamily: 'Inter',
      fontSize: 8,
      fontWeight: 600,
      color: c.primary,
      paddingHorizontal: 4,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: '#f0f0f0',
    },
    tableRowEven: {
      backgroundColor: '#f7fafc',
    },
    tableRowOdd: {
      backgroundColor: '#ffffff',
    },
    tableCell: {
      fontFamily: 'Inter',
      fontSize: 8,
      color: '#2d3748',
      paddingHorizontal: 4,
    },
  })
}
