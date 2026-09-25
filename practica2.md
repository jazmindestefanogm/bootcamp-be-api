# De la base de datos a la API — Práctica

Vas a construir **Library API** (carpeta `library-api`): 12 endpoints contra una base de datos real.

Cómo se trabaja:

- Hacé los pasos en orden. Cada paso termina con una **prueba**: no sigas hasta que te dé lo esperado.
- El código lo escribís vos. Te ayudan las pistas 💡 y la teoría: los números 📖 como **5.5** son secciones de `teoria/`.
- **El código va en inglés** (archivos, variables, tipos, rutas, campos, mensajes de error). Los comentarios pueden ir en castellano.

| Castellano | En el código |
|---|---|
| autor · libro · préstamo | `author` · `book` · `loan` |
| nombre · nacionalidad | `name` · `nationality` |
| título · año · disponible | `title` · `year` · `available` |
| nombre del socio | `member_name` |
| fecha de préstamo · de devolución | `loan_date` · `return_date` |
| página · límite · activos | `page` · `limit` · `active` |

---

## Reglas generales

1. Los errores se responden con `{ "error": "message" }`. Ej.: `{ "error": "Book not found" }`.
2. `id` que no es entero (`/books/abc`) → **400**. `id` que no existe (`/books/999`) → **404**.
3. Dato del body o la query que falta, tiene otro tipo o está fuera de rango → **400**.
4. En los `import` de tus archivos, la extensión es **`.js`** aunque el archivo sea `.ts`: `import * as AuthorsService from "../services/authors.service.js";`.

| Status | Cuándo |
|---|---|
| 200 | OK, devuelvo datos. |
| 201 | OK, creé algo. |
| 204 | OK, borré. Sin body. |
| 400 | Me mandaste algo mal. |
| 404 | No existe. |
| 409 | Choca con el estado actual (ej.: el libro ya está prestado). |
| 500 | Se rompió algo. Nunca a propósito. |

La arquitectura final:

```
ruta → controller → service → repository → base de datos
```

| Capa | Carpeta | Hace | No hace |
|---|---|---|---|
| Rutas | `src/routes/` | Verbo + URL → función. | Lógica. |
| Controllers | `src/controllers/` | Lee `req`, valida, elige el status. | Tocar la base. |
| Services | `src/services/` | Reglas del negocio. | Conocer `req`/`res`. |
| Repositories | `src/repositories/` | Leer y guardar en la base. | Validar ni elegir status. |

---

## Los 12 endpoints

| # | Endpoint | Recibe | Responde |
|---|---|---|---|
| 1 | `GET /authors` | — | 200 con `Author[]` |
| 2 | `GET /authors/{id}` | — | 200 con `Author` · 400 · 404 |
| 3 | `DELETE /authors/{id}` | — | 204 · 400 · 404 · 409 (tiene libros) |
| 4 | `GET /books` | query params (abajo) | 200 con `BookPage` · 400 |
| 5 | `GET /books/{id}` | — | 200 con `Book` · 400 · 404 |
| 6 | `POST /books` | `NewBook` | 201 con `Book` · 400 · 404 (el autor no existe) |
| 7 | `PATCH /books/{id}` | `UpdateBook` | 200 con `Book` · 400 · 404 |
| 8 | `PUT /books/{id}` | `NewBook` | 200 con `Book` · 400 · 404 |
| 9 | `DELETE /books/{id}` | — | 204 · 400 · 404 · 409 (tiene préstamos) |
| 10 | `GET /loans` | `?active=true\|false` (opcional) | 200 con `Loan[]` · 400 |
| 11 | `POST /loans` | `NewLoan` | 201 con `Loan` · 400 · 404 (el libro no existe) · 409 (no disponible) |
| 12 | `PATCH /loans/{id}` | `LoanReturn` | 200 con `Loan` · 400 · 404 · 409 (ya devuelto) |

Query params de `GET /books` (todos opcionales):

