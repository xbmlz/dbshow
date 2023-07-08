import type { Dialect } from 'sequelize'

export interface DB {
  name: string
  value: Dialect
  defaultPort: string
  defaultUser: string
}

export interface DBOption {
  dbType: Dialect
  host: string
  port: string
  user: string
  pwd: string
  database: string
}

export interface LocalConfig extends DBOption {
  key: string
}

export type DBType = Dialect

export interface ColumnInfo {
  ordinalPosition: number
  columnName: string
  columnType: string
  columnKey: string
  columnDefault: string
  columnComment: string
  isNullable: string
}

export interface TableInfo {
  tableName: string
  tableComment: string
  tableDDL: string
  createTime: string
  updateTime: string
  columns: ColumnInfo[]
}

export interface DBInfo {
  name: string
  version: string
  charset: string
  collation: string
  tables: TableInfo[]
}
