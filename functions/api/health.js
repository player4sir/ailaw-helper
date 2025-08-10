// Cloudflare Pages Function for health check
export async function onRequestGet() {
  return new Response(
    JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), 
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