| Param | Tipo | Qué hace |
|---|---|---|
| `title` | string | Título **contiene** el texto, sin importar mayúsculas. |
| `available` | boolean | `true`: disponibles. `false`: prestados. |
| `author_id` | integer | Libros de ese autor. |
| `page` | integer ≥ 1, default 1 | Página. |
| `limit` | integer ≥ 1, default 10 | Libros por página. Máximo 50 (si piden más, se usa 50). |

---

## Paso 0 · Levantar el proyecto

📖 4.3

1. Hacé **Fork** de https://github.com/jazmindestefanogm/library-api y clonalo:

   ```bash
   git clone URL-DE-TU-FORK
   cd library-api
   ```

2. En **pgAdmin**, creá una base llamada `library` (clic derecho en **Databases** → **Create** → **Database...**).
3. En `src/db/connection.ts`, poné tu `USER` y `PASSWORD` de Postgres.
4. Corré:

   ```bash
   npm install      # solo la primera vez
   npm run seed     # crea las tablas y carga datos de ejemplo
   npm run dev      # levanta el servidor (dejalo corriendo)
   ```

Al terminar cada paso, subí tus cambios: `git add .` → `git commit -m "paso 1"` → `git push`.

**Prueba.**

- `http://localhost:3000` → `{ "message": "Library API running", ... }`
- `http://localhost:3000/docs` → Swagger UI (sin operaciones todavía).
- En pgAdmin, **library** → **Schemas** → **public** → **Tables**: `authors`, `books`, `loans`.

| Si ves... | Revisá |
|---|---|
| `password authentication failed` | Usuario/contraseña en `src/db/connection.ts`. |
| `database "library" does not exist` | El nombre de la base en pgAdmin. |
| `ECONNREFUSED` | Que Postgres esté prendido y el `PORT` (en pgAdmin: servidor → **Properties** → **Connection**). |
| `npm` no se reconoce | Instalá Node.js 18+ y reabrí la terminal. |
| Windows: `la ejecución de scripts está deshabilitada` | Usá **cmd** en vez de PowerShell. |
| `EADDRINUSE ... :3000` | Ya hay un servidor corriendo. Cortalo con `Ctrl + C`. |

---

## Paso 1 · Contrato (`docs/openapi.yaml`)

📖 2.2 · 2.6 · 2.7 · README "OpenAPI en cinco líneas"

Solo YAML. Indentación: 2 espacios, nunca tabs.

**Schemas** (en `components.schemas`, debajo de `Error`):

| Schema | Campos | Obligatorios |
|---|---|---|
| `Author` | `id` int, `name` string, `nationality` string | todos |
| `Book` | `id` int, `title` string, `year` int, `author_id` int, `available` boolean | todos |
| `NewBook` | `title` string (1–200 caracteres), `year` int (1000–2100), `author_id` int | todos |
| `UpdateBook` | igual que `NewBook` | ninguno |
| `BookPage` | `data` (`Book[]`), `total`, `page`, `limit` int | todos |
| `Loan` | `id` int, `book_id` int, `member_name` string, `loan_date` string, `return_date` string o `null` | todos |
| `NewLoan` | `book_id` int, `member_name` string (no vacío) | todos |
| `LoanReturn` | `return_date` string (`YYYY-MM-DD`) | todos |

BookPage pertenece a GET Books, es un search con paginado

**Endpoints:** los 12 de la tabla de arriba, con `tags` `Authors`, `Books` y `Loans`. Los errores usan el schema `Error`. En la descripción del 11 aclará que el libro pasa a `available: false`, y en la del 12 que vuelve a `true`.

**Prueba.** `/docs` muestra 12 endpoints en 3 grupos y 9 schemas, sin errores.

---

## Paso 2 · Tipos (`src/types/`)

📖 3.4 · 3.6 · 3.9 · 5.5 · 5.10

Tienen que coincidir con los schemas.

