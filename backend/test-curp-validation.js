const mongoose = require('mongoose');
require('dotenv').config();

const testCurpValidation = async () => {
  try {
    // Conectar
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado a MongoDB Atlas');
    
    // Definir el modelo (igual que en server.js)
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
      strict: false,
      collection: 'usuarios'
    });
    
    const UsuarioAutorizado = mongoose.model('TestUsuarioAutorizado', UsuarioAutorizadoSchema);
    
    // Obtener algunos CURPs reales para probar
    console.log('🔍 Obteniendo algunos CURPs de tu base de datos...');
    const sampleUsers = await UsuarioAutorizado.find({}, { curp: 1, seccion: 1 }).limit(3);
    
    console.log('\n📋 CURPs de ejemplo en tu base de datos:');
    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. CURP: ${user.curp} - Sección: ${user.seccion}`);
    });
    
    // Probar la validación con el primer CURP
    if (sampleUsers.length > 0) {
      const testCurp = sampleUsers[0].curp;
      console.log(`\n🧪 Probando validación con: ${testCurp}`);
      
      const foundUser = await UsuarioAutorizado.findOne({ 
        curp: testCurp.toUpperCase()
      });
      
      if (foundUser) {
        console.log('✅ Validación exitosa - Usuario encontrado');
        console.log('   Datos:', {
          curp: foundUser.curp,
          seccion: foundUser.seccion,
          telefono: foundUser.telefono ? 'Sí' : 'No'
        });
      } else {
        console.log('❌ Validación falló - Usuario no encontrado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

testCurpValidation();