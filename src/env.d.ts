/// <reference types="astro/client" />

type Rol = 'escribana' | 'recepcion' | 'desarrollador';

declare namespace App {
  interface Locals {
    /** Persona autenticada en /admin (la pone src/middleware.ts). */
    usuario?: { email: string; rol: Rol };
  }
}
