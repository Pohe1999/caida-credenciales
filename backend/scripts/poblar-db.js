const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Modelo de Usuario Autorizado
const UsuarioAutorizadoSchema = new mongoose.Schema({
  curp: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  activo: {
    type: Boolean,
    default: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const UsuarioAutorizado = mongoose.model('UsuarioAutorizado', UsuarioAutorizadoSchema);

// CURPs de ejemplo para testing
const curpsDeEjemplo = [
  'ABCD123456HDFXYZ01',
  'EFGH789012MDFABC02',
  'IJKL345678HDFMNO03',
  'MNOP901234HDFPQR04',
  'QRST567890MDFSTU05',
  'UVWX123456HDFVWX06',
  'YZAB789012MDFYZA07',
  'CDEF345678HDFCDE08',
  'GHIJ901234MDFGHI09',
  'KLMN567890HDFKLM10'
];

const poblarBaseDeDatos = async () => {
  try {
    console.log('🔄 Iniciando población de base de datos...');
    
    // Limpiar datos existentes
    await UsuarioAutorizado.deleteMany({});
    console.log('🧹 Datos anteriores eliminados');
    
    // Insertar CURPs de ejemplo
    for (const curp of curpsDeEjemplo) {
      const usuario = new UsuarioAutorizado({
        curp: curp,
        activo: true
      });
      
      await usuario.save();
      console.log(`✅ Agregado CURP: ${curp}`);
    }
    
    console.log(`🎉 ¡Base de datos poblada exitosamente con ${curpsDeEjemplo.length} CURPs!`);
    console.log('\n📋 CURPs disponibles para pruebas:');
    curpsDeEjemplo.forEach((curp, index) => {
      console.log(`   ${index + 1}. ${curp}`);
    });
    
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  connectDB().then(() => poblarBaseDeDatos());
}

module.exports = { poblarBaseDeDatos, curpsDeEjemplo };