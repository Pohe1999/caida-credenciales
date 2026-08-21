import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import {
  FaCheckCircle, FaSpinner, FaUserCheck,
  FaSearch, FaUpload, FaCamera, FaTimes, FaChevronDown
} from 'react-icons/fa';

// ---------------------------------------------------------------------------
// Sub-components (defined outside to avoid unmount/remount on every render)
// ---------------------------------------------------------------------------

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full px-4 py-3 pr-10 rounded-xl border-2 text-left flex items-center justify-between transition-all duration-200 bg-white font-medium text-sm
          ${open
            ? 'border-[#8B1538] ring-2 ring-[#8B1538]/20'
            : 'border-gray-200 hover:border-gray-300'
          }`}
      >
        <span className={selected ? 'text-gray-800' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <FaChevronDown className={`absolute right-4 text-[#8B1538] text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fadeIn">
          {options.map(opt => {
            const isSelected = String(value) === String(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors text-sm
                  ${isSelected ? 'bg-[#FFF5F7]' : 'hover:bg-gray-50'}`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                  ${isSelected ? 'bg-[#8B1538] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {opt.value}
                </span>
                <span className={isSelected ? 'text-[#8B1538] font-semibold' : 'text-gray-700'}>
                  {opt.label}
                </span>
                {isSelected && <FaCheckCircle className="ml-auto text-[#8B1538] text-xs" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepBadge({ num, done, label }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-300
          ${done ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}
      >
        {done ? <FaCheckCircle className="text-xs" /> : num}
      </div>
      <span className={`font-semibold text-sm ${done ? 'text-emerald-600' : 'text-[#8B1538]'}`}>
        {label}
      </span>
    </div>
  );
}

function ImageDropZone({ isDragActive, onDragOver, onDragEnter, onDragLeave, onDrop, onClick, onKeyDown, error, inputRef, onFileChange }) {
  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        onKeyDown={onKeyDown}
        className={`w-full border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all duration-200 text-center select-none
          ${isDragActive
            ? 'border-[#8B1538] bg-[#FFF5F7] scale-[1.01] shadow-md'
            : 'border-gray-200 hover:border-[#8B1538]/40 hover:bg-gray-50/80'
          }`}
      >
        {/* pointer-events-none on children keeps drag events firing only on the parent */}
        <div className="flex flex-col items-center gap-2.5 pointer-events-none">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
            ${isDragActive ? 'bg-[#8B1538]/10 scale-110' : 'bg-gray-100'}`}>
            <FaUpload className={`text-lg transition-colors ${isDragActive ? 'text-[#8B1538]' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className={`font-semibold text-sm transition-colors ${isDragActive ? 'text-[#8B1538]' : 'text-gray-600'}`}>
              {isDragActive ? '¡Suelta la imagen aquí!' : 'Seleccionar de galería'}
            </p>
            {!isDragActive && <p className="text-gray-400 text-xs mt-0.5">o arrastra una imagen a esta zona</p>}
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mt-1.5 text-center">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RegistroForm() {
  // --- Global form state ---
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Refs ---
  const webcamRef = useRef(null);
  const webcamRefComprobacion = useRef(null);
  const containerRefTarjeta = useRef(null);
  const containerRefComprobacion = useRef(null);
  const fileInputCredencialRef = useRef(null);
  const fileInputComprobacionRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  // Counter-based drag tracking — more reliable than relatedTarget (which can be null)
  const dragCounterCredencial = useRef(0);
  const dragCounterComprobacion = useRef(0);

  // --- Image states ---
  const [imgCredencial, setImgCredencial] = useState(null);
  const [imgCredencialPreview, setImgCredencialPreview] = useState(null);
  const [showCam, setShowCam] = useState(false);
  const [fotoConfirmada, setFotoConfirmada] = useState(false);

  const [imgComprobacion, setImgComprobacion] = useState(null);
  const [imgComprobacionPreview, setImgComprobacionPreview] = useState(null);
  const [showCamComprobacion, setShowCamComprobacion] = useState(false);
  const [fotoComprobacionConfirmada, setFotoComprobacionConfirmada] = useState(false);

  // --- Drag & drop state ---
  const [dragActivoCredencial, setDragActivoCredencial] = useState(false);
  const [dragActivoComprobacion, setDragActivoComprobacion] = useState(false);
  const [errorArchivoCredencial, setErrorArchivoCredencial] = useState('');
  const [errorArchivoComprobacion, setErrorArchivoComprobacion] = useState('');

  // --- Search state ---
  const [spSeleccionado, setSpSeleccionado] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState('');

  // --- New person form state ---
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [curpNuevo, setCurpNuevo] = useState('');
  const [spNuevo, setSpNuevo] = useState('');
  const [telefonoNuevo, setTelefonoNuevo] = useState('');
  const [registrandoNuevo, setRegistrandoNuevo] = useState(false);
  const [errorCurp, setErrorCurp] = useState('');
  const [telefonoRegistro, setTelefonoRegistro] = useState('');

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Warn before closing/refreshing if the user has unsaved data
  const hasData = !!(personaSeleccionada || imgCredencial || imgComprobacion);
  useEffect(() => {
    if (!hasData) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasData]);

  // Revoke object URLs on change to avoid memory leaks
  useEffect(() => () => { if (imgCredencialPreview) URL.revokeObjectURL(imgCredencialPreview); }, [imgCredencialPreview]);
  useEffect(() => () => { if (imgComprobacionPreview) URL.revokeObjectURL(imgComprobacionPreview); }, [imgComprobacionPreview]);

  // Prevent default browser behavior when dropping outside designated zones
  useEffect(() => {
    const prevent = (e) => e.preventDefault();
    window.addEventListener('dragover', prevent);
    window.addEventListener('drop', prevent);
    return () => { window.removeEventListener('dragover', prevent); window.removeEventListener('drop', prevent); };
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (busquedaNombre.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => buscarPersona(busquedaNombre), 500);
    } else {
      setResultadosBusqueda([]);
      setMensajeBusqueda('');
      setMostrarResultados(false);
    }

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaNombre, spSeleccionado]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const obtenerMensajeError = (response, result, fallback) => {
    if (result?.error) return result.error;
    if (result?.mensaje) return result.mensaje;
    if (response?.status === 400) return fallback || 'Solicitud inválida.';
    if (response?.status === 404) return fallback || 'Recurso no encontrado.';
    if (response?.status === 409) return fallback || 'Conflicto con un registro existente.';
    if (response?.status === 429) return fallback || 'Demasiadas solicitudes. Intenta más tarde.';
    if (response?.status >= 500) return fallback || 'Error interno del servidor.';
    return fallback || 'Error inesperado.';
  };

  const validarCURP = (curp) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/.test(curp.toUpperCase());

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Updates the preview URL, revoking the previous one
  const updatePreview = (file, setPreview) => {
    setPreview(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const videoConstraints = {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    facingMode: 'environment',
    frameRate: { ideal: 30 },
    focusMode: 'continuous',
  };

  const generateFolio = () => {
    const d = new Date();
    return `REG-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
  };

  // ---------------------------------------------------------------------------
  // Image processing
  // ---------------------------------------------------------------------------

  const procesarArchivoImagen = (file, setImg, setPreview, setConfirm, setShow, filename, setError) => {
    setError?.('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError?.('Ese archivo no es una imagen. Selecciona o arrastra un JPG, PNG o similar.');
      return;
    }

    // Single-pass re-encode at 0.88 quality: ~10-15% lighter, imperceptible quality loss.
    // Only scales down if the image exceeds 4096px (ultra-high-res cameras).
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDimension = 4096;
        if (width > maxDimension || height > maxDimension) {
          const scale = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          const out = new File([blob], filename, { type: 'image/jpeg' });
          setImg(out);
          updatePreview(out, setPreview);
          setConfirm(true);
          setShow(false);
        }, 'image/jpeg', 0.88);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const capture = (ref, containerRef, setImg, setPreview, setConfirm, setShow, filename) => {
    const video = ref.current?.video;
    const container = containerRef?.current;
    if (!video || !container) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const vw = video.videoWidth, vh = video.videoHeight;
    const cw = Math.max(1, container.clientWidth), ch = Math.max(1, container.clientHeight);
    const scale = Math.max(cw / vw, ch / vh);
    const sw = Math.round(cw / scale), sh = Math.round(ch / scale);
    const sx = Math.max(0, Math.round((vw - sw) / 2)), sy = Math.max(0, Math.round((vh - sh) / 2));

    canvas.width = cw;
    canvas.height = ch;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);

    canvas.toBlob(blob => {
      const file = new File([blob], filename.replace('.png', '.jpg'), { type: 'image/jpeg' });
      setImg(file);
      updatePreview(file, setPreview);
      setConfirm(true);
      setShow(false);
    }, 'image/jpeg', 0.9);
  };

  const handleFileUpload = (e, setImg, setPreview, setConfirm, setShow, filename, setError) => {
    const file = e.target.files?.[0];
    procesarArchivoImagen(file, setImg, setPreview, setConfirm, setShow, filename, setError);
    e.target.value = '';
  };

  // ---------------------------------------------------------------------------
  // Drag & drop handlers (counter-based — immune to null relatedTarget)
  // ---------------------------------------------------------------------------

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const handleDragEnter = (e, setDragActivo, counterRef) => {
    e.preventDefault();
    e.stopPropagation();
    counterRef.current++;
    setDragActivo(true);
  };

  const handleDragLeave = (e, setDragActivo, counterRef) => {
    e.preventDefault();
    e.stopPropagation();
    counterRef.current--;
    if (counterRef.current <= 0) {
      counterRef.current = 0;
      setDragActivo(false);
    }
  };

  const handleDrop = (e, setImg, setPreview, setConfirm, setShow, filename, setError, setDragActivo, counterRef) => {
    e.preventDefault();
    e.stopPropagation();
    counterRef.current = 0;
    setDragActivo(false);
    procesarArchivoImagen(e.dataTransfer.files?.[0], setImg, setPreview, setConfirm, setShow, filename, setError);
  };

  // ---------------------------------------------------------------------------
  // Search & person selection
  // ---------------------------------------------------------------------------

  const buscarPersona = async (nombre) => {
    if (!spSeleccionado) { setMensajeBusqueda('Selecciona un SP primero'); return; }
    if (!nombre || nombre.trim().length < 2) {
      setResultadosBusqueda([]); setMensajeBusqueda(''); setMostrarResultados(false); return;
    }

    setBuscando(true);
    setMostrarResultados(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_URL}/api/buscar-persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), sp: parseInt(spSeleccionado) })
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setResultadosBusqueda(result.resultados);
        setMensajeBusqueda(result.mensaje);
      } else {
        setResultadosBusqueda([]);
        setMensajeBusqueda(obtenerMensajeError(response, result, 'Error al buscar'));
      }
    } catch {
      setResultadosBusqueda([]);
      setMensajeBusqueda('Error de conexión con el servidor');
    } finally {
      setBuscando(false);
    }
  };

  const seleccionarPersona = (persona) => {
    setPersonaSeleccionada(persona);
    setBusquedaNombre(persona.nombreCompleto);
    setResultadosBusqueda([]);
    setMensajeBusqueda('');
    setMostrarResultados(false);
    setTelefonoRegistro(persona.telefono || '');
  };

  const limpiarPersona = () => {
    setPersonaSeleccionada(null);
    setBusquedaNombre('');
    setTelefonoRegistro('');
  };

  // ---------------------------------------------------------------------------
  // New person registration
  // ---------------------------------------------------------------------------

  const registrarPersonaNueva = async () => {
    if (!nombreNuevo.trim()) { setErrorCurp('El nombre completo es requerido'); return; }
    if (!curpNuevo.trim()) { setErrorCurp('El CURP es requerido'); return; }
    if (!validarCURP(curpNuevo)) { setErrorCurp('El formato del CURP no es válido (18 caracteres)'); return; }
    if (!spNuevo) { setErrorCurp('Debes seleccionar un SP'); return; }
    if (!telefonoNuevo.trim()) { setErrorCurp('El teléfono es requerido'); return; }

    setRegistrandoNuevo(true);
    setErrorCurp('');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_URL}/api/persona-nueva`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto: nombreNuevo.trim(),
          curp: curpNuevo.trim(),
          sp: parseInt(spNuevo),
          telefono: telefonoNuevo.trim()
        })
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setMensaje('✅ Usuario registrado exitosamente. Ahora puedes tomar las fotos de comprobación.');
        setPersonaSeleccionada({
          nombreCompleto: result.persona.nombreCompleto,
          curp: result.persona.curp,
          sp: result.persona.sp,
          telefono: result.persona.telefono || telefonoNuevo.trim(),
          cargo: '',
          seccion: 0
        });
        setBusquedaNombre(result.persona.nombreCompleto);
        setTelefonoRegistro(result.persona.telefono || telefonoNuevo.trim());
        setNombreNuevo(''); setCurpNuevo(''); setSpNuevo(''); setTelefonoNuevo('');
        setMostrarFormNuevo(false);
        setTimeout(() => setMensaje(''), 3000);
      } else {
        setErrorCurp(obtenerMensajeError(response, result, 'Error al registrar persona'));
      }
    } catch {
      setErrorCurp('Error de conexión con el servidor');
    } finally {
      setRegistrandoNuevo(false);
    }
  };

  const cerrarFormNuevo = () => {
    setMostrarFormNuevo(false);
    setNombreNuevo(''); setCurpNuevo(''); setSpNuevo(''); setTelefonoNuevo(''); setErrorCurp('');
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const resetForm = () => {
    setImgCredencial(null);
    updatePreview(null, setImgCredencialPreview);
    setFotoConfirmada(false);
    setShowCam(false);
    setImgComprobacion(null);
    updatePreview(null, setImgComprobacionPreview);
    setFotoComprobacionConfirmada(false);
    setShowCamComprobacion(false);
    setBusquedaNombre('');
    setPersonaSeleccionada(null);
    setTelefonoRegistro('');
    setResultadosBusqueda([]);
    setMensajeBusqueda('');
    setMensaje('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!personaSeleccionada) { setMensaje('❌ Debes seleccionar un usuario de la lista antes de continuar.'); return; }
    if (!imgCredencial) { setMensaje('❌ Debes capturar la foto de la tarjeta.'); return; }
    if (!imgComprobacion) { setMensaje('❌ Debes capturar la foto de comprobación de entrega.'); return; }
    if (!telefonoRegistro.trim()) { setMensaje('❌ Debes capturar el teléfono de la persona.'); return; }

    setLoading(true);
    try {
      const folio = generateFolio();
      const [credencialBase64, comprobacionBase64] = await Promise.all([
        readFileAsDataURL(imgCredencial),
        readFileAsDataURL(imgComprobacion)
      ]);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_URL}/api/registro-credencial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folio,
          curp: personaSeleccionada.curp || busquedaNombre,
          credencial: credencialBase64,
          comprobacion: comprobacionBase64,
          nombreCompleto: personaSeleccionada.nombreCompleto,
          telefono: telefonoRegistro.trim(),
          cargo: personaSeleccionada.cargo,
          seccion: personaSeleccionada.seccion,
          sp: personaSeleccionada.sp
        })
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setMensaje(`✅ Registro exitoso. Folio: ${result.folio}`);
        setTimeout(resetForm, 3000);
      } else {
        setMensaje(`❌ ${obtenerMensajeError(response, result, 'Error al registrar credencial')}`);
      }
    } catch {
      setMensaje('❌ Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const allReady = personaSeleccionada && fotoConfirmada && fotoComprobacionConfirmada;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex justify-center items-start py-8 px-4">
      <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#8B1538] to-[#C72044] px-6 py-5">
          <h2 className="text-xl font-bold text-white tracking-tight">Registro de Tarjetas</h2>
          <p className="text-[#F5D0DA] text-xs mt-0.5 font-medium">Completa los pasos para registrar la credencial</p>
        </div>

        <div className="p-6 space-y-6">

          {/* ── STEP 1: SP ── */}
          <div>
            <StepBadge num="1" done={!!spSeleccionado} label="Selecciona el SP" />
            <div className="mt-3">
              <CustomSelect
                value={spSeleccionado}
                placeholder="Selecciona un SP"
                options={[1,2,3,4,5,6,7,8].map(n => ({ value: n, label: `SP ${n}` }))}
                onChange={(val) => {
                  setSpSeleccionado(val);
                  setBusquedaNombre('');
                  setPersonaSeleccionada(null);
                  setResultadosBusqueda([]);
                  setMensajeBusqueda('');
                }}
              />
            </div>
            {spSeleccionado && (
              <p className="text-xs text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                <FaCheckCircle /> SP {spSeleccionado} seleccionado
              </p>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* ── STEP 2: Buscar Persona ── */}
          <div className={`transition-all duration-300 ${!spSeleccionado ? 'opacity-40 pointer-events-none' : ''}`}>
            <StepBadge num="2" done={!!personaSeleccionada} label="Buscar Persona" />

            {!personaSeleccionada ? (
              <>
                <div className="mt-3 relative">
                  <input
                    type="text"
                    value={busquedaNombre}
                    onChange={(e) => {
                      setBusquedaNombre(e.target.value);
                      if (!e.target.value.trim()) setPersonaSeleccionada(null);
                    }}
                    onFocus={() => {
                      if (resultadosBusqueda.length > 0 && !personaSeleccionada) setMostrarResultados(true);
                    }}
                    placeholder={spSeleccionado ? 'Escribe el nombre o apellido...' : 'Primero selecciona un SP'}
                    disabled={!spSeleccionado}
                    className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] focus:outline-none bg-white text-gray-700 transition-all duration-200 text-sm placeholder-gray-400"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {buscando
                      ? <FaSpinner className="animate-spin text-[#8B1538]" />
                      : <FaSearch className="text-gray-400" />
                    }
                  </div>
                </div>

                {/* Search dropdown */}
                {mostrarResultados && busquedaNombre.trim().length >= 2 && (
                  <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto animate-fadeIn">
                    {buscando ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        <FaSpinner className="animate-spin inline mr-2 text-[#8B1538]" />
                        Buscando...
                      </div>
                    ) : resultadosBusqueda.length > 0 ? (
                      <>
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium rounded-t-xl">
                          {mensajeBusqueda}
                        </div>
                        {resultadosBusqueda.map((persona, i) => (
                          <div
                            key={i}
                            onClick={() => seleccionarPersona(persona)}
                            className="px-4 py-3 hover:bg-[#FFF5F7] cursor-pointer border-b border-gray-50 transition-colors last:border-0"
                          >
                            <div className="font-semibold text-gray-800 text-sm">{persona.nombreCompleto}</div>
                            <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
                              <span>{persona.cargo || 'Sin cargo'}</span>
                              <span>Sección {persona.seccion || 'N/A'}</span>
                              <span>SP {persona.sp}</span>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No se encontraron resultados
                      </div>
                    )}
                  </div>
                )}

                {spSeleccionado && busquedaNombre.trim().length < 2 && (
                  <p className="text-xs text-gray-400 mt-1.5">Escribe al menos 2 caracteres para buscar</p>
                )}

                {/* Register new person */}
                <div className="mt-3">
                  {!mostrarFormNuevo ? (
                    <button
                      type="button"
                      onClick={() => { setMostrarFormNuevo(true); setMostrarResultados(false); }}
                      className="text-[#8B1538] text-xs font-medium hover:underline flex items-center gap-1.5"
                    >
                      <span className="w-4 h-4 rounded-full bg-[#8B1538] text-white text-[9px] flex items-center justify-center font-bold">?</span>
                      ¿No aparece en la lista? Registrar persona nueva
                    </button>
                  ) : (
                    <div className="border-2 border-[#8B1538]/20 bg-blue-50/40 rounded-xl p-4 animate-fadeIn">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[#8B1538] font-bold text-sm">Registrar Nueva Persona</h3>
                        <button type="button" onClick={cerrarFormNuevo} className="text-gray-400 hover:text-gray-600 p-0.5">
                          <FaTimes />
                        </button>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-gray-600 font-medium text-xs mb-1 block">SP <span className="text-red-500">*</span></label>
                          <CustomSelect
                            value={spNuevo}
                            placeholder="Selecciona un SP"
                            options={[1,2,3,4,5,6,7,8].map(n => ({ value: n, label: `SP ${n}` }))}
                            onChange={(val) => { setSpNuevo(val); setErrorCurp(''); }}
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium text-xs mb-1 block">Nombre Completo <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={nombreNuevo}
                            onChange={(e) => { setNombreNuevo(e.target.value.toUpperCase()); setErrorCurp(''); }}
                            placeholder="NOMBRE COMPLETO"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] focus:outline-none uppercase text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium text-xs mb-1 block">CURP <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            value={curpNuevo}
                            onChange={(e) => {
                              const v = e.target.value.toUpperCase().slice(0, 18);
                              setCurpNuevo(v);
                              setErrorCurp('');
                              if (v.length === 18 && !validarCURP(v)) setErrorCurp('Formato de CURP inválido');
                            }}
                            placeholder="18 CARACTERES"
                            maxLength="18"
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none uppercase text-sm
                              ${errorCurp && curpNuevo.length > 0
                                ? 'border-red-400 focus:ring-red-300'
                                : 'border-gray-200 focus:ring-[#8B1538]/30 focus:border-[#8B1538]'}`}
                          />
                          {curpNuevo.length > 0 && (
                            <p className={`text-xs mt-0.5 ${validarCURP(curpNuevo) ? 'text-emerald-600' : 'text-orange-500'}`}>
                              {curpNuevo.length}/18 {validarCURP(curpNuevo) ? '· Válido ✓' : ''}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-600 font-medium text-xs mb-1 block">Teléfono <span className="text-red-500">*</span></label>
                          <input
                            type="tel"
                            value={telefonoNuevo}
                            onChange={(e) => { setTelefonoNuevo(e.target.value); setErrorCurp(''); }}
                            placeholder="5551234567"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#8B1538]/30 focus:border-[#8B1538] focus:outline-none text-sm"
                          />
                        </div>
                        {errorCurp && (
                          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
                            {errorCurp}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={registrarPersonaNueva}
                          disabled={registrandoNuevo || !nombreNuevo.trim() || !curpNuevo.trim() || curpNuevo.length !== 18 || !spNuevo || !telefonoNuevo.trim()}
                          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
                            ${registrandoNuevo || !nombreNuevo.trim() || !curpNuevo.trim() || curpNuevo.length !== 18 || !spNuevo || !telefonoNuevo.trim()
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            }`}
                        >
                          {registrandoNuevo
                            ? <><FaSpinner className="animate-spin" /> Registrando...</>
                            : '✓ Registrar y Continuar'
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Selected person card */
              <div className="mt-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4 animate-fadeIn">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FaUserCheck className="text-emerald-600 text-base" />
                    </div>
                    <div>
                      <p className="text-gray-800 font-bold text-sm">{personaSeleccionada.nombreCompleto}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {personaSeleccionada.cargo || 'Sin cargo'} · Sección {personaSeleccionada.seccion || 'N/A'} · SP {personaSeleccionada.sp}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={limpiarPersona} className="text-gray-400 hover:text-gray-600 p-1" title="Cambiar persona">
                    <FaTimes />
                  </button>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <label className="text-gray-600 font-medium text-xs mb-1 block uppercase tracking-wide">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={telefonoRegistro}
                    onChange={(e) => setTelefonoRegistro(e.target.value)}
                    placeholder="Ej. 5551234567"
                    className="w-full px-3 py-2 rounded-lg border-2 border-emerald-200 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 focus:outline-none text-sm bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100" />

          {/* ── STEP 3: Foto de Tarjeta ── */}
          <div className={`transition-all duration-300 ${!personaSeleccionada ? 'opacity-40 pointer-events-none' : ''}`}>
            <StepBadge num="3" done={fotoConfirmada} label="Foto de Tarjeta" />
            <p className="text-gray-400 text-xs mt-1 ml-[42px]">Toma una foto clara de la tarjeta</p>

            <div className="mt-3">
              {!showCam && !fotoConfirmada && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowCam(true)}
                    className="w-full bg-[#8B1538] text-white py-3.5 rounded-xl hover:bg-[#A01A43] active:scale-[0.99] transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                  >
                    <FaCamera /> Abrir Cámara
                  </button>
                  <ImageDropZone
                    isDragActive={dragActivoCredencial}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, setDragActivoCredencial, dragCounterCredencial)}
                    onDragLeave={(e) => handleDragLeave(e, setDragActivoCredencial, dragCounterCredencial)}
                    onDrop={(e) => handleDrop(e, setImgCredencial, setImgCredencialPreview, setFotoConfirmada, setShowCam, 'tarjeta.jpg', setErrorArchivoCredencial, setDragActivoCredencial, dragCounterCredencial)}
                    onClick={() => fileInputCredencialRef.current?.click()}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputCredencialRef.current?.click()}
                    error={errorArchivoCredencial}
                    inputRef={fileInputCredencialRef}
                    onFileChange={(e) => handleFileUpload(e, setImgCredencial, setImgCredencialPreview, setFotoConfirmada, setShowCam, 'tarjeta.jpg', setErrorArchivoCredencial)}
                  />
                </div>
              )}

              {showCam && (
                <div className="flex flex-col items-center animate-fadeIn">
                  <div ref={containerRefTarjeta} className="relative w-full aspect-video border-4 border-[#8B1538] rounded-xl overflow-hidden shadow-md">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      videoConstraints={videoConstraints}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-2 border-2 border-white/40 border-dashed rounded-lg pointer-events-none" />
                    <div className="absolute top-2 left-0 right-0 text-center">
                      <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                        Coloca la tarjeta dentro del marco
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 w-full">
                    <button
                      type="button"
                      onClick={() => capture(webcamRef, containerRefTarjeta, setImgCredencial, setImgCredencialPreview, setFotoConfirmada, setShowCam, 'tarjeta.jpg')}
                      className="flex-1 bg-[#8B1538] text-white py-3 rounded-xl hover:bg-[#A01A43] transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      <FaCamera /> Capturar
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCam(false)}
                      className="px-5 bg-gray-100 text-gray-600 py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {fotoConfirmada && imgCredencialPreview && (
                <div className="rounded-xl overflow-hidden border-2 border-emerald-200 animate-fadeIn">
                  <div className="relative">
                    <img src={imgCredencialPreview} alt="Foto de tarjeta" className="w-full h-44 object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                      <FaCheckCircle className="text-sm" />
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-emerald-50 flex items-center justify-between">
                    <p className="text-emerald-700 font-medium text-xs">Foto capturada correctamente</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFotoConfirmada(false);
                        setImgCredencial(null);
                        updatePreview(null, setImgCredencialPreview);
                        // Reset comprobacion too since it depends on this step
                        setFotoComprobacionConfirmada(false);
                        setImgComprobacion(null);
                        updatePreview(null, setImgComprobacionPreview);
                      }}
                      className="text-[#8B1538] text-xs font-medium hover:underline"
                    >
                      Cambiar foto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── STEP 4: Foto de Comprobación (appears after step 3) ── */}
          {fotoConfirmada && (
            <>
              <div className="h-px bg-gray-100" />
              <div className="animate-fadeIn">
                <StepBadge num="4" done={fotoComprobacionConfirmada} label="Foto de Comprobación" />
                <p className="text-gray-400 text-xs mt-1 ml-[42px]">Foto del comprobante de entrega</p>

                <div className="mt-3">
                  {!showCamComprobacion && !fotoComprobacionConfirmada && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setShowCamComprobacion(true)}
                        className="w-full bg-[#8B1538] text-white py-3.5 rounded-xl hover:bg-[#A01A43] active:scale-[0.99] transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm"
                      >
                        <FaCamera /> Abrir Cámara
                      </button>
                      <ImageDropZone
                        isDragActive={dragActivoComprobacion}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, setDragActivoComprobacion, dragCounterComprobacion)}
                        onDragLeave={(e) => handleDragLeave(e, setDragActivoComprobacion, dragCounterComprobacion)}
                        onDrop={(e) => handleDrop(e, setImgComprobacion, setImgComprobacionPreview, setFotoComprobacionConfirmada, setShowCamComprobacion, 'comprobacion.jpg', setErrorArchivoComprobacion, setDragActivoComprobacion, dragCounterComprobacion)}
                        onClick={() => fileInputComprobacionRef.current?.click()}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputComprobacionRef.current?.click()}
                        error={errorArchivoComprobacion}
                        inputRef={fileInputComprobacionRef}
                        onFileChange={(e) => handleFileUpload(e, setImgComprobacion, setImgComprobacionPreview, setFotoComprobacionConfirmada, setShowCamComprobacion, 'comprobacion.jpg', setErrorArchivoComprobacion)}
                      />
                    </div>
                  )}

                  {showCamComprobacion && (
                    <div className="flex flex-col items-center animate-fadeIn">
                      <div ref={containerRefComprobacion} className="relative w-full aspect-video border-4 border-[#8B1538] rounded-xl overflow-hidden shadow-md">
                        <Webcam
                          audio={false}
                          ref={webcamRefComprobacion}
                          videoConstraints={videoConstraints}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-2 border-2 border-white/40 border-dashed rounded-lg pointer-events-none" />
                        <div className="absolute top-2 left-0 right-0 text-center">
                          <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                            Coloca el comprobante dentro del marco
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 w-full">
                        <button
                          type="button"
                          onClick={() => capture(webcamRefComprobacion, containerRefComprobacion, setImgComprobacion, setImgComprobacionPreview, setFotoComprobacionConfirmada, setShowCamComprobacion, 'comprobacion.jpg')}
                          className="flex-1 bg-[#8B1538] text-white py-3 rounded-xl hover:bg-[#A01A43] transition-colors font-semibold text-sm flex items-center justify-center gap-2"
                        >
                          <FaCamera /> Capturar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCamComprobacion(false)}
                          className="px-5 bg-gray-100 text-gray-600 py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {fotoComprobacionConfirmada && imgComprobacionPreview && (
                    <div className="rounded-xl overflow-hidden border-2 border-emerald-200 animate-fadeIn">
                      <div className="relative">
                        <img src={imgComprobacionPreview} alt="Foto de comprobación" className="w-full h-44 object-cover" />
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-md">
                          <FaCheckCircle className="text-sm" />
                        </div>
                      </div>
                      <div className="px-3 py-2 bg-emerald-50 flex items-center justify-between">
                        <p className="text-emerald-700 font-medium text-xs">Comprobante capturado correctamente</p>
                        <button
                          type="button"
                          onClick={() => {
                            setFotoComprobacionConfirmada(false);
                            setImgComprobacion(null);
                            updatePreview(null, setImgComprobacionPreview);
                          }}
                          className="text-[#8B1538] text-xs font-medium hover:underline"
                        >
                          Cambiar foto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-gray-100" />

          {/* ── STEP 5: Submit ── */}
          <div>
            <StepBadge num="5" done={!!allReady} label="Finalizar Registro" />
            <div className="mt-3">
              {loading ? (
                <div className="w-full bg-[#8B1538]/90 text-white py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <FaSpinner className="animate-spin" />
                  <span className="font-semibold text-sm">Procesando registro...</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!allReady}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
                    ${allReady
                      ? 'bg-[#8B1538] text-white hover:bg-[#A01A43] hover:shadow-md active:scale-[0.99] shadow-sm'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <FaCheckCircle />
                  {!personaSeleccionada
                    ? 'Primero selecciona un usuario'
                    : !fotoConfirmada
                      ? 'Falta foto de la tarjeta'
                      : !fotoComprobacionConfirmada
                        ? 'Falta foto de comprobación'
                        : 'Registrar Tarjeta'
                  }
                </button>
              )}
            </div>
          </div>

          {/* Feedback message */}
          {mensaje && (
            <div className={`p-4 rounded-xl text-sm font-medium text-center animate-fadeIn
              ${mensaje.includes('✅')
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'}`}
            >
              {mensaje}
            </div>
          )}

        </div>
      </form>
    </div>
  );
}
