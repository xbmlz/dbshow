import type { DBOption, DBType } from './types'

export const MYSQL_TABLE_SQL = `
SELECT TABLE_NAME                                 AS tableName,
    TABLE_COMMENT                                 AS tableComment,
    DATE_FORMAT(CREATE_TIME, '%Y-%m-%d %H:%i:%s') AS createTime,
    DATE_FORMAT(UPDATE_TIME, '%Y-%m-%d %H:%i:%s') AS updateTime
FROM INFORMATION_SCHEMA.TABLES
WHERE lower(table_type) = "base table" AND table_schema = ?
ORDER BY TABLE_NAME ASC;
`

export const MYSQL_COLUMN_SQL = `
SELECT ORDINAL_POSITION  AS ordinalPosition,
    COLUMN_NAME          AS columnName,
    COLUMN_TYPE          AS columnType,
    COLUMN_KEY           AS columnKey,
    COLUMN_DEFAULT       AS columnDefault,
    COLUMN_COMMENT       AS columnComment,
    IS_NULLABLE          AS isNullable
FROM information_schema.COLUMNS
WHERE table_schema = ? AND table_name = ?
ORDER BY ORDINAL_POSITION;
`

export const MYSQL_DB_SQL = `
SELECT SCHEMA_NAME             AS name,
    VERSION()                  AS version,
    DEFAULT_CHARACTER_SET_NAME AS charset,
    DEFAULT_COLLATION_NAME     AS collation
FROM INFORMATION_SCHEMA.SCHEMATA
WHERE SCHEMA_NAME = ?;
`

export const MYSQL_TABLE_DDL_SQL = 'SHOW CREATE TABLE'

export function getDBSql(dbType: DBType): string {
  switch (dbType) {
    case 'mysql':
      return MYSQL_DB_SQL
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}

export function getTableSql(dbType: DBType): string {
  switch (dbType) {
    case 'mysql':
      return MYSQL_TABLE_SQL
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}

export function getColumnSql(dbType: DBType): string {
  switch (dbType) {
    case 'mysql':
      return MYSQL_COLUMN_SQL
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}

export function getTableDDLSql(opt: DBOption, tableName: string): string {
  switch (opt.dbType) {
    case 'mysql':
      return `${MYSQL_TABLE_DDL_SQL} ${opt.database}.${tableName}`
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}
