import { confirm, input, select } from '@inquirer/prompts'
import pkg from '../package.json'
import { dbList } from './data'
import { createDoc, runDocServer } from './doc'
import type { DBOption, DBType } from './types'
import { renderGradientString } from './utils'
import { readLocalConfig, writeLocalConfig } from './config'

async function main() {
  console.log(`\n${renderGradientString(`Welcome to the DB Show! v${pkg.version}`)}\n`)

  // read config from local
  let useLocal = false
  let opt: DBOption
  const config = await readLocalConfig()
  if (config.length > 0) {
    useLocal = await confirm({
      message: 'Use config from local?',
      default: true,
    })
  }
  if (useLocal) {
    const key = await select({
      message: 'Select a local config',
      choices: config.map((c) => {
        return {
          name: c.key,
          value: c.key,
        }
      }),
    })
    const c = config.find(c => c.key === key)
    if (!c)
      console.error('Config not found!')
    opt = {
      dbType: c!.dbType,
      host: c!.host,
      port: c!.port,
      user: c!.user,
      pwd: c!.pwd,
      database: c!.database,
    }
  }
  else {
    const dbType = await select({
      message: 'Select a database type',
      choices: dbList.map((db) => {
        return {
          name: db.name,
          value: db.value,
        }
      }),
    }) as DBType

    const host = await input({
      message: 'Enter the host name',
      default: 'localhost',
    })

    const port = await input({
      message: 'Enter the port number',
      validate: (input) => {
        const port = Number(input)
        if (!port || Number.isNaN(port) || port < 0 || port > 65535)
          return 'Please enter a valid port number!'
        return true
      },
      default: dbList.find(db => db.value === dbType)?.defaultPort || '',
    })

    const user = await input({
      message: 'Enter the user name',
      default: dbList.find(db => db.value === dbType)?.defaultUser || '',
    })

    const pwd = await input({
      message: 'Enter the password',
    })

    const database = await input({
      message: 'Enter the database name',
      validate: (input) => {
        if (!input)
          return 'Please enter the database name!'
        return true
      },
    })
    opt = {
      dbType,
      host,
      port,
      user,
      pwd,
      database,
    }
  }

  // create doc
  const docPath = await createDoc(opt)
  // confirm save config
  if (!useLocal) {
    const saveConfig = await confirm({
      message: 'Save config to local?',
      default: true,
    })
    if (saveConfig) {
      const key = await input({
        message: 'Enter a key to save',
        validate: (input) => {
          if (!input)
            return 'Please enter a key!'
          if (config.find(c => c.key === input))
            return 'Key already exists!'
          return true
        },
        default: `${opt.dbType}-${opt.host}-${opt.port}-${opt.database}`,
      })
      config.push({
        key,
        ...opt,
      })
      await writeLocalConfig(config)
    }
  }

  // run http server
  await runDocServer(docPath, 3000)
}

main()
