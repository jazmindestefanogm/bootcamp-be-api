# Library API · Starter

Proyecto base para la clase **De la base de datos a la API**. Trae la base de datos, los modelos, los tipos y el contrato de libros ya hechos. Vos vas a escribir las rutas, los controladores, los services y los repositorios.

## Requisitos

- Node.js 18 o superior
- PostgreSQL y pgAdmin instalados
- Un cliente HTTP: Thunder Client, REST Client, Postman o Insomnia

## Preparar la base de datos

1. Abrí **pgAdmin** y conectate a tu servidor de Postgres.
2. Clic derecho en **Databases** → **Create** → **Database...** → en **Database** escribí `library` → **Save**. La base queda vacía: las tablas las crea `npm run seed`.
3. Abrí `src/db/connection.ts` y poné tu usuario y contraseña de Postgres (los que elegiste al instalarlo). Si no cambiaste nada, el usuario es `postgres`.

## Instalar y correr

```bash
npm install
npm run seed     # crea las tablas en la base `library` y carga datos de ejemplo
npm run dev      # levanta el servidor en http://localhost:3000
```

Si entrás a `http://localhost:3000` y ves `{ "message": "Library API running" }`, está todo bien.

En `http://localhost:3000/docs` está **Swagger UI** mostrando el contrato de `docs/openapi.yaml`. Arranca con los endpoints de libros. Cada vez que guardás el YAML, recargá la página: no hace falta reiniciar el servidor. Desde ahí también podés probar los endpoints con **Try it out**.

`npm run seed` se puede correr las veces que quieras: borra todo y vuelve a cargar los datos de ejemplo.

Si `npm run seed` o `npm run dev` fallan con un error de conexión:

| Mensaje | Qué revisar |
|---|---|
| `password authentication failed` | El usuario o la contraseña de `src/db/connection.ts`. |
| `database "library" does not exist` | Que creaste la base en pgAdmin con ese nombre exacto, en minúscula. |
| `ECONNREFUSED` | Que Postgres esté prendido. Si lo está, fijate en pgAdmin (clic derecho en tu servidor → **Properties** → **Connection**) qué **Port** usa: si no es `5432`, cambiá `PORT` en `src/db/connection.ts`. |

## Qué hay adentro

```
src/
├── server.ts            ← arranca Express. Acá montás tus routers.
├── docs.ts              ← YA HECHO. Sirve docs/openapi.yaml en /docs con Swagger UI.
├── db/
│   ├── connection.ts    ← conexión a PostgreSQL. Acá va tu usuario y contraseña.
│   └── seed.ts          ← crea las tablas y carga datos de ejemplo
├── models/              ← YA HECHO. Modelos de Sequelize = tablas de la DB.
│   ├── Author.ts
│   ├── Book.ts
│   ├── Loan.ts
│   └── index.ts         ← relaciones. Importá los modelos siempre desde acá.
├── types/               ← YA HECHO. Interfaces del dominio.
├── repositories/        ← VOS. Acceso a datos. El único lugar que usa Sequelize.
├── controllers/         ← VOS. HTTP: lee req, valida, llama al service, responde.
├── services/            ← VOS. Reglas del negocio. Llama a los repositorios.
└── routes/              ← VOS. Mapa verbo + ruta → controlador.

docs/
├── DER.md               ← YA HECHO. Diagrama entidad-relación de la base.
└── openapi.yaml         ← YA HECHO para libros. El contrato de la API en OpenAPI.
```

## Base de datos

```
authors              books                      loans
──────────           ──────────────             ────────────────
id                   id                         id
name                 title                      book_id   → books.id
nationality          year                       member_name
                     author_id → authors.id     loan_date
                     available                  return_date  (null = no devuelto)
```

El diagrama entidad-relación completo, con cardinalidades y claves, está en `docs/DER.md`.

Datos de ejemplo: 5 autores (el último sin libros), 6 libros (2 prestados), 3 préstamos (2 activos).

Para mirar la base directamente, en pgAdmin andá a **library** → **Schemas** → **public** → **Tables**, clic derecho en una tabla → **View/Edit Data** → **All Rows**.

## Sequelize en cinco líneas

Lo que vas a usar en los repositorios:

