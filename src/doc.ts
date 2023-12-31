/* eslint-disable no-console */
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'
import http from 'node:http'
import { getDBInfo } from './db'
import type { DBInfo, DBOption, TableInfo } from './types'
import { convertLineBreaks, createDir, getLocalIPv4Addresses, renderGradientString, writeFile } from './utils'
import { SITE_FAVICON } from './data'

export async function createDoc(opt: DBOption): Promise<string> {
  const db = await getDBInfo(opt)
  const docPath = path.join(os.homedir(), '.dbshow', opt.dbType, opt.host, opt.database)
  await createDir(docPath)
  // docsify index.html
  await writeFile(path.join(docPath, 'index.html'), buildDocsifyIndexRaw(opt))
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
  | ${db.name} | ${convertLineBreaks(db.version)} | ${db.charset} | ${db.collation} |\n\n

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
  if (table.tableDDL) {
    tableInfo += '\n## DDL\n\n'
    tableInfo += '```sql\n'
    tableInfo += `${table.tableDDL}\n`
    tableInfo += '```\n'
  }
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

export function buildDocsifyIndexRaw(opt: DBOption) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta charset="UTF-8">
  <link href="https://cdn.bootcdn.net/ajax/libs/docsify/4.13.0/themes/vue.min.css" rel="stylesheet">
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${btoa(SITE_FAVICON)}">
  <title>${opt.database} - DBShow</title>
</head>
<body>
<div id="app">加载中</div>
<script>
  window.$docsify = {
    loadSidebar: true,
    auto2top: true,
    search: {
      placeholder: '搜索',
      noData: '找不到结果',
    },
    name: '${opt.database} - DBShow',
    plugins: [
      function(hook, vm) {
        hook.beforeEach(function(content) {
          return (
            content +
            '\\n---\\n' +
            'Built with [DBShow](https://github.com/xbmlz/dbshow) and powered by [Docsify](https://docsify.js.org/#/)'
          )
        })
      }
    ]
  }
</script>
<script src="https://cdn.bootcdn.net/ajax/libs/docsify/4.13.0/docsify.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/docsify/4.13.0/plugins/search.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/docsify-copy-code/2.1.1/docsify-copy-code.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/prism/1.9.0/components/prism-sql.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/prism/1.9.0/components/prism-json.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/prism/1.9.0/components/prism-typescript.min.js"></script>
</body>
</html>
`
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
