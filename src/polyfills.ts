import { Buffer } from 'buffer'

;(globalThis as typeof globalThis & { Buffer: typeof Buffer; global: typeof globalThis }).Buffer =
  Buffer
;(globalThis as typeof globalThis & { global: typeof globalThis }).global =
  globalThis
