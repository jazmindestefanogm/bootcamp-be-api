# De la base de datos a la API — Práctica

Vas a construir, paso a paso, la API de una biblioteca: **Library API** (carpeta `biblioteca-api`). Al final vas a tener 12 endpoints funcionando contra una base de datos real.

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

En cada paso te digo **qué archivo crear**, **qué escribir** y **cómo probar** que funciona. No pases al paso siguiente hasta que la prueba del paso actual te dé lo esperado.

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

**Primero, la base de datos.** Necesitás tener Postgres y pgAdmin instalados.

1. Abrí **pgAdmin** y conectate a tu servidor.
2. Clic derecho en **Databases** → **Create** → **Database...** → en **Database** escribí `library` (todo en minúscula) → **Save**. La base queda vacía; las tablas se crean solas en el punto siguiente.
3. Abrí `biblioteca-api/src/db/connection.ts` y cambiá `USER` y `PASSWORD` por los que elegiste al instalar Postgres.

**Después, el proyecto.** En una terminal, dentro de la carpeta `biblioteca-api`:

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
| `ECONNREFUSED` | Que Postgres esté prendido. |

---

## Paso 1 · El contrato (`docs/openapi.yaml`)

📖 2.2 · 2.6 · 2.7 · README, sección "OpenAPI en cinco líneas"

El contrato describe la API **antes** de programarla. En este paso no escribís nada de TypeScript: solo YAML.

Cada vez que guardás el archivo, recargá `http://localhost:3000/docs` para ver cómo queda. Si la página muestra un error, casi siempre es la **indentación**: en YAML los espacios importan. Usá siempre 2 espacios, nunca tabs.

### 1.a · Schemas

Los schemas van dentro de `components:` → `schemas:`, debajo del `Error` que ya está. Escribí estos:

| Schema | Campos | Obligatorios (`required`) |
|---|---|---|
| `Author` | `id` (integer), `name` (string), `nationality` (string) | todos |
| `Book` | `id` (integer), `title` (string), `year` (integer), `author_id` (integer), `available` (boolean) | todos |
| `NewBook` | `title` (string, `minLength: 1`, `maxLength: 200`), `year` (integer, `minimum: 1000`, `maximum: 2100`), `author_id` (integer) | todos |
| `UpdateBook` | los mismos 3 campos y reglas que `NewBook` | **ninguno** (no lleva `required`) |
| `BookPage` | `data` (array de `Book`), `total` (integer), `page` (integer), `limit` (integer) | todos |
| `Loan` | `id` (integer), `book_id` (integer), `member_name` (string), `loan_date` (string), `return_date` (string, `nullable: true`) | todos |
| `NewLoan` | `book_id` (integer), `member_name` (string, `minLength: 1`) | todos |
| `LoanReturn` | `return_date` (string, ejemplo `2026-09-30`) | todos |

Un array de `Book` se escribe así:

```yaml
data:
  type: array
  items:
    $ref: "#/components/schemas/Book"
```

### 1.b · Endpoints de autores (1, 2 y 3)

Reemplazá `paths: {}` por `paths:` y escribí los endpoints. Este es el endpoint 2 completo, para que lo uses de modelo:

