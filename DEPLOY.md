# Despliegue — Chipo Frontend (Vercel)

> Hacé esto **después** de tener la URL pública del backend (Render).

## 1. Crear el proyecto en Vercel
1. Entrá a https://vercel.com e iniciá sesión con GitHub.
2. **Add New → Project** → elegí `chipo-tienda-frontend`.
3. Vercel detecta Vite automáticamente:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

## 2. Variables de entorno
En **Environment Variables**, agregá:

| Variable | Valor |
|---|---|
| `VITE_API_URL` | `https://TU-BACKEND.onrender.com` *(sin `/api` ni barra final)* |
| `VITE_ENABLE_DEVTOOLS` | `false` |

## 3. Desplegar
- Tocá **Deploy**. Vercel construye y publica.
- Te da una URL tipo `https://chipo-tienda-frontend.vercel.app`.

## 4. Conectar los dos lados (importante)
1. Copiá la URL de Vercel.
2. Volvé a **Render → backend → Environment** y poné esa URL en `AllowedOrigins__0`
   (ej. `https://chipo-tienda-frontend.vercel.app`). Render redeploya solo.
3. Sin este paso, el navegador bloquea las llamadas por CORS.

## 5. Probar
- Abrí la URL de Vercel → deberías ver la tienda con los productos.
- Probá: buscar, abrir un producto, agregar al carrito, finalizar por WhatsApp.

## Dominio propio (más adelante)
En Vercel → **Settings → Domains** → agregás tu dominio (ej. `chipo.com.ar`) y seguís
las instrucciones de DNS. Después actualizás `AllowedOrigins__0` en Render con el dominio nuevo.
