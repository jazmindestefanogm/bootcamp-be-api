# Práctica · Library API

## Entrega

La entrega es **solo el CRUD de libros** (/books), funcionando contra la base de datos.

### Importante
Lee el README.md del proyecto Library API

Endpoints:

- GET /books: busca libros con filtros y paginación.
- GET /books/{id}: devuelve un libro.
- POST /books: crea un libro.
- PATCH /books/{id}: modifica algunos campos de un libro.
- PUT /books/{id}: reemplaza todos los campos de un libro.
- DELETE /books/{id}: borra un libro, solo si nunca se prestó.

Para entregar:

- Las pruebas de los pasos 2, 3 y 4 dan todo lo esperado.
- npm run build termina sin errores.
- Todo el código está en inglés.
- Todo está subido a tu fork. Mandá el link de tu fork.

## Extra (opcional)

El extra es el **CRUD de autores (/authors) y de préstamos (/loans)**. Hacelo solo si terminaste la entrega. Se resuelve con los mismos pasos que libros.

Autores:

- GET /authors: lista todos los autores.
- GET /authors/{id}: devuelve un autor.
- POST /authors: crea un autor. Recibe { "name": "Julio Cortázar", "nationality": "Argentina" }.
- PATCH /authors/{id}: modifica algunos campos de un autor.
- PUT /authors/{id}: reemplaza todos los campos de un autor.
- DELETE /authors/{id}: borra un autor, solo si no tiene libros. Si tiene, 409.

Préstamos:

- GET /loans: lista todos los préstamos. Con ?active=true, solo los que todavía no se devolvieron (return_date en null). Sin active o con ?active=false, todos. active no es un campo del préstamo: es solo un filtro. Si viene y no es true ni false, 400.
- GET /loans/{id}: devuelve un préstamo.
- POST /loans: presta un libro. Recibe { "book_id": 3, "member_name": "Sofía" }. Se guarda con loan_date = hoy y return_date = null. Si el libro no existe, 404. Si el libro tiene available: false (ya está prestado), 409. Al prestarlo, hay que actualizar también el libro: su available pasa a false.
- PATCH /loans/{id}: registra que se devolvió. Recibe { "return_date": "2026-09-30" }. Si el préstamo no existe, 404. Si ya tiene return_date, 409. Al devolverlo, hay que actualizar también el libro (el de book_id): su available vuelve a true.
- DELETE /loans/{id}: borra un préstamo. Si su return_date era null, hay que actualizar también el libro (el de book_id): su available vuelve a true.

Datos:

- Author: id, name, nationality. Para crear o modificar: NewAuthor y UpdateAuthor (sin id).
- Loan: id, book_id, member_name, loan_date, return_date (null si no se devolvió). Un préstamo no tiene available: ese campo es del libro (Book).
- Las respuestas siguen la misma forma que libros: un autor o préstamo va en { "data": {...} } y las listas (no están paginadas) en { "data": [...] }, sin total, page ni limit.

Tenés que escribir también su parte del contrato en docs/openapi.yaml.

Tips:

- Para loan_date, la fecha de hoy en formato YYYY-MM-DD: new Date().toISOString().slice(0, 10)
- Los ids que no son válidos o no existen siguen las reglas de toda la API (400 y 404).

## Paso a paso

### Reglas para toda la API

- Todas las respuestas OK con body se responden así: { "data": ... }. Adentro de data va lo que se pidió: un objeto (un libro) o un array (una lista de libros).
- Las listas paginadas agregan los datos de la paginación al lado de data: { "data": [...], "total": 6, "page": 1, "limit": 10 }.
- Todos los errores se responden así: { "error": "mensaje" }.
- Así, el que usa la API siempre sabe dónde mirar: si salió bien, en data; si salió mal, en error.
- Id que no es un número entero mayor que 0: 400.
- Id que no existe: 404.
- Filtro de la query con un valor inválido: 400.
- Los campos del body no se validan (eso lo vas a hacer más adelante con zod).
- Todo el código va en inglés: archivos, variables, funciones, tipos, rutas y mensajes de error.
- En los import entre tus archivos, la extensión es .js aunque el archivo sea .ts.

