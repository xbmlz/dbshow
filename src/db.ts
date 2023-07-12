import { Sequelize } from 'sequelize'
import { Parser } from 'sql-ddl-to-json-schema'
import { compile } from 'json-schema-to-typescript'
import type { JSONSchema4 } from 'json-schema'
import type { ColumnInfo, DBInfo, DBOption, TableInfo } from './types'
import { getColumnSql, getDBSql, getTableDDLSql, getTableSql } from './sql'
import { toInterfaceName } from './utils'

export async function getDBInfo(opt: DBOption): Promise<DBInfo> {
  const sequelize = new Sequelize({
    dialect: opt.dbType,
    host: opt.host,
    port: Number(opt.port),
    username: opt.user,
    password: opt.pwd,
    database: opt.database,
    logging: false,
  })
  try {
    await sequelize.authenticate()
  }
  catch (error) {
    console.error('Unable to connect to the database!')
    process.exit(1)
  }
  // find db info
  const db = await sequelize.query(getDBSql(opt), {
    plain: true,
  }) as unknown as DBInfo

  // find table info
  const [tables] = await sequelize.query(getTableSql(opt)) as TableInfo[]

  if (!Array.isArray(tables)) {
    console.error('Unable to get table info!')
    process.exit(1)
  }
  for (const table of tables) {
    // find table ddl
    const ddl = await sequelize.query(getTableDDLSql(opt, table.tableName), {
      plain: true,
    })
    table.tableDDL = ddl && ddl['Create Table']
    const js = getTableJsonSchema(table.tableDDL)
    if (js.length > 0) {
      table.jsonSchema = JSON.stringify(js[0], null, 2)
      table.tsInterface = await getTableTsInterface(js[0], table.tableName)
    }
    // find column info
    const [columns] = await sequelize.query(getColumnSql(opt, table.tableName)) as ColumnInfo[]
    if (!Array.isArray(columns)) {
      console.error('Unable to get column info!')
      process.exit(1)
    }
    table.columns = columns
  }
  db.tables = tables
  return db
}

function getTableJsonSchema(ddl: string): JSONSchema4[] {
  if (!ddl)
    return []
  try {
    const parser = new Parser()
    const options = { useRef: false }
    parser.feed(`${ddl};`)
    const parsedJsonFormat = parser.results
    const compactJsonTablesArray = parser.toCompactJson(parsedJsonFormat)
    const jsonSchemaDocuments = parser.toJsonSchemaArray(options, compactJsonTablesArray)
    return jsonSchemaDocuments as JSONSchema4[]
  }
  catch (error) {
    return []
  }
}

async function getTableTsInterface(js: JSONSchema4, tableName: string): Promise<string> {
  try {
    const ts = await compile(js, toInterfaceName(tableName), {
      additionalProperties: false,
    })
    return ts
  }
  catch (error) {
    return ''
  }
}
