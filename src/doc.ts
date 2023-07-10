/* eslint-disable no-console */
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import http from 'node:http'
import { getDBInfo } from './db'
import type { DBInfo, DBOption, TableInfo } from './types'
import { convertLineBreaks, createDir, getLocalIPv4Addresses, renderGradientString, writeFile } from './utils'
import { docsifyIndexRaw } from './data'

export async function createDoc(opt: DBOption): Promise<string> {
  const db = await getDBInfo(opt)
  const docPath = path.join(os.homedir(), '.dbshow', opt.dbType, opt.host, opt.database)
  await createDir(docPath)
  // docsify index.html
  await writeFile(path.join(docPath, 'index.html'), docsifyIndexRaw)
  // docsify README.md
  await writeFile(path.join(docPath, 'README.md'), buildReadme(db))
  // docsify _sidebar.md
  await writeFile(path.join(docPath, '_sidebar.md'), buildSideBar(db))
  // docsify tables
  for (const table of db.tables)
    writeFile(path.join(docPath, `${table.tableName}.md`), buildTableInfo(table))
  // console.log(`Database doc created at ${docPath}`)
  return docPath
}

function buildReadme(db: DBInfo): string {
  let readme = `
  # ${db.name}\n\n

  ## Database\n\n

  | Name | Version | Charset | Collation |
  | --- | --- | --- | --- |
  | ${db.name} | ${db.version} | ${db.charset} | ${db.collation} |\n\n

  ## Tables\n\n

  | No | Name | Comment | Create Time | Update Time |
  | --- | --- | --- | --- | --- |
  `
  for (const [index, table] of db.tables.entries()) {
    const tableLink = `<a href="/#/${table.tableName}">${table.tableName}</a>`
    readme += `| ${index + 1} | ${tableLink} | ${convertLineBreaks(table.tableComment)} | ${table.createTime} | ${table.updateTime} |\n`
  }
  return readme
}

function buildSideBar(db: DBInfo): string {
  /**
   * - Tables
   *  - [table1](table1.md)
   *  - [table2](table2.md)
   */
  let sidebar = '* Tables\n'
  if (db.tables.length === 0)
    sidebar += '  * No tables'
  for (const table of db.tables) {
    let name = table.tableName
    if (table.tableComment)
      name += ` - ${table.tableComment}`
    sidebar += `  * [${name}](${table.tableName}.md)\n`
  }
  return sidebar
}

function buildTableInfo(table: TableInfo): string {
  let tableInfo = `# ${table.tableName}`
  if (table.tableComment)
    tableInfo += ` - ${table.tableComment}`
  tableInfo += '\n\n'
  tableInfo += '## Structure\n\n'
  tableInfo += '| Name | Type | Key | Default | Nullable | Comment |\n'
  tableInfo += '| --- | --- | --- | --- | --- | --- |\n'
  for (const column of table.columns)
    tableInfo += `| ${column.columnName} | ${column.columnType} | ${column.columnKey} | ${column.columnDefault} | ${column.isNullable} | ${convertLineBreaks(column.columnComment)} |\n`
  tableInfo += '\n## DDL\n\n'
  tableInfo += '```sql\n'
  tableInfo += `${table.tableDDL}\n`
  tableInfo += '```\n'
  // if (table.jsonSchema) {
  //   tableInfo += '\n## JSON Schema\n\n'
  //   tableInfo += '```json\n'
  //   tableInfo += `${table.jsonSchema}\n`
  //   tableInfo += '```\n'
  // }
  if (table.tsInterface) {
    tableInfo += '\n## TypeScript Interface\n\n'
    tableInfo += '```typescript\n'
    tableInfo += `${table.tsInterface}\n`
    tableInfo += '```\n'
  }
  return tableInfo
}

export async function runDocServer(docPath: string, port: number) {
  const server = http.createServer((req, res) => {
    let filePath = path.join(docPath, req.url!)
    if (req.url === '/')
      filePath = path.join(docPath, 'index.html')
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.write('Not Found')
        res.end()
        return
      }
      fs.createReadStream(filePath).pipe(res)
    })
  })
  const host = '0.0.0.0'
  let networkUrl = `    \n\nDatebase doc server is ready.\n\n ➜  Local: http://localhost:${port}\n`
  for (const url of getLocalIPv4Addresses())
    networkUrl += ` ➜  Network: http://${url}:${port}\n`
  server.listen(port, host, () => {
    console.log(renderGradientString(networkUrl))
  })
}