### Status

- 200: OK, devuelvo datos.
- 201: OK, creé algo.
- 204: OK, borré. Sin body (ni data ni error).
- 400: me mandaste algo mal.
- 404: no existe.
- 409: choca con el estado actual (por ejemplo, el libro tiene préstamos).

### Qué hace cada capa

ruta → controller → service → repository → base de datos

- Ruta: verbo + URL → función del controller. No tiene lógica.
- Controller: lee el pedido, valida y elige el status. No toca la base.
- Service: aplica las reglas del negocio. No usa req ni res.
- Repository: lee y guarda en la base. No valida ni elige status.

### Paso 0 · Levantar el proyecto

1. Hacé un fork de github.com/jazmindestefanogm/library-api y clonalo.
2. En pgAdmin, creá una base llamada library.
3. En src/db/connection.ts, poné tu usuario y contraseña de Postgres.
4. En la terminal, dentro de la carpeta library-api, corré npm install, después npm run seed y después npm run dev.

Prueba:

- http://localhost:3000 muestra "Library API running".
- http://localhost:3000/docs muestra los endpoints de libros.

Al terminar cada paso, subí tus cambios: git add, git commit y git push.

### Paso 1 · El contrato y los tipos

Ya vienen resueltos, no tenés que escribirlos:

- El contrato de libros está en docs/openapi.yaml. Leelo y abrilo en http://localhost:3000/docs.
- Los tipos están en src/types: book.ts (Book, NewBook, UpdateBook, BookFilters), author.ts (Author, NewAuthor, UpdateAuthor), loan.ts (Loan, NewLoan, LoanReturn) y common.ts (Pagination, Page). Usalos en los pasos siguientes.
- La tabla de la base y sus relaciones están en docs/DER.md.

Datos:

- Book: id, title, year, author_id, available.
- NewBook (para POST y PUT): title, year y author_id.
- UpdateBook (para PATCH): los mismos campos que NewBook, todos opcionales. Puede venir uno, dos o los tres.
- BookResponse (respuesta de GET /books/{id}, POST, PATCH y PUT): { data: Book }.
- BookPage (respuesta de GET /books; en el código es Page<Book>): data (los libros de esa página), total (cuántos libros cumplen los filtros, en todas las páginas), page y limit.

Filtros de GET /books, todos opcionales:

- title: libros cuyo título contiene ese texto, sin importar mayúsculas.
- available: true (solo disponibles) o false (solo prestados).
- author_id: libros de ese autor.
- page: qué página devolver. Por defecto 1.
- limit: cuántos libros por página. Por defecto 10. Si piden más de 50, se usa 50.

### Paso 2 · Repository y rutas

La API empieza a leer y escribir libros en la base. En este paso no se valida nada.

1. En src/repositories/books.repository.ts, creá:
   - findById(id): devuelve el libro, o null si no existe.
   - search(filters, pagination): recibe un BookFilters y un Pagination. Aplica solo los filtros que vinieron, ordena por id y devuelve un Page<Book>. Ya está resuelta en el README de library-api (sección "Búsqueda con paginación"): copiala y leé los comentarios.
   - create(data): recibe un NewBook y guarda el libro. available empieza en true.
   - update(id, changes): recibe un UpdateBook y cambia solo los campos que vinieron. Devuelve el libro, o null si no existe. Lo usan el PATCH y el PUT.
   - remove(id): devuelve true si lo borró, false si no existía.
2. En src/routes/books.routes.ts, creá los 6 endpoints. Por ahora cada uno llama directo al repository. En GET /books, llamá a search sin filtros, con page 1 y limit 10 (los filtros se agregan en el paso 3).
3. En src/server.ts, montá el router en /books.

Tips:

