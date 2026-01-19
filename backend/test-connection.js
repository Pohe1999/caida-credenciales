const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔄 Conectando a MongoDB Atlas...');
console.log('📊 Base de datos objetivo: caida-credenciales');

const connectAndExplore = async () => {
  try {
    // Conectar
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conectado exitosamente!');
    console.log('🏠 Host:', conn.connection.host);
    console.log('🗄️ Base de datos:', conn.connection.name);
    
    // Listar todas las colecciones
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📋 Colecciones disponibles:');
    collections.forEach((collection, index) => {
      console.log(`   ${index + 1}. ${collection.name}`);
    });
    
    // Verificar la colección "usuarios"
    if (collections.some(c => c.name === 'usuarios')) {
      console.log('\n🔍 Explorando colección "usuarios":');
      
      const usuariosCollection = db.collection('usuarios');
      const totalDocs = await usuariosCollection.countDocuments();
      console.log(`   📊 Total de documentos: ${totalDocs}`);
      
      if (totalDocs > 0) {
        // Obtener un documento de ejemplo
        const sampleDoc = await usuariosCollection.findOne({});
        console.log('\n📄 Ejemplo de documento:');
        console.log('   Campos disponibles:', Object.keys(sampleDoc));
        
        if (sampleDoc.curp) {
          console.log('   ✅ Campo CURP encontrado:', sampleDoc.curp.substring(0, 8) + '...');
        } else if (sampleDoc.CURP) {
          console.log('   ✅ Campo CURP encontrado (mayúsculas):', sampleDoc.CURP.substring(0, 8) + '...');
        } else {
          console.log('   ❌ No se encontró campo CURP en el documento');
        }
        
        // Buscar documentos que tengan algún campo relacionado con CURP
        const curpFieldQuery = await usuariosCollection.findOne({
          $or: [
            { curp: { $exists: true } },
            { CURP: { $exists: true } },
            { Curp: { $exists: true } }
          ]
        });
        
        if (curpFieldQuery) {
          console.log('   ✅ Documentos con CURP encontrados');
        } else {
          console.log('   ❌ No se encontraron documentos con campo CURP');
        }
      }
    } else {
      console.log('\n❌ No se encontró la colección "usuarios"');
      console.log('💡 Colecciones disponibles:', collections.map(c => c.name).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('🔑 Problema de autenticación - verifica usuario y contraseña');
    } else if (error.message.includes('network')) {
      console.log('🌐 Problema de red - verifica tu conexión a internet');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada');
    process.exit(0);
  }
};

connectAndExplore();