import { useState } from 'react';

export interface DatosConsulta {
  servicio?: string;
  urgencia: 'baja' | 'normal' | 'alta';
  resumen: string;
}

// Formulario que el asistente ofrece dentro del chat. Los datos personales se
// piden ACÁ y viajan directo a /api/consulta: el modelo nunca los ve.
export default function FormularioConsulta({ datos }: { datos: DatosConsulta }) {
  const [nombre, setNombre] = useState('');
  const [contacto, setContacto] = useState('');
  const [web, setWeb] = useState(''); // campo trampa anti-bots
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    setError('');
    try {
      const res = await fetch('/api/consulta', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...datos, nombre, contacto, web }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error);
      setListo(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'No pudimos enviarlo. Probá de nuevo o escribinos por WhatsApp.');
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div role="status" className="border border-accent/40 bg-white rounded-2xl px-4 py-4 text-base text-neutral-700">
        <p className="font-medium text-primary mb-1">Listo, recibimos tu consulta.</p>
        <p>La escribanía se va a comunicar con vos. Atienden de lunes a viernes de 10 a 18 hs.</p>
      </div>
    );
  }

  const campo = 'w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-base text-neutral-700 focus:outline-none focus:border-accent';

  return (
    <form onSubmit={enviar} className="border border-neutral-200 bg-white rounded-2xl p-4 space-y-3">
      <div className="w-10 h-px bg-accent" />
      <p className="text-base text-neutral-700">Dejanos tus datos y la escribanía te contacta.</p>
      <label className="block">
        <span className="text-[0.65rem] tracking-[0.25em] uppercase text-neutral-500">Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={120} autoComplete="name" className={campo} />
      </label>
      <label className="block">
        <span className="text-[0.65rem] tracking-[0.25em] uppercase text-neutral-500">Teléfono o mail</span>
        <input value={contacto} onChange={(e) => setContacto(e.target.value)} required maxLength={120} autoComplete="email" autoCapitalize="off" className={campo} />
      </label>
      {/* Campo trampa: fuera de pantalla y del orden de tabulación; un humano no lo completa. */}
      <input value={web} onChange={(e) => setWeb(e.target.value)} name="web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <p className="text-xs text-neutral-500 leading-relaxed">
        Estos datos los recibe solo la escribanía, no el asistente. Los usamos únicamente para responder tu consulta.
      </p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={enviando || !nombre.trim() || !contacto.trim()} className="w-full rounded-xl bg-primary hover:bg-primary-light disabled:opacity-40 text-white py-3 text-base font-medium transition-colors">
        {enviando ? 'Enviando…' : 'Enviar'}
      </button>
    </form>
  );
}
