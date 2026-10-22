// Interpreta el campo "Teléfono o mail" de una ficha, que es texto libre
// ("11 5527-6746", "011 15 4444 1111", "+54 9 11 4444-1111", "ana@correo.com"),
// y arma los enlaces para contactar a la persona.

export interface Contacto {
  email: string | null;
  /** Número para wa.me: 549 + código de área + número, sin 0 ni 15. null si no es un celular reconocible. */
  whatsapp: string | null;
  /** Dígitos con +, para `tel:` (solo útil en un teléfono). */
  tel: string | null;
}

/** Celular argentino -> formato internacional de wa.me (549 + 10 dígitos), o null. */
export function whatsappAR(texto: string): string | null {
  let d = texto.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) {
    d = d.slice(2);
    if (d.startsWith('9')) d = d.slice(1); // el 9 de celular se vuelve a agregar al final
  }
  if (d.startsWith('0')) d = d.slice(1);
  // "15" de celular entre el código de área (2 a 4 dígitos) y el número: se saca.
  if (d.length === 12) {
    for (const area of [2, 3, 4]) {
      if (d.slice(area, area + 2) === '15') {
        d = d.slice(0, area) + d.slice(area + 2);
        break;
      }
    }
  }
  return d.length === 10 ? `549${d}` : null;
}

export function leerContacto(texto: string | null): Contacto {
  const t = texto ?? '';
  const email = t.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0] ?? null;
  const resto = email ? t.replace(email, ' ') : t;
  const numero = resto.match(/\+?\d[\d\s().-]{6,}\d/)?.[0] ?? null;
  const digitos = numero?.replace(/\D/g, '') ?? '';
  return {
    email,
    whatsapp: numero ? whatsappAR(numero) : null,
    tel: digitos.length >= 8 ? `${numero!.trim().startsWith('+') ? '+' : ''}${digitos}` : null,
  };
}

/** Mensaje inicial: lo escribe el estudio, pero se envía recién cuando la persona toca "enviar" en WhatsApp. */
export const enlaceWhatsapp = (numero: string, nombre: string | null) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(
    `Hola${nombre ? ` ${nombre.split(' ')[0]}` : ''}, te escribimos de la Escribanía Tocagni por tu consulta.`,
  )}`;
