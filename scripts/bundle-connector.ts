import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const SOURCE = join(ROOT, 'bundled-connector')
const TARGET = join(ROOT, 'lib', 'bundled-connector')

if (!existsSync(SOURCE)) {
  throw new Error(`Missing bundled-connector directory at ${SOURCE}`)
}

rmSync(TARGET, { recursive: true, force: true })
mkdirSync(join(ROOT, 'lib'), { recursive: true })
cpSync(SOURCE, TARGET, { recursive: true })
process.stdout.write(`Copied bundled-connector -> ${TARGET}\n`)