| Archivo | Tipos |
|---|---|
| `author.ts` | `Author` |
| `book.ts` | `Book` · `NewBook` (sin `id` ni `available`) · `UpdateBook` (`NewBook` todo opcional) · `BookFilters` (`title`, `available`, `author_id`, opcionales) |
| `loan.ts` | `Loan` · `NewLoan` · `LoanReturn` |
| `common.ts` | `Pagination` (`page`, `limit`) · `Page<T>` (`data`, `total`, `page`, `limit`) |

> 💡 `Omit`, `Partial` (📖 3.6) y genéricos (📖 3.9). ¿Qué tipo tiene `return_date` si no se devolvió?

**Prueba.** `npm run build` sin errores.

---

## Paso 3 · Rutas + repositories

📖 4.4 · 4.5 · 5.8 · 5.9 · README "Sequelize en cinco líneas"

Por ahora, la ruta llama **directo** al repository (`ruta → repository → base`). Marcá cada función de ruta con `// TEMPORAL`: en el paso 4 la movés. **No valides nada todavía.**

**Repositories** (versión final):

| Archivo | Funciones |
|---|---|
| `authors.repository.ts` | `findAll()` · `findById(id)` · `remove(id)` |
| `books.repository.ts` | `findById(id)` · `search(filters, pagination)` · `create(data)` · `update(id, changes)` · `remove(id)` |
| `loans.repository.ts` | `findAll(activeOnly)` · `findById(id)` · `create(data, loanDate)` · `registerReturn(id, returnDate)` |

- Devuelven **tus tipos**, no instancias de Sequelize.
- Si no existe: `findById`, `update`, `registerReturn` → `null`; `remove` → `false` (y `true` si borró).
- Listas ordenadas por `id`.
- `search`: aplica solo los filtros que vinieron y devuelve `Page<Book>` con el total.
- `create` de libro: `available` empieza en `true`.
- `findAll(true)` de préstamos: solo los no devueltos.

**Rutas:** `authors.routes.ts`, `books.routes.ts`, `loans.routes.ts`, montadas en `src/server.ts`.

- `GET /books` devuelve siempre la página 1 de 10, sin filtros.
- `POST`/`PUT`/`PATCH` pasan el body tal cual (se arregla en el paso 4).
- `POST /loans` usa la fecha de hoy como `loan_date`.

> 💡
> - Importá los modelos desde `../models/index.js` y renombralos con `as` (se llaman igual que tus tipos).
> - Instancia → objeto: `.toJSON()`.
> - `search`: `findAndCountAll`, `limit`, `offset` y `Op.iLike`.
> - Fecha de hoy: `new Date().toISOString().slice(0, 10)`.
> - En el router las rutas son `"/"` y `"/:id"`; el prefijo lo pone `app.use`.

**Prueba** (en orden):

| # | Pedido | Esperado |
|---|---|---|
| 1 | `GET /authors` | 200, 5 autores |
| 2 | `GET /authors/1` | 200, Julio Cortázar |
| 3 | `GET /books` | 200, 6 libros, `total: 6` |
| 4 | `GET /books/1` | 200, Rayuela |
| 5 | `POST /books` con `{ "title": "New", "year": 2000, "author_id": 1 }` | 201, `id: 7`, `available: true` |
| 6 | `PATCH /books/7` con `{ "title": "Other" }` | 200, `title: "Other"`, `year: 2000` |
| 7 | `DELETE /books/7` | 204 |
| 8 | `DELETE /authors/5` | 204 |
| 9 | `GET /loans` | 200, 3 préstamos |
| 10 | `POST /loans` con `{ "book_id": 3, "member_name": "Sofía" }` | 201, `return_date: null` |
| 11 | `PATCH /loans/4` con `{ "return_date": "2026-09-30" }` | 200, con la fecha |

Verificá en pgAdmin (tabla → **View/Edit Data**) y después corré `npm run seed`.

