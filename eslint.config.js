// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    formatters: {
      html: true,
      prettierOptions: {
        // @ts-expect-error missing in types
        printWidth: 120,
      },
    },
  },
)
