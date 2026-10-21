#!/usr/bin/env node
import { spawnSync, spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const api = join(root, 'api')
const web = join(root, 'web')
const desktop = join(root, 'desktop')
const configFile = join(api, '.env.demo')
const action = process.argv[2]
const useExisting = process.argv.includes('--existing-db')
const withDesktop = process.argv.includes('--desktop')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function fail(message) { console.error(`Erro: ${message}`); process.exit(1) }
function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: process.platform === 'win32' })
  if (result.error || result.status !== 0) fail(`${command} ${args.join(' ')} falhou. ${result.error?.message || ''}`)
}
function parseEnv(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/).flatMap(line => {
    const match = line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/)
    return match ? [[match[1], match[2].replace(/^"|"$/g, '')]] : []
  }))
}
function envForDemo() {
  const saved = parseEnv(configFile)
  if (!saved.DATABASE_URL) fail('Execute primeiro: node scripts/demo.mjs setup')
  return { ...process.env, ...saved, DATABASE_URL: saved.DATABASE_URL, NEXT_PUBLIC_API_URL: 'http://localhost:3333', NEXT_PUBLIC_BASE_DOMAIN: 'localhost' }
}
function docker(env, args) { run('docker', ['compose', '-p', 'cartalog-presentation', '-f', 'compose.demo.yml', ...args], root, env) }
function dependency(dir) {
  if (!existsSync(join(dir, 'node_modules'))) run(npm, ['ci'], dir)
}
function newConfig(databaseUrl) {
  const dbPassword = randomBytes(24).toString('hex')
  return {
    CARTALOG_DEMO_DB_PASSWORD: dbPassword,
    DATABASE_URL: databaseUrl || `postgresql://cartalog:${dbPassword}@127.0.0.1:5434/cartalog_demo`,
    JWT_SECRET: randomBytes(48).toString('hex'),
    JWT_REFRESH_SECRET: randomBytes(48).toString('hex'),
    JWT_EXPIRES_IN: '15m', JWT_REFRESH_EXPIRES_IN: '7d',
    PORT: '3333', NODE_ENV: 'development', API_URL: 'http://localhost:3333',
    FRONTEND_URL: 'http://localhost:3000', BASE_DOMAIN: 'localhost',
    UPLOAD_DIR: './uploads', TRUST_PROXY: 'false'
  }
}

async function setup() {
  const existingUrl = useExisting ? (process.env.DATABASE_URL || parseEnv(join(api, '.env')).DATABASE_URL) : null
  if (useExisting && !existingUrl) fail('DATABASE_URL não encontrado no ambiente ou api/.env.')
  if (!existsSync(configFile)) {
    const values = newConfig(existingUrl)
    writeFileSync(configFile, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 })
  } else if (useExisting && parseEnv(configFile).DATABASE_URL !== existingUrl) {
    fail('api/.env.demo já aponta para outro banco. Revise esse arquivo antes de continuar.')
  }
  const env = envForDemo()
  if (!useExisting && env.DATABASE_URL.includes('127.0.0.1:5434/cartalog_demo')) docker(env, ['up', '-d', '--wait'])
  dependency(api)
  dependency(web)
  dependency(desktop)
  run(npm, ['run', 'db:generate'], api, env)
  run(npm, ['run', 'db:migrate:prod'], api, env)
  run(npm, ['run', 'db:seed', '--', '--reference-only'], api, env)

  const require = createRequire(join(api, 'package.json'))
  const { Pool } = require('pg')
  const pool = new Pool({ connectionString: env.DATABASE_URL })
  let count
  try {
    const result = await pool.query("SELECT count(*)::int AS count FROM platform_users WHERE role = 'PLATFORM_OWNER'")
    count = result.rows[0].count
  } finally { await pool.end() }
  if (!count) {
    if (!process.stdin.isTTY) fail('Primeiro owner pendente. Rode setup num terminal interativo para definir nome, e-mail e senha.')
    console.log('\nCrie agora o primeiro administrador global (senha digitada sem aparecer):')
    run(npm, ['run', 'platform:bootstrap'], api, env)
  }
  console.log('\nSetup concluído. Inicie com: node scripts/demo.mjs start --desktop')
}

function start() {
  const env = envForDemo()
  if (env.DATABASE_URL.includes('127.0.0.1:5434/cartalog_demo')) docker(env, ['up', '-d', '--wait'])
  const children = []
  const launch = (dir, args) => {
    const child = spawn(npm, args, { cwd: dir, env, stdio: 'inherit', shell: process.platform === 'win32' })
    children.push(child)
    child.on('exit', code => { if (code && code !== 0) console.error(`${dir} encerrou com código ${code}`) })
  }
  launch(api, ['run', 'dev'])
  launch(web, ['run', 'dev'])
  if (withDesktop) launch(desktop, ['run', 'dev'])
  const stop = () => { for (const child of children) child.kill(); process.exit() }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
  console.log('API: http://localhost:3333 | Web: http://localhost:3000')
}

if (action === 'setup') await setup()
else if (action === 'start') start()
else console.log('Uso: node scripts/demo.mjs setup [--existing-db] | start [--desktop]')
