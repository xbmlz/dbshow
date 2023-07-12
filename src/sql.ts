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
    case 'mssql':
      return `
      SELECT '${opt.database}'                                                                              AS name,
            @@VERSION                                                                                       AS version,
            COLLATIONPROPERTY(CONVERT(varchar, DATABASEPROPERTYEX('${opt.database}', 'Collation')), 'Name') AS collation,
            CONVERT(varchar(100), SERVERPROPERTY('Collation'))                                              AS charset
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
    case 'mssql':
      return `
      SELECT o.name        AS tableName,
            ep.value       AS tableComment,
            CONVERT(VARCHAR(19), o.create_date, 120) AS createTime,
            CONVERT(VARCHAR(19), o.modify_date, 120) AS updateTime
      FROM sys.objects o
            LEFT JOIN sys.extended_properties ep ON ep.major_id = o.object_id AND ep.minor_id = 0 AND ep.name = 'MS_Description'
      WHERE o.type = 'U'
        AND o.is_ms_shipped = 0
      ORDER BY o.name ASC
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
    case 'mssql':
      return `
      SELECT a.colid                          AS ordinalPosition,
            a.name                            AS columnName,
            CASE WHEN b.name IN ('varchar', 'nvarchar', 'char', 'nchar', 'varbinary')
                      THEN b.name + '(' + CAST(a.length AS VARCHAR) + ')'
                  WHEN b.name IN ('numeric', 'decimal')
                      THEN b.name + '(' + CAST(a.prec AS VARCHAR) + ',' + CAST(a.scale AS VARCHAR) + ')'
                  ELSE b.name
                END                           AS columnType,
            CASE WHEN EXISTS(SELECT 1 FROM sysobjects
                              WHERE xtype = 'PK'
                                AND name IN (SELECT name FROM sysindexes
                                            WHERE indid IN (
                                                SELECT indid FROM sysindexkeys
                                                WHERE id = a.id
                                                  AND colid = a.colid
                                            )
                              )
            ) THEN 'PRI' ELSE '' END          AS columnKey,
            e.text                            AS columnDefault,
            g.value                           AS columnComment,
            CASE WHEN a.isnullable = 1 THEN 'YES' ELSE 'NO' END AS isNullable
      FROM syscolumns a
              LEFT JOIN systypes b ON a.xusertype = b.xusertype
              INNER JOIN sysobjects d ON a.id = d.id AND d.xtype = 'U' AND d.name <> 'dtproperties'
              LEFT JOIN syscomments e ON a.cdefault = e.id
              LEFT JOIN sys.extended_properties g ON a.id = g.major_id AND a.colid = g.minor_id
              LEFT JOIN sys.extended_properties f ON d.id = f.major_id AND f.minor_id = 0
      WHERE d.name = '${tableName}'
      ORDER BY a.id, a.colorder;
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
    case 'mssql':
      // TODO not yet implemented
      return `SELECT '' AS "Create Table" FROM ${tableName}`
    default:
      console.error('Unsupported database type!')
      process.exit(1)
  }
}