```ts
import { Op } from "sequelize";
import { Book, Author } from "../models/index.js";

await Book.findAll();                                   // SELECT * FROM books
await Book.findAll({ where: { available: true } });     // ... WHERE available = true
await Book.findByPk(3);                                 // ... WHERE id = 3   → Book | null
await Book.findAll({ include: { model: Author, as: "author" } }); // JOIN con authors
await Book.create({ title: "...", year: 1963, author_id: 7 });    // INSERT
await book.update({ available: false });                // UPDATE de una instancia
await book.destroy();                                   // DELETE de una instancia
await Book.count({ where: { author_id: 2 } });          // SELECT COUNT(*) ...
```

Cada instancia tiene los campos como propiedades (`book.title`) y `book.toJSON()` para convertirla a un objeto plano.

## Búsqueda con paginación (ya resuelta)

La función `search` del repository:

```ts
export async function search(filters: BookFilters, pagination: Pagination): Promise<Page<Book>> {
  // Solo se agregan al where los filtros que vinieron.
  const where: Record<string, unknown> = {};
  // Búsqueda parcial: ILIKE '%ray%'. En Postgres, LIKE distingue mayúsculas e ILIKE no.
  if (filters.title !== undefined) where.title = { [Op.iLike]: `%${filters.title}%` };
  if (filters.available !== undefined) where.available = filters.available;
  if (filters.author_id !== undefined) where.author_id = filters.author_id;

  // Devuelve las filas de la página (rows) Y el total de filas que cumplen el where (count).
  const { rows, count } = await BookModel.findAndCountAll({
    where,
    limit: pagination.limit,                            // cuántas filas
    offset: (pagination.page - 1) * pagination.limit,   // cuántas saltar: page 2 con limit 10 → offset 10
    order: [["id", "ASC"]],                             // siempre ordená al paginar, o las páginas se mezclan
  });

  return {
    data: rows.map((row) => row.toJSON()),
    total: count,
    page: pagination.page,
    limit: pagination.limit,
  };
}
```

`Page<Book>` ya tiene la forma de la respuesta, así que el controller la responde tal cual: `res.json(result)`. Lo que sí te toca es leer `page` y `limit` de la query en el controller (por defecto 1 y 10, validarlos y usar 50 si `limit` es mayor que 50) y pasárselos a `search`.

## Forma de las respuestas

Todas las respuestas de la API tienen la misma forma. Si salió bien, lo que pediste está en `data`. Si salió mal, el mensaje está en `error`.

| Caso | Status | Body |
|---|---|---|
| Un recurso (GET por id, POST, PATCH, PUT) | 200 / 201 | `{ "data": { "id": 1, "title": "Rayuela", ... } }` |
| Una lista sin paginar | 200 | `{ "data": [ ... ] }` |
| Una lista paginada (`GET /books`) | 200 | `{ "data": [ ... ], "total": 6, "page": 1, "limit": 10 }` |
| Borrado | 204 | sin body |
| Error | 400 / 404 / 409 | `{ "error": "Book not found" }` |

El repository devuelve el dato solo (un `Book`, un `Book[]`). El `{ data: ... }` lo arma el controller al responder:

```ts
res.json({ data: book });
res.status(201).json({ data: book });
```

## OpenAPI en cinco líneas

Lo que vas a usar en `docs/openapi.yaml`:

```yaml
paths:
  /books/{id}:                           # la ruta; los parámetros van entre llaves
    get:                                 # el verbo, en minúscula
      summary: Get a book by id
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        "200":                           # el status, entre comillas
          description: Book found
          content:
            application/json:
              schema: { $ref: "#/components/schemas/BookResponse" }

components:
  schemas:
    Book:                                # un schema por forma de dato
      type: object
      required: [id, title]              # qué campos son obligatorios
      properties:
        id:     { type: integer, example: 3 }
        title:  { type: string,  example: Rayuela }
    BookResponse:                        # la respuesta envuelve al Book en data
      type: object
      required: [data]
      properties:
        data: { $ref: "#/components/schemas/Book" }
```

Un `requestBody` se escribe igual que un `content` de respuesta. Tipos: `integer`, `number`, `string`, `boolean`. Reglas: `minLength`, `maxLength`, `minimum`, `maximum`, `nullable: true`. Un query param es un parámetro con `in: query` y `required: false`.

## Arquitectura esperada

```
Cliente → routes → controllers → services → repositories → models (Sequelize) → PostgreSQL
```

Reglas:

- Los **controladores** no importan nada de `models/` ni de Sequelize. Solo llaman a los services.
- Los **services** no conocen `req` ni `res` ni eligen status codes. Aplican las reglas del negocio y llaman a los repositorios.
- Los **repositorios** no conocen `req` ni `res`. Reciben y devuelven tipos de `types/`.
- Las **rutas** solo mapean. Sin lógica.