```yaml
paths:
  /authors/{id}:
    get:
      summary: Get an author by id
      tags: [Authors]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        "200":
          description: Author found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Author"
        "400":
          description: Id is not a number
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Author not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

Fijate que el `get` y el `delete` de `/authors/{id}` van **dentro del mismo bloque** `/authors/{id}:`, uno debajo del otro.

| # | Endpoint | Respuestas |
|---|---|---|
| 1 | `GET /authors` | 200 con un array de `Author` |
| 2 | `GET /authors/{id}` | 200 con `Author` · 400 · 404 |
| 3 | `DELETE /authors/{id}` | 204 (sin `content`) · 400 · 404 · 409 "Author has books" |

### 1.c · Endpoints de libros (4 a 9)

Usá `tags: [Books]`.

| # | Endpoint | Body | Respuestas |
|---|---|---|---|
| 4 | `GET /books` | — | 200 con `BookPage` · 400 |
| 5 | `GET /books/{id}` | — | 200 con `Book` · 400 · 404 |
| 6 | `POST /books` | `NewBook` | 201 con `Book` · 400 · 404 "Author not found" |
| 7 | `PATCH /books/{id}` | `UpdateBook` | 200 con `Book` · 400 · 404 |
| 8 | `PUT /books/{id}` | `NewBook` | 200 con `Book` · 400 · 404 |
| 9 | `DELETE /books/{id}` | — | 204 · 400 · 404 · 409 "Book has loans" |

El endpoint 4 tiene estos **query params**, todos con `in: query` y `required: false`:

| Param | Tipo | Qué hace |
|---|---|---|
| `title` | string | Trae los libros cuyo título **contiene** ese texto, sin importar mayúsculas. |
| `available` | boolean | `true` trae solo los disponibles; `false`, solo los prestados. |
| `author_id` | integer | Trae solo los libros de ese autor. |
| `page` | integer, `minimum: 1`, `default: 1` | Qué página devolver. |
| `limit` | integer, `minimum: 1`, `default: 10` | Cuántos libros por página. Si piden más de 50, se usa 50. |

El body se escribe con `requestBody`, igual que en la plantilla que está comentada en el archivo.

### 1.d · Endpoints de préstamos (10, 11 y 12)

Usá `tags: [Loans]`.

| # | Endpoint | Body | Respuestas |
|---|---|---|---|
| 10 | `GET /loans` | — | 200 con un array de `Loan` · 400 |
| 11 | `POST /loans` | `NewLoan` | 201 con `Loan` · 400 · 404 "Book not found" · 409 "Book is not available" |
| 12 | `PATCH /loans/{id}` | `LoanReturn` | 200 con `Loan` · 400 · 404 · 409 "Loan already returned" |

El endpoint 10 tiene un query param `active` (boolean, opcional).

En el `description` del endpoint 11 escribí: *"When a book is loaned, it becomes `available: false`."* En el del 12: *"When a loan is returned, the book becomes `available: true` again."*

**Prueba del paso 1.** En `http://localhost:3000/docs` se ven los 12 endpoints, agrupados en Authors, Books y Loans, sin ningún mensaje de error. Abajo de todo se ven los 9 schemas.

> Todavía no podés usar "Try it out": el código no existe. Eso viene ahora.

---

## Paso 2 · Los tipos (`src/types/`)

📖 3.4 · 3.6 · 3.7 · 5.5 · 5.10

Los tipos son el contrato escrito en TypeScript. Tienen que coincidir campo por campo con los schemas del paso 1. Son los **DTOs** de la API: `Book` es lo que sale, y `NewBook`, `UpdateBook`, `NewLoan` y `LoanReturn` son lo que entra.

Creá **`src/types/author.ts`**:

```ts
export interface Author {
  id: number;
  name: string;
  nationality: string;
}
```

Creá **`src/types/book.ts`** con:

- `interface Book` con los 5 campos del schema `Book`.
- `type NewBook = Omit<Book, "id" | "available">;` → un libro sin `id` ni `available` (esos los pone la API).
- `type UpdateBook = Partial<NewBook>;` → los mismos campos, pero todos opcionales.
- `interface BookFilters` con `title?: string`, `available?: boolean`, `author_id?: number`. El `?` significa "puede no venir".
- `interface Pagination` con `page: number` y `limit: number`.
- `interface Page<T>` con `data: T[]`, `total: number`, `page: number`, `limit: number`.

Creá **`src/types/loan.ts`** con:

- `interface Loan` con los 5 campos. Ojo: `return_date: string | null;`
- `interface NewLoan` con `book_id: number` y `member_name: string`.
- `interface LoanReturn` con `return_date: string`.

**Prueba del paso 2.** En otra terminal (dejá el servidor corriendo en la primera), corré `npm run build`. Tiene que terminar sin errores.

---

## Paso 3 · Rutas + repositories: conectar con la base

📖 4.4 · 4.5 · 5.8 · 5.9 · README, sección "Sequelize en cinco líneas"

