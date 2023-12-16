import 'shiki-twoslash/style-rich.css'
import { rendererRich, transformerTwoSlash } from 'shikiji-twoslash'
import { codeToHtml } from 'shikiji'
import { createStorage } from 'unstorage'
import indexedDbDriver from 'unstorage/drivers/indexedb'
import { createTwoSlashFromCDN } from 'twoslash-cdn'

const storage = createStorage({
  driver: indexedDbDriver({ base: 'twoslash-cdn:' }),
})

const twoSlash = createTwoSlashFromCDN({
  unstorage: storage,
  compilerOptions: {
    lib: ['esnext', 'dom'],
  },
})

const source = `
import { ref } from 'vue'

console.log("Hi! Shiki on CDN :)")

const count = ref(0)
//     ^?
`

await twoSlash.prepareTypes(source)

const app = document.getElementById('app')!
app.innerHTML = await codeToHtml(source, {
  lang: 'ts',
  theme: 'vitesse-dark',
  transformers: [
    transformerTwoSlash({
      twoslashOptions: twoSlash.twoSlashOptons,
      renderer: rendererRich(),
    }),
  ],
})
