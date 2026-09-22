# De la base de datos a la API — Práctica

Vas a construir, paso a paso, la API de una biblioteca: **Library API** (carpeta `library-api`). Al final vas a tener 12 endpoints funcionando contra una base de datos real.

**Todo el código se escribe en inglés**: nombres de archivos, variables, funciones, tipos, rutas, campos del JSON y mensajes de error. Es la costumbre en programación, y así vas a leer casi toda la documentación que encuentres. Los comentarios los podés escribir en castellano. Este mini diccionario te va a servir en toda la práctica:

| Castellano | En el código |
|---|---|
| autor / autores | `author` / `authors` |
| libro / libros | `book` / `books` |
| préstamo / préstamos | `loan` / `loans` |
| nombre · nacionalidad | `name` · `nationality` |
| título · año · disponible | `title` · `year` · `available` |
| nombre del socio | `member_name` |
| fecha de préstamo · fecha de devolución | `loan_date` · `return_date` |
| página · límite | `page` · `limit` |
| activos | `active` |

La API se arma así:

```
1. Contrato       → qué va a hacer la API (sin código)
2. Tipos          → la forma de los datos en TypeScript
3. Rutas + repositories → la API ya lee y escribe en la base real (versión simple, sin validar)
4. Controllers    → se meten entre la ruta y el repository: validan lo que llega
5. Services       → se meten entre el controller y el repository: aplican las reglas del negocio
```

Desde el paso 3 la API **siempre funciona** contra la base de datos. En los pasos 4 y 5 no se rompe nada: se agrega una capa **en el medio** y se prueba que todo siga andando. Al final queda así:

```
ruta → controller → service → repository → base de datos
```

| Capa | Carpeta | Qué hace | Qué NO hace |
|---|---|---|---|
| Contrato | `docs/openapi.yaml` | Describe qué endpoints hay, qué reciben y qué devuelven. | No tiene código. |
| Tipos | `src/types/` | Define la forma de los datos (`Author`, `Book`, `Loan`). | No tiene lógica. |
| Rutas | `src/routes/` | Dice qué función atiende cada verbo + URL. | No tiene lógica. |
| Controllers | `src/controllers/` | Lee el pedido (`req`), valida los datos y elige el status de la respuesta (`res`). | No conoce la base de datos. |
| Services | `src/services/` | Aplica las reglas del negocio ("no se puede prestar un libro prestado"). | No conoce `req` ni `res`. |
| Repositories | `src/repositories/` | Lee y guarda datos. Es el único que habla con la base. | No valida ni decide status. |

En cada paso te digo **qué tiene que hacer** la API y **cómo probar** que funciona. El código lo escribís vos, con la teoría y las pistas 💡. No pases al paso siguiente hasta que la prueba del paso actual te dé lo esperado.

📖 Los números como **5.5** son secciones de la carpeta `teoria/`. Si algo no se entiende, andá a buscarlo ahí. (Los ejemplos de la teoría están en castellano; en tu código, usá los nombres en inglés.)

---

## Reglas que valen para toda la API

Leelas ahora y volvé a ellas cuando tengas dudas.

1. **Todos los errores** se responden con un JSON de esta forma: `{ "error": "message" }`. Por ejemplo: `{ "error": "Book not found" }`.
2. Si el `id` de la URL **no es un número entero** (por ejemplo `/books/abc`) → **400**.
3. Si el `id` es un número pero **no existe** (por ejemplo `/books/999`) → **404**.
4. Si un dato del body o de la query **está mal** (falta, tiene otro tipo o está fuera de rango) → **400**.
5. Al terminar, cada capa solo llama a la capa de abajo: rutas → controllers → services → repositories. Nunca al revés, nunca saltando una. (En los pasos 3 y 4 todavía faltan capas, y es a propósito: se agregan en el medio más adelante.)
6. En los `import` entre archivos tuyos, la extensión se escribe **`.js`** aunque el archivo sea `.ts`. Ejemplo: `import * as AuthorsService from "../services/authors.service.js";`. Es una regla de Node, no un error.

**Status que vas a usar:**

