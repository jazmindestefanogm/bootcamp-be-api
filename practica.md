# De la base de datos a la API — Cuaderno de práctica

**API Contract · TypeScript · Express · MVC con repositorios · Clase de 4 horas**

## Cómo usar este cuaderno

Acá están **solo las consignas**. La teoría está en la carpeta `teoria/`, un archivo por módulo. Cada ejercicio indica qué secciones leer si te trabás, por número y título.

Vas a trabajar sobre el proyecto **biblioteca-api**, que ya trae la base de datos SQLite, el DER y los modelos de Sequelize hechos. Vos escribís lo demás:

```
Cliente → routes → controllers → repositories → models (Sequelize) → SQLite
                                                  └── YA HECHO ──┘
```

**La regla de toda la clase:** cada endpoint se hace en tres pasos, siempre en este orden.

1. **Contrato.** Lo escribís en `docs/openapi.yaml` antes de tocar código, y lo mirás en `http://localhost:3000/docs` (Swagger UI).
2. **Código.** Tipos → repositorio → controlador → ruta.
3. **Prueba.** Desde el botón **Try it out** de Swagger, probás cada caso del contrato. La respuesta real tiene que ser igual a la documentada.

**Lo que no vamos a hacer hoy:** middlewares propios, logs, tests, autenticación ni capa de servicios.

**Decisiones ya tomadas**, para que todos hagamos lo mismo:

- Los errores siempre tienen la forma `{ "error": "mensaje" }`.
- Un id que no es número entero (`/libros/abc`) devuelve **400**.
- Un id que no existe devuelve **404**.
- Un query param con valor inválido (`?disponible=banana`, `?pagina=0`, `?limite=abc`) devuelve **400**.
- `?limite=500` no es error: se corrige al máximo (50).
- Los libros se devuelven con `autor_id`, sin el autor adentro.
- Referenciar algo que no existe en un body (`autor_id: 999`) devuelve **404**.

---

## Ejercicio 1 · Levantar el proyecto

📖 Teoría: 4.3 El servidor mínimo · 5.8 ORM: hablar con la base sin escribir SQL

**a)** Cloná `biblioteca-api` y corré:

```bash
npm install
npm run seed
npm run dev
```

**b)** Entrá a `http://localhost:3000`. Tiene que responder `{ "mensaje": "API Biblioteca funcionando", ... }`.

**c)** Entrá a `http://localhost:3000/docs`. Tiene que mostrar Swagger UI con el título "API Biblioteca" y el aviso "No operations defined in spec!". Ahí va a aparecer tu contrato.

**d)** Abrí `docs/DER.md` y dejalo a mano. Después abrí `src/models/index.ts` y anotá el nombre del alias de cada relación (`as: "..."`). Los vas a necesitar.

**e)** Leé la sección "Sequelize en cinco líneas" del README.

---

## Ejercicio 2 · Diseñar las rutas

📖 Teoría: 1.3 Paso 2: aplicar el estilo REST · 1.5 Paso 4: filtros, orden y paginación con query params · 1.6 Paso 5: acciones que no son CRUD · 1.7 Convenciones de nombres · 1.10 Path params, query params y body: dónde viaja cada dato

Creá `docs/RUTAS.md`. Todavía sin código ni contrato.

**a)** Escribí los tres recursos de la API y la URL base de cada uno.

**b)** Armá una tabla con **una fila por endpoint** y estas columnas: `Verbo | Ruta | Qué hace | Status de éxito | Errores posibles`. Tiene que cubrir exactamente estas operaciones, ni más ni menos:

1. Listar autores.
2. Ver un autor.
3. Borrar un autor.
4. Ver un libro.
5. Buscar libros por parte del título, filtrar por disponibilidad y por autor, y pedir los resultados de a páginas. Es **un solo** endpoint.
6. Crear un libro.
7. Modificar algunos campos de un libro.
8. Reemplazar un libro completo.
9. Borrar un libro.
10. Listar préstamos, con la opción de ver solo los activos.
11. Registrar un préstamo.
12. Registrar la devolución de un préstamo.

Reglas para armarla: sustantivos en plural y minúscula, sin verbos en la URL, ids en la ruta, filtros en el query string, cada acción con el verbo HTTP que le corresponde.

**c)** Completá esta tabla. En la segunda columna escribí `path`, `query` o `body`. En la tercera, una sola palabra: `identifica`, `filtra` o `guarda`.

