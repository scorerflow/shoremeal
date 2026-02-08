import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import type { ParsedPlan } from '@/types'
import { createStyles, type BrandColours } from './styles'

interface PlanDocumentProps {
  plan: ParsedPlan
  clientName: string
  trainerName: string
  businessName: string
  colours: BrandColours
  createdAt: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Cover Page ──────────────────────────────────────────────

function CoverPage({ clientName, trainerName, businessName, colours, createdAt }: Omit<PlanDocumentProps, 'plan'>) {
  const s = createStyles(colours)
  return (
    <Page size="A4" style={{ padding: 0 }}>
      <View style={s.coverPage}>
        <Text style={s.coverTitle}>Nutrition Plan</Text>
        <Text style={s.coverSubtitle}>Prepared for {clientName}</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverMeta}>{formatDate(createdAt)}</Text>
        <Text style={s.coverMeta}>Created by {trainerName}</Text>
        <Text style={s.coverBrand}>{businessName}</Text>
        <Text style={s.coverConfidential}>Confidential — for client use only</Text>
      </View>
    </Page>
  )
}

// ── Page Layout (header + footer) ───────────────────────────

function PageLayout({ children, trainerName, colours }: { children: React.ReactNode; trainerName: string; colours: BrandColours }) {
  const s = createStyles(colours)
  return (
    <Page size="A4" style={s.page} wrap>
      <View style={s.header} fixed>
        <Text style={s.headerText}>{trainerName}</Text>
        <Text style={s.headerText}>Nutrition Plan</Text>
      </View>
      {children}
      <View style={s.footer} fixed>
        <Text style={s.footerText}>Confidential</Text>
        <Text style={s.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </Page>
  )
}

// ── Section Header ──────────────────────────────────────────

function SectionHeader({ title, colours }: { title: string; colours: BrandColours }) {
  const s = createStyles(colours)
  return (
    <View style={s.mb8}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionUnderline} />
    </View>
  )
}

// ── Nutritional Analysis ────────────────────────────────────

function NutritionalAnalysisContent({ plan, colours }: { plan: ParsedPlan; colours: BrandColours }) {
  const s = createStyles(colours)
  const na = plan.nutritionalAnalysis
  if (!na) return null

  const macros = [
    { label: 'Calories', value: na.calories, colour: '#e53e3e' },
    { label: 'Protein', value: na.protein, colour: '#3182ce' },
    { label: 'Carbs', value: na.carbs, colour: '#38a169' },
    { label: 'Fats', value: na.fats, colour: '#d69e2e' },
  ]

  return (
    <View>
      <View style={s.macroBar}>
        {macros.map((m) => (
          <View key={m.label} style={s.macroItem}>
            <View style={[s.macroDot, { backgroundColor: m.colour }]} />
            <Text style={s.macroValue}>{m.value || '—'}</Text>
            <Text style={s.macroLabel}>{m.label}</Text>
          </View>
        ))}
      </View>
      {na.paragraphs.map((p, i) => (
        <Text key={i} style={s.paragraph}>{p}</Text>
      ))}
    </View>
  )
}

// ── Meal Plan ───────────────────────────────────────────────

