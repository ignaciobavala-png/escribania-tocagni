// Fuente única de los datos de contacto: los consumen Contacto.astro y
// WhatsappFab.astro. El email sigue siendo PLACEHOLDER.
//
// wa.me pide solo dígitos, con código de país y SIN el 15:
//   +54 11 4444-5555  ->  541144445555
// Este es un celular, así que lleva el 9 después del 54 (54 9 11 ...).
//
// Teléfono confirmado por Inés el 2026-08-04 (provisorio: puede cambiar
// cuando llegue el Word con los textos definitivos).
export const phoneDisplay = '+54 9 11 5527-6746';
export const phoneWhatsapp = '5491155276746';

export const whatsappMessage = 'Hola, quisiera hacer una consulta.';
export const whatsappUrl = `https://wa.me/${phoneWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

// El dominio del sitio es .com (no se consiguio el .com.ar), pero el email
// queda en .com.ar a pedido de Ines: asi lo escribio en el Word. NO es un
// descuido — la casilla no depende del dominio del sitio. Si algun dia rebotan
// los mails de clientes, revisar esto primero.
export const email = 'info@escribaniatocagni.com.ar';
export const mapsUrl = 'https://www.google.com/maps/search/?api=1&query=-34.5537,-58.4505';