| Dato | ¿Dónde viaja? | Por qué |
|---|---|---|
| El id del libro que quiero ver | | |
| El texto a buscar en el título | | |
| Si quiero solo los disponibles | | |
| El número de página | | |
| El título de un libro nuevo | | |
| El id del libro que quiero prestar | | |
| La fecha en que devolvieron un préstamo | | |
| El id del préstamo que quiero cerrar | | |

**d)** Estas diez rutas están mal. Escribí al lado de cada una la versión correcta:

- `GET /obtenerLibros`
- `GET /libros/buscar?titulo=ray`
- `POST /libros/5/borrar`
- `GET /Libro/5`
- `GET /libros?id=5`
- `GET /libros/disponibles`
- `PUT /prestamos/12/devolver`
- `GET /autores/2/libros/5/prestamos/12`
- `DELETE /libros?id=5`
- `POST /libros/5` (para modificar el título)

Esta tabla es el mapa de todo lo que sigue. Cada ejercicio de acá en adelante toma filas de ella.

---

## Ejercicio 3 · Contrato de autores

📖 Teoría: 2.6 Anatomía de un documento OpenAPI · 2.7 Schemas: la forma de los datos

En `docs/openapi.yaml`:

**a)** En `components.schemas`, agregá el schema `Autor` con `id`, `nombre` y `nacionalidad`. Los tres en `required`. Cada propiedad con un `example` sacado del seed.

**b)** En `paths`, agregá `GET /autores` con `tags: [Autores]`. Responde **200** con un array de `Autor`. Todos los endpoints de acá en adelante llevan el tag de su recurso.

**c)** Agregá `GET /autores/{id}`. Parámetro `id` en path, entero, obligatorio. Respuestas: **200** con `Autor`, **400** si el id no es entero, **404** si no existe. Los dos errores con schema `Error` y un `example` de mensaje.

**d)** Guardá, recargá `/docs`. Tienen que aparecer los dos endpoints bajo el tag `Autores` y el schema `Autor` abajo. Si Swagger muestra un error de YAML arriba de la página, arreglalo antes de seguir.

---

## Ejercicio 4 · Implementar autores

📖 Teoría: 3.4 Interfaces: la forma de un objeto · 3.10 `async` y `Promise<T>` · 5.5 El código, capa por capa · 5.9 La capa de repositorios · 4.5 Leer datos del pedido · 4.6 Responder · 4.11 Routers

Implementá los dos endpoints del ejercicio 3, en este orden:

**a)** Creá `src/types/autor.ts` con `export interface Autor` con los mismos tres campos del schema.

**b)** Creá `src/repositories/autores.repository.ts` con dos funciones:

- `obtenerTodos(): Promise<Autor[]>`
- `obtenerPorId(id: number): Promise<Autor | null>`

Importá el modelo desde `../models/index.js`. Devolvé siempre `toJSON()` de las instancias, nunca la instancia. Este es el único archivo de autores que importa de `models/`.

**c)** Creá `src/controllers/autores.controller.ts` con dos funciones `async` que reciben `(req: Request, res: Response)`:

- `listar`: llama al repositorio y responde `res.json(...)`.
- `obtenerUno`: convierte `req.params.id` con `Number()`. Si el resultado no es un entero, responde 400. Llama al repositorio. Si devuelve `null`, responde 404. Si no, 200 con el autor. Usá `return` después de cada respuesta de error.

Este archivo no importa nada de `models/`.

**d)** Creá `src/routes/autores.routes.ts` con un `Router()`, registrá `router.get("/", listar)` y `router.get("/:id", obtenerUno)`, y exportalo por default. En `server.ts`, montalo con `app.use("/autores", autoresRoutes)`.

**e)** Probá desde Swagger, con **Try it out**:

| Pedido | Esperado |
|---|---|
| `GET /autores` | 200, array de 5 autores |
| `GET /autores/1` | 200, Julio Cortázar |
| `GET /autores/999` | 404, `{ "error": "..." }` |
| `GET /autores/abc` | 400, `{ "error": "..." }` |

Los cuatro tienen que coincidir con lo que dice tu contrato.

---

## Ejercicio 5 · Contrato de la búsqueda de libros

📖 Teoría: 1.5 Paso 4: filtros, orden y paginación con query params · 2.7 Schemas: la forma de los datos

**a)** Agregá el schema `Libro` con `id`, `titulo`, `anio`, `autor_id` y `disponible`. Todos en `required`.