En este paso la API empieza a leer y escribir **en la base de datos real**. Vas a escribir dos capas:

- El **repository**, que habla con la base usando Sequelize. Este ya queda en su versión final.
- La **ruta**, que por ahora hace todo lo demás: lee el pedido, llama al repository y responde.

```
ruta ──▶ repository ──▶ base de datos
```

> ⚠️ **Esto es temporal y a propósito.** Una ruta no debería tener lógica. Lo hacemos así para ver la base funcionando lo antes posible. En el paso 4 vas a mover ese código a los controllers, y en el paso 5 vas a agregar los services. Por eso cada handler lleva el comentario `// TEMPORAL`.

En este paso **no se valida nada**: probá solamente con datos correctos. Los errores (400, 404, 409) vienen en los pasos 4 y 5.

Dos cosas importantes de Sequelize:

- Los modelos (`Author`, `Book`, `Loan`) ya están hechos en `src/models/`. Importalos **siempre** desde `../models/index.js`.
- Lo que devuelve Sequelize **no** es un objeto común: es una "instancia" con muchas cosas más adentro. Convertila siempre con `.toJSON()` antes de devolverla (📖 5.10).

### 3.a · Autores

Creá **`src/repositories/authors.repository.ts`**. Como el modelo y tu tipo se llaman igual (`Author`), al importar el modelo le cambiás el nombre con `as`:

```ts
import { Author as AuthorModel } from "../models/index.js";
import { Author } from "../types/author.js";

export async function findAll(): Promise<Author[]> {
  const rows = await AuthorModel.findAll({ order: [["id", "ASC"]] });
  return rows.map((row) => row.toJSON());
}

export async function findById(id: number): Promise<Author | null> {
  const row = await AuthorModel.findByPk(id);
  return row ? row.toJSON() : null;
}

export async function remove(id: number): Promise<boolean> {
  const row = await AuthorModel.findByPk(id);
  if (!row) return false;
  await row.destroy();
  return true;
}
```

Creá **`src/routes/authors.routes.ts`**:

```ts
import { Router, Request, Response } from "express";
import * as AuthorsRepository from "../repositories/authors.repository.js";

const router = Router();

// TEMPORAL: en el paso 4 este código se mueve al controller.
router.get("/", async (req: Request, res: Response) => {
  const authors = await AuthorsRepository.findAll();
  res.json(authors);
});

// TEMPORAL
router.get("/:id", async (req: Request, res: Response) => {
  const author = await AuthorsRepository.findById(Number(req.params.id));
  res.json(author);
});

// TEMPORAL
router.delete("/:id", async (req: Request, res: Response) => {
  await AuthorsRepository.remove(Number(req.params.id));
  res.status(204).send();
});

export default router;
```

En **`src/server.ts`**, arriba de todo agregá `import authorsRoutes from "./routes/authors.routes.js";` y, donde dice "Acá vas a montar tus routers", descomentá la línea `app.use("/authors", authorsRoutes);`.

Fijate que en el router la ruta es `"/"` y `"/:id"`, no `"/authors"`. El `/authors` ya lo pone el `app.use`. En Express, `:id` es lo que en el contrato escribiste como `{id}`.

**Probá** en Swagger: `GET /authors` tiene que traer los 5 autores de la base. Si funciona, ya tenés tu primera API conectada a Postgres. Seguí con libros.

### 3.b · Libros

Creá **`src/repositories/books.repository.ts`** con estas funciones:

| Función | Devuelve | Cómo |
|---|---|---|
| `findById(id)` | `Book \| null` | Igual que en autores. |
| `search(filters, pagination)` | `Page<Book>` | Ver abajo. |
| `create(data: NewBook)` | `Book` | `BookModel.create(data)` y devolvés `toJSON()`. El `id` lo pone la base; `available` empieza en `true` solo. |
| `update(id, changes: UpdateBook)` | `Book \| null` | Buscás con `findByPk`. Si no existe → `null`. Si existe: `await row.update(changes)` y devolvés `toJSON()`. |
| `remove(id)` | `boolean` | Igual que en autores. |

