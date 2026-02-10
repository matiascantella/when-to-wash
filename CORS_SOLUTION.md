# Solución para CORS con Elering API

## Problema

La API de Elering probablemente bloquea requests desde el navegador por CORS (Cross-Origin Resource Sharing).

## Soluciones

### Opción 1: Proxy Backend (Recomendado para producción)

Crear un pequeño backend que haga el request y lo sirva a la app.

**Ejemplo con Node.js/Express:**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/api/prices', async (req, res) => {
  const { start, end } = req.query;
  const url = `https://dashboard.elering.ee/api/nps/price?start=${start}&end=${end}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001);
```

Luego cambiar la URL en `api.ts` a `http://localhost:3001/api/prices`.

### Opción 2: CORS Proxy Público (Solo para desarrollo)

Usar un proxy público como `https://cors-anywhere.herokuapp.com/` o `https://api.allorigins.win/raw?url=`

**Ejemplo:**

```typescript
const proxyUrl = 'https://api.allorigins.win/raw?url=';
const eleringUrl = `https://dashboard.elering.ee/api/nps/price?start=${startUTC}&end=${endUTC}`;
const response = await fetch(`${proxyUrl}${encodeURIComponent(eleringUrl)}`);
```

### Opción 3: Verificar si Elering permite CORS

Abrir la consola del navegador (F12) y ver el error exacto. Si es CORS, verás algo como:

```
Access to fetch at 'https://dashboard.elering.ee/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

## Verificar Error Actual

1. Abrir DevTools (F12)
2. Ir a la pestaña "Console"
3. Buscar errores en rojo
4. Ir a la pestaña "Network"
5. Buscar el request a `elering.ee`
6. Ver el status code y mensaje de error

## Próximos Pasos

1. Verificar el error exacto en la consola
2. Implementar proxy backend si es necesario
3. O usar proxy público para desarrollo
