import type { DBOption } from './types'

export function getDBSql(opt: DBOption): string {
  switch (opt.dbType) {
    case 'mysql':
      return `
      SELECT SCHEMA_NAME             AS name,
          VERSION()                  AS version,
          DEFAULT_CHARACTER_SET_NAME AS charset,
          DEFAULT_COLLATION_NAME     AS collation
      FROM INFORMATION_SCHEMA.SCHEMATA
      WHERE SCHEMA_NAME = '${opt.database}';
      `
    case 'postgres':
      return `
      SELECT current_database()              AS name,
          current_setting('server_version')  AS version,
          current_setting('server_encoding') AS charset,
          current_setting('lc_collate')      AS collation;
      `
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}

export function getTableSql(opt: DBOption): string {
  switch (opt.dbType) {
    case 'mysql':
      return `
      SELECT TABLE_NAME                                 AS tableName,
          TABLE_COMMENT                                 AS tableComment,
          DATE_FORMAT(CREATE_TIME, '%Y-%m-%d %H:%i:%s') AS createTime,
          DATE_FORMAT(UPDATE_TIME, '%Y-%m-%d %H:%i:%s') AS updateTime
      FROM INFORMATION_SCHEMA.TABLES
      WHERE lower(table_type) = "base table" AND table_schema = '${opt.database}'
      ORDER BY TABLE_NAME ASC;
      `
    case 'postgres':
      return `
      SELECT relname     AS "tableName",
            description  AS "tableComment",
            ''           AS "createTime",
            ''           AS "updateTime"
      FROM pg_catalog.pg_class c
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_catalog.pg_description d ON d.objoid = c.oid AND d.objsubid = 0
      WHERE n.nspname = 'public'
          AND c.relkind = 'r'
      ORDER BY relname;
      `
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}

export function getColumnSql(opt: DBOption, tableName: string): string {
  switch (opt.dbType) {
    case 'mysql':
      return `
      SELECT ORDINAL_POSITION  AS ordinalPosition,
          COLUMN_NAME          AS columnName,
          COLUMN_TYPE          AS columnType,
          COLUMN_KEY           AS columnKey,
          COLUMN_DEFAULT       AS columnDefault,
          COLUMN_COMMENT       AS columnComment,
          IS_NULLABLE          AS isNullable
      FROM information_schema.columns
      WHERE table_schema = '${opt.database}' AND table_name = '${tableName}'
      ORDER BY ORDINAL_POSITION;
      `
    case 'postgres':
      return `
      SELECT cols.ordinal_position                                              AS "ordinalPosition",
            cols.column_name                                                   AS "columnName",
            CASE
                WHEN cols.udt_name = 'varchar' THEN cols.udt_name || '(' || cols.character_maximum_length || ')'
                WHEN cols.udt_name IN ('numeric', 'decimal')
                    THEN cols.udt_name || '(' || cols.numeric_precision || ',' || cols.numeric_scale || ')'
                ELSE cols.udt_name
                END                                                            AS "columnType",

            CASE WHEN kcu.constraint_name IS NOT NULL THEN 'PRI' ELSE NULL END AS "columnKey",
            cols.column_default                                                AS "columnDefault",
            pd.description                                                     AS "columnComment",
            cols.is_nullable                                                   AS "isNullable"
      FROM information_schema.columns cols
              LEFT JOIN information_schema.key_column_usage kcu ON cols.table_catalog = kcu.table_catalog
          AND cols.table_schema = kcu.table_schema
          AND cols.table_name = kcu.table_name
          AND cols.column_name = kcu.column_name
              LEFT JOIN pg_catalog.pg_description pd
                        ON pd.objoid = (quote_ident(cols.table_schema) || '.' || quote_ident(cols.table_name))::regclass
                            AND pd.objsubid = cols.ordinal_position
      WHERE cols.table_name = '${tableName}'
      ORDER BY cols.ordinal_position;
      `
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}

export function getTableDDLSql(opt: DBOption, tableName: string): string {
  switch (opt.dbType) {
    case 'mysql':
      return `SHOW CREATE TABLE ${opt.database}.${tableName}`
    case 'postgres':
      // TODO not yet implemented
      return `SELECT '' AS "Create Table" FROM ${tableName}`
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}
