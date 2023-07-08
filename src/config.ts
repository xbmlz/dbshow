import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import type { LocalConfig } from './types'

const configPath = path.join(os.homedir(), '.dbshow', 'config.json')

export async function readLocalConfig(): Promise<LocalConfig[]> {
  if (!fs.existsSync(configPath)) {
    await fs.promises.writeFile(configPath, '[]')
    return []
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
}

export async function writeLocalConfig(config: LocalConfig[]) {
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2))
}