`search` usa `findAndCountAll`, que devuelve las filas de la página **y** el total:

```ts
import { Op } from "sequelize";
import { Book as BookModel } from "../models/index.js";
import { Book, NewBook, UpdateBook, BookFilters, Pagination, Page } from "../types/book.js";

export async function search(filters: BookFilters, pagination: Pagination): Promise<Page<Book>> {
  const where: Record<string, unknown> = {};
  if (filters.title !== undefined) where.title = { [Op.iLike]: `%${filters.title}%` };
  // Completá vos: el filtro por `available` y el filtro por `author_id`.

  const { rows, count } = await BookModel.findAndCountAll({
    where,
    limit: pagination.limit,                           // cuántas filas
    offset: (pagination.page - 1) * pagination.limit,  // cuántas saltar
    order: [["id", "ASC"]],                            // siempre ordená al paginar
  });

  return {
    data: rows.map((row) => row.toJSON()),
    total: count,
    page: pagination.page,
    limit: pagination.limit,
  };
}
```

`Op.iLike` busca el texto **en cualquier parte** del título y sin importar mayúsculas. Ojo: `Op.like` (sin la `i`) sí distingue mayúsculas en Postgres.

Creá **`src/routes/books.routes.ts`**, montado en `/books`, con los 6 endpoints. Todos siguen la forma de autores. Dos ejemplos:

```ts
// TEMPORAL: por ahora sin filtros y siempre la página 1. Los query params se leen en el paso 4.
router.get("/", async (req: Request, res: Response) => {
  const page = await BooksRepository.search({}, { page: 1, limit: 10 });
  res.json(page);
});

// TEMPORAL: pasar req.body directo al repository es peligroso (📖 5.10). Se arregla en el paso 4.
router.post("/", async (req: Request, res: Response) => {
  const book = await BooksRepository.create(req.body);
  res.status(201).json(book);
});
```

`PATCH /:id` y `PUT /:id` llaman **los dos** a `BooksRepository.update(Number(req.params.id), req.body)` y responden el libro. `DELETE /:id` llama a `remove` y responde 204.

### 3.c · Préstamos

Creá **`src/repositories/loans.repository.ts`** con:

| Función | Devuelve | Cómo |
|---|---|---|
| `findAll(activeOnly: boolean)` | `Loan[]` | Si `activeOnly` es `true`, el `where` es `{ return_date: null }`. Si no, `{}`. Ordená por `id`. |
| `findById(id)` | `Loan \| null` | Igual que en autores. |
| `create(data: NewLoan, loanDate: string)` | `Loan` | `LoanModel.create({ ...data, loan_date: loanDate })`. |
| `registerReturn(id, returnDate: string)` | `Loan \| null` | Buscás con `findByPk`; si existe, `row.update({ return_date: returnDate })`. |

Creá **`src/routes/loans.routes.ts`**, montado en `/loans`:

- `GET /` → `LoansRepository.findAll(false)` (por ahora trae todos).
- `POST /` → calculá la fecha de hoy con `const today = new Date().toISOString().slice(0, 10);` (da algo como `"2026-09-22"`), llamá a `LoansRepository.create(req.body, today)` y respondé 201.
- `PATCH /:id` → `LoansRepository.registerReturn(Number(req.params.id), req.body.return_date)` y respondé el préstamo.

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
> - `GET /authors/abc` o un body con datos incorrectos rompen el pedido. → Paso 4.
> - Después de prestar el libro 3, `GET /books/3` sigue diciendo `available: true`. → Paso 5.
> - `DELETE /authors/1` falla, porque la base no deja borrar un autor con libros. → Paso 5.
>
> Cuando un pedido falla con un error de la base, Swagger se queda "cargando" y en la terminal aparece el error en rojo. Siempre que pase algo raro, **mirá la terminal**.

---

## Paso 4 · Los controllers: validar lo que llega

📖 4.8 · 4.11 · 4.12 · 5.5 · 5.10

Ahora vas a sacar el código de las rutas y lo vas a llevar a los **controllers**. La ruta queda solo con el mapa (verbo + URL → función), y el controller se encarga de revisar lo que llega.

