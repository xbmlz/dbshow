import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import type { LocalConfig } from './types'
import { createDir } from './utils'

const configPath = path.join(os.homedir(), '.dbshow', 'config.json')

export async function readLocalConfig(): Promise<LocalConfig[]> {
  if (!fs.existsSync(configPath)) {
    createDir(path.dirname(configPath))
    await fs.promises.writeFile(configPath, '[]')
    return []
  }
  const data = await fs.promises.readFile(configPath, 'utf-8')
  // order by createTime(timestamp) desc
  return JSON.parse(data).sort((a: LocalConfig, b: LocalConfig) => b.createdTime - a.createdTime)
}

export async function writeLocalConfig(config: LocalConfig[]) {
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2))
}