**b)** Agregá el schema `PaginaDeLibros`:

```yaml
type: object
required: [datos, total, pagina, limite]
properties:
  datos:  { type: array, items: { $ref: "#/components/schemas/Libro" } }
  total:  { type: integer, example: 6 }
  pagina: { type: integer, example: 1 }
  limite: { type: integer, example: 10 }
```

**c)** Agregá `GET /libros/{id}`. Igual que el de autores: 200 con `Libro`, 400, 404.

**d)** Agregá `GET /libros` con estos cinco query params, todos `required: false`:

| Nombre | Schema | Descripción a escribir |
|---|---|---|
| `titulo` | `string` | Búsqueda parcial, sin distinguir mayúsculas |
| `disponible` | `boolean` | Filtro exacto |
| `autor_id` | `integer` | Filtro exacto |
| `pagina` | `integer, default: 1, minimum: 1` | Página a devolver |
| `limite` | `integer, default: 10, minimum: 1, maximum: 50` | Cantidad por página |

Respuestas: **200** con `PaginaDeLibros`, **400** si algún query param tiene un valor inválido.

**e)** Recargá `/docs` y verificá que `GET /libros` muestre los cinco parámetros en el formulario de **Try it out**.

---

## Ejercicio 6 · Implementar la búsqueda

📖 Teoría: 3.9 Genéricos: tipos con parámetros · 4.12 Convertir lo que llega por query string · 5.8 ORM: hablar con la base sin escribir SQL

**a)** Creá `src/types/libro.ts` con:

```ts
export interface Libro { ... }                       // los cinco campos
export interface FiltrosLibro { titulo?: string; disponible?: boolean; autor_id?: number }
export interface Paginacion { pagina: number; limite: number }
export interface PaginaDe<T> { datos: T[]; total: number; pagina: number; limite: number }
```

**b)** Creá `src/repositories/libros.repository.ts` con:

- `obtenerPorId(id: number): Promise<Libro | null>`
- `buscar(filtros: FiltrosLibro, paginacion: Paginacion): Promise<PaginaDe<Libro>>`

En `buscar`: armá un objeto `where` vacío y agregale una clave por cada filtro que venga definido. Para `titulo` usá `{ [Op.like]: \`%${filtros.titulo}%\` }`. Después llamá a `findAndCountAll` con `where`, `limit: paginacion.limite`, `offset: (paginacion.pagina - 1) * paginacion.limite` y `order: [["id", "ASC"]]`. Devolvé `{ datos: rows.map(r => r.toJSON()), total: count, pagina, limite }`.

**c)** Creá `src/controllers/libros.controller.ts` con `obtenerUno` (igual que el de autores) y `buscar`. En `buscar`, convertí cada query param así:

- `titulo`: se usa tal cual si viene.
- `disponible`: `"true"` → `true`, `"false"` → `false`, cualquier otro valor → 400.
- `autor_id`, `pagina`, `limite`: `Number()`. Si el resultado no es entero, 400.
- `pagina`: default 1. Si es menor a 1, 400.
- `limite`: default 10. Si es menor a 1, 400. Si es mayor a 50, usá 50.

Armá `FiltrosLibro` y `Paginacion` con los valores convertidos y llamá al repositorio.

**d)** Creá `src/routes/libros.routes.ts`, registrá las dos rutas y montalo en `/libros`.

**e)** Probá desde Swagger:

| Pedido | Esperado |
|---|---|
| `GET /libros` | 200, `total: 6`, 6 libros en `datos` |
| `GET /libros?titulo=EL` | 200, `total: 2` (Rayuela y El Aleph) |
| `GET /libros?disponible=true&autor_id=2` | 200, `total: 1` (Ficciones) |
| `GET /libros?pagina=2&limite=2` | 200, 2 libros, `total: 6`, `pagina: 2` |
| `GET /libros?limite=500` | 200, `limite: 50` |
| `GET /libros?disponible=banana` | 400 |
| `GET /libros?pagina=0` | 400 |

---

## Ejercicio 7 · Contrato de `POST /libros`

📖 Teoría: 2.2 Qué tiene que definir el contrato de un endpoint · 2.7 Schemas: la forma de los datos

**a)** Agregá el schema `NuevoLibro`:

- `titulo`: string, `minLength: 1`, `maxLength: 200`
- `anio`: integer, `minimum: 1000`, `maximum: 2100`
- `autor_id`: integer
- `required: [titulo, anio, autor_id]`