| Status | Cuándo |
|---|---|
| 200 | Todo bien, devuelvo datos. |
| 201 | Todo bien, creé algo nuevo. |
| 204 | Todo bien, lo borré. No devuelvo nada. |
| 400 | Me mandaste algo mal. |
| 404 | Lo que buscás no existe. |
| 409 | El pedido está bien, pero choca con el estado actual (ej.: el libro ya está prestado). |
| 500 | Error del servidor: algo se rompió en tu código o en la base. Nunca se responde a propósito. |

---

## Los 12 endpoints

Esta es la lista completa de lo que vas a construir. Todos los pasos se refieren a esta tabla.

| # | Verbo | Ruta | Qué hace |
|---|---|---|---|
| 1 | GET | `/authors` | Lista todos los autores. |
| 2 | GET | `/authors/{id}` | Devuelve un autor. |
| 3 | DELETE | `/authors/{id}` | Borra un autor. Solo si no tiene libros. |
| 4 | GET | `/books` | Busca libros con filtros y paginación. |
| 5 | GET | `/books/{id}` | Devuelve un libro. |
| 6 | POST | `/books` | Crea un libro. |
| 7 | PATCH | `/books/{id}` | Modifica **algunos** campos de un libro. |
| 8 | PUT | `/books/{id}` | Reemplaza **todos** los campos de un libro. |
| 9 | DELETE | `/books/{id}` | Borra un libro. Solo si nunca se prestó. |
| 10 | GET | `/loans` | Lista los préstamos. Con `?active=true`, solo los no devueltos. |
| 11 | POST | `/loans` | Presta un libro. |
| 12 | PATCH | `/loans/{id}` | Registra que un préstamo se devolvió. |

---

## Paso 0 · Levantar el proyecto

📖 4.3

**Primero, tu copia del repositorio.** Cada uno trabaja en su propia copia, así podés guardar y subir tus cambios sin pisar los de nadie. Necesitás una cuenta de GitHub y tener Git instalado.

1. Entrá a https://github.com/jazmindestefanogm/library-api y apretá el botón **Fork** (arriba a la derecha) → **Create fork**. Ahora tenés una copia en tu cuenta: `github.com/TU-USUARIO/library-api`.
2. En tu fork, apretá el botón verde **Code** y copiá la URL.
3. En una terminal, clonalo en tu compu y entrá a la carpeta:

   ```bash
   git clone URL-QUE-COPIASTE
   cd library-api
   ```

Trabajá siempre en tu fork, nunca en el repositorio de la clase. Cada vez que termines un paso, guardá y subí tus cambios:

```bash
git add .
git commit -m "paso 1: contrato"
git push
```

**Después, la base de datos.** Necesitás tener Postgres y pgAdmin instalados.

1. Abrí **pgAdmin** y conectate a tu servidor.
2. Clic derecho en **Databases** → **Create** → **Database...** → en **Database** escribí `library` (todo en minúscula) → **Save**. La base queda vacía; las tablas se crean solas en el punto siguiente.
3. Abrí `src/db/connection.ts` y cambiá `USER` y `PASSWORD` por los que elegiste al instalar Postgres.

**Por último, el proyecto.** En la terminal, dentro de la carpeta `library-api`, corré:

```bash
npm install      # instala las dependencias (solo la primera vez)
npm run seed     # crea las tablas en la base `library` y carga datos de ejemplo
npm run dev      # levanta el servidor
```

Dejá esa terminal abierta: el servidor se reinicia solo cada vez que guardás un archivo.

**Prueba.**

- Abrí `http://localhost:3000` en el navegador. Tiene que aparecer `{ "message": "Library API running", ... }`.
- Abrí `http://localhost:3000/docs`. Tiene que aparecer Swagger UI (una página que por ahora dice que no hay operaciones).
- En pgAdmin, en **library** → **Schemas** → **public** → **Tables** (clic derecho → **Refresh** si no las ves), tienen que aparecer las tablas `authors`, `books` y `loans`.

Si `npm run seed` falla, leé el mensaje de error:

