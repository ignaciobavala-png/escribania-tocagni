import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { whatsappUrl } from '../data/contacto';
import FormularioConsulta, { type DatosConsulta } from './FormularioConsulta';

// Un solo transporte para toda la vida del widget.
const transport = new DefaultChatTransport({ api: '/api/chat' });

// Se ve una vez por sesion de pestana: si ya se descarto (manual, abriendo el
// chat, o en una visita anterior de esta misma sesion) no vuelve a aparecer.
const BUBBLE_DISMISSED_KEY = 'tocagni-chat-bubble-dismissed';

interface Props {
  /** Atajos del estado vacío, provistos por el server (data/agente.ts). */
  sugerencias: string[];
}

export default function ChatWidget({ sugerencias }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [showBubble, setShowBubble] = useState(false);

  const { messages, sendMessage, status, error } = useChat({ transport });
  const busy = status === 'submitted' || status === 'streaming';

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Al abrir, el foco va al input.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Globito "¿Una consulta?": aparece una vez, con un respiro despues del
  // primer paint para no competir con el resto de la entrada de la pagina.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(BUBBLE_DISMISSED_KEY) === '1';
    } catch {
      // Storage bloqueado (ventana privada, etc): el globito se muestra igual.
    }
    if (dismissed) return;
    const t = setTimeout(() => setShowBubble(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismissBubble() {
    setShowBubble(false);
    try {
      sessionStorage.setItem(BUBBLE_DISMISSED_KEY, '1');
    } catch {
      // Sin storage no persiste, pero el estado en memoria ya lo oculta.
    }
  }

  // Escape cierra el panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // La conversación queda pegada abajo mientras llega el stream. Con el estado
  // vacío NO se scrollea: si no, recorta la tarjeta de bienvenida.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && messages.length > 0) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  function enviar(texto: string) {
    const t = texto.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar(input);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 md:bottom-7 md:right-7 z-50 flex flex-col items-end gap-3">
      {open && (
        <section
          role="dialog"
          aria-label="Asistente de Escribanía Tocagni"
          className="flex flex-col w-[calc(100vw-2.5rem)] sm:w-[26rem] md:w-[28rem] h-[min(88dvh,46rem)] max-h-[calc(100dvh-8rem)] bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden shadow-[0_18px_50px_-12px_rgb(26_41_64/0.45)]"
        >
          {/* Header navy, mismo lenguaje que el footer del sitio */}
          <header className="shrink-0 bg-primary px-5 py-4">
            <div className="w-16 h-px bg-accent mb-3" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] tracking-[0.3em] uppercase text-white/40 font-medium mb-1">
                  Asistente
                </p>
                <h2 className="font-serif text-xl text-white leading-tight">
                  ¿En qué te puedo ayudar?
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                className="flex-none -mt-1 p-1 rounded-md text-white/50 hover:text-accent hover:bg-white/5 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <p className="mt-2 flex items-center gap-2 text-xs text-white/40">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" aria-hidden="true" />
              Consultas sobre la escribanía
            </p>
          </header>

          {/* Conversación: `min-h-0` es lo que permite que scrollee dentro del flex */}
          <div
            ref={scrollRef}
            aria-live="polite"
            className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="border border-neutral-200 bg-white rounded-2xl p-5">
                <div className="w-10 h-px bg-accent mb-4" />
                <p className="text-neutral-500 text-sm leading-relaxed mb-4">
                  Hola. Soy el asistente de la escribanía. Puedo orientarte sobre
                  servicios, documentación y turnos.
                </p>
                <div className="flex flex-col gap-2">
                  {sugerencias.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => enviar(s)}
                      className="text-left border border-neutral-200 rounded-xl hover:border-accent hover:bg-neutral-50 px-4 py-3 text-sm text-neutral-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => {
                const esUsuario = m.role === 'user';
                const texto = m.parts
                  .map((p) => (p.type === 'text' ? p.text : ''))
                  .join('');
                // El asistente ofrece dejar los datos: se dibuja el formulario
                // (los argumentos de la herramienta son solo la clasificación).
                const registro = m.parts.find(
                  (p): p is typeof p & { input: DatosConsulta } =>
                    p.type === 'tool-ofrecer_registro' && 'state' in p && p.state === 'output-available',
                );
                if (!texto && !registro) return null;
                return (
                  <div key={m.id} className="space-y-3">
                    {texto && (
                      <div className={esUsuario ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                        <span
                          className={`text-[0.65rem] tracking-[0.25em] uppercase font-medium mb-1 ${
                            esUsuario ? 'text-neutral-400' : 'text-accent-dark'
                          }`}
                        >
                          {esUsuario ? 'Vos' : 'Asistente'}
                        </span>
                        <div
                          className={`max-w-[85%] px-4 py-3 text-base leading-relaxed whitespace-pre-wrap rounded-2xl ${
                            esUsuario
                              ? 'bg-primary text-white/90 rounded-br-md'
                              : 'bg-white border border-neutral-200 text-neutral-700 rounded-bl-md'
                          }`}
                        >
                          {texto}
                        </div>
                      </div>
                    )}
                    {registro && <FormularioConsulta datos={registro.input} />}
                  </div>
                );
              })
            )}

            {busy && (
              <p className="text-[0.65rem] tracking-[0.25em] uppercase text-neutral-400 motion-safe:animate-pulse">
                Escribiendo…
              </p>
            )}

            {error && (
              <p className="border border-accent/40 bg-white rounded-2xl px-4 py-3 text-sm text-neutral-500">
                No pudimos responder en este momento. Probá de nuevo o escribinos por
                WhatsApp.
              </p>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(input);
            }}
            className="shrink-0 border-t border-neutral-200 bg-white p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Escribí tu consulta…"
                aria-label="Mensaje"
                className="flex-1 resize-none rounded-xl bg-neutral-50 px-3 py-2 text-base text-neutral-700 placeholder:text-neutral-400 focus:outline-none max-h-28"
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                aria-label="Enviar mensaje"
                className="flex-none inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary hover:bg-primary-light disabled:opacity-30 disabled:hover:bg-primary text-white transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
          </form>

          {/* Derivación al canal humano */}
          <div className="shrink-0 border-t border-neutral-200 bg-neutral-100 px-4 py-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.7rem] tracking-[0.15em] uppercase text-accent-dark hover:text-primary transition-colors"
            >
              ¿Preferís hablar con una persona? WhatsApp
            </a>
          </div>
        </section>
      )}

      {/* Globito "consultame": solo antes de abrir el chat por primera vez. */}
      {!open && showBubble && (
        <div className="relative chat-bubble-in">
          <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl shadow-[0_8px_24px_-8px_rgb(26_41_64/0.3)] pl-4 pr-2.5 py-2.5">
            <p className="text-sm text-neutral-700 whitespace-nowrap">
              <span className="text-accent-dark font-medium">¿Una consulta?</span> Preguntame
            </p>
            <button
              type="button"
              onClick={dismissBubble}
              aria-label="Cerrar aviso"
              className="flex-none p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          {/* Puntita del globo, apunta al launcher */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-r border-b border-neutral-200 rotate-45" aria-hidden="true" />
        </div>
      )}

      {/* Launcher: navy con filo dorado y esquinas suaves, mismo lenguaje que el panel */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          dismissBubble();
        }}
        aria-expanded={open}
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente'}
        className="inline-flex items-center justify-center w-14 h-14 md:w-[3.75rem] md:h-[3.75rem] rounded-2xl bg-primary text-accent shadow-[0_8px_28px_-8px_rgb(26_41_64/0.55)] border border-white/10 hover:bg-primary-light transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-accent"
      >
        <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h8M8 13.5h5M21 12c0 4.418-4.03 8-9 8a9.9 9.9 0 0 1-4-.8L3 21l1.2-3.6A7.6 7.6 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
          />
        </svg>
      </button>
    </div>
  );
}
