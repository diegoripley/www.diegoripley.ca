import render from 'render2'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    
    // Redirect to add trailing slash for paths that:
    // 1. Don't already have a trailing slash
    // 2. Aren't the root path
    // 3. Don't have a file extension
    if (url.pathname !== '/' && 
        !url.pathname.endsWith('/') && 
        !url.pathname.match(/\.[^/]+$/)) {
      return Response.redirect(url.origin + url.pathname + '/' + url.search, 301)
    }
    
    // Let render2 handle the request
    return render.fetch(request, env, ctx)
  }
}