export function resolveApiAction(req, basePath) {
  const queryAction =
    typeof req.query?.action === 'string' ? req.query.action.trim() : ''

  if (queryAction) {
    return queryAction
  }

  const url = typeof req.url === 'string' ? req.url : ''
  const parsed = new URL(url, 'http://localhost')
  const prefix = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath

  if (parsed.pathname.startsWith(`${prefix}/`)) {
    return parsed.pathname.slice(prefix.length + 1).split('/')[0] || ''
  }

  return ''
}
