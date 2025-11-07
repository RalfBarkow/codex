#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import path from 'node:path'

function orderFromStory (story = []) {
  return story.map(item => (item && item.id) ? item.id : undefined)
}

function addAfter (story, afterId, item) {
  const ids = orderFromStory(story)
  const index = ids.indexOf(afterId) + 1
  story.splice(index, 0, item)
}

function removeId (story, id) {
  const ids = orderFromStory(story)
  const idx = ids.indexOf(id)
  if (idx !== -1) {
    story.splice(idx, 1)
  }
}

function applyAction (page, action) {
  if (!page.story) page.story = []
  switch (action.type) {
    case 'create':
      if (action.item?.title) page.title = action.item.title
      if (Array.isArray(action.item?.story)) page.story = action.item.story.slice()
      break
    case 'add':
      addAfter(page.story, action.after, action.item)
      break
    case 'edit': {
      const ids = orderFromStory(page.story)
      const idx = ids.indexOf(action.id)
      if (idx !== -1) {
        page.story.splice(idx, 1, action.item)
      } else {
        page.story.push(action.item)
      }
      break
    }
    case 'move': {
      const idx = action.order?.indexOf(action.id)
      if (idx === undefined || idx === -1) break
      const after = action.order[idx - 1]
      const ids = orderFromStory(page.story)
      const storyIndex = ids.indexOf(action.id)
      if (storyIndex === -1) break
      const item = page.story[storyIndex]
      removeId(page.story, action.id)
      addAfter(page.story, after, item)
      break
    }
    case 'remove':
      removeId(page.story, action.id)
      break
    default:
      break
  }
}

function revision ({ revIndex, journal = [], title }) {
  const revJournal = journal.slice(0, revIndex || journal.length)
  const revPage = { title, story: [] }
  for (const action of revJournal) {
    applyAction(revPage, action || {})
  }
  return revPage
}

function compareByDate (a = {}, b = {}) {
  if (!('date' in a) || !('date' in b)) return 0
  if (a.date < b.date) return -1
  if (a.date > b.date) return 1
  return 0
}

function checkJournal (page) {
  const issues = new Set()
  const story = page.story ?? []
  const journal = page.journal ?? []

  if (story.length && story.every(item => !item || !item.type)) {
    issues.add('nulls')
  }

  const storyBytes = JSON.stringify(story).length
  const journalBytes = JSON.stringify(journal).length
  if (storyBytes + journalBytes > 5_000_000) {
    issues.add('huge')
  }
  if (storyBytes > 5000 && journalBytes > 20 * storyBytes) {
    issues.add('bloated')
  }

  const needs = {
    create: ['type', 'item', 'date'],
    add: ['type', 'item', 'id', 'date'],
    edit: ['type', 'item', 'id', 'date'],
    move: ['type', 'order', 'id', 'date'],
    fork: ['type', 'date'],
    remove: ['type', 'id', 'date']
  }

  const hasFields = (action, fields) => fields.every(f => Object.prototype.hasOwnProperty.call(action, f))

  for (const action of journal) {
    const shape = needs[action?.type]
    if (!shape) continue
    if (!hasFields(action, shape)) {
      issues.add('malformed')
      break
    }
  }

  let chronError = false
  let lastDate = null
  for (const action of journal) {
    if (lastDate !== null && action?.date && lastDate > action.date) {
      issues.add('chronology')
      chronError = true
      break
    }
    if (action?.date) lastDate = action.date
  }

  const replayJournal = chronError ? [...journal].sort(compareByDate) : journal
  if (!replayJournal.length || replayJournal[0]?.type !== 'create') {
    issues.add('creation')
  }

  try {
    const revPage = revision({ revIndex: replayJournal.length, journal: replayJournal, title: page.title })
    const sameStory = JSON.stringify(revPage.story ?? []) === JSON.stringify(story)
    if (!sameStory) {
      issues.add('revision')
    }
  } catch (error) {
    issues.add('revision')
  }

  return issues
}

function usageAndExit () {
  console.error('Usage: journal-checker <page.json>')
  process.exit(1)
}

const [, , targetPath] = process.argv
if (!targetPath) {
  usageAndExit()
}

const resolvedPath = path.resolve(process.cwd(), targetPath)
let page
try {
  page = JSON.parse(readFileSync(resolvedPath, 'utf8'))
} catch (error) {
  console.error(`Failed to read ${resolvedPath}:`, error.message)
  process.exit(1)
}

const issues = checkJournal(page)
if (issues.size === 0) {
  console.log(`Journal Checker: no errors detected (${resolvedPath})`)
  process.exit(0)
} else {
  console.log(`Journal Checker found ${issues.size} issue(s) in ${resolvedPath}:`)
  for (const issue of issues) {
    console.log(`- ${issue}`)
  }
  process.exit(2)
}
