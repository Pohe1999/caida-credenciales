# Sistema de Búsqueda de Personas Prioritarias

## 📋 Descripción

El sistema ahora utiliza **MongoDB** en lugar de archivos Excel para buscar personas prioritarias. Esto mejora significativamente el rendimiento y permite búsquedas más rápidas.

## 🚀 Configuración Inicial

### 1. Convertir Excel a JSON (si es necesario)

Si tienes el archivo `lista-prioritarios.xlsx`, conviértelo a JSON:

```bash
cd backend
node -e "const xlsx = require('xlsx'); const fs = require('fs'); const workbook = xlsx.readFile('../lista-prioritarios.xlsx'); const sheetName = workbook.SheetNames[0]; const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]); fs.writeFileSync('lista-prioritarios.json', JSON.stringify(data, null, 2)); console.log('Convertido:', data.length, 'registros');"
```

### 2. Subir Datos a MongoDB

Ejecuta el script para cargar los datos:

```bash
npm run seed-prioritarios
```

O directamente:

```bash
node scripts/subir-prioritarios.js
```

Esto:
- ✅ Limpia la colección anterior
- ✅ Sube 872 registros válidos a MongoDB
- ✅ Crea índices para búsqueda rápida
- ✅ Muestra progreso en tiempo real

## 📊 Estructura de Datos

Cada persona prioritaria tiene:

```javascript
{
  nombreCompleto: "MARIA CRISTINA HERNANDEZ ESQUIVEL",
  cargo: "VOCAL",
  seccion: 4198,
  sp: 1,
  curp: "" // Opcional
}
```

## 🔍 API Endpoint

### POST `/api/buscar-persona`

**Request:**
```json
{
  "nombre": "maria"
}
```

**Response:**
```json
{
  "success": true,
  "resultados": [
    {
      "nombreCompleto": "MARIA CRISTINA HERNANDEZ ESQUIVEL",
      "cargo": "VOCAL",
      "seccion": 4198,
      "sp": 1,
      "curp": ""
    }
  ],
  "total": 10,
  "mensaje": "10 resultado(s) encontrado(s)"
}
```

## 🎯 Características

- ✅ **Búsqueda rápida** con MongoDB (regex insensible a mayúsculas)
- ✅ **Límite de 10 resultados** por búsqueda
- ✅ **Mínimo 2 caracteres** para buscar
- ✅ **Búsqueda parcial** en nombre completo
- ✅ **Índices optimizados** para mejor rendimiento

## 🔧 Mantenimiento

### Actualizar datos

Cuando necesites actualizar la lista de personas:

1. Coloca el nuevo archivo Excel o JSON
2. Ejecuta: `npm run seed-prioritarios`
3. Los datos anteriores se eliminarán y se cargarán los nuevos

### Verificar datos cargados

```bash
# En MongoDB Compass o desde mongo shell
use caida-credenciales
db.getCollection('personas-prioritarias').countDocuments()
db.getCollection('personas-prioritarias').find().limit(5)
```

## 📦 Colección MongoDB

- **Nombre:** `personas-prioritarias`
- **Base de datos:** `caida-credenciales`
- **Índices:** 
  - `nombreCompleto` (text index para búsqueda)
  - `nombreCompleto` (regular index)

## 🎨 Frontend

El componente `Formulario-credencial.jsx` ahora:

1. ✅ Reemplaza el campo CURP por buscador de nombre
2. ✅ Búsqueda dinámica con delay de 500ms
3. ✅ Muestra resultados en dropdown
4. ✅ Al seleccionar, muestra: Nombre, Cargo, Sección, SP
5. ✅ Solo permite tomar foto después de seleccionar usuario

## 📝 Notas

- El archivo `lista-prioritarios.xlsx` ya no se usa en runtime
- Todos los datos están en MongoDB para mayor velocidad
- Se filtran 54 registros sin nombre completo (de 926 a 872)