```
antes:    ruta ─────────────────▶ repository ──▶ base
después:  ruta ──▶ controller ──▶ repository ──▶ base
```

Todo lo que llega en `req.params` y `req.query` es **texto** (string), aunque parezca un número. `"5"` no es lo mismo que `5`. El controller lo convierte al tipo correcto y, si no se puede, responde 400.

Escribí siempre **primero los errores**, cada uno con `return`, y al final el caso feliz. El `return` hace que la función termine ahí y no siga.

### 4.a · Mover el código de autores al controller

Creá **`src/controllers/authors.controller.ts`** y mové ahí los tres handlers. Cada uno pasa a ser una función con nombre:

```ts
import { Request, Response } from "express";
import * as AuthorsRepository from "../repositories/authors.repository.js";

export async function list(req: Request, res: Response) {
  const authors = await AuthorsRepository.findAll();
  res.json(authors);
}

export async function getOne(req: Request, res: Response) {
  const author = await AuthorsRepository.findById(Number(req.params.id));
  res.json(author);
}

export async function remove(req: Request, res: Response) {
  await AuthorsRepository.remove(Number(req.params.id));
  res.status(204).send();
}
```

La función de borrar se llama `remove` y no `delete` porque `delete` es una palabra reservada de JavaScript.

Y **`src/routes/authors.routes.ts`** queda así, sin nada de lógica:

```ts
import { Router } from "express";
import * as controller from "../controllers/authors.controller.js";

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.delete("/:id", controller.remove);

export default router;
```

**Probá** `GET /authors` y `GET /authors/1`: tienen que responder **exactamente lo mismo** que antes. Moviste el código, pero no cambiaste lo que hace.

Hacé lo mismo con libros y préstamos. Los nombres de las funciones son:

| Archivo | Endpoint → función |
|---|---|
| `books.controller.ts` | `GET /` → `search` · `GET /:id` → `getOne` · `POST /` → `create` · `PATCH /:id` → `update` · `PUT /:id` → `replace` · `DELETE /:id` → `remove` |
| `loans.controller.ts` | `GET /` → `list` · `POST /` → `create` · `PATCH /:id` → `registerReturn` |

### 4.b · Validar los ids y responder 404

Creá **`src/controllers/validations.ts`**. Vas a ir agregando acá las funciones de validación que usan varios controllers. La primera:

```ts
// Convierte el texto a número entero positivo.
// Devuelve null si no se puede (ej.: "abc", "2.5", "-3").
export function parseId(text: string): number | null {
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1) return null;
  return value;
}
```

Usala en `getOne` de autores, y agregá el 404 cuando el repository devuelve `null`:

```ts
import { parseId } from "./validations.js";

export async function getOne(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const author = await AuthorsRepository.findById(id);
  if (!author) return res.status(404).json({ error: "Author not found" });

  res.json(author);
}
```

Hacé lo mismo en **todos** los endpoints que tienen `:id` (son 6):

- Si el id no es válido → 400.
- Si el repository devuelve `null` (en `findById`, `update`, `registerReturn`) o `false` (en `remove`) → 404, con el mensaje que corresponda: `"Author not found"`, `"Book not found"` o `"Loan not found"`.

### 4.c · Query params de `GET /books`

En `search`, leé cada query param y convertilo. Si un param **no viene**, no es un error: simplemente no se filtra por eso.

| Param | Si no viene | Cómo se convierte | Es 400 si... |
|---|---|---|---|
| `title` | no se filtra | se usa tal cual | nunca |
| `available` | no se filtra | `"true"` → `true`, `"false"` → `false` | es cualquier otra cosa |
| `author_id` | no se filtra | con `parseId` | `parseId` devuelve `null` |
| `page` | vale `1` | con `Number` | no es un entero, o es menor que 1 |
| `limit` | vale `10` | con `Number` | no es un entero, o es menor que 1. Si es mayor que 50, **no** es error: se usa 50. |

