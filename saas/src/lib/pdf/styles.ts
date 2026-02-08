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
      marginBottom: 4,
    },
    sectionUnderline: {
      width: 40,
      height: 2,
      backgroundColor: c.accent,
      marginBottom: 16,
    },

    // Macro summary bar
    macroBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: '#f7fafc',
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
    },
    macroItem: {
      alignItems: 'center',
    },
    macroDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginBottom: 4,
    },
    macroValue: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: 700,
      color: '#1a202c',
    },
    macroLabel: {
      fontFamily: 'Inter',
      fontSize: 8,
      color: '#718096',
      fontWeight: 500,
    },

    // Day headers
    dayHeader: {
      backgroundColor: c.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginTop: 14,
      marginBottom: 6,
    },
    dayHeaderText: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 700,
      color: '#ffffff',
    },

    // Meal rows
    mealRow: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 2,
    },
    mealRowEven: {
      backgroundColor: '#f7fafc',
    },
    mealRowOdd: {
      backgroundColor: '#ffffff',
    },
    mealType: {
      width: '18%',
      fontFamily: 'Inter',
      fontSize: 9,
      fontWeight: 600,
      color: c.primary,
    },
    mealDescription: {
      width: '55%',
      fontFamily: 'Inter',
      fontSize: 9,
      color: '#2d3748',
    },
    mealMacros: {
      width: '27%',
      fontFamily: 'Inter',
      fontSize: 8,
      color: '#718096',
      textAlign: 'right',
    },

    // Recipe cards
    recipeCard: {
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
      marginBottom: 14,
      overflow: 'hidden',
    },
    recipeHeader: {
      backgroundColor: hexToRgba(c.primary, 0.06),
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    recipeName: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 700,
      color: c.primary,
    },
    recipeMeta: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    recipeMetaItem: {
      fontFamily: 'Inter',
      fontSize: 8,
      color: '#718096',
    },
    recipeBody: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    recipeSubheading: {
      fontFamily: 'Inter',
      fontSize: 9,
      fontWeight: 600,
      color: '#4a5568',
      marginBottom: 4,
      marginTop: 6,
    },
    ingredientItem: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: '#2d3748',
      marginBottom: 2,
      paddingLeft: 8,
    },
    instructionItem: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: '#2d3748',
      marginBottom: 3,
      paddingLeft: 8,
    },
    instructionNumber: {
      fontFamily: 'Inter',
      fontSize: 8,
      fontWeight: 600,
      color: c.accent,
      marginRight: 4,
    },

    // Shopping list
    shoppingCategory: {
      marginBottom: 10,
    },
    shoppingCategoryHeader: {
      fontFamily: 'Inter',
      fontSize: 11,
      fontWeight: 600,
      color: c.primary,
      marginBottom: 4,
      paddingBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: hexToRgba(c.accent, 0.3),
    },
    shoppingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    shoppingItemName: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: '#2d3748',
    },
    shoppingItemQty: {
      fontFamily: 'Inter',
      fontSize: 9,
      color: '#718096',
    },

    // Paragraphs (meal prep, tips)
    paragraph: {
      fontFamily: 'Inter',
      fontSize: 10,
      color: '#2d3748',
      lineHeight: 1.6,
      marginBottom: 6,
    },

    // Utility
    mb8: { marginBottom: 8 },
    mb16: { marginBottom: 16 },
  })
}
