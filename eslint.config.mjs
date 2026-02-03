// eslint.config.js
import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: {
    overrides: {
      'ts/consistent-type-imports': ['off'],
      'ts/consistent-type-definitions': ['off'],
    },
  },
})
