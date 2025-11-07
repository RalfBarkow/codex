import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { writeFileSync, unlinkSync } from 'node:fs'
import path from 'node:path'

const checker = path.resolve(process.cwd(), 'tools/journal-checker.mjs')
const tmpPage = path.resolve(process.cwd(), 'tests/tmp-missing-create.json')

writeFileSync(tmpPage, JSON.stringify({
  title: 'bad-page',
  story: [{ type: 'paragraph', id: 'a', text: 'hello' }],
  journal: [
    { type: 'add', id: 'a', item: { type: 'paragraph', id: 'a', text: 'hello' }, date: 123 }
  ]
}, null, 2))

let exitCode = 0
let output = ''
try {
  execFileSync('node', [checker, tmpPage], { stdio: 'pipe' })
} catch (error) {
  exitCode = error.status ?? 1
  output = error.stdout?.toString() ?? ''
}

try {
  assert.equal(exitCode, 2)
  assert.match(output, /creation/)
} finally {
  unlinkSync(tmpPage)
}
