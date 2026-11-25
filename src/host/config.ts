import { existsSync, readFileSync } from 'node:fs'
import { homedir, userInfo } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import z from '@deepseek-ai/schemastery'
import { CLOUD_API_BASE_URL, type ConnectionSettings } from '../contracts/index.js'
import { normalizeServerOrigin } from './account/server.js'

export interface YunworkBridgeContract {
  readonly runtimeType: string
  readonly serverUrl?: string
  readonly webUrl?: string
  readonly productName?: string
  readonly shortName?: string
}

function probeYunworkContract(): YunworkBridgeContract | undefined {
  const candidates = [
    process.env['YUNWORK_RUNTIME'],
    typeof process.resourcesPath === 'string' ? join(process.resourcesPath, 'yunwork-runtime.json') : undefined,
    typeof process.resourcesPath === 'string' ? join(process.resourcesPath, 'app.asar.unpacked', 'yunwork-runtime.json') : undefined,
    join(dirname(process.execPath), 'resources', 'yunwork-runtime.json'),
  ].filter((p): p is string => typeof p === 'string' && p.trim() !== '')

  let parsed: Record<string, unknown> | undefined
  for (const file of candidates) {
    if (!existsSync(file)) continue
    try {
      const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown
      if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
        parsed = raw as Record<string, unknown>
        break
      }
    } catch {
      // Ignore unreadable candidate and continue probing.
    }
  }

  const runtimeType = process.env['YUNWORK_ANYWHERE_RUNTIME_TYPE']?.trim()
    || (typeof parsed?.['anywhereRuntimeType'] === 'string' ? parsed['anywhereRuntimeType'].trim() : '')
    || (parsed !== undefined ? 'yunwork' : '')
  const serverUrl = process.env['YUNWORK_ANYWHERE_SERVER_URL']?.trim()
    || (typeof parsed?.['anywhereServerUrl'] === 'string' ? parsed['anywhereServerUrl'].trim() : '')
  const webUrl = process.env['YUNWORK_ANYWHERE_WEB_URL']?.trim()
    || (typeof parsed?.['anywhereWebUrl'] === 'string' ? parsed['anywhereWebUrl'].trim() : '')
  const productName = typeof parsed?.['productName'] === 'string' ? parsed['productName'].trim() : undefined
  const shortName = typeof parsed?.['shortName'] === 'string' ? parsed['shortName'].trim() : undefined

  if (parsed === undefined && runtimeType === '' && serverUrl === '' && webUrl === '') return undefined
  return {
    runtimeType: runtimeType || 'yunwork',
    ...(serverUrl !== '' ? { serverUrl } : {}),
    ...(webUrl !== '' ? { webUrl } : {}),
    ...(productName !== undefined && productName !== '' ? { productName } : {}),
    ...(shortName !== undefined && shortName !== '' ? { shortName } : {}),
  }
}

export interface Config {
  dshHome?: string
  apiBaseUrl?: string
  stateRoot?: string
  connectorSourceDir?: string
  uvPath?: string
}

export const Config: z<Config> = z.object({
  dshHome: z.string(),
  apiBaseUrl: z.string(),
  stateRoot: z.string(),
  connectorSourceDir: z.string(),
  uvPath: z.string(),
})

export interface ResolvedConfig extends ConnectionSettings {
  dshHome?: string
  stateRoot: string
  legacyStateRoot?: string
  connectorSourceDir: string
  uvPath: string
  runtimeType: string
  anywhereWebUrl?: string
  productName?: string
  shortName?: string
}

export function stateRoot(config: Config): string {
  if (config.stateRoot !== undefined) return config.stateRoot
  const dshHome = config.dshHome ?? process.env['DSH_HOME']
  if (probeYunworkContract() !== undefined && typeof dshHome === 'string' && dshHome.trim() !== '' && isAbsolute(dshHome)) {
    return join(dshHome, 'anywhere', 'dsh-bridge-next')
  }
  return join(userInfo().homedir, '.agents-anywhere', 'dsh-bridge-next')
}

/** Fixed per-user rendezvous with the Connector; isolated under DSH_HOME when branded. */
export function bridgeDirectory(dshHome?: string): string {
  const home = dshHome ?? process.env['DSH_HOME']
  if (probeYunworkContract() !== undefined && typeof home === 'string' && home.trim() !== '' && isAbsolute(home)) {
    return join(home, 'anywhere', 'dsh-bridge')
  }
  return join(userInfo().homedir, '.agents-anywhere', 'dsh-bridge')
}

/**
 * Where plugins before 2.0.3 published the endpoint. Connectors before 2.0.3 look only here, so
 * the bridge mirrors its endpoint to this directory; it is resolved exactly as those plugins did.
 */
export function legacyBridgeDirectory(config: Config): string | undefined {
  const home = config.dshHome ?? process.env['DSH_HOME'] ?? join(homedir(), '.dsh')
  return isAbsolute(home) ? join(home, 'agents-anywhere', 'bridge') : undefined
}

export function resolveConfig(config: Config): ResolvedConfig {
  if (config.dshHome !== undefined && !isAbsolute(config.dshHome)) throw new Error('DSH_HOME 必须是绝对路径。')
  const contract = probeYunworkContract()
  const root = stateRoot(config)
  const connectorSourceDir = config.connectorSourceDir ?? fileURLToPath(new URL('./bundled-connector/', import.meta.url))
  if (!isAbsolute(root) || !isAbsolute(connectorSourceDir)) throw new Error('数据目录和 Connector 源码目录必须是绝对路径。')
  return {
    ...(config.dshHome !== undefined ? { dshHome: config.dshHome } : {}),
    stateRoot: root,
    ...(config.stateRoot === undefined ? { legacyStateRoot: join(userInfo().homedir, '.agentsanywhere', 'dsh-bridge-next') } : {}),
    connectorSourceDir,
    apiBaseUrl: normalizeServerOrigin(config.apiBaseUrl ?? contract?.serverUrl ?? CLOUD_API_BASE_URL),
    uvPath: config.uvPath ?? process.env['UV_PATH'] ?? 'uv',
    runtimeType: contract?.runtimeType ?? 'yunwork',
    anywhereWebUrl: contract?.webUrl ?? CLOUD_API_BASE_URL,
    productName: contract?.productName ?? '云大师 Agent',
    shortName: contract?.shortName ?? '云大师',
  }
}