| Mensaje | Qué revisar |
|---|---|
| `password authentication failed` | El usuario o la contraseña en `src/db/connection.ts`. |
| `database "library" does not exist` | Que creaste la base en pgAdmin con ese nombre exacto. |
| `ECONNREFUSED` | Que Postgres esté prendido. Si lo está, fijate en pgAdmin (clic derecho en tu servidor → **Properties** → **Connection**) qué **Port** usa: si no es `5432`, cambiá `PORT` en `src/db/connection.ts`. |
| `npm` no se reconoce como comando | Falta instalar Node.js (versión 18 o más nueva). Después de instalarlo, cerrá y volvé a abrir la terminal. |
| En Windows: `la ejecución de scripts está deshabilitada` | Usá la terminal **Command Prompt** (cmd) en vez de PowerShell. |
| `EADDRINUSE: address already in use :::3000` (al hacer `npm run dev`) | Ya tenés el servidor corriendo en otra terminal. Cerrala, o cortala con `Ctrl + C`. |

---

## Paso 1 · El contrato (`docs/openapi.yaml`)

📖 2.2 · 2.6 · 2.7 · README, sección "OpenAPI en cinco líneas"

El contrato describe la API **antes** de programarla. En este paso no escribís TypeScript, solo YAML. Al final del archivo hay una **plantilla comentada** de un endpoint: usala como guía.

Cada vez que guardás, recargá `http://localhost:3000/docs`. Si aparece un error, casi siempre es la **indentación**: usá 2 espacios, nunca tabs. Si un texto tiene dos puntos adentro (por ejemplo `available: false`), ponelo entre comillas dobles.

### 1.a · Schemas

Van dentro de `components:` → `schemas:`, debajo del `Error` que ya está.

| Schema | Campos | Obligatorios |
|---|---|---|
| `Author` | `id` (integer), `name` (string), `nationality` (string) | todos |
| `Book` | `id` (integer), `title` (string), `year` (integer), `author_id` (integer), `available` (boolean) | todos |
| `NewBook` | `title` (string, de 1 a 200 caracteres), `year` (integer, de 1000 a 2100), `author_id` (integer) | todos |
| `UpdateBook` | los mismos campos y reglas que `NewBook` | ninguno |
| `BookPage` | `data` (array de `Book`), `total`, `page`, `limit` (integer) | todos |
| `Loan` | `id` (integer), `book_id` (integer), `member_name` (string), `loan_date` (string), `return_date` (string, puede ser `null`) | todos |
| `NewLoan` | `book_id` (integer), `member_name` (string, no vacío) | todos |
| `LoanReturn` | `return_date` (string, formato `YYYY-MM-DD`) | todos |

### 1.b · Endpoints

Documentá los 12 endpoints, agrupados con `tags` en `Authors`, `Books` y `Loans`. Cada respuesta de error usa el schema `Error`.

| # | Endpoint | Recibe | Responde |
|---|---|---|---|
| 1 | `GET /authors` | — | 200 con un array de `Author` |
| 2 | `GET /authors/{id}` | — | 200 con `Author` · 400 · 404 |
| 3 | `DELETE /authors/{id}` | — | 204 · 400 · 404 · 409 (tiene libros) |
| 4 | `GET /books` | query params (abajo) | 200 con `BookPage` · 400 |
| 5 | `GET /books/{id}` | — | 200 con `Book` · 400 · 404 |
| 6 | `POST /books` | `NewBook` | 201 con `Book` · 400 · 404 (el autor no existe) |
| 7 | `PATCH /books/{id}` | `UpdateBook` | 200 con `Book` · 400 · 404 |
| 8 | `PUT /books/{id}` | `NewBook` | 200 con `Book` · 400 · 404 |
| 9 | `DELETE /books/{id}` | — | 204 · 400 · 404 · 409 (tiene préstamos) |
| 10 | `GET /loans` | query param `active` (boolean, opcional) | 200 con un array de `Loan` · 400 |
| 11 | `POST /loans` | `NewLoan` | 201 con `Loan` · 400 · 404 (el libro no existe) · 409 (el libro no está disponible) |
| 12 | `PATCH /loans/{id}` | `LoanReturn` | 200 con `Loan` · 400 · 404 · 409 (ya se devolvió) |

Query params de `GET /books`, todos opcionales:

| Param | Tipo | Qué hace |
|---|---|---|
| `title` | string | Libros cuyo título **contiene** ese texto, sin importar mayúsculas. |
| `available` | boolean | `true`: solo disponibles. `false`: solo prestados. |
| `author_id` | integer | Solo los libros de ese autor. |
| `page` | integer, mínimo 1, por defecto 1 | Qué página devolver. |
| `limit` | integer, mínimo 1, por defecto 10 | Cuántos libros por página. Si piden más de 50, se usa 50. |

