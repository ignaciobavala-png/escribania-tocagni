// Fuente única de los datos de contacto: los consumen Contacto.astro y
// WhatsappFab.astro. PLACEHOLDERS: falta confirmar teléfono y email.
//
// wa.me pide solo dígitos, con código de país y SIN el 15:
//   +54 11 4444-5555  ->  541144445555
export const phoneDisplay = '+54 11 5555-1234';
export const phoneWhatsapp = '5491155551234';

export const whatsappMessage = 'Hola, quisiera hacer una consulta.';
export const whatsappUrl = `https://wa.me/${phoneWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

export const email = 'info@escribaniatocagni.com';
export const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=-34.5537,-58.4505';
