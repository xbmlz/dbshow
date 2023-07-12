import type { DB } from './types'

export const dbList: DB[] = [
  {
    name: 'MySQL',
    value: 'mysql',
    defaultPort: '3306',
    defaultUser: 'root',
  },
  {
    name: 'PostgreSQL',
    value: 'postgres',
    defaultPort: '5432',
    defaultUser: 'postgres',
  },
  {
    name: 'Microsoft SQL Server',
    value: 'mssql',
    defaultPort: '1433',
    defaultUser: 'sa',
  },
]

export const SITE_FAVICON = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><g fill="none" stroke="#42b983" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M4 6c0 1.657 3.582 3 8 3s8-1.343 8-3s-3.582-3-8-3s-8 1.343-8 3"/><path d="M4 6v6c0 1.453 2.755 2.665 6.414 2.941M20 11V6"/><path d="M4 12v6c0 1.579 3.253 2.873 7.383 2.991M18 22l3.35-3.284a2.143 2.143 0 0 0 .005-3.071a2.242 2.242 0 0 0-3.129-.006l-.224.22l-.223-.22a2.242 2.242 0 0 0-3.128-.006a2.143 2.143 0 0 0-.006 3.071L18 22z"/></g></svg>'
