const mongoose = require('mongoose');
require('dotenv').config();

const testRegistroCompleto = async () => {
  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    
    // Conectar
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado exitosamente');
    
    // Definir modelos
    const UsuarioAutorizadoSchema = new mongoose.Schema({
      seccion: String,
      curp: String,
      telefono: String
    }, {
      strict: false,
      collection: 'usuarios'
    });
    
    const RegistroCredencialSchema = new mongoose.Schema({
      folio: String,
      curp: String,
      imagenCredencial: String,
      fechaRegistro: { type: Date, default: Date.now },
      metadata: {
        ipAddress: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now }
      }
    }, {
      timestamps: true,
      collection: 'registros-credenciales'
    });
    
    const UsuarioAutorizado = mongoose.model('TestUsuarioAutorizado2', UsuarioAutorizadoSchema);
    const RegistroCredencial = mongoose.model('TestRegistroCredencial2', RegistroCredencialSchema);
    
    // Obtener un CURP válido para probar
    console.log('🔍 Obteniendo CURP válido para probar...');
    const usuarioValido = await UsuarioAutorizado.findOne({});
    
    if (!usuarioValido) {
      console.log('❌ No se encontraron usuarios en la base de datos');
      return;
    }
    
    console.log(`✅ Usuario encontrado: ${usuarioValido.curp}`);
    
    // Generar folio de prueba
    const folio = `TEST-${Date.now()}`;
    const imagenBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA+Q1JFQVR...'; // Imagen de prueba
    
    // Crear registro de prueba
    console.log('💾 Creando registro de prueba...');
    const nuevoRegistro = new RegistroCredencial({
      folio: folio,
      curp: usuarioValido.curp,
      imagenCredencial: imagenBase64,
      metadata: {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
        timestamp: new Date()
      }
    });
    
    const registroGuardado = await nuevoRegistro.save();
    
    console.log('✅ Registro creado exitosamente:');
    console.log(`   - ID: ${registroGuardado._id}`);
    console.log(`   - Folio: ${registroGuardado.folio}`);
    console.log(`   - CURP: ${registroGuardado.curp}`);
    console.log(`   - Fecha: ${registroGuardado.fechaRegistro}`);
    
    // Verificar que se guardó correctamente
    const registroVerificado = await RegistroCredencial.findById(registroGuardado._id);
    console.log('✅ Verificación exitosa - registro encontrado en BD');
    
    // Contar total de registros
    const totalRegistros = await RegistroCredencial.countDocuments();
    console.log(`📊 Total de registros en BD: ${totalRegistros}`);
    
    // Limpiar el registro de prueba (opcional)
    console.log('🧹 Limpiando registro de prueba...');
    await RegistroCredencial.deleteOne({ _id: registroGuardado._id });
    console.log('✅ Registro de prueba eliminado');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.code === 11000) {
      console.log('   Error de duplicado - el registro ya existe');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
};

testRegistroCompleto();