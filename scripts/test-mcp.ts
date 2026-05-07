import { strict as assert } from 'node:assert'
import { listPages, readPage, searchDocs } from '../lib/mcp-tools'

let passed = 0
let failed = 0

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn()
    if (result instanceof Promise) {
      throw new Error('async tests not supported in this runner')
    }
    console.log(`  ok    ${name}`)
    passed++
  } catch (err) {
    console.log(`  FAIL  ${name}`)
    console.log(`        ${err instanceof Error ? err.message : err}`)
    failed++
  }
}

console.log('readPage')

test('rejects parent traversal', () => {
  assert.equal(readPage('../../package'), null)
})

test('rejects leading-slash traversal', () => {
  assert.equal(readPage('/../../package'), null)
})

test('rejects deeply nested traversal', () => {
  assert.equal(readPage('battlechain/../../../package'), null)
})

test('reads an existing page', () => {
  const page = readPage('battlechain/using-battlechain-with-ai')
  assert.ok(page, 'page should be found')
  assert.equal(page!.title, 'Using BattleChain with AI')
})

test('strips .mdx suffix from input', () => {
  const page = readPage('battlechain/using-battlechain-with-ai.mdx')
  assert.ok(page)
})

test('strips full URL prefix from input', () => {
  const page = readPage(
    'https://docs.battlechain.com/battlechain/using-battlechain-with-ai',
  )
  assert.ok(page)
})

test('returns null for non-existent page', () => {
  assert.equal(readPage('battlechain/does-not-exist'), null)
})

console.log('\nsearchDocs')

test('throws on empty query', () => {
  assert.throws(() => searchDocs(''), /Query must contain/)
})

test('throws on punctuation-only query', () => {
  assert.throws(() => searchDocs('!!!'), /Query must contain/)
})

test('throws on whitespace-only query', () => {
  assert.throws(() => searchDocs('   '), /Query must contain/)
})

test('throws on stopword-only query', () => {
  assert.throws(() => searchDocs('the'), /Query must contain/)
})

test('accepts single-letter terms (e.g. "C")', () => {
  const results = searchDocs('C')
  assert.ok(Array.isArray(results))
})

test('returns matches for real query', () => {
  const results = searchDocs('battlechain')
  assert.ok(Array.isArray(results))
  assert.ok(results.length > 0, 'expected at least one result')
  for (const r of results) {
    assert.ok(typeof r.title === 'string')
    assert.ok(typeof r.url === 'string')
    assert.ok(typeof r.snippet === 'string')
  }
})

test('snippet shows match context, not just the page intro', () => {
  const results = searchDocs('whitehat')
  if (results.length > 0) {
    const snippet = results[0].snippet.toLowerCase()
    assert.ok(
      snippet.includes('whitehat'),
      `expected snippet to include the matched term, got: ${results[0].snippet}`,
    )
  }
})

test('returns no matches for nonsense query', () => {
  const results = searchDocs('zzzzqqqq')
  assert.deepEqual(results, [])
})

console.log('\nlistPages')

test('returns array of pages with required fields', () => {
  const pages = listPages()
  assert.ok(Array.isArray(pages))
  assert.ok(pages.length > 0)
  for (const p of pages) {
    assert.ok(typeof p.title === 'string')
    assert.ok(typeof p.path === 'string')
    assert.ok(typeof p.url === 'string')
  }
})

console.log()
console.log(`${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
