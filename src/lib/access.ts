// Valida el JWT que Cloudflare Access agrega a cada request autenticada
// (header Cf-Access-Jwt-Assertion). Sin esta verificación, el header es solo
// texto que cualquiera podría falsificar si llegara al Worker por otro camino.

interface Jwk extends JsonWebKey {
  kid?: string;
}

const b64 = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export async function emailDesdeAccess(
  jwt: string,
  teamDomain: string,
  aud: string,
): Promise<string | null> {
  const [h, p, s] = jwt.split('.');
  if (!h || !p || !s) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(b64(h)));
    const claims = JSON.parse(new TextDecoder().decode(b64(p)));

    const ahora = Math.floor(Date.now() / 1000);
    const audiencias: string[] = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!audiencias.includes(aud) || claims.exp < ahora) return null;
    if (claims.iss !== `https://${teamDomain}`) return null;

    // Cloudflare cachea esta respuesta en el borde; las claves rotan rara vez.
    const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
    const { keys } = (await res.json()) as { keys: Jwk[] };
    const jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const clave = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      clave,
      b64(s),
      new TextEncoder().encode(`${h}.${p}`),
    );
    return ok && typeof claims.email === 'string' ? claims.email.toLowerCase() : null;
  } catch {
    return null;
  }
}
