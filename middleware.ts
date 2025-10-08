import { createMiddleware } from '@lovable/middleware';

export default createMiddleware({
  async middleware(request) {
    const url = new URL(request.url);
    
    // Check if we're on the preview domain
    if (url.hostname === 'preview--univgates-connect.lovable.app') {
      // Create the redirect URL
      const redirectUrl = new URL(url.pathname + url.search + url.hash, 'https://univgates.com.tr');
      
      // Return redirect response
      return new Response(null, {
        status: 301,
        headers: {
          'Location': redirectUrl.toString(),
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    // Continue with the request if not on preview domain
    return null;
  }
});