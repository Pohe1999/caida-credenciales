import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Webcam from 'react-webcam';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaUserCheck, FaSearch } from 'react-icons/fa';

export default function RegistroForm() {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm();
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);
  const webcamRefComprobacion = useRef(null);

  const [imgCredencial, setImgCredencial] = useState(null);
  const [showCam, setShowCam] = useState(false);
  const [fotoConfirmada, setFotoConfirmada] = useState(false);

  // Estados para foto de comprobación de entrega
  const [imgComprobacion, setImgComprobacion] = useState(null);
  const [showCamComprobacion, setShowCamComprobacion] = useState(false);
  const [fotoComprobacionConfirmada, setFotoComprobacionConfirmada] = useState(false);

  // Estados para búsqueda de personas
  const [spSeleccionado, setSpSeleccionado] = useState('');
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [mensajeBusqueda, setMensajeBusqueda] = useState('');

  // Timeout para búsqueda con delay
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Estados para registro de persona nueva
  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [curpNuevo, setCurpNuevo] = useState('');
  const [spNuevo, setSpNuevo] = useState('');
  const [registrandoNuevo, setRegistrandoNuevo] = useState(false);
  const [errorCurp, setErrorCurp] = useState('');

  const videoConstraints = {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    facingMode: 'environment',
    frameRate: { ideal: 30, max: 60 },
    focusMode: 'continuous',
  };

  // Margen porcentual para el recuadro de guía (coincide con el recorte)
  const OVERLAY_MARGIN_RATIO = 0.1; // 10% de margen en cada lado

  // Función para validar formato de CURP mexicano
  const validarCURP = (curp) => {
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
    return curpRegex.test(curp.toUpperCase());
  };

  // Función para registrar persona nueva
  const registrarPersonaNueva = async () => {
    if (!nombreNuevo.trim()) {
      setErrorCurp('El nombre completo es requerido');
      return;
    }

    if (!curpNuevo.trim()) {
      setErrorCurp('El CURP es requerido');
      return;
    }

    if (!validarCURP(curpNuevo)) {
      setErrorCurp('El formato del CURP no es válido. Debe tener 18 caracteres');
      return;
    }

    if (!spNuevo) {
      setErrorCurp('Debes seleccionar un SP');
      return;
    }

    setRegistrandoNuevo(true);
    setErrorCurp('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_URL}/api/persona-nueva`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombreCompleto: nombreNuevo.trim(),
          curp: curpNuevo.trim(),
          sp: parseInt(spNuevo)
        })
      });

      const result = await response.json();

      if (result.success) {
        setMensaje('✅ Usuario registrado exitosamente. Ahora puedes tomar las fotos de comprobación.');
        
        setPersonaSeleccionada({
          nombreCompleto: result.persona.nombreCompleto,
          curp: result.persona.curp,
          sp: result.persona.sp,
          cargo: '',
          seccion: 0
        });

        setNombreNuevo('');
        setCurpNuevo('');
        setSpNuevo('');
        setMostrarFormNuevo(false);
        setBusquedaNombre(result.persona.nombreCompleto);
        
        setTimeout(() => {
          setMensaje('');
        }, 3000);
      } else {
        setErrorCurp(result.error || 'Error al registrar persona');
      }
    } catch (error) {
      console.error('Error registrando persona nueva:', error);
      setErrorCurp('Error de conexión con el servidor');
    } finally {
      setRegistrandoNuevo(false);
    }
  };

  // Función para buscar personas en el Excel
  const buscarPersona = async (nombre) => {
    if (!spSeleccionado) {
      setMensajeBusqueda('Selecciona un SP primero');
      return;
    }

    if (!nombre || nombre.trim().length < 2) {
      setResultadosBusqueda([]);
      setMensajeBusqueda('');
      setMostrarResultados(false);
      return;
    }

    setBuscando(true);
    setMostrarResultados(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
      const response = await fetch(`${API_URL}/api/buscar-persona`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre: nombre.trim(), sp: parseInt(spSeleccionado) })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResultadosBusqueda(result.resultados);
        setMensajeBusqueda(result.mensaje);
      } else {
        setResultadosBusqueda([]);
        setMensajeBusqueda('Error al buscar');
      }
    } catch (error) {
      console.error('Error buscando persona:', error);
      setResultadosBusqueda([]);
      setMensajeBusqueda('Error de conexión con el servidor');
    } finally {
      setBuscando(false);
    }
  };

  // Effect para búsqueda dinámica con delay
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (busquedaNombre.trim().length >= 2) {
      const timeout = setTimeout(() => {
        buscarPersona(busquedaNombre);
      }, 500); // Delay de 500ms después de dejar de escribir
      
      setSearchTimeout(timeout);
    } else {
      setResultadosBusqueda([]);
      setMensajeBusqueda('');
      setMostrarResultados(false);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [busquedaNombre]);

  // Función para seleccionar una persona de los resultados
  const seleccionarPersona = (persona) => {
    setPersonaSeleccionada(persona);
    setBusquedaNombre(persona.nombreCompleto);
    setResultadosBusqueda([]);
    setMensajeBusqueda('');
    setMostrarResultados(false);
    setValue('curp', persona.curp || ''); // Si hay CURP en el Excel
  };

  const capture = (ref, setImg, setConfirm, setShow, filename) => {
    const video = ref.current?.video;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.imageSmoothingEnabled = false;

    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    // Calcular recorte según margen porcentual
    const marginX = Math.round(videoWidth * OVERLAY_MARGIN_RATIO);
    const marginY = Math.round(videoHeight * OVERLAY_MARGIN_RATIO);
    const cropX = marginX;
    const cropY = marginY;
    const cropWidth = Math.max(1, videoWidth - marginX * 2);
    const cropHeight = Math.max(1, videoHeight - marginY * 2);

    canvas.width = cropWidth;
    canvas.height = cropHeight;
    // Recortar del video la región visible del recuadro
    ctx.drawImage(
      video,
      cropX, // sx
      cropY, // sy
      cropWidth, // sWidth
      cropHeight, // sHeight
      0, // dx
      0, // dy
      cropWidth, // dWidth
      cropHeight // dHeight
    );

    canvas.toBlob(
      blob => {
        const file = new File([blob], filename.replace('.png', '.jpg'), { type: 'image/jpeg' });
        setImg(file);
        setConfirm(true);
        setShow(false);
      },
      'image/jpeg',
      0.9
    );
  };

  const generateFolio = () => {
    const date = new Date();
    return `REG-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-5)}`;
  };

  const onSubmit = async (data) => {
    // Verificar que se haya seleccionado una persona
    if (!personaSeleccionada) {
      setMensaje('❌ Debes seleccionar un usuario de la lista antes de continuar.');
      return;
    }

    if (!imgCredencial) {
      setMensaje('❌ Debes capturar la foto de la tarjeta.');
      return;
    }

    if (!imgComprobacion) {
      setMensaje('❌ Debes capturar la foto de comprobación de entrega.');
      return;
    }

    setLoading(true);
    
    try {
      const folio = generateFolio();
      
      // Convertir imágenes a base64 para enviar al backend
      const readerCredencial = new FileReader();
      const readerComprobacion = new FileReader();
      
      let credencialBase64 = '';
      let comprobacionBase64 = '';
      
      // Leer primera imagen
      readerCredencial.onload = () => {
        credencialBase64 = readerCredencial.result;
        
        // Leer segunda imagen
        readerComprobacion.onload = async () => {
          comprobacionBase64 = readerComprobacion.result;
          
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
            const response = await fetch(`${API_URL}/api/registro-credencial`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                folio,
                curp: personaSeleccionada.curp || busquedaNombre,
                credencial: credencialBase64,
                comprobacion: comprobacionBase64,
                nombreCompleto: personaSeleccionada.nombreCompleto,
                cargo: personaSeleccionada.cargo,
                seccion: personaSeleccionada.seccion,
                sp: personaSeleccionada.sp
              })
            });
            
            const result = await response.json();
            
            if (result.success) {
              setMensaje(`✅ Registro exitoso. Folio: ${result.folio}`);
              setTimeout(() => {
                reset();
                setImgCredencial(null);
                setFotoConfirmada(false);
                setShowCam(false);
                setImgComprobacion(null);
                setFotoComprobacionConfirmada(false);
                setShowCamComprobacion(false);
                setMensaje('');
                setBusquedaNombre('');
                setPersonaSeleccionada(null);
                setResultadosBusqueda([]);
                setMensajeBusqueda('');
              }, 3000);
            } else {
              setMensaje(`❌ ${result.error}`);
              
              if (result.error && result.error.includes('Ya existe un registro de credencial para')) {
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }
            }
          } catch (error) {
            console.error('Error enviando al backend:', error);
            setMensaje('❌ Error al conectar con el servidor');
          } finally {
            setLoading(false);
          }
        };
        
        readerComprobacion.readAsDataURL(imgComprobacion);
      };
      
      readerCredencial.readAsDataURL(imgCredencial);
      
    } catch (error) {
      setMensaje('❌ Error al procesar el registro');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4" style={{fontFamily: 'Verdana, sans-serif'}}>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-gray-200">
        <h2 className="text-xl md:text-3xl font-bold text-[#8B1538] mb-6 text-center">Registro de tarjetas</h2>

        {/* Selector de SP */}
        <div className="mb-6 pb-6 border-b-2 border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${spSeleccionado ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>1</span>
            <label className="text-[#8B1538] font-semibold text-sm uppercase tracking-wide">
              Selecciona el SP
            </label>
          </div>
          <div className="relative">
            <select
              value={spSeleccionado}
              onChange={(e) => {
                setSpSeleccionado(e.target.value);
                setBusquedaNombre('');
                setPersonaSeleccionada(null);
                setResultadosBusqueda([]);
                setMensajeBusqueda('');
              }}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 focus:ring-2 focus:ring-[#991B3A] focus:border-[#991B3A] focus:outline-none bg-white text-gray-700 font-medium transition-all duration-300 hover:border-[#C72044] cursor-pointer appearance-none shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238B1538'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5rem'
              }}
            >
              <option value="" className="text-gray-400"> Selecciona un SP </option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num} className="py-2">
                  {num}
                </option>
              ))}
            </select>
            {spSeleccionado && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </span>
              </div>
            )}
          </div>
          {spSeleccionado && (
            <p className="text-xs text-green-600 mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              SP {spSeleccionado} seleccionado
            </p>
          )}
        </div>

        {/* Buscador de Personas */}
        <div className={`mb-6 pb-6 border-b-2 border-gray-100 transition-all duration-300 ${!spSeleccionado ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${personaSeleccionada ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>2</span>
            <label className="text-[#8B1538] font-semibold text-sm md:text-base">Buscar Persona</label>
          </div>
          <div className="relative">
            <input
              type="text"
              value={busquedaNombre}
              onChange={(e) => {
                setBusquedaNombre(e.target.value);
                if (!e.target.value.trim()) {
                  setPersonaSeleccionada(null);
                }
              }}
              onFocus={() => {
                if (resultadosBusqueda.length > 0 && !personaSeleccionada) {
                  setMostrarResultados(true);
                }
              }}
              placeholder={spSeleccionado ? "Escribe el nombre o apellido..." : "Primero selecciona un SP"}
              disabled={!spSeleccionado}
              className={`w-full px-3.5 py-3 rounded-lg border transition-all duration-300 text-sm md:text-base ${
                !spSeleccionado 
                  ? 'bg-gray-100 cursor-not-allowed border-gray-300'
                  : personaSeleccionada
                    ? 'border-green-500 focus:ring-green-500 focus:border-green-500 bg-green-50'
                    : 'border-gray-300 focus:ring-[#991B3A] focus:border-[#991B3A]'
              } focus:outline-none focus:ring-2 bg-white text-gray-700 placeholder-gray-400`}
            />
            
            {/* Indicador de estado en el input */}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {buscando ? (
                <FaSpinner className="animate-spin text-[#991B3A]" />
              ) : personaSeleccionada ? (
                <FaUserCheck className="text-green-500" />
              ) : (
                <FaSearch className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {mostrarResultados && !personaSeleccionada && busquedaNombre.trim().length >= 2 && (
            <div className="absolute z-10 left-1/2 transform -translate-x-1/2 w-11/12 max-w-lg mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {buscando ? (
                <div className="p-4 text-center text-gray-600">
                  <FaSpinner className="animate-spin inline mr-2" />
                  Buscando...
                </div>
              ) : resultadosBusqueda.length > 0 ? (
                <>
                  <div className="p-2 bg-gray-100 border-b border-gray-200 text-xs md:text-sm text-gray-600">
                    {mensajeBusqueda}
                  </div>
                  {resultadosBusqueda.map((persona, index) => (
                    <div
                      key={index}
                      onClick={() => seleccionarPersona(persona)}
                      className="p-3 hover:bg-[#FFF5F7] cursor-pointer border-b border-gray-100 transition-colors"
                    >
                      <div className="font-semibold text-gray-800 text-sm md:text-base">{persona.nombreCompleto}</div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        <span className="font-medium">Cargo:</span> {persona.cargo || 'N/A'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 mt-1">
                        <span className="mr-3">
                          <span className="font-medium">Sección:</span> {persona.seccion || 'N/A'}
                        </span>
                        <span>
                          <span className="font-medium">SP:</span> {persona.sp || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-red-600">
                  ❌ {mensajeBusqueda || 'Usuario no encontrado'}
                </div>
              )}
            </div>
          )}

          {/* Información de persona seleccionada */}
          {personaSeleccionada && (
            <div className="mt-3 p-4 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center mb-2">
                <FaUserCheck className="text-green-600 mr-2 text-xl" />
                <span className="text-green-800 font-bold">✅ Usuario encontrado</span>
              </div>
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Nombre:</span>{' '}
                  <span className="text-gray-800">{personaSeleccionada.nombreCompleto}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Cargo:</span>{' '}
                  <span className="text-gray-800">{personaSeleccionada.cargo || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Sección:</span>{' '}
                  <span className="text-gray-800">{personaSeleccionada.seccion || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">SP:</span>{' '}
                  <span className="text-gray-800">{personaSeleccionada.sp || 'N/A'}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPersonaSeleccionada(null);
                  setBusquedaNombre('');
                }}
                className="text-[#991B3A] text-sm underline hover:text-[#8B1538] mt-2"
              >
                Buscar otra persona
              </button>
            </div>
          )}

          {/* Instrucciones */}
          {!personaSeleccionada && !spSeleccionado && (
            <p className="text-sm text-gray-600 mt-2">
              💡 Primero selecciona un SP
            </p>
          )}
          {!personaSeleccionada && spSeleccionado && busquedaNombre.trim().length < 2 && (
            <p className="text-sm text-gray-600 mt-2">
              💡 Escribe al menos 2 caracteres para buscar
            </p>
          )}
        </div>

        {/* Botón discreto para registrar persona nueva - SIEMPRE HABILITADO */}
        {!personaSeleccionada && (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setMostrarFormNuevo(true);
                setMostrarResultados(false);
                setBusquedaNombre('');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium shadow-sm bg-[#FFF5F7] text-[#8B1538] border-[#F5D0DA] hover:bg-[#FCE7EF] hover:border-[#F0B3C3] hover:shadow transition-colors"
              title="¿No aparece en la lista? Registrar persona"
            >
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#8B1538] text-white text-[10px] font-bold">?</span>
              ¿No aparece en la lista? Registrar persona
            </button>
          </div>
        )}

        {/* Formulario para registrar persona nueva - SIEMPRE HABILITADO */}
        {mostrarFormNuevo && !personaSeleccionada && (
          <div className="mb-6 p-4 bg-blue-50 border-2 border-[#8B1538] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#8B1538] font-bold text-lg">📝 Registrar Nueva Persona</h3>
              <button
                type="button"
                onClick={() => {
                  setMostrarFormNuevo(false);
                  setNombreNuevo('');
                  setCurpNuevo('');
                  setSpNuevo('');
                  setErrorCurp('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Selector de SP para persona nueva */}
              <div>
                <label className="text-gray-700 font-semibold block mb-1 text-sm">
                  SP: <span className="text-red-500">*</span>
                </label>
                <select
                  value={spNuevo}
                  onChange={(e) => {
                    setSpNuevo(e.target.value);
                    setErrorCurp('');
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] focus:outline-none text-sm"
                >
                  <option value="">Selecciona un SP</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              {/* Campo Nombre Completo */}
              <div>
                <label className="text-gray-700 font-semibold block mb-1 text-sm">
                  Nombre Completo: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombreNuevo}
                  onChange={(e) => {
                    setNombreNuevo(e.target.value.toUpperCase());
                    setErrorCurp('');
                  }}
                  placeholder="NOMBRE COMPLETO EN MAYÚSCULAS"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538] focus:outline-none uppercase text-sm"
                />
              </div>

              {/* Campo CURP */}
              <div>
                <label className="text-gray-700 font-semibold block mb-1 text-sm">
                  CURP: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={curpNuevo}
                  onChange={(e) => {
                    const valor = e.target.value.toUpperCase().slice(0, 18);
                    setCurpNuevo(valor);
                    setErrorCurp('');
                    
                    if (valor.length === 18 && !validarCURP(valor)) {
                      setErrorCurp('Formato de CURP inválido');
                    }
                  }}
                  placeholder="18 CARACTERES"
                  maxLength="18"
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:outline-none uppercase text-sm ${
                    errorCurp && curpNuevo.length > 0
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-[#8B1538] focus:border-[#8B1538]'
                  }`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: 4 letras, 6 números, H o M, 5 letras, 2 alfanuméricos
                </p>
                {curpNuevo.length > 0 && (
                  <p className={`text-xs mt-1 ${validarCURP(curpNuevo) ? 'text-green-600' : 'text-orange-600'}`}>
                    {curpNuevo.length}/18 caracteres {validarCURP(curpNuevo) ? '✓ Válido' : ''}
                  </p>
                )}
              </div>

              {/* Mensaje de error */}
              {errorCurp && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  ⚠️ {errorCurp}
                </div>
              )}

              {/* Botón de registro */}
              <button
                type="button"
                onClick={registrarPersonaNueva}
                disabled={registrandoNuevo || !nombreNuevo.trim() || !curpNuevo.trim() || curpNuevo.length !== 18 || !spNuevo}
                className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-colors ${
                  registrandoNuevo || !nombreNuevo.trim() || !curpNuevo.trim() || curpNuevo.length !== 18 || !spNuevo
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {registrandoNuevo ? (
                  <>
                    <FaSpinner className="animate-spin inline mr-2" />
                    Registrando...
                  </>
                ) : (
                  '✓ Registrar y Continuar'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Foto de Tarjeta */}
        <div className={`mb-6 pb-6 border-b-2 border-gray-100 transition-all duration-300 ${!personaSeleccionada ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${fotoConfirmada ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>3</span>
            <label className="text-[#8B1538] font-semibold text-base">Foto de Tarjeta</label>
          </div>
          <p className="text-gray-600 text-sm mb-4 ml-10">Toma una foto clara de la tarjeta</p>
          {!showCam && (
            <button 
              type="button" 
              onClick={() => setShowCam(true)} 
              className="w-full bg-[#991B3A] text-white py-4 rounded-lg hover:bg-[#8B1538] transition-colors duration-300 text-lg font-semibold"
            >
              📷 Abrir Cámara para Tomar Foto de Tarjeta
            </button>
          )}
          {showCam && (
            <div className="flex flex-col items-center">
              <div className="relative w-full max-w-sm aspect-2/3 border-4 border-[#991B3A] rounded-lg overflow-hidden mb-4 shadow-lg">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  videoConstraints={videoConstraints}
                  className="w-full h-full object-cover"
                />
                {/* Guía visual para alineación */}
                <div className="absolute inset-[10%] border-2 border-[#C72044] border-dashed rounded-md pointer-events-none opacity-60"></div>
                <div className="absolute top-2 left-2 right-2 text-center">
                  <span className="bg-[#8B1538]/80 text-white text-xs px-2 py-1 rounded">
                    Coloca la tarjeta aquí
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => capture(webcamRef, setImgCredencial, setFotoConfirmada, setShowCam, 'tarjeta.jpg')}
                  className="bg-[#991B3A] text-white py-3 px-6 rounded-lg hover:bg-[#8B1538] transition-colors duration-300 font-semibold"
                >
                  📸 Capturar
                </button>
                <button
                  type="button"
                  onClick={() => setShowCam(false)}
                  className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {fotoConfirmada && (
            <div className="text-center mt-4">
              <p className="text-[#991B3A] font-medium">✅ Foto de tarjeta capturada correctamente</p>
              <button
                type="button"
                onClick={() => {
                  setFotoConfirmada(false);
                  setImgCredencial(null);
                }}
                className="text-[#991B3A] text-sm underline hover:text-[#8B1538] mt-2"
              >
                Tomar otra foto
              </button>
            </div>
          )}
        </div>

        {/* Foto de Comprobación de Entrega - Solo aparece después de la primera foto */}
        {fotoConfirmada && (
          <div className="mb-6 pb-6 border-b-2 border-gray-100 animate-fadeIn">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${fotoComprobacionConfirmada ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>4</span>
              <label className="text-[#8B1538] font-semibold text-base">Foto de Comprobación</label>
            </div>
            <p className="text-gray-600 text-sm mb-4 ml-10">Toma una foto clara del comprobante de entrega</p>
            {!showCamComprobacion && (
              <button 
                type="button" 
                onClick={() => setShowCamComprobacion(true)} 
                className="w-full bg-[#991B3A] text-white py-4 rounded-lg hover:bg-[#8B1538] transition-colors duration-300 text-lg font-semibold"
              >
                📷 Abrir Cámara para Tomar Foto de Comprobación
              </button>
            )}
            {showCamComprobacion && (
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-sm aspect-2/3 border-4 border-[#991B3A] rounded-lg overflow-hidden mb-4 shadow-lg">
                  <Webcam
                    audio={false}
                    ref={webcamRefComprobacion}
                    videoConstraints={videoConstraints}
                    className="w-full h-full object-cover"
                  />
                  {/* Guía visual para alineación */}
                  <div className="absolute inset-[10%] border-2 border-[#C72044] border-dashed rounded-md pointer-events-none opacity-60"></div>
                  <div className="absolute top-2 left-2 right-2 text-center">
                    <span className="bg-[#8B1538]/80 text-white text-xs px-2 py-1 rounded">
                      Coloca el comprobante aquí
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => capture(webcamRefComprobacion, setImgComprobacion, setFotoComprobacionConfirmada, setShowCamComprobacion, 'comprobacion.jpg')}
                    className="bg-[#991B3A] text-white py-3 px-6 rounded-lg hover:bg-[#8B1538] transition-colors duration-300 font-semibold"
                  >
                    📸 Capturar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCamComprobacion(false)}
                    className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-300"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
            {fotoComprobacionConfirmada && (
              <div className="text-center mt-4">
                <p className="text-[#991B3A] font-medium">✅ Foto de comprobación capturada correctamente</p>
                <button
                  type="button"
                  onClick={() => {
                    setFotoComprobacionConfirmada(false);
                    setImgComprobacion(null);
                  }}
                  className="text-[#991B3A] text-sm underline hover:text-[#8B1538] mt-2"
                >
                  Tomar otra foto
                </button>
              </div>
            )}
          </div>
        )}

        {/* Botón de Envío */}
        <div className={`mb-4 transition-all duration-300 ${!personaSeleccionada || !fotoConfirmada || !fotoComprobacionConfirmada ? 'opacity-50' : 'opacity-100'}`}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${personaSeleccionada && fotoConfirmada && fotoComprobacionConfirmada ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>5</span>
            <h3 className="text-[#8B1538] font-semibold text-base">Finalizar Registro</h3>
          </div>
          {loading ? (
            <button
              type="button"
              className="w-full bg-[#991B3A] text-white py-3 px-4 rounded-lg flex items-center justify-center opacity-75 cursor-not-allowed transition-all duration-300"
              disabled
            >
              <FaSpinner className="animate-spin mr-2 text-lg" />
              Procesando...
            </button>
          ) : (
            <button
              type="submit"
              disabled={!personaSeleccionada || !fotoConfirmada || !fotoComprobacionConfirmada}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-lg shadow-md transition-all duration-300 flex items-center justify-center ${
                personaSeleccionada && fotoConfirmada && fotoComprobacionConfirmada
                  ? 'bg-gradient-to-r from-[#8B1538] to-[#991B3A] text-white hover:from-[#991B3A] hover:to-[#C72044] hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#991B3A] focus:ring-offset-2'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
              }`}
            >
              <FaCheckCircle className="mr-2" />
              {!personaSeleccionada ? 'Selecciona un usuario' : !fotoConfirmada ? 'Falta foto de tarjeta' : !fotoComprobacionConfirmada ? 'Falta foto de comprobación' : 'Registrar tarjeta'}
            </button>
          )}
        </div>

        {mensaje && (
          <div className={`text-center p-4 rounded-lg ${mensaje.includes('✅') ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`font-medium ${mensaje.includes('✅') ? 'text-green-700' : 'text-red-700'}`}>{mensaje}</p>
          </div>
        )}
      </form>
    </div>
  );
}