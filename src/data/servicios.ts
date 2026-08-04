// Fuente única de los servicios. La consumen dos lugares:
//   - Servicios.astro, para pintar la grilla 01-09
//   - Schema.astro, para el hasOfferCatalog del structured data
// Están acá y no dentro del componente justamente para que la lista que ve el
// usuario y la que leen Google y los agentes no puedan divergir. Mismo criterio
// que el array `faqs` de Faq.astro con su FAQPage.
//
// Textos definitivos provistos por Inés (Word "PAGINA WEB", 2026-08-04).

export interface Servicio {
  number: string;
  title: string;
  description: string;
}

export const servicios: Servicio[] = [
  { number: '01', title: 'Certificaciones', description: 'Certificación de firmas ológrafas y digitales, autenticación de documentos y copias, legalizaciones y apostillas.' },
  { number: '02', title: 'Operaciones inmobiliarias', description: 'Compraventas, donaciones, permutas, usufructos, hipotecas, reglamentos de propiedad horizontal, afectación y desafectación al Régimen de Protección de la Vivienda y demás actos sobre inmuebles.' },
  { number: '03', title: 'Poderes y autorizaciones', description: 'Poderes generales y especiales, autorizaciones para viajar al exterior de menores de edad y para conducir vehículos.' },
  { number: '04', title: 'Sociedades', description: 'Constitución de sociedades, rúbrica de libros, reformas estatutarias, designación de autoridades, cambios de sede, fusiones, escisiones, venta de acciones, cesión de cuotas sociales y demás trámites societarios.' },
  { number: '05', title: 'Sucesiones', description: 'Declaratorias de herederos, cesiones de derechos hereditarios, tracto abreviado e inscripciones registrales.' },
  { number: '06', title: 'Planificación patrimonial', description: 'Testamentos, donaciones y herramientas jurídicas para organizar y proteger tu patrimonio.' },
  { number: '07', title: 'Fideicomisos', description: 'Constitución, modificación y extinción de fideicomisos civiles e inmobiliarios.' },
  { number: '08', title: 'Actas notariales', description: 'Actas de constatación, notificación, intimación, inventario, sorteos, asambleas y demás actuaciones con valor probatorio.' },
];

// El 09 va aparte porque es el único con ficha ampliada: su tarjeta lleva un
// "Conocé más" que despliega el detalle.
export const desarrollo: Servicio = {
  number: '09',
  title: 'Desarrollos inmobiliarios',
  description: 'Asesoramiento notarial integral para desarrolladores e inversores en todas las etapas del proyecto.',
};

// El orden es el del Word: son las etapas del proyecto, no una lista suelta.
export const etapasDesarrollo = [
  'Adquisición del inmueble.',
  'Estructuración jurídica del proyecto.',
  'Constitución de sociedades y fideicomisos.',
  'Adhesiones, boletos y cesiones.',
  'Reglamentos de Propiedad Horizontal.',
  'Escrituración de unidades.',
  'Extinción de fideicomisos.',
  'Inscripciones registrales.',
];
