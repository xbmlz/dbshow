import gradient from 'gradient-string'
import pkg from '../package.json'
import type { DB } from './types'

export const bannerText = gradient([
  { color: '#42d392', pos: 0 },
  { color: '#42d392', pos: 0.1 },
  { color: '#647eff', pos: 1 },
])(`Welcome to the DB Show! v${pkg.version}`)

export const dbList: DB[] = [
  {
    name: 'MySQL(MariaDB)',
    value: 'mysql',
    defaultPort: '3306',
    defaultUser: 'root',
  },
]

export const docsifyIndexRaw = `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta charset="UTF-8">
  <link href="https://cdn.bootcdn.net/ajax/libs/docsify/4.13.0/themes/vue.min.css" rel="stylesheet">
</head>
<body>
<div id="app">加载中</div>
<script>
  window.$docsify = {
    loadSidebar: true,
    search: 'auto',
  }
</script>
<script src="https://cdn.bootcdn.net/ajax/libs/docsify/4.13.0/docsify.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/docsify/4.13.0/plugins/search.min.js"></script>
<script src="https://cdn.bootcdn.net/ajax/libs/prism/9000.0.1/components/prism-sql.min.js"></script>
</body>
</html>
`