En la descripción del endpoint 11 aclará que el libro pasa a `available: false`, y en la del 12 que vuelve a `available: true`.

**Prueba del paso 1.** En `/docs` se ven los 12 endpoints en 3 grupos y los 9 schemas, sin errores.

---

## Paso 2 · Los tipos (`src/types/`)

📖 3.4 · 3.6 · 3.9 · 5.5 · 5.10

Los tipos son el contrato escrito en TypeScript: tienen que coincidir campo por campo con los schemas. Son los **DTOs** de la API (lo que entra y lo que sale).

Creá estos archivos y tipos:

| Archivo | Tipos |
|---|---|
| `author.ts` | `Author` |
| `book.ts` | `Book` · `NewBook` (un `Book` sin `id` ni `available`) · `UpdateBook` (un `NewBook` con todo opcional) · `BookFilters` (los tres filtros de `GET /books`, todos opcionales) |
| `loan.ts` | `Loan` · `NewLoan` · `LoanReturn` |
| `common.ts` | `Pagination` (`page` y `limit`) · `Page<T>` (`data`, `total`, `page`, `limit`: una página de cualquier cosa, por ejemplo `Page<Book>`) |

> 💡 Pistas: `Omit` y `Partial` (📖 3.6) te ahorran repetir campos, y `Page<T>` es un genérico (📖 3.9). Pensá qué tipo tiene `return_date` en un préstamo que todavía no se devolvió.

**Prueba del paso 2.** `npm run build` termina sin errores.

---

## Paso 3 · Rutas + repositories: conectar con la base

📖 4.4 · 4.5 · 5.8 · 5.9 · README, sección "Sequelize en cinco líneas"

Ahora la API empieza a leer y escribir en **la base de datos real**. Vas a hacer dos capas:

- **Repositories** (`src/repositories/`): hablan con la base usando los modelos de Sequelize. Quedan en su versión final.
- **Rutas** (`src/routes/`): un router por recurso, montado en `src/server.ts`. **Por ahora** la función de cada ruta llama directo al repository y responde.

```
ruta ──▶ repository ──▶ base de datos
```

> ⚠️ **Esto es temporal y a propósito.** Una ruta no debería tener lógica; lo hacemos así para ver la base funcionando cuanto antes. Marcá cada función de ruta con el comentario `// TEMPORAL`: en el paso 4 la vas a mover a un controller.

En este paso **no se valida nada**: probá solo con datos correctos.

**Repositories que tenés que hacer:**

| Archivo | Funciones |
|---|---|
| `authors.repository.ts` | `findAll()` · `findById(id)` · `remove(id)` |
| `books.repository.ts` | `findById(id)` · `search(filters, pagination)` · `create(data)` · `update(id, changes)` · `remove(id)` |
| `loans.repository.ts` | `findAll(activeOnly)` · `findById(id)` · `create(data, loanDate)` · `registerReturn(id, returnDate)` |

Cómo tienen que comportarse:

- Siempre devuelven **tus tipos** (`Author`, `Book`, `Loan`, `Page<Book>`), nunca la instancia de Sequelize.
- `findById`, `update` y `registerReturn` devuelven `null` si no existe. `remove` devuelve `true` si borró y `false` si no existía.
- Las listas salen ordenadas por `id`.
- `search` aplica solo los filtros que vinieron y devuelve la página pedida junto con el total de resultados.
- `create` de libros: el `id` lo pone la base y `available` empieza en `true`.
- `findAll(true)` de préstamos trae solo los que no se devolvieron.

> 💡 Pistas:
> - Importá los modelos siempre desde `../models/index.js`. Como el modelo y tu tipo se llaman igual, renombrá uno al importar (`as`).
> - Para pasar una instancia de Sequelize a objeto común: `.toJSON()` (📖 5.10).
> - Para `search`: `findAndCountAll` (trae filas y total), `limit` y `offset` para paginar, y `Op.iLike` para buscar texto sin importar mayúsculas (`Op.like` sí distingue en Postgres).
> - La fecha de hoy en formato `YYYY-MM-DD`: `new Date().toISOString().slice(0, 10)`.

**Rutas:** un archivo por recurso (`authors.routes.ts`, `books.routes.ts`, `loans.routes.ts`), con los endpoints de la tabla del paso 1. Por ahora:

