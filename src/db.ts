import { Sequelize } from 'sequelize'
import type { ColumnInfo, DBInfo, DBOption, TableInfo } from './types'
import { getColumnSql, getDBSql, getTableDDLSql, getTableSql } from './sql'

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
  const db = await sequelize.query(getDBSql(opt.dbType), {
    replacements: [opt.database],
    plain: true,
  }) as unknown as DBInfo

  const [tables] = await sequelize.query(getTableSql(opt.dbType), {
    replacements: [opt.database],
  }) as TableInfo[]

  if (!Array.isArray(tables)) {
    console.error('Unable to get table info!')
    process.exit(1)
  }
  for (const table of tables) {
    const ddl = await sequelize.query(getTableDDLSql(opt, table.tableName), {
      plain: true,
    })
    table.tableDDL = ddl && ddl['Create Table']
    const [columns] = await sequelize.query(getColumnSql(opt.dbType), {
      replacements: [opt.database, table.tableName],
    }) as ColumnInfo[]
    if (!Array.isArray(columns)) {
      console.error('Unable to get column info!')
      process.exit(1)
    }
    table.columns = columns
  }
  db.tables = tables
  return db
}