function MealPlanContent({ plan, colours }: { plan: ParsedPlan; colours: BrandColours }) {
  const s = createStyles(colours)
  if (plan.mealPlan.length === 0) return null

  return (
    <View>
      {plan.mealPlan.map((day) => (
        <View key={day.dayLabel} wrap={false}>
          <View style={s.dayHeader}>
            <Text style={s.dayHeaderText}>{day.dayLabel}</Text>
          </View>
          {day.meals.map((meal, j) => (
            <View key={j} style={[s.mealRow, j % 2 === 0 ? s.mealRowEven : s.mealRowOdd]}>
              <Text style={s.mealType}>{meal.type}</Text>
              <Text style={s.mealDescription}>{meal.description}</Text>
              <Text style={s.mealMacros}>{meal.macros}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

// ── Recipes ─────────────────────────────────────────────────

function RecipesContent({ plan, colours }: { plan: ParsedPlan; colours: BrandColours }) {
  const s = createStyles(colours)
  if (plan.recipes.length === 0) return null

  return (
    <View>
      {plan.recipes.map((recipe, i) => (
        <View key={i} style={s.recipeCard} wrap={false}>
          <View style={s.recipeHeader}>
            <Text style={s.recipeName}>{recipe.name}</Text>
            <View style={s.recipeMeta}>
              {recipe.prepTime && <Text style={s.recipeMetaItem}>Prep: {recipe.prepTime}</Text>}
              {recipe.cookTime && <Text style={s.recipeMetaItem}>Cook: {recipe.cookTime}</Text>}
              {recipe.calories && <Text style={s.recipeMetaItem}>{recipe.calories} kcal</Text>}
              {recipe.protein && <Text style={s.recipeMetaItem}>P: {recipe.protein}</Text>}
              {recipe.carbs && <Text style={s.recipeMetaItem}>C: {recipe.carbs}</Text>}
              {recipe.fats && <Text style={s.recipeMetaItem}>F: {recipe.fats}</Text>}
            </View>
          </View>
          <View style={s.recipeBody}>
            {recipe.ingredients.length > 0 && (
              <View>
                <Text style={s.recipeSubheading}>Ingredients</Text>
                {recipe.ingredients.map((ing, j) => (
                  <Text key={j} style={s.ingredientItem}>• {ing}</Text>
                ))}
              </View>
            )}
            {recipe.instructions.length > 0 && (
              <View>
                <Text style={s.recipeSubheading}>Instructions</Text>
                {recipe.instructions.map((step, j) => (
                  <View key={j} style={{ flexDirection: 'row', marginBottom: 3 }}>
                    <Text style={s.instructionNumber}>{j + 1}.</Text>
                    <Text style={s.instructionItem}>{step}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

// ── Shopping List ───────────────────────────────────────────

function ShoppingListContent({ plan, colours }: { plan: ParsedPlan; colours: BrandColours }) {
  const s = createStyles(colours)
  if (plan.shoppingList.length === 0) return null

  return (
    <View>
      {plan.shoppingList.map((cat, i) => (
        <View key={i} style={s.shoppingCategory}>
          <Text style={s.shoppingCategoryHeader}>{cat.category}</Text>
          {cat.items.map((item, j) => (
            <View key={j} style={s.shoppingItem}>
              <Text style={s.shoppingItemName}>{item.name}</Text>
              <Text style={s.shoppingItemQty}>{item.quantity}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

// ── Meal Prep Guide ─────────────────────────────────────────

function MealPrepGuideContent({ plan, colours }: { plan: ParsedPlan; colours: BrandColours }) {
  const s = createStyles(colours)
  if (plan.mealPrepGuide.length === 0) return null

  return (
    <View>
      {plan.mealPrepGuide.map((p, i) => (
        <Text key={i} style={s.paragraph}>{p}</Text>
      ))}
    </View>
  )
}

// ── Additional Tips ─────────────────────────────────────────

function AdditionalTipsContent({ plan, colours }: { plan: ParsedPlan; colours: BrandColours }) {
  const s = createStyles(colours)
  if (plan.additionalTips.length === 0) return null

  return (
    <View>
      {plan.additionalTips.map((p, i) => (
        <Text key={i} style={s.paragraph}>{p}</Text>
      ))}
    </View>
  )
}

// ── Main Document ───────────────────────────────────────────

export function NutritionPlanDocument(props: PlanDocumentProps) {
  const { plan, clientName, trainerName, businessName, colours, createdAt } = props

  const sections: { title: string; content: React.ReactNode }[] = [
    {
      title: 'Nutritional Analysis',
      content: <NutritionalAnalysisContent plan={plan} colours={colours} />,
    },
    {
      title: 'Meal Plan',
      content: <MealPlanContent plan={plan} colours={colours} />,
    },
    {
      title: 'Recipes',
      content: <RecipesContent plan={plan} colours={colours} />,
    },
    {
      title: 'Shopping List',
      content: <ShoppingListContent plan={plan} colours={colours} />,
    },
    {
      title: 'Meal Prep Guide',
      content: <MealPrepGuideContent plan={plan} colours={colours} />,
    },
    {
      title: 'Additional Tips & Advice',
      content: <AdditionalTipsContent plan={plan} colours={colours} />,
    },
  ]

  return (
    <Document
      title={`Nutrition Plan — ${clientName}`}
      author={businessName || trainerName}
      subject="Personalised Nutrition Plan"
    >
      <CoverPage
        clientName={clientName}
        trainerName={trainerName}
        businessName={businessName}
        colours={colours}
        createdAt={createdAt}
      />
      {sections.map((section) => (
        <PageLayout key={section.title} trainerName={trainerName} colours={colours}>
          <SectionHeader title={section.title} colours={colours} />
          {section.content}
        </PageLayout>
      ))}
    </Document>
  )
}