Sin `id` ni `disponible`: los pone el servidor.

**b)** Agregá `POST /libros` con `requestBody` obligatorio de tipo `NuevoLibro` y estas respuestas:

| Status | Cuándo | Example del mensaje |
|---|---|---|
| 201 | Creado. Body: `Libro` completo, con `disponible: true` | — |
| 400 | Falta un campo obligatorio | `"El campo titulo es obligatorio"` |
| 400 | Un campo tiene tipo incorrecto | `"anio debe ser un número entero"` |
| 400 | `anio` fuera de rango | `"anio debe estar entre 1000 y 2100"` |
| 404 | `autor_id` no existe | `"Autor no encontrado"` |

**c)** Recargá `/docs`. En **Try it out** de `POST /libros`, el body de ejemplo tiene que aparecer ya armado con los tres campos.

---

## Ejercicio 8 · Implementar `POST /libros`

📖 Teoría: 3.6 Tipos derivados: `Omit`, `Partial`, `Pick` · 3.7 `any` y `unknown` · 4.7 Ejemplo completo: GET uno y POST · 4.8 TypeScript y el body

**a)** En `types/libro.ts` agregá `export type NuevoLibro = Omit<Libro, "id" | "disponible">`.

**b)** En el repositorio de libros agregá `crear(datos: NuevoLibro): Promise<Libro>`, que llama a `Libro.create(datos)` y devuelve `toJSON()`.

**c)** En el controlador agregá `crear`. En este orden:

1. Sacá `titulo`, `anio` y `autor_id` de `req.body`.
2. Validá con `typeof` que `titulo` sea string, `anio` y `autor_id` números enteros. Si falla, 400 con el mensaje del contrato.
3. Validá el rango de `anio` y el largo de `titulo`. Si falla, 400.
4. Llamá a `Autores.obtenerPorId(autor_id)`. Si devuelve `null`, 404.
5. Armá el objeto `NuevoLibro`, llamá a `Libros.crear`, respondé 201 con el resultado.

El controlador de libros importa el **repositorio** de autores, no el modelo.

**d)** Registrá `router.post("/", crear)`.

**e)** Probá desde Swagger, un pedido por fila del contrato:

| Body | Esperado |
|---|---|
| `{ "titulo": "Rayuela 2", "anio": 2000, "autor_id": 1 }` | 201, libro con `id: 7` y `disponible: true` |
| `{ "anio": 2000, "autor_id": 1 }` | 400 |
| `{ "titulo": "x", "anio": "2000", "autor_id": 1 }` | 400 |
| `{ "titulo": "x", "anio": 500, "autor_id": 1 }` | 400 |
| `{ "titulo": "x", "anio": 2000, "autor_id": 999 }` | 404 |

Después `GET /libros/7` tiene que devolver el libro nuevo.

---

## Ejercicio 9 · PATCH y PUT

📖 Teoría: 0.5 PUT y PATCH no son lo mismo · 3.6 Tipos derivados · 6.1 Buenas prácticas básicas

**a)** Contrato. Agregá el schema `EditarLibro`: las mismas tres propiedades de `NuevoLibro` con las mismas reglas, pero **sin** lista `required`. Después agregá:

- `PATCH /libros/{id}`: body `EditarLibro`. 200 con `Libro`, 400 si el body está vacío o algún campo presente tiene tipo o rango incorrecto, 404 si el libro o el `autor_id` no existen.
- `PUT /libros/{id}`: body `NuevoLibro`. 200 con `Libro`, 400 si falta algún campo o hay tipo o rango incorrecto, 404 si el libro o el `autor_id` no existen.

**b)** Tipos. Agregá `export type EditarLibro = Partial<NuevoLibro>`.

**c)** Repositorio. Agregá `actualizar(id: number, cambios: EditarLibro): Promise<Libro | null>`: busca con `findByPk`, si no existe devuelve `null`, si existe hace `instancia.update(cambios)` y devuelve `toJSON()`.

**d)** Validación compartida. La validación de tipos y rangos de `titulo`, `anio` y `autor_id` es la misma en POST, PUT y PATCH. Movela a una función `validarCamposLibro(body: unknown, todosObligatorios: boolean)` que devuelve `string | null` (el mensaje de error, o `null` si está todo bien). Usala en los tres controladores. En `crear` reemplazá lo que habías escrito a mano.