- `GET /books` siempre devuelve la primera página de 10, sin filtros.
- `POST`, `PUT` y `PATCH` le pasan el body tal cual al repository. (Es peligroso, 📖 5.10: se arregla en el paso 4.)
- `POST /loans` usa la fecha de hoy como `loan_date`.

> 💡 Dentro del router, las rutas son `"/"` y `"/:id"`: el `/authors` lo pone `app.use` en `server.ts`.

**Prueba del paso 3.** Probá **en este orden**, solo con datos correctos:

| # | Pedido | Esperado |
|---|---|---|
| 1 | `GET /authors` | 200, 5 autores |
| 2 | `GET /authors/1` | 200, Julio Cortázar |
| 3 | `GET /books` | 200, 6 libros, `total: 6` |
| 4 | `GET /books/1` | 200, Rayuela |
| 5 | `POST /books` con `{ "title": "New", "year": 2000, "author_id": 1 }` | 201, `id: 7`, `available: true` |
| 6 | `PATCH /books/7` con `{ "title": "Other" }` | 200, `title: "Other"`, `year` sigue en 2000 |
| 7 | `DELETE /books/7` | 204 |
| 8 | `DELETE /authors/5` | 204 |
| 9 | `GET /loans` | 200, 3 préstamos |
| 10 | `POST /loans` con `{ "book_id": 3, "member_name": "Sofía" }` | 201, `return_date: null` |
| 11 | `PATCH /loans/4` con `{ "return_date": "2026-09-30" }` | 200, con la fecha puesta |

Abrí las tablas en pgAdmin (clic derecho → **View/Edit Data** → **All Rows**) y fijate que los cambios están guardados de verdad.

Después, corré **`npm run seed`** para dejar la base como al principio.

> **Lo que todavía anda mal (y está bien que ande mal):**
> - `GET /authors/999` responde 200 con `null`. Debería ser 404. → Paso 4.
> - `GET /authors/abc` o un body con datos incorrectos rompen el pedido: Swagger se queda cargando y la terminal muestra el error (ver abajo). → Paso 4.
> - Después de prestar el libro 3, `GET /books/3` sigue diciendo `available: true`. → Paso 5.
> - `DELETE /authors/1` falla, porque la base no deja borrar un autor con libros. → Paso 5.
>
> Cuando un pedido falla con un error de la base, Swagger se queda "cargando" y en la terminal aparece el error en rojo. Siempre que pase algo raro, **mirá la terminal**.

---

## Paso 4 · Controllers: validar lo que llega

📖 4.8 · 4.11 · 4.12 · 5.5 · 5.10

Ahora sacás la lógica de las rutas y la pasás a **controllers** (`src/controllers/`, un archivo por recurso):

```
antes:    ruta ─────────────────▶ repository ──▶ base
después:  ruta ──▶ controller ──▶ repository ──▶ base
```

Hacelo en dos partes:

1. **Mover sin cambiar nada.** Cada función de ruta pasa a ser una función con nombre en el controller, y la ruta queda solo como mapa (verbo + URL → función). Borrá los `// TEMPORAL`. Probá que todo responde igual que antes.

   | Controller | Funciones |
   |---|---|
   | authors | `list` · `getOne` · `remove` |
   | books | `search` · `getOne` · `create` · `update` (PATCH) · `replace` (PUT) · `remove` |
   | loans | `list` · `create` · `registerReturn` |

2. **Agregar las validaciones** de abajo.

Las validaciones que se repiten entre controllers van en **`src/controllers/validations.ts`**. Como mínimo: una función para convertir un id, una para convertir `"true"`/`"false"` a boolean, y una para validar el body de un libro que sirva para POST, PUT y PATCH.

Los mensajes de error los elegís vos: tienen que estar **en inglés** y explicar qué está mal (por ejemplo, `"year must be an integer from 1000 to 2100"`).

> 💡 Todo lo que llega en `req.params` y `req.query` es **texto**, aunque parezca un número: `"5"` no es `5`. Escribí primero los casos de error, cada uno con `return`, y al final el caso feliz.

### Validaciones

**Ids** (todos los endpoints con `:id`): si no es un entero mayor que 0 → 400. Si no existe → 404 (`Author not found`, `Book not found`, `Loan not found`).

