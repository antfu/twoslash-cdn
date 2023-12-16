import type { TwoSlashOptions } from '@typescript/twoslash'
import { twoslasher } from '@typescript/twoslash'
import ts from 'typescript'
import lzstring from 'lz-string'
import { createDefaultMapFromCDN } from '@typescript/vfs'
import { setupTypeAcquisition } from '@typescript/ata'
import type { Storage } from 'unstorage'

export interface TwoSlashCdnOptions {
  /**
   * Unstorage instance to use for caching
   * @see https://github.com/unjs/unstorage
   */
  unstorage?: Storage
  /**
   * TypeScript compiler options
   */
  compilerOptions?: ts.CompilerOptions
  /**
   * TwoSlash options Overrides
   *
   * Options `tsModule`, `lzstringModule` and `fsMap` are controlled by this function
   */
  twoSlashOptionsOverrides?: Omit<TwoSlashOptions, 'tsModule' | 'lzstringModule' | 'fsMap'>
  /**
   * A map of file paths to virtual file contents
   */
  fsMap?: Map<string, string>
  /**
   * Custom fetch function. When `unstorage` is provided, we will wrap the fetch function to cache the response.
   */
  fetcher?: typeof fetch
}

const noopLocalStorage = <typeof localStorage>{
  getItem: () => null,
  setItem: () => { },
  hasItem: () => false,
  clear: () => { },
  removeItem: () => { },
  length: 0,
  key: () => null,
}

export function createTwoSlashFromCDN(options: TwoSlashCdnOptions = {}) {
  const fetcher = (
    options.unstorage
      ? createCachedFetchFromUnstorage(options.unstorage, options.fetcher || fetch)
      : options.fetcher || fetch
  )
  const fsMap = options.fsMap || new Map<string, string>()

  let initPromise: Promise<void> | undefined
  async function _init() {
    const newMap = await createDefaultMapFromCDN(
      options.compilerOptions || {},
      ts.version,
      true,
      ts,
      lzstring,
      fetcher,
      // We pass noopStorage to avoid using localStorage,
      // cache should be handled by the fetcher
      noopLocalStorage,
    )

    newMap.forEach((value, key) => {
      fsMap.set(key, value)
    })
  }

  function init() {
    if (!initPromise)
      initPromise = _init()
    return initPromise
  }

  const ata = setupTypeAcquisition({
    projectName: 'twoslash-cdn',
    typescript: ts,
    fetcher,
    delegate: {
      receivedFile: (code: string, path: string) => {
        // console.log("ATA received", path);
        fsMap.set(path, code)
      },
    },
  })

  /**
   * Runs Auto-Type-Acquisition (ATA) on the given code, the async operation before running twoslash
   * @param code
   */
  async function prepareTypes(code: string) {
    await init()
    // ATA actually returns a Promise<void> but it's not typed
    await ata(code)
  }

  /**
   * Overrides options for twoslash
   */
  const twoSlashOptons: TwoSlashOptions = {
    tsModule: ts,
    lzstringModule: lzstring,
    fsMap,
  }

  /**
   * Run auto type acquisition and then twoslash on the given code
   */
  async function run(source: string, extension: string, localOptions: TwoSlashOptions) {
    await prepareTypes(source)
    return runSync(source, extension, localOptions)
  }

  /**
   * Run twoslasher on the given code, without running ATA
   */
  function runSync(source: string, extension: string, localOptions: TwoSlashOptions) {
    twoslasher(source, extension, {
      defaultCompilerOptions: options.compilerOptions,
      ...localOptions,
      ...twoSlashOptons,
    })
  }

  return {
    run,
    runSync,
    init,
    prepareTypes,

    fsMap,
    fetcher,
    twoSlashOptons,
  }
}

/**
 * Create a cached fetch function from an unstorage instance
 *
 * @see https://github.com/unjs/unstorage
 * @param storage
 * @param nativeFetch
 */
export function createCachedFetchFromUnstorage(
  storage: Storage,
  nativeFetch: typeof fetch = fetch,
): typeof fetch {
  return (async (url: string, init?: RequestInit) => {
    const shouldCache = !init || (init?.method === 'GET' && init?.cache !== 'no-store')
    const cached = shouldCache
      ? await storage.getItemRaw(url)
      : undefined
    if (cached != null) {
      // console.log("cached", url);
      return new Response(cached as any, init)
    }
    else {
      // console.log("fetching", url);
      const response = await nativeFetch(url, init)
      if (shouldCache)
        response.clone().text().then(text => storage.setItemRaw(url, text))
      return response
    }
  }) as any
}
