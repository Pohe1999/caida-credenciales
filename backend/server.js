const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================================
// MIDDLEWARES DE SEGURIDAD Y CONFIGURACIÓN
// ===========================================

// Helmet para seguridad HTTP
app.use(helmet());

// Compresión de respuestas
app.use(compression());

// CORS configurado para desarrollo local y producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, 'https://registro-tarjetas.netlify.app']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Rate limiting - limitar solicitudes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 solicitudes por ventana por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  }
});
app.use('/api', limiter);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// ===========================================
// CONEXIÓN A MONGODB ATLAS
// ===========================================

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Atlas conectado: ${conn.connection.host}`);
    console.log(`📊 Base de datos: ${conn.connection.name}`);
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

// ===========================================
// MODELOS DE DATOS - ADAPTADO A TU ESTRUCTURA REAL
// ===========================================

// Modelo basado en tu estructura real: { _id, seccion, curp, telefono, __v }
const UsuarioAutorizadoSchema = new mongoose.Schema({
  seccion: String,
  curp: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  telefono: String
}, {
  strict: false, // Permite campos adicionales
  collection: 'usuarios' // Tu colección real
});

const UsuarioAutorizado = mongoose.model('UsuarioAutorizado', UsuarioAutorizadoSchema);

// Modelo para registros de credenciales (nueva colección)
const RegistroCredencialSchema = new mongoose.Schema({
  folio: {
    type: String,
    required: true,
    unique: true
  },
  curp: {
    type: String,
    required: false,
    uppercase: true,
    trim: true
  },
  nombreCompleto: {
    type: String,
    required: false,
    trim: true
  },
  cargo: {
    type: String,
    required: false,
    trim: true
  },
  seccion: {
    type: Number,
    required: false
  },
  sp: {
    type: Number,
    required: false
  },
  imagenCredencial: {
    type: String, // Base64 de la imagen
    required: true
  },
  imagenComprobacion: {
    type: String, // Base64 de la imagen de comprobación
    required: false
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  // Información adicional del registro
  metadata: {
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    browserInfo: String
  }
}, {
  timestamps: true, // createdAt y updatedAt automáticos
  collection: 'registros-credenciales' // Nombre claro para la nueva colección
});

const RegistroCredencial = mongoose.model('RegistroCredencial', RegistroCredencialSchema);

// Modelo para personas prioritarias
const PersonaPrioritariaSchema = new mongoose.Schema({
  nombreCompleto: {
    type: String,
    required: true,
    index: true
  },
  cargo: String,
  seccion: Number,
  sp: Number,
  curp: String
}, {
  collection: 'personas-prioritarias',
  timestamps: true
});

// Índice de texto para búsqueda eficiente
PersonaPrioritariaSchema.index({ nombreCompleto: 'text' });

const PersonaPrioritaria = mongoose.model('PersonaPrioritaria', PersonaPrioritariaSchema);

// ===========================================
// RUTAS DE LA API
// ===========================================

// Endpoint para registrar persona nueva
app.post('/api/persona-nueva', async (req, res) => {
  try {
    const { nombreCompleto, curp, sp } = req.body;

    // Validaciones
    if (!nombreCompleto || !nombreCompleto.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El nombre completo es requerido'
      });
    }

    if (!curp || !curp.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El CURP es requerido'
      });
    }

    // Validar formato de CURP
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
    if (!curpRegex.test(curp.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'El formato del CURP no es válido'
      });
    }

    if (!sp) {
      return res.status(400).json({
        success: false,
        error: 'El SP es requerido'
      });
    }

    console.log(`📝 Registrando nueva persona: ${nombreCompleto} con CURP: ${curp}`);

    // Verificar si ya existe una persona con ese CURP
    const personaExistente = await PersonaPrioritaria.findOne({ 
      curp: curp.toUpperCase() 
    });

    if (personaExistente) {
      console.log(`⚠️ CURP ya existe: ${curp.toUpperCase()}`);
      return res.status(409).json({
        success: false,
        error: 'Ya existe una persona registrada con este CURP'
      });
    }

    // Crear nueva persona
    const nuevaPersona = new PersonaPrioritaria({
      nombreCompleto: nombreCompleto.trim().toUpperCase(),
      curp: curp.trim().toUpperCase(),
      sp: parseInt(sp),
      cargo: '',
      seccion: 0
    });

    const personaGuardada = await nuevaPersona.save();
    
    console.log(`✅ Persona registrada exitosamente: ${personaGuardada.nombreCompleto}`);

    res.status(201).json({
      success: true,
      message: 'Persona registrada exitosamente',
      persona: {
        nombreCompleto: personaGuardada.nombreCompleto,
        curp: personaGuardada.curp,
        sp: personaGuardada.sp,
        cargo: personaGuardada.cargo,
        seccion: personaGuardada.seccion
      }
    });

  } catch (error) {
    console.error('❌ Error registrando persona nueva:', error);
    
    // Manejar error de duplicado por si acaso
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una persona con estos datos'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al registrar persona'
    });
  }
});

// Endpoint para buscar personas en MongoDB
app.post('/api/buscar-persona', async (req, res) => {
  try {
    const { nombre, sp } = req.body;
    
    if (!nombre || nombre.trim().length < 2) {
      return res.json({
        success: false,
        resultados: [],
        mensaje: 'Escribe al menos 2 caracteres para buscar'
      });
    }

    if (!sp) {
      return res.json({
        success: false,
        resultados: [],
        mensaje: 'Debes seleccionar un SP'
      });
    }

    // Normalizar texto de búsqueda
    const busqueda = nombre.trim();
    
    // Buscar en MongoDB usando regex para búsqueda parcial (insensible a mayúsculas) y filtrar por SP
    const resultados = await PersonaPrioritaria.find({
      nombreCompleto: { $regex: busqueda, $options: 'i' },
      sp: parseInt(sp)
    })
    .limit(10)
    .select('nombreCompleto cargo seccion sp curp -_id')
    .lean();

    // Formatear resultados
    const resultadosFormateados = resultados.map(persona => ({
      nombreCompleto: persona.nombreCompleto,
      cargo: persona.cargo || '',
      seccion: persona.seccion || 0,
      sp: persona.sp || 0,
      curp: persona.curp || ''
    }));

    res.json({
      success: true,
      resultados: resultadosFormateados,
      total: resultadosFormateados.length,
      mensaje: resultadosFormateados.length === 0 ? 'Usuario no encontrado' : `${resultadosFormateados.length} resultado(s) encontrado(s)`
    });

  } catch (error) {
    console.error('Error buscando persona:', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar en la base de datos',
      resultados: []
    });
  }
});

// Ruta de prueba mejorada
app.get('/api/test', (req, res) => {
  res.json({ 
    message: '🚀 Servidor backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: mongoose.connection?.name || 'desconocida',
    collection: process.env.CURP_COLLECTION_NAME || 'usuarios'
  });
});

// Endpoint para debuggear la base de datos
app.get('/api/debug/database', async (req, res) => {
  try {
    // Obtener información de la base de datos
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    // Contar documentos en la colección de usuarios
    const userCount = await UsuarioAutorizado.countDocuments();
    
    // Obtener algunos documentos de ejemplo (sin mostrar datos sensibles)
    const sampleDocs = await UsuarioAutorizado.find({}, { curp: 1, _id: 1 }).limit(5);
    
    res.json({
      success: true,
      database: db.databaseName,
      collections: collections.map(c => c.name),
      targetCollection: process.env.CURP_COLLECTION_NAME || 'usuarios',
      documentsInUserCollection: userCount,
      sampleCurps: sampleDocs.map(doc => doc.curp?.substring(0, 8) + '...' || 'sin CURP'),
      mongoUri: process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':***@') // Ocultar password
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Endpoint para probar un CURP específico con más detalles
app.post('/api/debug/test-curp', async (req, res) => {
  try {
    const { curp } = req.body;
    
    if (!curp) {
      return res.status(400).json({
        success: false,
        error: 'CURP requerido'
      });
    }

    console.log(`🔍 DEBUG - Buscando CURP: ${curp.toUpperCase()}`);
    console.log(`🗂️  En colección: ${process.env.CURP_COLLECTION_NAME || 'usuarios'}`);
    console.log(`🗄️  Base de datos: ${mongoose.connection?.name || 'desconocida'}`);

    // Buscar con diferentes variaciones
    const queries = [
      { curp: curp.toUpperCase() },
      { curp: curp.toLowerCase() },
      { CURP: curp.toUpperCase() },
      { $text: { $search: curp.toUpperCase() } }
    ];

    const results = [];

    for (let i = 0; i < queries.length; i++) {
      try {
        const result = await UsuarioAutorizado.findOne(queries[i]);
        results.push({
          query: queries[i],
          found: !!result,
          doc: result ? { 
            curp: result.curp,
            fields: Object.keys(result.toObject())
          } : null
        });
        
        if (result) {
          console.log(`✅ Encontrado con query ${i + 1}:`, queries[i]);
          break;
        }
      } catch (err) {
        results.push({
          query: queries[i],
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      searchedCurp: curp.toUpperCase(),
      results: results,
      collectionUsed: process.env.CURP_COLLECTION_NAME || 'usuarios'
    });

  } catch (error) {
    console.error('Error en test CURP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validar CURP en tu base de datos existente
app.post('/api/validate-curp', async (req, res) => {
  try {
    const { curp } = req.body;

    // Validación básica
    if (!curp || typeof curp !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'CURP es requerido'
      });
    }

    // Validación de formato
    const curpRegex = /^[A-Z]{4}\d{6}[A-Z]{6}[A-Z0-9]{2}$/;
    if (!curpRegex.test(curp.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: 'Formato de CURP inválido'
      });
    }

    console.log(`🔍 Buscando CURP: ${curp.toUpperCase()} en colección "usuarios"`);

    // Buscar en tu base de datos (estructura simple: solo verificar que existe)
    const usuarioAutorizado = await UsuarioAutorizado.findOne({ 
      curp: curp.toUpperCase()
    });

    if (usuarioAutorizado) {
      console.log(`✅ CURP encontrado: ${curp.toUpperCase()}`);
      res.json({
        success: true,
        message: 'Usuario autorizado para registro'
      });
    } else {
      console.log(`❌ CURP no encontrado: ${curp.toUpperCase()}`);
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado en la base de datos'
      });
    }

  } catch (error) {
    console.error('Error validando CURP:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al validar CURP'
    });
  }
});

// Registrar credencial (mejorado)
app.post('/api/registro-credencial', async (req, res) => {
  try {
    const { folio, curp, credencial, comprobacion, nombreCompleto, cargo, seccion, sp } = req.body;

    console.log(`📝 Intentando registrar credencial para: ${nombreCompleto || curp || 'sin identificador'}`);

    // Validaciones básicas: el usuario ya fue validado por selección de nombre
    if (!folio || !credencial || !nombreCompleto) {
      console.log('❌ Datos incompletos en el registro');
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos: folio, nombreCompleto, credencial'
      });
    }

    // CURP es opcional; si viene lo almacenamos sin bloquear el flujo
    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
    const tieneCurpValido = curp && curpRegex.test(curp.toUpperCase());

    // Verificar que no exista ya un registro con el mismo folio
    const registroExistenteFolio = await RegistroCredencial.findOne({ folio });
    if (registroExistenteFolio) {
      console.log(`❌ Folio duplicado: ${folio}`);
      return res.status(409).json({
        success: false,
        error: 'El folio ya existe. Intenta de nuevo.'
      });
    }

    // Verificar que no exista ya un registro para esta persona (por nombre completo)
    const registroExistenteNombre = await RegistroCredencial.findOne({ 
      nombreCompleto: nombreCompleto.trim() 
    });
    if (registroExistenteNombre) {
      console.log(`❌ Ya existe un registro para: ${nombreCompleto}`);
      return res.status(409).json({
        success: false,
        error: `Ya existe un registro de credencial para ${nombreCompleto}`
      });
    }

    // Crear el nuevo registro
    console.log(`💾 Creando nuevo registro con folio: ${folio}`);
    const nuevoRegistro = new RegistroCredencial({
      folio,
      curp: tieneCurpValido ? curp.toUpperCase() : '',
      nombreCompleto: nombreCompleto || '',
      cargo: cargo || '',
      seccion: seccion || 0,
      sp: sp || 0,
      imagenCredencial: credencial,
      imagenComprobacion: comprobacion || '',
      fechaRegistro: new Date(),
      metadata: {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown',
        timestamp: new Date(),
        browserInfo: req.get('User-Agent') || 'Unknown'
      }
    });

    // Guardar en la base de datos
    const registroGuardado = await nuevoRegistro.save();
    
    console.log(`✅ Registro guardado exitosamente con ID: ${registroGuardado._id}`);
    console.log(`📊 Total de registros en BD: ${await RegistroCredencial.countDocuments()}`);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Credencial registrada exitosamente',
      folio: registroGuardado.folio,
      fechaRegistro: registroGuardado.fechaRegistro,
      id: registroGuardado._id
    });

  } catch (error) {
    console.error('❌ Error registrando credencial:', error);
    
    // Manejar errores específicos de MongoDB
    if (error.code === 11000) {
      // Error de duplicado
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `Ya existe un registro con este ${field}`
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al registrar credencial'
    });
  }
});

// Obtener estadísticas mejoradas
app.get('/api/estadisticas', async (req, res) => {
  try {
    const totalUsuariosAutorizados = await UsuarioAutorizado.countDocuments();
    const totalRegistros = await RegistroCredencial.countDocuments();
    
    // Registros de hoy
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);
    
    const registrosHoy = await RegistroCredencial.countDocuments({
      fechaRegistro: {
        $gte: inicioHoy,
        $lt: finHoy
      }
    });
    
    // Registros de la última semana
    const unaSemanaAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const registrosSemana = await RegistroCredencial.countDocuments({
      fechaRegistro: { $gte: unaSemanaAtras }
    });

    res.json({
      success: true,
      estadisticas: {
        usuariosAutorizados: totalUsuariosAutorizados,
        totalRegistros: totalRegistros,
        registrosHoy: registrosHoy,
        registrosSemana: registrosSemana,
        ultimaActualizacion: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Obtener registros recientes (para administración)
app.get('/api/registros-recientes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const registros = await RegistroCredencial.find({}, {
      folio: 1,
      curp: 1,
      fechaRegistro: 1,
      'metadata.ipAddress': 1,
      createdAt: 1
    })
    .sort({ fechaRegistro: -1 })
    .skip(skip)
    .limit(limit);

    const total = await RegistroCredencial.countDocuments();

    res.json({
      success: true,
      registros: registros,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error obteniendo registros:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Buscar registro por CURP o folio
app.get('/api/buscar-registro/:termino', async (req, res) => {
  try {
    const { termino } = req.params;
    
    // Buscar por CURP o folio
    const registro = await RegistroCredencial.findOne({
      $or: [
        { curp: termino.toUpperCase() },
        { folio: termino }
      ]
    }, {
      imagenCredencial: 0 // Excluir la imagen para performance
    });

    if (registro) {
      res.json({
        success: true,
        registro: registro
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'No se encontró registro con ese CURP o folio'
      });
    }

  } catch (error) {
    console.error('Error buscando registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para manejar errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// Middleware global de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// ===========================================
// INICIAR SERVIDOR
// ===========================================

const startServer = async () => {
  try {
    // Conectar a MongoDB
    await connectDB();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📝 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API disponible en: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
};

startServer();

// Manejo elegante de cierre del servidor
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await mongoose.connection.close();
  console.log('✅ Conexión a MongoDB cerrada');
  process.exit(0);
});

module.exports = app;