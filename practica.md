# Práctica · Library API

## Entrega

La entrega es **solo el CRUD de libros** (/books), funcionando contra la base de datos.

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

Endpoints:

- GET /authors: lista todos los autores.
- GET /authors/{id}: devuelve un autor. 400 si el id no es válido, 404 si no existe.
- DELETE /authors/{id}: borra un autor. 409 si tiene libros.
- GET /loans: lista los préstamos. Con ?active=true, solo los no devueltos. 400 si active no es true ni false.
- POST /loans: presta un libro. Recibe book_id y member_name. La fecha del préstamo es la de hoy. 404 si el libro no existe, 409 si no está disponible. Al prestarlo, el libro pasa a available: false.
- PATCH /loans/{id}: registra la devolución. Recibe return_date. 404 si no existe, 409 si ya se devolvió. Al devolverlo, el libro vuelve a available: true.

Datos:

- Author: id, name, nationality.
- Loan: id, book_id, member_name, loan_date, return_date (null si no se devolvió).

Tenés que escribir también su parte del contrato en docs/openapi.yaml.

Tips:

- La fecha de hoy en formato YYYY-MM-DD: new Date().toISOString().slice(0, 10)

## Paso a paso

### Reglas para toda la API

- Todos los errores se responden así: { "error": "mensaje" }.
- Id que no es un número entero mayor que 0: 400.
- Id que no existe: 404.
- Filtro de la query con un valor inválido: 400.
- Los campos del body no se validan (eso lo vas a hacer más adelante con zod).
- Todo el código va en inglés: archivos, variables, funciones, tipos, rutas y mensajes de error.
- En los import entre tus archivos, la extensión es .js aunque el archivo sea .ts.

### Status

- 200: OK, devuelvo datos.
- 201: OK, creé algo.
- 204: OK, borré. Sin body.
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
- Los tipos están en src/types: book.ts (Book, NewBook, UpdateBook, BookFilters), author.ts (Author), loan.ts (Loan, NewLoan, LoanReturn) y common.ts (Pagination, Page). Usalos en los pasos siguientes.

Datos:

- Book: id, title, year, author_id, available.
- NewBook (para POST y PUT): title, year y author_id.
- UpdateBook (para PATCH): los mismos campos que NewBook, pero puede venir cualquiera de ellos.
- BookPage (respuesta de GET /books): data (lista de libros), total, page, limit.

Filtros de GET /books, todos opcionales:

- title: libros cuyo título contiene ese texto, sin importar mayúsculas.
- available: true o false.
- author_id: libros de ese autor.
- page: qué página devolver. Por defecto 1.
- limit: cuántos libros por página. Por defecto 10. Si piden más de 50, se usa 50.

### Paso 2 · Repository y rutas

La API empieza a leer y escribir libros en la base. En este paso no se valida nada.

1. En src/repositories/books.repository.ts, creá:
   - findById(id): devuelve el libro, o null si no existe.
   - search(filters, pagination): aplica los filtros que vinieron, ordena por id y devuelve una página.
   - create(data): guarda el libro. available empieza en true.
   - update(id, changes): cambia solo los campos que vinieron. Devuelve el libro, o null si no existe.
   - remove(id): devuelve true si lo borró, false si no existía.
2. En src/routes/books.routes.ts, creá los 6 endpoints. Por ahora cada uno llama directo al repository. GET /books devuelve siempre la primera página de 10, sin filtros.
3. En src/server.ts, montá el router en /books.

Tips:

- Importá los modelos desde models/index.js.
- Devolvé siempre objetos comunes, no instancias de Sequelize (usá toJSON).
- Para search: findAndCountAll, limit y offset para paginar, y Op.iLike para buscar texto.
- offset = (page - 1) × limit. Por ejemplo, page 2 con limit 10 es offset 10.
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
  res.json(category);
});

router.post("/", async (req, res) => {
  const category = await CategoriesRepository.create(req.body);
  res.status(201).json(category);
});

export default router;
```

```ts
// src/server.ts
import categoriesRoutes from "./routes/categories.routes.js";

app.use("/categories", categoriesRoutes);
```

Pruebas que podes hacer:

- GET /books: 200, 6 libros, total 6.
- GET /books/1: 200, Rayuela.
- POST /books con { "title": "New", "year": 2000, "author_id": 1 }: 201, id 7, available true.
- PATCH /books/7 con { "title": "Other" }: 200, title Other, year sigue en 2000.
- PUT /books/7 con { "title": "Another", "year": 2001, "author_id": 2 }: 200, los tres campos cambiados.
- DELETE /books/7: 204.

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

  res.json(category);
}

export async function create(req: Request, res: Response) {
  const data: NewCategory = { name: req.body.name };
  const category = await CategoriesRepository.create(data);
  res.status(201).json(category);
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

Prueba (corré npm run seed antes):

- GET /books/abc: 400.
- GET /books/999: 404.
- GET /books?title=EL: total 2.
- GET /books?available=true&author_id=2: total 1.
- GET /books?page=2&limit=2: 2 libros (ids 3 y 4), page 2.
- GET /books?limit=500: 200, limit 50.
- GET /books?available=banana: 400.
- GET /books?page=0: 400.
- POST /books con { "title": "New", "year": 2000, "author_id": 1, "available": false }: 201 con available true.
- PATCH /books/1 con { "title": "Other" }: 200, year sigue en 1963.
- PUT /books/999 con { "title": "X", "year": 2000, "author_id": 1 }: 404.
- DELETE /books/999: 404.

### Paso 4 · Service

1. En src/services/books.service.ts, creá las funciones que necesita el controller. El PUT y el PATCH pueden usar la misma función del service. El controller llama al service, y el service al repository. El controller ya no importa el repository: solo llama al service.
2. Agregá las reglas:
   - POST, PUT y PATCH: el author_id tiene que ser de un autor que existe (en PATCH, solo si viene). Si no, 404 con "Author not found".
   - DELETE: no se puede borrar un libro que tiene préstamos. Si tiene, 409 con "Book has loans".
3. Para las reglas, creá:
   - En src/repositories/authors.repository.ts: findById(id).
   - En src/repositories/loans.repository.ts: countByBook(bookId).
4. El service no usa req ni res y no elige status. Si algo sale mal, devuelve un texto (por ejemplo "AUTHOR_NOT_FOUND") y el controller elige el status.

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

Prueba (corré npm run seed antes, en este orden):

- POST /books con { "title": "New", "year": 2000, "author_id": 99 }: 404.
- POST /books con { "title": "New", "year": 2000, "author_id": 1 }: 201, id 7.
- PATCH /books/7 con { "author_id": 99 }: 404.
- PUT /books/7 con { "title": "New", "year": 2000, "author_id": 99 }: 404.
- DELETE /books/2: 409.
- DELETE /books/7: 204.

Después corré npm run seed y repetí la prueba del paso 3: tiene que dar igual.

Revisión de capas. Con el buscador de VS Code, buscá dentro de src:

- "repository.js" aparece solo en services.
- "service.js" aparece solo en controllers.
- "controller.js" aparece solo en routes.
- "models/index.js" aparece solo en repositories (y en db y models, que ya venían hechos).
