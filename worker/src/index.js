import render from 'render2'

export default {
  async fetch(request, env, ctx) {
    return render.fetch(request, env, ctx)
  }
}