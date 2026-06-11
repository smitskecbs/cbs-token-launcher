export function createVercelLikeResponse(res) {
  return {
    status(code) {
      res.statusCode = code

      return {
        json(body) {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        },
        end() {
          res.end()
        },
      }
    },
  }
}

export function buildVercelLikeRequest(req, url) {
  const parsed = new URL(url, 'http://localhost')
  const query = {}

  for (const [key, value] of parsed.searchParams.entries()) {
    query[key] = value
  }

  return Object.assign(req, {
    url,
    query,
  })
}