> Todavía falla, y está bien: `GET /authors/999` da 200 con `null`, `/authors/abc` cuelga (→ paso 4); prestar el libro 3 no lo marca como no disponible y `DELETE /authors/1` rompe (→ paso 5). Si algo cuelga, **mirá la terminal**.

---

## Paso 4 · Controllers: validar

📖 4.8 · 4.11 · 4.12 · 5.5 · 5.10

`ruta → controller → repository → base`

1. **Mové** cada función de ruta a un controller (`src/controllers/`, un archivo por recurso) y borrá los `// TEMPORAL`. Una función con nombre por endpoint: los nombres los elegís vos (tienen que decir qué hace, en inglés). La ruta queda solo como mapa: verbo + URL → función. Probá que todo siga igual.

2. **Agregá las validaciones.** Las compartidas van en `src/controllers/validations.ts` (como mínimo: parsear un id, parsear `"true"`/`"false"`, validar el body de libro para POST/PUT/PATCH). Mensajes en inglés y claros (ej.: `"year must be an integer from 1000 to 2100"`).

| Qué | Regla |
|---|---|
| `:id` | Entero > 0, si no 400. Si no existe → 404 (`Author not found`, `Book not found`, `Loan not found`). |
| `GET /books` `available` | `"true"` o `"false"` |
| `GET /books` `author_id`, `page`, `limit` | Entero > 0. `limit` > 50 no es error: se usa 50. |
| Body libro `title` | Texto de 1 a 200 caracteres |
| Body libro `year` | Entero de 1000 a 2100 |
| Body libro `author_id` | Entero > 0 |
| `POST`/`PUT /books` | Los 3 campos obligatorios |
| `PATCH /books` | Todos opcionales, pero los que vienen se validan. Body vacío → 400. |
| `GET /loans` `active` | `"true"` o `"false"` |
| `POST /loans` | `book_id` entero > 0, `member_name` texto no vacío |
| `PATCH /loans/:id` | `return_date` con formato `YYYY-MM-DD` |

**Nunca pases `req.body` directo:** armá el DTO (`NewBook`, `UpdateBook`, `NewLoan`, `LoanReturn`) solo con los campos permitidos. Si mandan `"available"` o `"id"`, se ignoran.

> 💡 `req.params` y `req.query` siempre son texto (`"5"`, no `5`). Primero los errores con `return`, al final el caso feliz. Fecha: `/^\d{4}-\d{2}-\d{2}$/`.

**Prueba** (después de `npm run seed`):

| Pedido | Esperado |
|---|---|
| `GET /authors/abc` | 400 |
| `GET /authors/999` | 404 |
| `GET /books/999` | 404 |
| `GET /books?title=EL` | `total: 2` (Rayuela y El Aleph) |
| `GET /books?available=true&author_id=2` | `total: 1` (Ficciones) |
| `GET /books?page=2&limit=2` | ids 3 y 4, `page: 2` |
| `GET /books?limit=500` | 200, `limit: 50` |
| `GET /books?available=banana` | 400 |
| `GET /books?page=0` | 400 |
| `POST /books` con `{ "title": "New" }` | 400 |
| `POST /books` con `{ "title": "New", "year": "mil", "author_id": 1 }` | 400 |
| `POST /books` con `{ "title": "New", "year": 50, "author_id": 1 }` | 400 |
| `POST /books` con `{ "title": "New", "year": 2000, "author_id": 1, "available": false }` | 201 con `available: true` |
| `PATCH /books/1` con `{}` | 400 |
| `PATCH /books/1` con `{ "title": "Other" }` | 200, `year: 1963` |
| `PUT /books/1` con `{ "title": "Other" }` | 400 |
| `PUT /books/999` con `{ "title": "X", "year": 2000, "author_id": 1 }` | 404 |
| `DELETE /books/999` | 404 |
| `GET /loans?active=true` | 200, 2 préstamos |
| `GET /loans?active=maybe` | 400 |
| `PATCH /loans/999` con `{ "return_date": "2026-09-30" }` | 404 |
| `PATCH /loans/1` con `{ "return_date": "yesterday" }` | 400 |