Para saber si un query param vino: `if (req.query.available !== undefined)`. Para usarlo como texto: `String(req.query.available)`.

Agregá a `validations.ts` una función `parseBoolean(text: string): boolean | null` que devuelva `true`, `false` o `null` si el texto no es ni `"true"` ni `"false"`. La vas a usar también en préstamos.

Con los valores ya convertidos, armá un objeto `BookFilters` y uno `Pagination` y pasáselos a `BooksRepository.search`, en lugar del `{}` y `{ page: 1, limit: 10 }` fijos que tenías.

### 4.d · Body de libros (`POST`, `PUT` y `PATCH`)

Las reglas de un libro son las mismas en los tres endpoints, así que conviene escribirlas **una sola vez**. Agregá a `validations.ts`:

```ts
// Revisa los campos de un libro que vienen en el body.
// Si `allRequired` es true (POST y PUT), falta un campo → error.
// Si es false (PATCH), cada campo es opcional, pero si viene tiene que estar bien.
// Devuelve el mensaje de error, o null si está todo bien.
export function validateBook(body: any, allRequired: boolean): string | null {
  const { title, year, author_id } = body;

  if (title === undefined) {
    if (allRequired) return "Missing field: title";
  } else if (typeof title !== "string" || title.length < 1 || title.length > 200) {
    return "title must be a string of 1 to 200 characters";
  }

  // Completá vos: `year` (entero de 1000 a 2100) y `author_id` (entero mayor que 0),
  // con la misma forma que `title`. Para ver si es entero: Number.isInteger(year).

  return null;
}
```

En los controllers:

- `create` y `replace`: `validateBook(req.body, true)`. Si devuelve un mensaje → 400 con ese mensaje.
- `update`: primero, si el body está vacío (`Object.keys(req.body).length === 0`) → 400 `"Body cannot be empty"`. Después `validateBook(req.body, false)`.

**Ahora sacá el `req.body` directo.** Hasta acá le pasabas al repository todo lo que mandaba el cliente. Si alguien mandaba `"available": false` o `"id": 99`, se guardaba. Armá un **DTO** (📖 5.10) solo con los campos permitidos:

```ts
// En create y replace: los tres campos son obligatorios y ya están validados.
const data: NewBook = {
  title: req.body.title,
  year: req.body.year,
  author_id: req.body.author_id,
};

// En update (PATCH): solo los campos que vinieron.
const changes: UpdateBook = {};
if (req.body.title !== undefined) changes.title = req.body.title;
if (req.body.year !== undefined) changes.year = req.body.year;
if (req.body.author_id !== undefined) changes.author_id = req.body.author_id;
```

Y le pasás `data` o `changes` al repository, **nunca** `req.body`.

### 4.e · Préstamos

- `list`: si viene `active`, convertilo con `parseBoolean`. Si da `null` → 400. Si no vino, usá `false`. Pasáselo a `LoansRepository.findAll`.
- `create`: `book_id` tiene que ser un entero mayor que 0 y `member_name` un texto no vacío. Si no → 400. Armá un `NewLoan` con esos dos campos.
- `registerReturn`: `return_date` tiene que ser un texto con formato `YYYY-MM-DD`. Para revisarlo usá: `/^\d{4}-\d{2}-\d{2}$/.test(return_date)`. Si no → 400.

Cuando termines, borrá todos los comentarios `// TEMPORAL` que queden en las rutas: ya no hay lógica ahí.

**Prueba del paso 4.** Corré `npm run seed` antes de empezar.

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

## Paso 5 · Los services: las reglas del negocio

📖 5.6

La API ya valida bien los datos, pero todavía no respeta las **reglas de la biblioteca**:

- Se puede prestar un libro que ya está prestado.
- Al prestar o devolver, el libro no cambia su `available`.
- `DELETE /authors/1`, `DELETE /books/2` y `POST /books` con un `author_id` que no existe fallan con un error de la base, en vez de responder algo claro.

Esas reglas van en una capa nueva, el **service**, que se mete entre el controller y el repository:

```
antes:    ruta ──▶ controller ──────────────▶ repository ──▶ base
después:  ruta ──▶ controller ──▶ service ──▶ repository ──▶ base
```