**Query params de `GET /books`:**

| Param | Si no viene | Es 400 si... |
|---|---|---|
| `title` | no se filtra | nunca |
| `available` | no se filtra | no es `"true"` ni `"false"` |
| `author_id` | no se filtra | no es un entero mayor que 0 |
| `page` | vale 1 | no es un entero mayor que 0 |
| `limit` | vale 10 | no es un entero mayor que 0. Si es mayor que 50 **no** es error: se usa 50. |

**Body de libros:**

| Campo | Regla |
|---|---|
| `title` | texto de 1 a 200 caracteres |
| `year` | entero de 1000 a 2100 |
| `author_id` | entero mayor que 0 |

- `POST` y `PUT`: los tres campos son obligatorios.
- `PATCH`: todos son opcionales, pero los que vienen tienen que cumplir la regla. Body vacío → 400.

**Préstamos:**

- `GET /loans`: `active` es opcional; si viene y no es `"true"` ni `"false"` → 400.
- `POST /loans`: `book_id` entero mayor que 0 y `member_name` texto no vacío.
- `PATCH /loans/:id`: `return_date` tiene que ser texto con formato `YYYY-MM-DD`.

> 💡 Para revisar el formato de una fecha podés usar una expresión regular: `/^\d{4}-\d{2}-\d{2}$/`.

### DTOs: nunca `req.body` directo

Ahora el controller arma un objeto **solo con los campos permitidos** (`NewBook`, `UpdateBook`, `NewLoan`, `LoanReturn`) y le pasa eso al repository (📖 5.10). Si el cliente manda `"available": false` o `"id": 99`, se ignora. En el PATCH, el DTO lleva solo los campos que vinieron.

**Prueba del paso 4.** Corré `npm run seed` y probá:

| Pedido | Esperado |
|---|---|
| `GET /authors/abc` | 400 |
| `GET /authors/999` | 404 |
| `GET /books/999` | 404 |
| `GET /books?title=EL` | `total: 2` (Rayuela y El Aleph) |
| `GET /books?available=true&author_id=2` | `total: 1` (Ficciones) |
| `GET /books?page=2&limit=2` | 2 libros (ids 3 y 4), `page: 2` |
| `GET /books?limit=500` | 200, `limit: 50` |
| `GET /books?available=banana` | 400 |
| `GET /books?page=0` | 400 |
| `POST /books` con `{ "title": "New" }` | 400, falta `year` |
| `POST /books` con `{ "title": "New", "year": "mil", "author_id": 1 }` | 400, `year` no es número |
| `POST /books` con `{ "title": "New", "year": 50, "author_id": 1 }` | 400, `year` fuera de rango |
| `POST /books` con `{ "title": "New", "year": 2000, "author_id": 1, "available": false }` | 201, pero con `available: true`: el campo de más se ignoró |
| `PATCH /books/1` con `{}` | 400 |
| `PATCH /books/1` con `{ "title": "Other" }` | 200, `year` sigue en 1963 |
| `PUT /books/1` con `{ "title": "Other" }` | 400, al PUT le faltan campos |
| `PUT /books/999` con `{ "title": "X", "year": 2000, "author_id": 1 }` | 404 |
| `DELETE /books/999` | 404 |
| `GET /loans?active=true` | 200, 2 préstamos |
| `GET /loans?active=maybe` | 400 |
| `PATCH /loans/999` con `{ "return_date": "2026-09-30" }` | 404 |
| `PATCH /loans/1` con `{ "return_date": "yesterday" }` | 400 |

---

## Paso 5 · Services: las reglas del negocio

📖 5.6

La API ya valida bien los datos, pero todavía no respeta las reglas de la biblioteca. Esas reglas van en **services** (`src/services/`, un archivo por recurso), que se meten entre el controller y el repository:

```
antes:    ruta ──▶ controller ──────────────▶ repository ──▶ base
después:  ruta ──▶ controller ──▶ service ──▶ repository ──▶ base
```

- El service **no conoce `req` ni `res`**: recibe datos ya validados y devuelve un resultado.
- El controller deja de importar repositories: solo llama al service.
- El service **nunca** elige un status. Cuando algo sale mal, devuelve un resultado que lo diga (por ejemplo, el texto `"AUTHOR_NOT_FOUND"`) y el controller decide el status.

