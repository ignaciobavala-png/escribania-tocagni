/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Persona autenticada en /admin (la pone src/middleware.ts). */
    usuario?: { email: string; rol: 'escribana' | 'recepcion' };
  }
}
