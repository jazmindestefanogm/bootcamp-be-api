# Bootcamp Backend API — De la base de datos a la API

Material de la clase **"De la base de datos a la API"**: teoría, consignas de práctica y el proyecto **Library API**, una API REST construida en capas (rutas → controllers → services → repositories) sobre Express, TypeScript, Sequelize y PostgreSQL.

## Contenido del repositorio

```
.
├── teoria/                  Material teórico, organizado por módulos
├── practica.md              Consigna de práctica (versión 1)
├── practica2.md             Consigna de práctica (versión 2, con tabla de pasos y pruebas)
├── library-api/             Proyecto starter: para que el alumno complete
└── expected-resolution/     Resolución esperada de referencia
```

### `teoria/`

Material de consulta conceptual, dividido en módulos (cada uno citado desde la práctica con un número, por ejemplo **5.5**):

- **0** — Qué es una API (cliente/servidor, HTTP, status codes, PUT vs PATCH)
- **1** — Modelar una API (recursos, REST, anidamiento, filtros y paginación)
- **2** — API Contract y documentación (OpenAPI/Swagger)
- **3** — TypeScript básico (tipos, interfaces, `Omit`/`Partial`, genéricos)
- **4** — Express.js (rutas, middleware, routers)
- **5** — Arquitectura y MVC (capas, ORM, repositories, DTOs)
- **6** — SOLID y buenas prácticas

Además hay tres anexos: cheatsheet, glosario y recursos para seguir aprendiendo. Empezá por `teoria/README.md`, que tiene el índice completo.

### `practica.md`

Consignas de la práctica: construir **Library API**, una API con los recursos `books`, `authors` y `loans` contra una base PostgreSQL real, siguiendo la arquitectura en capas:

```
ruta → controller → service → repository → base de datos
```

- **Entrega mínima**: CRUD completo de `/books`.
- **Extra opcional**: CRUD de `/authors` y `/loans`.

### `library-api/`

El proyecto **starter**: trae la base de datos, los modelos de Sequelize, los tipos de TypeScript y el contrato OpenAPI de libros ya resueltos. El alumno completa `repositories/`, `services/`, `controllers/` y `routes/`. Ver `library-api/README.md` para instrucciones de instalación y ejecución.

### `expected-resolution/`

Resolución de referencia completa (los 12 endpoints de `authors`, `books` y `loans`, con todas las capas implementadas). Sirve como guía para corregir o comparar con lo entregado.

## Cómo levantar el proyecto (Library API)

1. Elegí `library-api/` (para practicar) o `expected-resolution/` (para ver la solución).
2. En pgAdmin, creá una base llamada `library`.
3. En `src/db/connection.ts`, configurá tu usuario y contraseña de Postgres.
4. Instalá dependencias y levantá el servidor:

   ```bash
   cd library-api        # o expected-resolution
   npm install
   npm run seed           # crea las tablas y carga datos de ejemplo
   npm run dev             # levanta el servidor en http://localhost:3000
   ```

5. Probá:
   - `http://localhost:3000` → `{ "message": "Library API running" }`
   - `http://localhost:3000/docs` → Swagger UI con el contrato de `docs/openapi.yaml`

## Stack técnico

- **Node.js** + **TypeScript**
- **Express** (rutas y middleware)
- **Sequelize** (ORM) + **PostgreSQL**
- **Swagger UI** para documentación interactiva (`/docs`)

## Reglas generales de la API

- Respuestas OK: `{ "data": ... }` (objeto o array). Listas paginadas agregan `total`, `page` y `limit`.
- Errores: `{ "error": "mensaje" }`.
- Status codes: `200` OK · `201` creado · `204` borrado sin body · `400` pedido inválido · `404` no existe · `409` conflicto con el estado actual.
- Todo el código (archivos, variables, funciones, tipos, rutas, mensajes de error) va en inglés.

## Créditos

Repositorio base para el bootcamp de backend: [jazmindestefanogm/library-api](https://github.com/jazmindestefanogm/library-api).
