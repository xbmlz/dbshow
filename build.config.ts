import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/cli/index.ts',
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
    inlineDependencies: true,
  },
})
