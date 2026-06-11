/**
 * Consolidated admin API — auth, submissions CRUD, launch update writes.
 */
import { handleAdminApi } from '../server/lib/adminRouter.js'

console.log('[admin-api] handler loaded')

export default async function handler(req, res) {
  await handleAdminApi(req, res, process.env)
}