El service **no conoce `req` ni `res`**. Recibe datos ya validados por el controller y devuelve un resultado. El controller deja de importar los repositories: ahora solo llama al service.

### Cómo avisa el service que algo salió mal

- Si lo que se busca no existe, el service devuelve `null` (o `false`). El controller lo convierte en 404, como ya hacía.
- Si hay más de un error posible, el service devuelve un **texto en mayúsculas** que dice qué pasó (por ejemplo `"AUTHOR_NOT_FOUND"`), y el controller elige el status.

El service **nunca** elige un status. Eso es trabajo del controller.

### 5.a · Autores

Primero, agregá a **`books.repository.ts`** una función para contar libros de un autor:

```ts
export async function countByAuthor(authorId: number): Promise<number> {
  return BookModel.count({ where: { author_id: authorId } });
}
```

Creá **`src/services/authors.service.ts`**:

```ts
import * as AuthorsRepository from "../repositories/authors.repository.js";
import * as BooksRepository from "../repositories/books.repository.js";
import { Author } from "../types/author.js";

export async function list(): Promise<Author[]> {
  return AuthorsRepository.findAll();
}

export async function getOne(id: number): Promise<Author | null> {
  return AuthorsRepository.findById(id);
}

// Regla: no se puede borrar un autor que tiene libros.
export async function remove(id: number): Promise<"DELETED" | "AUTHOR_NOT_FOUND" | "HAS_BOOKS"> {
  const author = await AuthorsRepository.findById(id);
  if (!author) return "AUTHOR_NOT_FOUND";

  const bookCount = await BooksRepository.countByAuthor(id);
  if (bookCount > 0) return "HAS_BOOKS";

  await AuthorsRepository.remove(id);
  return "DELETED";
}
```

En **`authors.controller.ts`**, cambiá el import del repository por el del service, y usalo en las tres funciones. `remove` queda así:

```ts
import * as AuthorsService from "../services/authors.service.js";

export async function remove(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Id must be an integer" });

  const result = await AuthorsService.remove(id);
  if (result === "AUTHOR_NOT_FOUND") return res.status(404).json({ error: "Author not found" });
  if (result === "HAS_BOOKS") return res.status(409).json({ error: "Author has books" });

  res.status(204).send();
}
```

En `list` y `getOne` solo cambia `AuthorsRepository` por `AuthorsService`: todo lo demás queda igual.

### 5.b · Libros

Primero, agregá a **`loans.repository.ts`** la función `countByBook(bookId)`, igual que `countByAuthor` pero contando préstamos de un libro.

Creá **`src/services/books.service.ts`** con estas funciones:

| Función | Qué hace | Devuelve |
|---|---|---|
| `search(filters, pagination)` | Llama a `BooksRepository.search`. | `Page<Book>` |
| `getOne(id)` | Llama a `BooksRepository.findById`. | `Book \| null` |
| `create(data: NewBook)` | Si el autor `data.author_id` no existe (`AuthorsRepository.findById`) → `"AUTHOR_NOT_FOUND"`. Si existe, crea el libro. | `Book \| "AUTHOR_NOT_FOUND"` |
| `update(id, changes: UpdateBook)` | Si el libro no existe → `"BOOK_NOT_FOUND"`. Si en los cambios viene `author_id` y ese autor no existe → `"AUTHOR_NOT_FOUND"`. Si no, actualiza. | `Book \| "BOOK_NOT_FOUND" \| "AUTHOR_NOT_FOUND"` |
| `remove(id)` | Si el libro no existe → `"BOOK_NOT_FOUND"`. Si `LoansRepository.countByBook(id)` es mayor que 0 → `"HAS_LOANS"`. Si no, lo borra. | `"DELETED" \| "BOOK_NOT_FOUND" \| "HAS_LOANS"` |

`update` (PATCH) y `replace` (PUT) del controller llaman **los dos** a `BooksService.update`. La diferencia entre PATCH y PUT ya la resolvió la validación del paso 4.