- Importá los modelos desde models/index.js.
- Devolvé siempre objetos comunes, no instancias de Sequelize (usá toJSON).
- El repository devuelve el libro solo. El { data: ... } lo arma la ruta (después el controller) al responder: res.json({ data: book }). La excepción es search: Page<Book> ya viene con data (y total, page y limit), así que se responde tal cual.
- La forma de todas las respuestas está en el README de library-api (sección "Forma de las respuestas").
- Dentro del router, las rutas son / y /:id. El /books lo pone app.use en server.ts.

Ejemplo:

Ejemplo con Category, un recurso que no existe en tu proyecto. No lo copies: hacé lo mismo con libros.

```ts
// src/repositories/categories.repository.ts
import { Category as CategoryModel } from "../models/index.js";
import { Category, NewCategory } from "../types/category.js";

export async function findById(id: number): Promise<Category | null> {
  const row = await CategoryModel.findByPk(id);
  return row ? row.toJSON() : null;
}

export async function create(data: NewCategory): Promise<Category> {
  const row = await CategoryModel.create(data);
  return row.toJSON();
}
```

```ts
// src/routes/categories.routes.ts
import { Router } from "express";
import * as CategoriesRepository from "../repositories/categories.repository.js";

const router = Router();

router.get("/:id", async (req, res) => {
  const category = await CategoriesRepository.findById(Number(req.params.id));
  res.json({ data: category });
});

router.post("/", async (req, res) => {
  const category = await CategoriesRepository.create(req.body);
  res.status(201).json({ data: category });
});

export default router;
```

```ts
// src/server.ts
import categoriesRoutes from "./routes/categories.routes.js";

app.use("/categories", categoriesRoutes);
```

Pruebas que podes hacer:

- GET /books: 200, 6 libros en data, total 6.
- GET /books/1: 200, data.title Rayuela.
- POST /books con { "title": "New", "year": 2000, "author_id": 1 }: 201, data.id 7, data.available true.
- PATCH /books/7 con { "title": "Other" }: 200, data.title Other, data.year sigue en 2000.
- PUT /books/7 con { "title": "Another", "year": 2001, "author_id": 2 }: 200, los tres campos cambiados en data.
- DELETE /books/7: 204, sin body.

Al terminar, corré npm run seed para dejar la base como al principio.

### Paso 3 · Controller

1. En src/controllers/books.controller.ts, creá una función por endpoint: search, getOne, create, update (PATCH), replace (PUT) y remove. Pasá ahí la lógica de las rutas.
2. Las rutas quedan solo como mapa: verbo + URL → función del controller.
3. Agregá las validaciones:
   - Id: si no es un entero mayor que 0, 400. Si no existe, 404 con "Book not found".
   - Filtros de GET /books: available tiene que ser true o false; author_id, page y limit tienen que ser enteros mayores que 0. Si no, devolvé 400. Si limit es mayor que 50, se usa 50.
4. Nunca le pases el body directo al repository: armá un objeto solo con title, year y author_id. Cualquier otro campo se ignora. En el PATCH, el objeto lleva solo los campos que vinieron.

Tip: lo que llega por la URL y la query es texto, aunque parezca un número.

Ejemplo:

Ejemplo con Category, un recurso que no existe en tu proyecto. No lo copies: hacé lo mismo con libros.

```ts
// src/controllers/categories.controller.ts
import { Request, Response } from "express";
import * as CategoriesRepository from "../repositories/categories.repository.js";
import { NewCategory } from "../types/category.js";

export async function getOne(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const category = await CategoriesRepository.findById(id);
  if (!category) {
    return res.status(404).json({ error: "Category not found" });
  }

  res.json({ data: category });
}

export async function create(req: Request, res: Response) {
  const data: NewCategory = { name: req.body.name };
  const category = await CategoriesRepository.create(data);
  res.status(201).json({ data: category });
}
```

```ts
// src/routes/categories.routes.ts
import { Router } from "express";
import * as CategoriesController from "../controllers/categories.controller.js";

const router = Router();

router.get("/:id", CategoriesController.getOne);
router.post("/", CategoriesController.create);

export default router;
```

