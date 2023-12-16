# twoslash-cdn

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Run [TypeScript TwoSlash](https://www.typescriptlang.org/dev/twoslash/) on the browsers or web workers, with [Auto-Type-Acquisition](https://www.typescriptlang.org/play#example/automatic-type-acquisition) from CDN.

A thin wrapper around `@typescript/twoslash`, `@typescript/vfs`, `@typescript/ata` to an easy-to-use interface. Huge thanks to the TypeScript team for the heavy-lifting work on [TypeScript Website](https://github.com/microsoft/TypeScript-Website) project.

[CDN Example](https://twoslash-cdn-examples.netlify.app/) | [Example Source File](./examples/index.html)

## Usage

```html
<script type="module">
  // replace with exact version in production
  import { createTwoSlashFromCDN } from 'https://esm.sh/twoslash-cdn@latest'

  const twoslash = createTwoSlashFromCDN()

  // During `.run()`, it will automatically fetch types from CDN
  // for used imports in the code (in this case, `vue` and its dependencies),
  // and then resolve the types with TypeScript running on the browser.
  const result = await twoslash.run(`
    import { ref } from 'vue'
    const count = ref(0)
    //     ^?
  `)

  console.log(result) // { code: '...', staticQuickInfos: [...] }
</script>
```

### Cache Persistence

By default, the fetched files are stored in a virtual file system in memory. So that multiple runs can share the same cache. If you want to keep them persistent, you can pass a `storage` option to the factory. The storage supports [unstorage](https://github.com/unjs/unstorage)'s interface, where you can adopt the storage to any supported providers.

```html
<script type="module">
  // replace with exact versions in production
  import { createTwoSlashFromCDN } from 'https://esm.sh/twoslash-cdn@latest'
  import { createStorage } from 'https://esm.sh/unstorage@latest'
  import indexedDbDriver from 'https://esm.sh/unstorage@latest/drivers/indexedb'

  // An example of using unstorage with IndexedDB to cache the virtual file system
  const storage = createStorage({
    driver: indexedDbDriver(),
  })

  const twoslash = createTwoSlashFromCDN({
    storage,
  })

  const result = await twoslash.run(`const foo = 1`)
</script>
```

Refresh the page after loading once, you will see the execution is much faster as the cache is loaded from the local IndexedDB.

### Synchronize Usage

Fetching files from CDN is asynchronous, and there is no way to make the whole process synchronous. But if you can run some asynchronous code beforehand, we do provide API to separate the asynchronous part and the synchronous part.

For example, in [Shikiji](https://shikiji.netlify.app/), the `codeToHtml` function is synchronous as well as the [`shikiji-twoslash` transformer](https://shikiji.netlify.app/packages/twoslash).

```ts
import { createTwoSlashFromCDN } from 'twoslash-cdn'
import { createHighlighter } from 'shikiji'
import { transformerTwoSlash } from 'shikiji-twoslash'

const highlighter = await createHighlighter({})

const twoslash = createTwoSlashFromCDN()

const code = `
import { ref } from 'vue'
const foo = ref(1)
//    ^?
`

// Load all necessary types from CDN before hand
await twoslash.prepreTypes(code)

// This can be done synchronously
const highlighted = highlighter.codeToHtml(code, {
  lang: 'ts',
  theme: 'dark-plus',
  transformers: [
    transformerTwoSlash({
      // Use `twoslash.runSync` to replace the non-CDN `twoslasher` function
      twoslasher: twoslash.runSync
    })
  ],
})
```

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg" />
  </a>
</p>

## License

[MIT](./LICENSE) License © 2023-PRESENT [Anthony Fu](https://github.com/antfu)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/twoslash-cdn?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/twoslash-cdn
[npm-downloads-src]: https://img.shields.io/npm/dm/twoslash-cdn?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/twoslash-cdn
[bundle-src]: https://img.shields.io/bundlephobia/minzip/twoslash-cdn?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=twoslash-cdn
[license-src]: https://img.shields.io/github/license/antfu/twoslash-cdn.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/twoslash-cdn/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/twoslash-cdn
