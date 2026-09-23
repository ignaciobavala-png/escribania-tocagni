// Tipos de los secrets del Worker que no viven en `wrangler.jsonc`.
//
// `wrangler types` genera `worker-configuration.d.ts` (y lo pisa en cada
// corrida), asi que esta augmentacion manual va en un archivo aparte para no
// perderse. La interfaz se fusiona con la que declara el generado.
declare namespace Cloudflare {
  interface Env {
    DEEPSEEK_API_KEY?: string;
  }
}
