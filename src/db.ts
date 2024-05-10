import { Sequelize } from 'sequelize'
import { Parser } from 'sql-ddl-to-json-schema'
import type { JSONSchema4 } from 'json-schema'
import type { ColumnInfo, DBInfo, DBOption, TableInfo } from './types'
import { getColumnSql, getDBSql, getTableDDLSql, getTableSql } from './sql'
import { quicktypeJSONSchema } from './utils'

export async function getDBInfo(opt: DBOption): Promise<DBInfo> {
  const sequelize = new Sequelize({
    dialect: opt.dbType,
    host: opt.host,
    port: Number(opt.port),
    username: opt.user,
    password: opt.pwd,
    database: opt.database,
    logging: false,
    dialectOptions: {
      connectString: opt.connectString || undefined,
    },
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
      const { lines: tsLines } = await quicktypeJSONSchema('TypeScript', table.tableName, table.jsonSchema, {
        'just-types': true,
      })
      table.tsModel = tsLines.join('\n')
      const { lines: goLines } = await quicktypeJSONSchema('Go', table.tableName, table.jsonSchema, {
        'just-types': true,
      })
      table.goModel = goLines.join('\n')
      const { lines: javaLines } = await quicktypeJSONSchema('Java', table.tableName, table.jsonSchema, {
        'just-types': true,
        'lombok': true,
      })
      table.javaModel = javaLines.join('\n')
      const { lines: rustLines } = await quicktypeJSONSchema('Rust', table.tableName, table.jsonSchema, {
        'just-types': true,
        'leading-comments': false,
      })
      table.rustModel = rustLines.join('\n')
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
  sequelize.close()
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