**e)** Controladores. Agregá `reemplazar` (PUT) y `modificar` (PATCH). Los dos: validan el id, validan el body con la función del punto anterior (con `true` para PUT, `false` para PATCH), en PATCH verifican que venga al menos un campo, si viene `autor_id` verifican que exista, llaman a `actualizar`, responden 404 si devolvió `null` o 200 con el libro.

**f)** Rutas: `router.put("/:id", reemplazar)` y `router.patch("/:id", modificar)`.

**g)** Probá sobre el libro 1 (Rayuela, 1963, autor 1):

| Pedido | Body | Esperado |
|---|---|---|
| `PATCH /libros/1` | `{ "titulo": "Rayuela (ed. 2026)" }` | 200, `anio` sigue en 1963 |
| `PUT /libros/1` | `{ "titulo": "Rayuela (ed. 2026)" }` | 400 |
| `PUT /libros/1` | `{ "titulo": "Rayuela", "anio": 1963, "autor_id": 1 }` | 200 |
| `PATCH /libros/1` | `{}` | 400 |
| `PATCH /libros/1` | `{ "autor_id": 999 }` | 404 |
| `PATCH /libros/999` | `{ "titulo": "x" }` | 404 |

---

## Ejercicio 10 · Los dos DELETE

📖 Teoría: 0.4 Status codes que vas a usar siempre

**a)** Contrato. Agregá:

- `DELETE /libros/{id}`: **204** sin body, 400, 404.
- `DELETE /autores/{id}`: **204** sin body, 400, 404, y **409** si el autor tiene libros. Example del 409: `"No se puede borrar: el autor tiene 2 libros"`.

**b)** Repositorio de libros: agregá `eliminar(id: number): Promise<boolean>` (busca, si no existe devuelve `false`, si existe hace `destroy()` y devuelve `true`) y `contarPorAutor(autorId: number): Promise<number>` con `Libro.count({ where: { autor_id: autorId } })`.

**c)** Repositorio de autores: agregá `eliminar(id: number): Promise<boolean>`, igual que el de libros.

**d)** Controlador de libros: `eliminar`. Valida el id, llama al repositorio, 404 si devolvió `false`, si no `res.status(204).send()`.

**e)** Controlador de autores: `eliminar`. Valida el id, llama a `Autores.obtenerPorId`, 404 si es `null`. Llama a `Libros.contarPorAutor(id)`. Si es mayor a 0, 409 con el mensaje que incluye la cantidad. Si no, llama a `Autores.eliminar` y responde 204.

**f)** Rutas: `router.delete("/:id", eliminar)` en los dos routers.

**g)** Probá:

| Pedido | Esperado |
|---|---|
| `DELETE /libros/7` (el que creaste en el ejercicio 8) | 204 |
| `GET /libros/7` | 404 |
| `DELETE /autores/1` (Cortázar, tiene 2 libros) | 409 |
| `DELETE /autores/999` | 404 |
| `DELETE /autores/5` (Mariana Enriquez, sin libros) | 204 |
| `GET /autores/5` | 404 |

---

## Ejercicio 11 · Contrato de préstamos

📖 Teoría: 1.6 Paso 5: acciones que no son CRUD · 2.7 Schemas: la forma de los datos

**a)** Agregá el schema `Prestamo` con `id`, `libro_id`, `socio_nombre`, `fecha_prestamo` (string, `format: date`) y `fecha_devolucion` (string, `format: date`, `nullable: true`). Todos en `required`.

**b)** Agregá el schema `NuevoPrestamo` con `libro_id` (integer) y `socio_nombre` (string, `minLength: 1`, `maxLength: 100`). Los dos en `required`.

**c)** Agregá el schema `Devolucion` con `fecha_devolucion` (string, `format: date`) en `required`.

**d)** Agregá `GET /prestamos` con el query param `activos` (boolean, opcional). Si es `true`, devuelve solo los que tienen `fecha_devolucion` en `null`. 200 con array de `Prestamo`, 400 si `activos` no es `true` ni `false`.

**e)** Agregá `POST /prestamos` con body `NuevoPrestamo`. En la `description` escribí: "Marca el libro como no disponible." Respuestas: 201 con `Prestamo` (con `fecha_prestamo` igual a la fecha de hoy y `fecha_devolucion: null`), 400 por body inválido, 404 si el libro no existe, **409** si el libro no está disponible.

