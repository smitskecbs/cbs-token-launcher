/**
 * Consolidated public API — homepage, interest, market data, launch update reads.
 */
import { handlePublicApi } from './lib/publicRouter.js'

console.log('[public-api] handler loaded')

export default async function handler(req, res) {
  await handlePublicApi(req, res, process.env)
}
