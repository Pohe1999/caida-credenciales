const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

async function subirPrioritarios() {
  try {
    // Conectar a MongoDB
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado a MongoDB Atlas');

    // Leer archivo JSON
    const jsonPath = path.join(__dirname, '../lista-prioritarios.json');
    console.log('📖 Leyendo archivo JSON...');
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`📊 Total de registros a subir: ${data.length}`);

    // Limpiar colección existente
    console.log('🗑️  Limpiando colección anterior...');
    await PersonaPrioritaria.deleteMany({});

    // Transformar y subir datos
    console.log('⬆️  Subiendo datos a MongoDB...');
    const registros = data
      .map(item => ({
        nombreCompleto: item['NOMBRE COMPLETO'] || item.nombreCompleto || '',
        cargo: item['CARGO'] || item.cargo || '',
        seccion: item['SECCION'] || item.seccion || 0,
        sp: item['SP'] || item.sp || 0,
        curp: item['CURP'] || item.curp || ''
      }))
      .filter(item => item.nombreCompleto && item.nombreCompleto.trim() !== ''); // Filtrar registros sin nombre

    console.log(`📊 Registros válidos a insertar: ${registros.length}`);

    // Insertar en lotes de 100 para mejor rendimiento
    const batchSize = 100;
    let insertados = 0;

    for (let i = 0; i < registros.length; i += batchSize) {
      const batch = registros.slice(i, i + batchSize);
      await PersonaPrioritaria.insertMany(batch);
      insertados += batch.length;
      console.log(`   Progreso: ${insertados}/${registros.length} (${Math.round(insertados/registros.length*100)}%)`);
    }

    console.log('✅ ¡Datos subidos exitosamente!');
    console.log(`📊 Total de registros insertados: ${insertados}`);

    // Verificar algunos registros
    const muestra = await PersonaPrioritaria.find().limit(3);
    console.log('\n📋 Muestra de registros:');
    muestra.forEach((p, i) => {
      console.log(`${i + 1}. ${p.nombreCompleto} - ${p.cargo} (Sección: ${p.seccion})`);
    });

    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada. Proceso completado.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

subirPrioritarios();
