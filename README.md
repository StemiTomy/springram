
Demostración de [Stelut Grigore Tomoiaga](https://steluttomoiaga.com)

# Lanzar app

Todo se levanta con Docker Compose (`app` + `redis` + `kafka`). La BBDD maestra sigue siendo remota y se configura en `.env`.
Compose incluye `healthcheck` en `app`, `redis` y `kafka`, y `app` espera a que `redis/kafka` esten saludables para arrancar.

## Variables mínimas:

```
DATABASE_URL=jdbc:postgresql://host:5432/db?sslmode=require
POSTGRES_USER=usuario
POSTGRES_PASSWORD=clave
JWT_SECRET=change-this-secret-to-at-least-32-bytes-long
REDIS_HOST=redis
REDIS_PORT=6379
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
APP_SOCIAL_ASYNC_ENABLED=true
APP_SOCIAL_REDIS_ENABLED=true
APP_SOCIAL_KAFKA_TOPIC=social-events
```

```bash
docker compose build --no-cache
docker compose up -d

# Conjunto
docker compose up -d --build

# Logs
docker compose logs -f app
```

Comprobar readiness manualmente:

```bash
curl http://localhost:8080/actuator/health/readiness
```

Logs en fichero (persistidos en la raíz del proyecto):

```bash
ls -la logs/
tail -f logs/demostracion.log
```

Audit de `GET /api/v1/auth/me`:

- Se registra por middleware con `method`, `path`, `status`, `ip`, `user`, `durationMs`.
- Ejemplo: `auth_me_audit method=GET path=/api/v1/auth/me status=401 ip=... user=anonymous durationMs=...`

Para ver logs:

```bash
docker compose logs -f app
```

Para parar y limpiar:

```bash
docker compose down
```


# Referencias

### **Scopes**

*"As a rule, you should use the prototype scope for all stateful beans and the singleton scope for stateless beans."*

https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html#beans-factory-scopes-singleton

### Tests
https://docs.spring.io/spring-boot/reference/testing/test-modules.html

### Logs
https://docs.spring.io/spring-boot/reference/features/logging.html#page-title

### OpenAPI 3.1 para ver los endpoints
http://localhost:8080/swagger-ui/index.html

# Dependencias

Spring Web

Spring Security

Spring Data JPA

Spring Batch

PostgreSQL Driver

Spring Data Redis

Spring Kafka

Lombok

Docker Compose Support

Spring Boot Starter Flyway (`org.springframework.boot:spring-boot-starter-flyway`)

## Spring Boot Actuator (health, readiness, metrics)
Actuator: expone endpoints de administración como `health` y `readiness`, además de métricas y info de la app. Se usa para saber si el servicio está vivo y listo para recibir tráfico.

## Micrometer (metrics)
Micrometer: librería de métricas. Recolecta tiempos de respuesta, contadores, memoria, etc., y los exporta a sistemas como Prometheus/Grafana.

## Flyway (migraciones de BBDD)
Migraciones (Flyway): versionan y aplican cambios del esquema de la base de datos. En vez de crear tablas a mano, la app ejecuta scripts al arrancar y mantiene un historial de cambios.



# Flyway (cómo se usa)

Las migraciones van en `src/main/resources/db/migration` con nombres tipo `V1__init.sql`, `V2__add_table.sql`.

NOTA: Al arrancar la app, Flyway aplica las migraciones pendientes automáticamente.

### Generar SQL desde entidades (code-first) y pasarlo a Flyway:

```bash
# Genera DDL en target/generated-schema.sql usando el perfil ddl
./mvnw -Dspring-boot.run.profiles=ddl \
  -Dspring-boot.run.arguments=--spring.main.web-application-type=none \
  spring-boot:run
```

Pasos de la creación:

1. Modelar entidades/repos/servicios.
2. Genera DDL a `target/generated-schema.sql`.
3. Crea una nueva migración `src/main/resources/db/migration/Vx__descripcion.sql`.
4. Copia/limpia SQL relevante al `Vx__...sql` (no copiar todo a ciegas).
5. Mantén `ddl-auto=validate` + Flyway para producción.

# BBDD

BBDD remota (p.ej. Neon o proveedor gestionado). La app se conecta usando `DATABASE_URL`.

# Redis + Kafka (cuello app -> BBDD)

Objetivo: reducir presión de escrituras/lecturas sobre Neon sin cambiar el contrato REST.

Flujo:

1. API recibe `like/view/comment`.
2. Actualiza contador en Redis (respuesta rápida).
3. Publica evento en Kafka.
4. Consumidor persiste en PostgreSQL (Neon) con `INSERT ... ON CONFLICT`.

Fallback:

- Si Kafka no está disponible, la app hace escritura directa a PostgreSQL.
- Si Redis no está disponible, los contadores salen desde PostgreSQL.

Nota:

- Con async habilitado, `like/view/comment` son *eventually consistent* en BBDD.
- El `feed` prioriza contadores en Redis y, si faltan, recalcula desde BBDD.

TTL en Redis:

- `stats` (contadores) expiran con `APP_SOCIAL_REDIS_STATS_TTL`.
- `likes:users` (set de usuarios) expira con `APP_SOCIAL_REDIS_LIKES_TTL` para dedupe temporal.
- `posts` (set de posts conocidos) expira con `APP_SOCIAL_REDIS_POSTS_TTL`.

Esto no lo “borra Kafka”; Redis expira por TTL. Kafka solo asegura la escritura final en PostgreSQL.

Métricas (Actuator):

- `GET /actuator/metrics` lista métricas.
- `GET /actuator/metrics/social.redis.cache` (hits/miss).
- `GET /actuator/metrics/social.kafka.published`
- `GET /actuator/metrics/social.kafka.failed`
- `GET /actuator/metrics/social.kafka.consumed`
- `GET /actuator/metrics/social.kafka.db_error`
- `GET /actuator/metrics/social.db.fallback`

En producción, protege `/actuator/**` (ahora están abiertas para debug local).

# Escalado con Docker (sin Kubernetes)

Cuando sube mucho el tráfico, primero suele escalarse horizontalmente (más réplicas de la app) en vez de solo meter una máquina más grande.

En Docker Compose (modo normal), el escalado se hace así:

```bash
docker compose up -d --scale app=3
```

Nota:
- `deploy.replicas` se usa en Swarm, no en `docker compose` clásico.

Qué resuelve Compose bien:

- Levantar varias instancias de `app`.
- Reiniciar contenedores caídos (`restart: unless-stopped`).
- Mantener configuración simple en un solo host.

Qué no resuelve bien por sí solo:

- Autoscaling real por CPU/RAM.
- Balanceo avanzado entre varios nodos/hosts.
- Orquestación completa de rolling updates sin fricción.

Importante sobre BBDD:

- La app Spring Boot es stateless y se replica fácil.
- PostgreSQL es stateful; no se replica igual que la app.
- Lo habitual: app replicada + una BBDD gestionada/externa (como ya tienes).

Flujo práctico de despliegue:

1. `git push`.
2. CI construye imagen con tu Dockerfile multi-stage.
3. CI sube imagen al registry.
4. Servidor hace `docker compose pull` + `docker compose up -d`.

# API (v1)

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me` (requiere `Authorization: Bearer <token>`)
- `GET /api/v1/auth/preferences/language` (requiere token)
- `PUT /api/v1/auth/preferences/language` (body: `{ "language": "es" | "en" }`)

Posts (requiere `Authorization: Bearer <token>`):

- `POST /api/v1/posts` (crear post)
- `POST /api/v1/posts/{postId}/like` (like idempotente por usuario)
- `DELETE /api/v1/posts/{postId}/like` (quitar like idempotente por usuario)
- `POST /api/v1/posts/{postId}/view` (incrementa vistas)
- `POST /api/v1/posts/{postId}/comments` (crear comentario)
- `GET /api/v1/posts/{postId}/comments?size=50` (listar comentarios)
- `GET /api/v1/posts/feed?page=0&size=20` (feed paginado)

Search (requiere `Authorization: Bearer <token>`):

- `GET /api/v1/search/suggestions?q=spring&type=posts|users&limit=10` (autocompletado, por defecto `posts`)
- `GET /api/v1/search/results?q=spring&type=posts|users&page=0&size=20` (resultados paginados con `likes/comments/views`)

Payloads de ejemplo:

```json
POST /api/v1/posts
{
  "content": "Mi primer post",
  "authorDisplayName": "stelut"
}
```

```json
POST /api/v1/posts/{postId}/comments
{
  "content": "Buen post!"
}
```

# Tests

Estrategia por slices (unitarios/aislados):

- `@WebMvcTest` + `MockMvc` para Controller/Security.
- `@DataJpaTest` para repositorios JPA.
- `@SpringBootTest` + `@AutoConfigureMockMvc` como integración completa (opcional).

Dependencias de test recomendadas para este stack:

- `org.springframework.boot:spring-boot-starter-test`
- `org.springframework.boot:spring-boot-starter-security-test`
- `org.springframework.boot:spring-boot-starter-webmvc-test`
- `org.springframework.boot:spring-boot-starter-data-jpa-test`
- `com.h2database:h2` (solo test, para `@DataJpaTest`)
- Opcional integración real con PostgreSQL: `org.springframework.boot:spring-boot-starter-flyway-test` + Testcontainers.

Casos cubiertos ahora:

- `AuthControllerWebMvcTest`
- `GET /api/v1/auth/me` sin token -> `401`.
- `POST /api/v1/auth/register` con password débil -> `400`.
- `UserRepositoryDataJpaTest`
- `existsByEmail(...)` devuelve `true` cuando existe usuario.
- restricción `unique` en `email` dispara excepción al duplicar.

Cómo ejecutar tests:

```bash
# Todos los tests
./mvnw test

# Solo slice web/security
./mvnw -Dtest=AuthControllerWebMvcTest test

# Solo slice JPA
./mvnw -Dtest=UserRepositoryDataJpaTest test
```

# Observaciones
## Flyway vs Liquibase

Flyway: más simple. Migraciones en SQL con nombres versionados. Ideal para demos y proyectos pequeños.

Liquibase: más flexible. Permite XML/YAML/JSON/SQL, soporta “labels/contexts” y precondiciones. Mejor cuando necesitas despliegues selectivos y mayor control.

Para este proyecto demo, elegimos Flyway.


# Comandos útiles

```bash
openssl rand -hex 64
```

# Seed SQL directo

Se incluye script Python para meter datos demo directamente en PostgreSQL (Neon o similar):

- `scripts/main.py`
- `scripts/requirements.txt`
- `scripts/.env` (local, ignorado por git)
- `scripts/.env.example`

Uso:

```bash
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# ajusta DATABASE_URL
python main.py
```

El seed crea:

- usuarios (1 admin + resto user)
- posts
- likes
- views (con `view_count`)
- comments

Password por defecto de usuarios seed: `SEED_DEFAULT_PASSWORD`.













# FRONTEND (Preact)

Se incluye frontend en `frontend/preact-front` con nombre **Springram by Stelut Tomoiaga**.

Config local:

```bash
cd frontend/preact-front
cp .env.example .env
# ajusta VITE_API_BASE_URL
npm install
npm run dev
```

Para Cloudflare Pages:

- Build command: `npm run build`
- Output directory: `dist`
- Variable: `VITE_API_BASE_URL=https://tu-api-dominio`

Rutas frontend:

- `/` landing + intro del proyecto
- `/auth` registro/login
- `/app` perfil + feed + acciones de post







# SCRIPTS

```bash
# Seed
cd scripts
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python main.py
```
