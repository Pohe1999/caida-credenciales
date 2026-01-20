import React, { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Webcam from 'react-webcam';
import { FaCheckCircle, FaSpinner, FaExclamationTriangle, FaUserCheck, FaSearch } from 'react-icons/fa';

export default function RegistroForm() {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm();
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  const webcamRef = useRef(null);

  const [imgCredencial, setImgCredencial] = useState(null);
  const [showCam, setShowCam] = useState(false);
  const [fotoConfirmada, setFotoConfirmada] = useState(false);

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

  const videoConstraints = {
    width: { ideal: 1920, max: 1920 },
    height: { ideal: 1080, max: 1080 },
    facingMode: 'environment',
    frameRate: { ideal: 30, max: 60 },
    focusMode: 'continuous',
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

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    ctx.drawImage(video, 0, 0);

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
      setMensaje('Debes capturar la foto de la credencial.');
      return;
    }

    setLoading(true);
    
    try {
      const folio = generateFolio();
      
      // Convertir imagen a base64 para enviar al backend
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
          const response = await fetch(`${API_URL}/api/registro-credencial`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              folio,
              curp: personaSeleccionada.curp || busquedaNombre, // Usar CURP si existe, sino el nombre
              credencial: reader.result, // base64
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
              setMensaje('');
              setBusquedaNombre('');
              setPersonaSeleccionada(null);
              setResultadosBusqueda([]);
              setMensajeBusqueda('');
            }, 3000);
          } else {
            setMensaje(`❌ ${result.error}`);
            
            // Si es error de duplicado, recargar página después de 3 segundos
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
      
      reader.readAsDataURL(imgCredencial);
      
    } catch (error) {
      setMensaje('❌ Error al procesar el registro');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center p-4" style={{fontFamily: 'Verdana, sans-serif'}}>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-[#8B1538] mb-6 text-center">Registro de tarjetas</h2>

        {/* Selector de SP */}
        <div className="mb-6">
          <label className="text-[#8B1538] font-semibold block mb-3 text-sm uppercase tracking-wide">
            Selecciona el SP
          </label>
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
              <option value="" className="text-gray-400">-- Selecciona un SP --</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num} className="py-2">
                  SP {num}
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
        <div className="mb-6">
          <label className="text-[#8B1538] font-semibold block mb-2">Buscar Persona:</label>
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
              className={`w-full p-3 rounded-lg border transition-all duration-300 ${
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
            <div className="absolute z-10 w-full max-w-lg mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {buscando ? (
                <div className="p-4 text-center text-gray-600">
                  <FaSpinner className="animate-spin inline mr-2" />
                  Buscando...
                </div>
              ) : resultadosBusqueda.length > 0 ? (
                <>
                  <div className="p-2 bg-gray-100 border-b border-gray-200 text-sm text-gray-600">
                    {mensajeBusqueda}
                  </div>
                  {resultadosBusqueda.map((persona, index) => (
                    <div
                      key={index}
                      onClick={() => seleccionarPersona(persona)}
                      className="p-3 hover:bg-[#FFF5F7] cursor-pointer border-b border-gray-100 transition-colors"
                    >
                      <div className="font-semibold text-gray-800">{persona.nombreCompleto}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Cargo:</span> {persona.cargo || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
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

        {/* Foto de Credencial */}
        <div className="mb-6">
          <label className="text-[#8B1538] font-semibold block mb-3 text-center text-lg">Foto de comprobación</label>
          <p className="text-gray-600 text-sm text-center mb-4">La foto debe ser clara y legible</p>
          {!showCam && (
            <button 
              type="button" 
              onClick={() => setShowCam(true)} 
              className="w-full bg-[#991B3A] text-white py-4 rounded-lg hover:bg-[#8B1538] transition-colors duration-300 text-lg font-semibold"
            >
              📷 Abrir Cámara para Tomar comprobación
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
                <div className="absolute inset-2 border-2 border-[#C72044] border-dashed rounded-md pointer-events-none opacity-60"></div>
                <div className="absolute top-2 left-2 right-2 text-center">
                  <span className="bg-[#8B1538]/80 text-white text-xs px-2 py-1 rounded">
                    Coloca la tarjeta aquí
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => capture(webcamRef, setImgCredencial, setFotoConfirmada, setShowCam, 'credencial.jpg')}
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
              <p className="text-[#991B3A] font-medium">✅ Tarjeta capturada correctamente</p>
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

        {/* Botón de Envío */}
        <div className="mb-4">
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
              disabled={!personaSeleccionada || !fotoConfirmada}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-lg shadow-md transition-all duration-300 flex items-center justify-center ${
                personaSeleccionada && fotoConfirmada
                  ? 'bg-gradient-to-r from-[#8B1538] to-[#991B3A] text-white hover:from-[#991B3A] hover:to-[#C72044] hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#991B3A] focus:ring-offset-2'
                  : 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-60'
              }`}
            >
              <FaCheckCircle className="mr-2" />
              {!personaSeleccionada ? 'Selecciona un usuario' : !fotoConfirmada ? 'Falta capturar foto' : 'Registrar tarjeta'}
            </button>
          )}
          
          {/* Indicadores de requisitos */}
          <div className="mt-3 space-y-1 text-xs">
            <div className={`flex items-center ${personaSeleccionada ? 'text-green-600' : 'text-gray-500'}`}>
              {personaSeleccionada ? '✅' : '⏳'} Usuario seleccionado de la lista
            </div>
            <div className={`flex items-center ${fotoConfirmada ? 'text-green-600' : 'text-gray-500'}`}>
              {fotoConfirmada ? '✅' : '⏳'} Foto de credencial capturada
            </div>
          </div>
        </div>

        {mensaje && (
          <div className="text-center">
            <p className="text-[#8B1538] font-medium">{mensaje}</p>
          </div>
        )}
      </form>
    </div>
  );
}