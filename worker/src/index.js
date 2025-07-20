import render from 'render2'
import { handleContactForm } from './contact.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle contact form requests at /contact_form_worker/
    if (url.pathname === '/contact_form_worker/') {
      return handleContactForm(request, env);
    }

    return render.fetch(request, env, ctx)
  }
}