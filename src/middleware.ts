import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { emailDesdeAccess } from './lib/access';
import { auditar } from './lib/auditoria';

// Solo /admin y /api/admin pasan por acá; el sitio público ni lo nota.
const protegida = (ruta: string) => ruta.startsWith('/admin') || ruta.startsWith('/api/admin');

export const onRequest = defineMiddleware(async (ctx, next) => {
  if (!protegida(ctx.url.pathname)) return next();

  let email: string | null = null;

  if (import.meta.env.DEV) {
    // En local no hay Access delante: entra como escribana de prueba.
    email = 'dev@local';
  } else {
    const jwt = ctx.request.headers.get('Cf-Access-Jwt-Assertion');
    // Sin configuración o sin JWT válido, el panel queda cerrado (falla cerrado).
    if (jwt && env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD) {
      email = await emailDesdeAccess(jwt, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD);
    }
  }
  if (!email) return new Response('No autorizado', { status: 401 });

  // Autenticado por Access no alcanza: además tiene que estar en `usuarios`.
  let fila = await env.DB.prepare('SELECT rol FROM usuarios WHERE email = ?')
    .bind(email)
    .first<{ rol: 'escribana' | 'recepcion' }>();
  if (!fila && import.meta.env.DEV) fila = { rol: 'escribana' };
  if (!fila) {
    await auditar(env.DB, email, 'acceso_denegado', { detalle: { ruta: ctx.url.pathname } });
    return new Response('No autorizado', { status: 403 });
  }

  ctx.locals.usuario = { email, rol: fila.rol };
  return next();
});
