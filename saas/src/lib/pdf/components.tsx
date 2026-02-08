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

// ── Text cleaning ───────────────────────────────────────────

/** Strip bold markers, emoji (corrupts in PDF fonts), and mojibake */
function cleanText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\uFE00-\uFE0F\u200D\u20E3]/g, '')
    .replace(/=€/g, '')
    .trim()
}

// ── Markdown table ──────────────────────────────────────────

function isTableRow(line: string): boolean {
  return /^\|.*\|$/.test(line.trim())
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim())
}

function MarkdownTable({ lines, colours }: { lines: string[]; colours: BrandColours }) {
  const s = createStyles(colours)
  const dataLines = lines.filter(l => !isTableSeparator(l))
  const rows = dataLines.map(l =>
    l.split('|').map(c => c.trim()).filter(c => c.length > 0)
  )
  if (rows.length === 0) return null

  const [header, ...dataRows] = rows
  const colCount = header.length

  return (
    <View style={s.table}>
      <View style={s.tableHeaderRow}>
        {header.map((cell, i) => (
          <View key={i} style={{ flex: 1 }}>
            <Text style={s.tableHeaderCell}>{cleanText(cell)}</Text>
          </View>
        ))}
      </View>
      {dataRows.map((row, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 ? s.tableRowEven : s.tableRowOdd]}>
          {Array.from({ length: colCount }, (_, j) => (
            <View key={j} style={{ flex: 1 }}>
              <Text style={s.tableCell}>{cleanText(row[j] || '')}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

// ── Rich line (single markdown line → styled element) ───────

function RichLine({ line, colours }: { line: string; colours: BrandColours }) {
  const s = createStyles(colours)
  const clean = cleanText(line)

  // Divider: --- or ___ or ***
  if (/^[-_*]{3,}$/.test(line)) {
    return <View style={s.divider} />
  }

  // ## or ### heading
  if (/^#{2,3}\s+/.test(line)) {
    return <Text style={s.subsectionHeading}>{cleanText(line.replace(/^#+\s+/, ''))}</Text>
  }

  // # heading
  if (/^#\s+/.test(line)) {
    return <Text style={s.subsectionTitle}>{cleanText(line.replace(/^#+\s+/, ''))}</Text>
  }

  // ALL CAPS line (e.g. "SUNDAY PREP SESSION")
  if (/^[A-Z][A-Z\s&:–-]{4,}$/.test(clean)) {
    return <Text style={s.subsectionTitle}>{clean}</Text>
  }

  // "Step N:" pattern
  if (/^step\s+\d+/i.test(clean)) {
    return <Text style={s.subsectionHeading}>{clean}</Text>
  }

  // Entire line is bold **Like This**
  if (/^\*\*[^*]+\*\*:?\s*$/.test(line)) {
    return <Text style={s.subsectionHeading}>{clean}</Text>
  }

  // Bullet: - or • followed by space
  const bulletMatch = line.match(/^[-•]\s+(.*)$/)
  if (bulletMatch) {
    return (
      <View style={s.bulletRow}>
        <Text style={s.bulletDot}>•</Text>
        <Text style={s.bulletText}>{cleanText(bulletMatch[1])}</Text>
      </View>
    )
  }

  // Numbered list: 1. or 1)
  const numberedMatch = line.match(/^\d+[.)]\s+(.*)$/)
  if (numberedMatch) {
    return (
      <View style={s.bulletRow}>
        <Text style={s.bulletDot}>•</Text>
        <Text style={s.bulletText}>{cleanText(numberedMatch[1])}</Text>
      </View>
    )
  }

  // Regular paragraph
  return <Text style={s.paragraph}>{clean}</Text>
}

// ── Rich content (handles tables + lines) ───────────────────

function RichContent({ lines, colours }: { lines: string[]; colours: BrandColours }) {
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    if (isTableRow(lines[i])) {
      const tableLines: string[] = []
      while (i < lines.length && (isTableRow(lines[i]) || isTableSeparator(lines[i]))) {
        tableLines.push(lines[i])
        i++
      }
      elements.push(<MarkdownTable key={`t-${i}`} lines={tableLines} colours={colours} />)
    } else {
      elements.push(<RichLine key={`l-${i}`} line={lines[i]} colours={colours} />)
      i++
    }
  }

  return <>{elements}</>
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
    <View>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.sectionUnderline} />
    </View>
  )
}

// ── Main Document ───────────────────────────────────────────

export function NutritionPlanDocument(props: PlanDocumentProps) {
  const { plan, clientName, trainerName, businessName, colours, createdAt } = props

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
      {plan.sections.map((section) => (
        <PageLayout key={section.title} trainerName={trainerName} colours={colours}>
          <SectionHeader title={section.title} colours={colours} />
          <RichContent lines={section.lines} colours={colours} />
        </PageLayout>
      ))}
    </Document>
  )
}