---

## Paso 5 · Services: reglas del negocio

📖 5.6

`ruta → controller → service → repository → base`

- El service recibe datos ya validados, **no conoce `req`/`res`** y nunca elige status: si algo falla devuelve un resultado que lo diga (ej.: `"AUTHOR_NOT_FOUND"`) y el controller elige el status.
- El controller ya no importa repositories.
- Un archivo por recurso (`authors.service.ts`, etc.). Qué funciones tiene cada uno y cómo se llaman lo decidís vos.

| Endpoint | Regla | Si no se cumple |
|---|---|---|
| `DELETE /authors/:id` | No borrar un autor con libros. | 409 `Author has books` |
| `POST`/`PUT`/`PATCH /books` | `author_id` tiene que existir (en PATCH, si viene). | 404 `Author not found` |
| `DELETE /books/:id` | No borrar un libro con préstamos. | 409 `Book has loans` |
| `POST /loans` | El libro tiene que existir. | 404 `Book not found` |
| `POST /loans` | El libro tiene que estar disponible. | 409 `Book is not available` |
| `POST /loans` | El libro pasa a `available: false`. La fecha la pone el service. | — |
| `PATCH /loans/:id` | Se devuelve una sola vez. | 409 `Loan already returned` |
| `PATCH /loans/:id` | El libro vuelve a `available: true`. | — |

Vas a necesitar funciones nuevas en los repositories (contar libros de un autor, contar préstamos de un libro, cambiar disponibilidad…).

> 💡 Si el repository devuelve `Book | null` y tu service no debe devolver `null`, mirá el operador `??`.

**Revisá las capas** con el buscador de VS Code en `src/`:

| Buscá | Solo aparece en |
|---|---|
| `repository.js` | `src/services/` |
| `service.js` | `src/controllers/` |
| `controller.js` | `src/routes/` |
| `models/index.js` | `src/repositories/` (y `src/db/`, `src/models/`) |
| `TEMPORAL` | ningún lado |

**Prueba** (después de `npm run seed`, en orden):

| # | Pedido | Esperado |
|---|---|---|
| 1 | `POST /books` con `{ "title": "New", "year": 2000, "author_id": 99 }` | 404 |
| 2 | `POST /books` con `{ "title": "New", "year": 2000, "author_id": 1 }` | 201, `id: 7` |
| 3 | `PATCH /books/7` con `{ "author_id": 99 }` | 404 |
| 4 | `DELETE /books/2` | 409 |
| 5 | `DELETE /books/7` | 204 |
| 6 | `DELETE /authors/1` | 409 |
| 7 | `DELETE /authors/5` | 204 |
| 8 | `POST /loans` con `{ "book_id": 99, "member_name": "Sofía" }` | 404 |
| 9 | `POST /loans` con `{ "book_id": 3, "member_name": "Sofía" }` | 201, `return_date: null` |
| 10 | `GET /books/3` | `available: false` |
| 11 | `POST /loans` con `{ "book_id": 3, "member_name": "Tomás" }` | 409 |
| 12 | `GET /loans?active=true` | 3 préstamos |
| 13 | `PATCH /loans/4` con `{ "return_date": "2026-09-30" }` | 200 |
| 14 | `GET /books/3` | `available: true` |
| 15 | `PATCH /loans/4` con `{ "return_date": "2026-09-30" }` | 409 |

Después, `npm run seed` y repetí la prueba del paso 4.

---

## Entrega

- [ ] `/docs` carga sin errores con 12 endpoints y 9 schemas.
- [ ] `src/types/`, `routes/`, `controllers/` (+ `validations.ts`), `services/`, `repositories/`: un archivo por recurso.
- [ ] Todo el código en inglés.
- [ ] Revisión de capas y pruebas de los pasos 4 y 5 OK.
- [ ] `npm run build` sin errores.
- [ ] Todo subido a tu fork. Mandá el link.