**f)** Agregá `PATCH /prestamos/{id}` con body `Devolucion`. En la `description` escribí: "Registra la devolución y marca el libro como disponible." Respuestas: 200 con `Prestamo`, 400, 404 si el préstamo no existe, **409** si el préstamo ya tenía `fecha_devolucion`.

---

## Ejercicio 12 · Implementar préstamos

📖 Teoría: 5.5 El código, capa por capa · 6.1 Buenas prácticas básicas

**a)** Creá `src/types/prestamo.ts` con `Prestamo` (`fecha_devolucion: string | null`), `NuevoPrestamo = Omit<Prestamo, "id" | "fecha_prestamo" | "fecha_devolucion">` y `Devolucion = Pick<Prestamo, "fecha_devolucion">`.

**b)** Creá `src/repositories/prestamos.repository.ts` con:

- `obtenerTodos(soloActivos: boolean): Promise<Prestamo[]>`. Si `soloActivos`, `where: { fecha_devolucion: null }`.
- `obtenerPorId(id: number): Promise<Prestamo | null>`
- `crear(datos: NuevoPrestamo, fechaPrestamo: string): Promise<Prestamo>`
- `registrarDevolucion(id: number, fecha: string): Promise<Prestamo | null>`

**c)** Al repositorio de libros agregale `cambiarDisponibilidad(id: number, disponible: boolean): Promise<void>`.

**d)** Creá `src/controllers/prestamos.controller.ts`:

- `listar`: convierte `activos` como hiciste con `disponible` en libros, llama al repositorio, 200.
- `crear`, en este orden: valida el body con `typeof`. Llama a `Libros.obtenerPorId(libro_id)`, 404 si es `null`. Si `libro.disponible` es `false`, 409. Llama a `Prestamos.crear` con la fecha de hoy en formato `YYYY-MM-DD`. Llama a `Libros.cambiarDisponibilidad(libro_id, false)`. Responde 201.
- `devolver`, en este orden: valida el id y el body. Llama a `Prestamos.obtenerPorId`, 404 si es `null`. Si `fecha_devolucion` no es `null`, 409. Llama a `registrarDevolucion`. Llama a `Libros.cambiarDisponibilidad(prestamo.libro_id, true)`. Responde 200.

Cada error con su `return`. Primero los errores, al final el caso feliz.

**e)** Creá `src/routes/prestamos.routes.ts` con las tres rutas y montalo en `/prestamos`.

**f)** Probá esta secuencia, en orden, sobre el libro 3 (Ficciones, disponible):

| # | Pedido | Body | Esperado |
|---|---|---|---|
| 1 | `POST /prestamos` | `{ "libro_id": 3, "socio_nombre": "Ana" }` | 201, `fecha_devolucion: null` |
| 2 | `GET /libros/3` | | `disponible: false` |
| 3 | `POST /prestamos` | `{ "libro_id": 3, "socio_nombre": "Luis" }` | 409 |
| 4 | `GET /prestamos?activos=true` | | incluye el préstamo del paso 1 |
| 5 | `PATCH /prestamos/{id del paso 1}` | `{ "fecha_devolucion": "2026-09-22" }` | 200 |
| 6 | `GET /libros/3` | | `disponible: true` |
| 7 | `PATCH /prestamos/{id del paso 1}` | `{ "fecha_devolucion": "2026-09-23" }` | 409 |

---

## Entrega

El repositorio con:

1. `docs/RUTAS.md` con la tabla del ejercicio 2.
2. `docs/openapi.yaml` con los doce endpoints y todos sus errores. `/docs` carga sin errores.
3. Código con la estructura `types / repositories / controllers / routes`, un archivo por recurso en cada carpeta.
4. `npm run build` sin errores.

**Checklist de autoevaluación**

| Criterio | ✅ |
|---|---|
| Los doce endpoints están en el contrato y en el código | |
| Cada respuesta real coincide con el contrato: mismo status, mismos campos | |
| Todos los errores tienen la forma `{ "error": "..." }` | |
| Todas las tablas de prueba de los ejercicios 4, 6, 8, 9, 10 y 12 dan el resultado esperado | |
| Solo los repositorios importan de `models/` | |
| Los repositorios no reciben `req` ni `res` y devuelven `toJSON()`, nunca instancias | |
| Las rutas solo tienen `router.<verbo>(ruta, controlador)` | |
| La validación de campos de libro está en una sola función | |
| No hay `any` escrito a mano | |
| `npm run build` compila sin errores | |