En **`books.controller.ts`**, cambiá el repository por el service en las 6 funciones:

- `create`: `"AUTHOR_NOT_FOUND"` → 404 `"Author not found"`. Si no, 201.
- `update` y `replace`: `"BOOK_NOT_FOUND"` → 404 `"Book not found"`; `"AUTHOR_NOT_FOUND"` → 404 `"Author not found"`.
- `remove`: `"BOOK_NOT_FOUND"` → 404; `"HAS_LOANS"` → 409 `"Book has loans"`. Si no, 204.

### 5.c · Préstamos

Primero, agregá a **`books.repository.ts`** la función `setAvailability(id: number, available: boolean): Promise<void>`. Buscá el libro con `findByPk` y hacé `row.update({ available })`.

Creá **`src/services/loans.service.ts`**:

| Función | Qué hace | Devuelve |
|---|---|---|
| `list(activeOnly: boolean)` | Llama a `LoansRepository.findAll(activeOnly)`. | `Loan[]` |
| `create(data: NewLoan)` | Ver abajo. | `Loan \| "BOOK_NOT_FOUND" \| "BOOK_NOT_AVAILABLE"` |
| `registerReturn(id, data: LoanReturn)` | Ver abajo. | `Loan \| "LOAN_NOT_FOUND" \| "ALREADY_RETURNED"` |

**`create`**, en este orden:

1. Buscar el libro con `BooksRepository.findById(data.book_id)`. Si no existe → `"BOOK_NOT_FOUND"`.
2. Si `book.available` es `false` → `"BOOK_NOT_AVAILABLE"`.
3. Calcular la fecha de hoy. **Mové acá** la línea `const today = ...` que estaba en el controller: decidir la fecha del préstamo es una regla del negocio.
4. Crear el préstamo con `LoansRepository.create(data, today)`.
5. Marcar el libro como prestado: `BooksRepository.setAvailability(data.book_id, false)`.
6. Devolver el préstamo creado.

**`registerReturn`**, en este orden:

1. Buscar el préstamo con `LoansRepository.findById(id)`. Si no existe → `"LOAN_NOT_FOUND"`.
2. Si `loan.return_date` **no** es `null`, ya se devolvió → `"ALREADY_RETURNED"`.
3. Guardar la devolución con `LoansRepository.registerReturn(id, data.return_date)`.
4. Marcar el libro como disponible: `BooksRepository.setAvailability(loan.book_id, true)`.
5. Devolver el préstamo actualizado.

En **`loans.controller.ts`**, cambiá el repository por el service:

- `create`: `"BOOK_NOT_FOUND"` → 404 `"Book not found"`; `"BOOK_NOT_AVAILABLE"` → 409 `"Book is not available"`. Si no, 201.
- `registerReturn`: `"LOAN_NOT_FOUND"` → 404 `"Loan not found"`; `"ALREADY_RETURNED"` → 409 `"Loan already returned"`. Si no, 200.

### 5.d · Revisar que las capas quedaron bien

Con el buscador de VS Code (lupa de la izquierda), buscá dentro de `src/`:

| Buscá | Tiene que aparecer solo en |
|---|---|
| `repository.js` | `src/services/` |
| `service.js` | `src/controllers/` |
| `controller.js` | `src/routes/` |
| `models/index.js` | `src/repositories/` (y en `src/db/`, que ya venía hecho) |
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

Por último, repetí la tabla del paso 4: tiene que seguir dando todo igual.

---

## Entrega

- [ ] `docs/openapi.yaml` con los 12 endpoints y los 9 schemas. `/docs` carga sin errores.
- [ ] `src/types/`: `author.ts`, `book.ts`, `loan.ts`.
- [ ] `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`: un archivo por recurso (authors, books, loans), más `controllers/validations.ts`.
- [ ] Todo el código (archivos, variables, funciones, tipos, rutas, campos y mensajes de error) está en inglés.
- [ ] La revisión de capas del paso 5.d da todo bien.
- [ ] Las tablas de prueba de los pasos 4 y 5 dan todo lo esperado.
- [ ] `npm run build` termina sin errores.