Pruebas que podes hacer (corré npm run seed antes):

- GET /books/abc: 400.
- GET /books/999: 404.
- GET /books?title=EL: total 2.
- GET /books?available=true&author_id=2: total 1.
- GET /books?page=2&limit=2: 2 libros en data (ids 3 y 4), page 2.
- GET /books?limit=500: 200, limit 50.
- GET /books?available=banana: 400.
- GET /books?page=0: 400.
- POST /books con { "title": "New", "year": 2000, "author_id": 1, "available": false }: 201 con data.available true.
- PATCH /books/1 con { "title": "Other" }: 200, data.year sigue en 1963.
- PUT /books/999 con { "title": "X", "year": 2000, "author_id": 1 }: 404.
- DELETE /books/999: 404.

### Paso 4 · Service

1. En src/services/books.service.ts, creá las funciones que necesita el controller. El PUT y el PATCH pueden usar la misma función del service. El controller llama al service, y el service al repository. El controller ya no importa el repository: solo llama al service.
2. Agregá las validaciones:
   - POST /books, PUT /books/{id} y PATCH /books/{id}: el author_id tiene que ser de un autor que existe (en PATCH, solo si viene). Si no, 404 con "Author not found".
   - DELETE /books/{id}: no se puede borrar un libro que tiene préstamos, aunque ya estén devueltos. Si tiene, 409 con "Book has loans".
3. Para las validaciones, creá:
   - En src/repositories/authors.repository.ts: findById(id), que devuelve el autor o null.
   - En src/repositories/loans.repository.ts: countByBook(bookId), que devuelve cuántos préstamos tiene ese libro.
4. El service no usa req ni res y no elige status. Si algo sale mal, devuelve un texto (por ejemplo "AUTHOR_NOT_FOUND") y el controller elige el status.

### Importante
Los GET, para este caso, no llevan reglas, pero aun asi deben estar en el servicio!

Ejemplo:

Ejemplo con Category, un recurso que no existe en tu proyecto. No lo copies: hacé lo mismo con libros. La regla del ejemplo es "no se puede borrar una categoría que tiene productos".

```ts
// src/services/categories.service.ts
import * as CategoriesRepository from "../repositories/categories.repository.js";
import * as ProductsRepository from "../repositories/products.repository.js";

export async function remove(id: number): Promise<"DELETED" | "CATEGORY_NOT_FOUND" | "HAS_PRODUCTS"> {
  const category = await CategoriesRepository.findById(id);
  if (!category) return "CATEGORY_NOT_FOUND";

  const productCount = await ProductsRepository.countByCategory(id);
  if (productCount > 0) return "HAS_PRODUCTS";

  await CategoriesRepository.remove(id);
  return "DELETED";
}
```

```ts
// src/controllers/categories.controller.ts
export async function remove(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "Id must be an integer" });
  }

  const result = await CategoriesService.remove(id);
  if (result === "CATEGORY_NOT_FOUND") return res.status(404).json({ error: "Category not found" });
  if (result === "HAS_PRODUCTS") return res.status(409).json({ error: "Category has products" });

  res.status(204).send();
}
```

Pruebas que podes hacer (corré npm run seed antes, en este orden):

- POST /books con { "title": "New", "year": 2000, "author_id": 99 }: 404.
- POST /books con { "title": "New", "year": 2000, "author_id": 1 }: 201, data.id 7.
- PATCH /books/7 con { "author_id": 99 }: 404.
- PUT /books/7 con { "title": "New", "year": 2000, "author_id": 99 }: 404.
- DELETE /books/2: 409 (Bestiario tiene préstamos).
- DELETE /books/7: 204.

Después corré npm run seed y repetí la prueba del paso 3: tiene que dar igual.

Revisión de capas. Con el buscador de VS Code, buscá dentro de src:

- "repository.js" aparece solo en services.
- "service.js" aparece solo en controllers.
- "controller.js" aparece solo en routes.
- "models/index.js" aparece solo en repositories (y en db y models, que ya venían hechos).
