import fs from 'fs'
import path from 'path'
import { buildSearchIndex } from '../lib/search'

// Build and save search index
const index = buildSearchIndex()
const outputPath = path.join(process.cwd(), 'public', 'search-index.json')

// Ensure public directory exists
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
}

fs.writeFileSync(outputPath, JSON.stringify(index, null, 2))

console.log(`✓ Built search index with ${index.length} documents`)
console.log(`  Saved to: ${outputPath}`)
