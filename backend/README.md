# 🏗️ Backend - Gestor de Credenciales

Backend para el sistema de gestión y validación de credenciales con verificación CURP.

## 🚀 Instalación y Configuración

### 1. Instalar dependencias
```bash
cd backend
npm install
```

### 2. Configurar variables de entorno
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita las variables según tu configuración
nano .env
```

### 3. Configurar MongoDB
- **Opción A - Local:** Instala MongoDB localmente
- **Opción B - Atlas:** Crea una cuenta en [MongoDB Atlas](https://cloud.mongodb.com/)

### 4. Poblar base de datos (opcional para testing)
```bash
npm run seed
```

### 5. Iniciar servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📦 Dependencias Principales

- **Express.js** - Framework web
- **Mongoose** - ODM para MongoDB
- **Helmet** - Seguridad HTTP
- **CORS** - Configuración de CORS
- **Morgan** - Logging de requests
- **Multer** - Manejo de archivos
- **Rate Limit** - Limitación de solicitudes

## 🔧 API Endpoints

### Validación de CURP
```http
POST /api/validate-curp
Content-Type: application/json

{
  "curp": "ABCD123456HDFXYZ01"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario autorizado para registro"
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "error": "Usuario no encontrado en la base de datos"
}
```

### Registro de Credencial
```http
POST /api/registro-credencial
Content-Type: application/json

{
  "folio": "REG-20241110-12345",
  "curp": "ABCD123456HDFXYZ01",
  "credencial": "base64_image_data"
}
```

### Estadísticas
```http
GET /api/estadisticas
```

### Test de conectividad
```http
GET /api/test
```

## 🗄️ Estructura de Base de Datos

### Colección: usuariosautorizados
```javascript
{
  curp: String,        // CURP único del usuario
  activo: Boolean,     // Si el usuario está activo
  fechaRegistro: Date, // Fecha de registro
  createdAt: Date,     // Auto-generado por mongoose
  updatedAt: Date      // Auto-generado por mongoose
}
```

### Colección: registrocredencials
```javascript
{
  folio: String,          // Folio único del registro
  curp: String,           // CURP del usuario
  imagenCredencial: String, // Imagen en base64 o ruta
  fechaRegistro: Date,    // Fecha del registro
  ipAddress: String,      // IP del cliente
  userAgent: String,      // User-Agent del cliente
  createdAt: Date,        // Auto-generado
  updatedAt: Date         // Auto-generado
}
```

## 🔒 Seguridad Implementada

- ✅ Helmet para headers de seguridad
- ✅ Rate limiting (100 req/15min por IP)
- ✅ Validación de datos de entrada
- ✅ CORS configurado
- ✅ Sanitización de inputs
- ✅ Logging de requests

## 🛠️ Scripts Disponibles

```json
{
  "start": "node server.js",           // Producción
  "dev": "nodemon server.js",          // Desarrollo con auto-reload
  "seed": "node scripts/poblar-db.js"  // Poblar BD con datos de prueba
}
```

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `5000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `MONGODB_URI` | URI de conexión a MongoDB | `mongodb://localhost:27017/gestor_credenciales` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:5173` |
| `JWT_SECRET` | Clave secreta para JWT | `tu_clave_secreta` |

## 📊 CURPs de Prueba

Después de ejecutar `npm run seed`, tendrás estos CURPs disponibles:

1. `ABCD123456HDFXYZ01`
2. `EFGH789012MDFABC02`
3. `IJKL345678HDFMNO03`
4. `MNOP901234HDFPQR04`
5. `QRST567890MDFSTU05`
6. `UVWX123456HDFVWX06`
7. `YZAB789012MDFYZA07`
8. `CDEF345678HDFCDE08`
9. `GHIJ901234MDFGHI09`
10. `KLMN567890HDFKLM10`

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

## 📝 Logs

El servidor registra todas las solicitudes usando Morgan en formato 'combined'. Los logs incluyen:
- IP del cliente
- Método HTTP
- URL solicitada
- Código de estado
- Tiempo de respuesta
- User-Agent

## 🐛 Troubleshooting

### Error de conexión a MongoDB
- Verifica que MongoDB esté ejecutándose
- Revisa la URI en el archivo `.env`
- Asegúrate de que el usuario tenga permisos

### Error de CORS
- Verifica la configuración de `FRONTEND_URL`
- Asegúrate de que el frontend esté en la lista de orígenes permitidos

### Error de Rate Limit
- Espera 15 minutos o reinicia el servidor
- Ajusta los límites en `server.js` si es necesario