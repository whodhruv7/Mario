export type SubjectId = 'history' | 'geography' | 'civics' | 'economics' | 'entrepreneurship'

export interface SubjectMeta {
  id: SubjectId
  name: string
  tagline: string
  icon: string // lucide icon name key used by SetupScreen
  color: string
  soft: string
}

export const SUBJECTS: SubjectMeta[] = [
  { id: 'history', name: 'History', tagline: 'Empires, heroes & timelines', icon: 'landmark', color: '#B45309', soft: '#FEF3C7' },
  { id: 'geography', name: 'Geography', tagline: 'Earth, oceans & skies', icon: 'globe', color: '#047857', soft: '#D1FAE5' },
  { id: 'civics', name: 'Civics', tagline: 'Democracy & governance', icon: 'scale', color: '#BE123C', soft: '#FFE4E6' },
  { id: 'economics', name: 'Economics', tagline: 'Money, markets & choices', icon: 'coins', color: '#C2410C', soft: '#FFEDD5' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', tagline: 'Ideas to startups', icon: 'rocket', color: '#6D28D9', soft: '#EDE9FE' },
]

export interface ChapterMeta {
  id: string
  subject: SubjectId
  part: 1 | 2
  label: string
  name: string
  short: string
}

export const CHAPTERS: ChapterMeta[] = [
  // Part 1 — "Exploring Society: India and Beyond" Grade 9
  { id: 'hist4', subject: 'history', part: 1, label: 'Ch 4', name: 'Early Humans and Beginning of Civilisation', short: 'Early Humans & Civilisation' },
  { id: 'hist5', subject: 'history', part: 1, label: 'Ch 5', name: 'State and Society up to 1000 CE', short: 'State & Society to 1000 CE' },
  { id: 'geo2', subject: 'geography', part: 1, label: 'Ch 2', name: "Shaping of the Earth's Surface", short: "Earth's Surface" },
  { id: 'geo3', subject: 'geography', part: 1, label: 'Ch 3', name: 'Atmosphere and Climate', short: 'Atmosphere & Climate' },
  { id: 'civ6', subject: 'civics', part: 1, label: 'Ch 6', name: 'Democracy', short: 'Democracy' },
  { id: 'civ7', subject: 'civics', part: 1, label: 'Ch 7', name: 'Elections', short: 'Elections' },
  { id: 'econ8', subject: 'economics', part: 1, label: 'Ch 8', name: 'Building Blocks in Economics: The Problem of Choice', short: 'The Problem of Choice' },
  { id: 'econ9', subject: 'economics', part: 1, label: 'Ch 9', name: 'The Price Puzzle: What Drives the Market', short: 'The Price Puzzle' },
  // Part 2
  { id: 'p2geo1', subject: 'geography', part: 2, label: 'Ch 1', name: 'Oceans and Life', short: 'Oceans & Life' },
  { id: 'p2geo2', subject: 'geography', part: 2, label: 'Ch 2', name: 'Life on Earth', short: 'Life on Earth' },
  { id: 'p2hist3', subject: 'history', part: 2, label: 'Ch 3', name: 'Resistance and Resilience (1000–1700 CE)', short: 'Resistance & Resilience' },
  { id: 'p2civ4', subject: 'civics', part: 2, label: 'Ch 4', name: 'Governance and Public Policy', short: 'Governance & Public Policy' },
  { id: 'p2econ5', subject: 'economics', part: 2, label: 'Ch 5', name: 'Managing Your Personal Finances', short: 'Personal Finances' },
  { id: 'p2ent6', subject: 'entrepreneurship', part: 2, label: 'Ch 6', name: 'From Ideas to Startups', short: 'Ideas to Startups' },
]

export const CHAPTERS_BY_SUBJECT = (s: SubjectId) => CHAPTERS.filter((c) => c.subject === s)

export const getChapter = (id: string) => CHAPTERS.find((c) => c.id === id)
