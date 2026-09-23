// Fuente única de las preguntas frecuentes. La consumen dos lugares:
//   - Faq.astro, para pintar el acordeón 01-10 y su FAQPage (JSON-LD)
//   - data/agente.ts, para el corpus de grounding del chatbot
// Están acá y no dentro del componente justamente para que lo que ve el
// usuario, lo que leen los buscadores y lo que sabe el asistente no puedan
// divergir. Mismo criterio que `servicios.ts`.
//
// Textos definitivos provistos por Inés (Word "PAGINA WEB", 2026-08-04).
// SON CONTENIDO LEGAL, no copy: no reescribirlos sin consultarla.

export interface Faq {
  number: string;
  question: string;
  answer: string;
}

export const faqs: Faq[] = [
  {
    number: '01',
    question: '¿Necesito turno previo para ir?',
    answer:
      'Sí. Trabajamos con turno previo para brindar una atención personalizada y dedicar el tiempo necesario a cada consulta. Podés solicitarlo por WhatsApp, teléfono o correo electrónico. Para una respuesta más ágil, te recomendamos escribirnos por WhatsApp.',
  },
  {
    number: '02',
    question: '¿Quién elige al escribano en una compraventa?',
    answer:
      'Por regla general, el escribano es elegido por la parte compradora. Existen, sin embargo, supuestos particulares, como las operaciones con saldo de precio, en las que la elección corresponde a la parte vendedora, ya sea que dicho saldo esté garantizado con hipoteca o no.',
  },
  {
    number: '03',
    question: 'Si compro con un crédito hipotecario, ¿debo elegir al escribano del banco?',
    answer:
      'No necesariamente. El banco suele exigir la intervención de un escribano de su nómina para instrumentar la hipoteca, pero eso no impide que la parte compradora elija a su escribano de confianza para la compraventa. En esos casos, ambos escribanos trabajan de manera coordinada y las escrituras se otorgan en un mismo acto.',
  },
  {
    number: '04',
    question: '¿Cuánto puede costar una escritura de compraventa?',
    answer:
      'El costo de una escritura depende de distintos factores, como el valor del inmueble, la jurisdicción donde se encuentra ubicado, y la eventual aplicación de exenciones o beneficios fiscales. Consultanos y prepararemos un presupuesto detallado, con el desglose de honorarios, impuestos y gastos, para que conozcas de manera anticipada el costo total de la operación.',
  },
  {
    number: '05',
    question: '¿Puedo escriturar con ustedes si el inmueble está ubicado fuera de la Ciudad de Buenos Aires?',
    answer:
      'Sí. Realizamos escrituras de inmuebles ubicados en la Provincia de Buenos Aires y en cualquier otra provincia del país. La ubicación del inmueble no es un impedimento: la escritura debe otorgarse dentro del ámbito de la Ciudad Autónoma de Buenos Aires.',
  },
  {
    number: '06',
    question: '¿Pueden ir a firmar a un domicilio?',
    answer:
      'Sí. Cuando alguna de las partes no puede trasladarse, podemos concurrir al lugar donde se encuentre dentro de la Ciudad Autónoma de Buenos Aires.',
  },
  {
    number: '07',
    question: '¿Qué documentación necesito para certificar una firma?',
    answer:
      'Debés concurrir con tu DNI vigente y el documento sin firmar, ya que la firma debe realizarse en presencia del escribano. Si firmás en representación de una sociedad o de un tercero, también deberás presentar la documentación que acredite esa representación, como el estatuto con la designación vigente de autoridades o un poder, según corresponda.',
  },
  {
    number: '08',
    question: '¿Necesito un abogado o un escribano para hacer una sucesión?',
    answer:
      'La sucesión requiere la intervención de un abogado. Trabajamos de manera coordinada con abogados especializados en derecho sucesorio para brindar un acompañamiento integral durante todo el proceso. Una vez obtenida la declaratoria de herederos o aprobado el testamento, la intervención del escribano resulta fundamental para la adjudicación, inscripción y transmisión de los bienes.',
  },
  {
    number: '09',
    question: '¿Puedo vender un inmueble si la sucesión todavía no terminó?',
    answer:
      'Sí. Una vez obtenida la declaratoria de herederos o aprobado el testamento, y su orden de inscripción, la venta puede realizarse por tracto abreviado, evitando la inscripción previa del inmueble a nombre de los herederos. Te asesoramos y coordinamos todo el proceso para concretar la operación de manera ágil y segura.',
  },
  {
    number: '10',
    question: '¿Cuánto demora constituir una sociedad?',
    answer:
      'El plazo depende del tipo societario elegido y de la jurisdicción donde se inscriba (Inspección General de Justicia o Dirección Provincial de Personas Jurídicas). Actualmente, en la Inspección General de Justicia (IGJ), una Sociedad Anónima (S.A.) o una Sociedad de Responsabilidad Limitada (S.R.L.) con trámite urgente puede estar completamente operativa —con inscripción, CUIT y rúbrica de libros societarios— en aproximadamente 20 a 30 días desde la firma de la escritura. En la Dirección Provincial de Personas Jurídicas (DPPJ), los plazos suelen ser mayores.',
  },
];
