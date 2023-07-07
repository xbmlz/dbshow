/* eslint-disable no-console */
import { input, select } from '@inquirer/prompts'
import { bannerText } from './data'

async function main() {
  console.log(`\n${bannerText}\n`)

  const _dbType = await select({
    message: 'Select a database type',
    choices: [
      {
        name: 'MySQL(MariaDB)',
        value: 'mysql',
      },
      {
        name: 'PostgreSQL',
        value: 'postgres',
      },
      {
        name: 'Microsoft SQL Server',
        value: 'mssql',
      },
    ],
  })

  const _host = await input({
    message: 'Enter the host name',
    default: 'localhost',
  })

  console.log('\nThis project is currently under development ^-^. \n')
}

main()
