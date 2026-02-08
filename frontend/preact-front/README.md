# Springram Frontend (Preact)

Frontend en Preact + Vite para consumir la API Spring Boot.

## Variables de entorno

Crea `frontend/preact-front/.env` (o usa variables en Cloudflare Pages):

```bash
VITE_API_BASE_URL=http://localhost:8080
```

En Cloudflare Pages, configura `VITE_API_BASE_URL` en **Settings > Environment variables**.

## Desarrollo

```bash
npm install
npm run dev
```

La app arranca en `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Flujos implementados

- Landing (`/`) con intro del proyecto y stack usado.
- Registro/Login (`/auth`) contra `/api/v1/auth/register|login`.
- Status (`/status`) consultando `GET /actuator/health/readiness`.
- Perfil y logout en cabecera (`/app`).
- Feed de posts (`/api/v1/posts/feed`) con acciones `like`, `view`, `comment`.
- Composer para crear post (`POST /api/v1/posts`).
- Persistencia de sesión JWT en `localStorage`.


# Despliegue Cloudflare Pages (Wrangler)

## 1) Preparar build local

```bash
npm install
npm run build
```

Esto genera `dist/`.

## 2) Login en Cloudflare

```bash
npx wrangler login
```

## 3) Crear proyecto Pages (una sola vez)

```bash
npx wrangler pages project create springram-front
```

Si ya existe en Cloudflare Dashboard, salta este paso.

## 4) Publicar

```bash
npm run build
npx wrangler pages deploy dist --project-name=springram-front
```

## 5) Variables de entorno en Pages

En Cloudflare Pages (`Settings -> Environment variables`) configura:

- `VITE_API_BASE_URL=https://tu-api-dominio`

Después de cambiar variables, vuelve a publicar:

```bash
npx wrangler pages deploy dist --project-name=springram-front
```
