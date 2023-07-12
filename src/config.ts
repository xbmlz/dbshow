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
  // createdTime maybe undefined
  const config = JSON.parse(data) as LocalConfig[]
  config.sort((a, b) => (b.createdTime ?? 0) - (a.createdTime ?? 0))
  return config
}

export async function writeLocalConfig(config: LocalConfig[]) {
  await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2))
}
