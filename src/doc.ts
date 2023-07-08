/* eslint-disable no-console */
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import http from 'node:http'
import { getDBInfo } from './db'
import type { DBInfo, DBOption, TableInfo } from './types'
import { convertLineBreaks, createDir, writeFile } from './utils'
import { docsifyIndexRaw } from './data'

export async function createDoc(opt: DBOption): Promise<string> {
  const db = await getDBInfo(opt)
  const docPath = path.join(os.homedir(), '.dbshow', db.name)
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
  console.log(`Database doc created at ${docPath}`)
  return docPath
}

function buildReadme(db: DBInfo): string {
  let readme = `
  # ${db.name}\n\n

  ## Overview\n\n

  | Name | Version | Charset | Collation |
  | --- | --- | --- | --- |
  | ${db.name} | ${db.version} | ${db.charset} | ${db.collation} |\n\n

  ## Tables\n\n

  | Name | Comment | Create Time | Update Time |
  | --- | --- | --- | --- |
  `
  for (const table of db.tables)
    readme += `| ${table.tableName} | ${convertLineBreaks(table.tableComment)} | ${table.createTime} | ${table.updateTime} |\n`
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
  server.listen(port, host, () => {
    console.log(`Datebase doc server running at http://127.0.0.1:${port}, press Ctrl+C to stop.`)
  })
}