### Reglas

| Endpoint | Regla | Si no se cumple |
|---|---|---|
| `DELETE /authors/:id` | No se puede borrar un autor que tiene libros. | 409 `Author has books` |
| `POST /books` · `PUT` · `PATCH` | El `author_id` tiene que ser de un autor que existe (en PATCH, solo si viene). | 404 `Author not found` |
| `DELETE /books/:id` | No se puede borrar un libro que tiene préstamos. | 409 `Book has loans` |
| `POST /loans` | El libro tiene que existir. | 404 `Book not found` |
| `POST /loans` | El libro tiene que estar disponible. | 409 `Book is not available` |
| `POST /loans` | Al prestarlo, el libro pasa a `available: false`. La fecha del préstamo la decide el service. | — |
| `PATCH /loans/:id` | Un préstamo se devuelve una sola vez. | 409 `Loan already returned` |
| `PATCH /loans/:id` | Al devolverlo, el libro vuelve a `available: true`. | — |

Para cumplirlas, vas a necesitar funciones nuevas en los repositories (por ejemplo: contar los libros de un autor, contar los préstamos de un libro, cambiar la disponibilidad de un libro). Pensá cuáles y agregalas.

> 💡 Si una función de repository devuelve `Book | null` pero tu service promete devolver `Book` o un texto de error, TypeScript no te va a dejar devolver el `null`. Mirá el operador `??`.

### Revisar las capas

Con el buscador de VS Code, buscá dentro de `src/`:

| Buscá | Tiene que aparecer solo en |
|---|---|
| `repository.js` | `src/services/` |
| `service.js` | `src/controllers/` |
| `controller.js` | `src/routes/` |
| `models/index.js` | `src/repositories/` (y en `src/db/` y `src/models/`, que ya venían hechos) |
| `TEMPORAL` | en ningún lado |

**Prueba del paso 5.** Corré `npm run seed` y probá **en este orden**:


| # | Pedido | Esperado |
|---|---|---|
| 1 | `POST /books` con `{ "title": "New", "year": 2000, "author_id": 99 }` | 404, el autor no existe |
| 2 | `POST /books` con `{ "title": "New", "year": 2000, "author_id": 1 }` | 201, `id: 7` |
| 3 | `PATCH /books/7` con `{ "author_id": 99 }` | 404, el autor no existe |
| 4 | `DELETE /books/2` | 409, tiene préstamos |
| 5 | `DELETE /books/7` | 204 |
| 6 | `DELETE /authors/1` | 409, tiene libros |
| 7 | `DELETE /authors/5` | 204 |
| 8 | `POST /loans` con `{ "book_id": 99, "member_name": "Sofía" }` | 404, el libro no existe |
| 9 | `POST /loans` con `{ "book_id": 3, "member_name": "Sofía" }` | 201, `return_date: null` |
| 10 | `GET /books/3` | `available: false` |
| 11 | `POST /loans` con `{ "book_id": 3, "member_name": "Tomás" }` | 409, ya está prestado |
| 12 | `GET /loans?active=true` | 3 préstamos |
| 13 | `PATCH /loans/4` con `{ "return_date": "2026-09-30" }` | 200 |
| 14 | `GET /books/3` | `available: true` |
| 15 | `PATCH /loans/4` con `{ "return_date": "2026-09-30" }` | 409, ya fue devuelto |

Por último, corré `npm run seed` otra vez y repetí la tabla del paso 4: tiene que seguir dando todo igual.

---

## Entrega

- [ ] `docs/openapi.yaml` con los 12 endpoints y los 9 schemas. `/docs` carga sin errores.
- [ ] `src/types/`: `author.ts`, `book.ts`, `loan.ts`, `common.ts`.
- [ ] `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`: un archivo por recurso (authors, books, loans), más `controllers/validations.ts`.
- [ ] Todo el código (archivos, variables, funciones, tipos, rutas, campos y mensajes de error) está en inglés.
- [ ] La revisión de capas del paso 5 da todo bien.
- [ ] Las tablas de prueba de los pasos 4 y 5 dan todo lo esperado.
- [ ] `npm run build` termina sin errores.
- [ ] Todo está subido a tu fork (`git push`). Para entregar, mandá el link de tu fork.
