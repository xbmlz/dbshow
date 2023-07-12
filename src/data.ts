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
    auto2top: true,
    search: {
      placeholder: '搜索',
      noData: '找不到结果',
    },
    name: 'DBShow',
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
