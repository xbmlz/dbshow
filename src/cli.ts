import { input, select } from '@inquirer/prompts'
import { bannerText, dbList } from './data'
import { createDoc, runDocServer } from './doc'
import type { DBType } from './types'

async function main() {
  console.log(`\n${bannerText}\n`)

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

  // create doc
  const docPath = await createDoc({ dbType, host, port, user, pwd, database })
  // run http server
  await runDocServer(docPath, 3000)
}

main()
