# De la base de datos a la API — Práctica

Vas a construir, paso a paso, la API de una biblioteca: **biblioteca-api**. Al final vas a tener 12 endpoints funcionando contra una base de datos real.

La API se arma **de afuera hacia adentro**, una capa por vez:

```
contrato → tipos → rutas → controllers → services → repositories → base de datos
```

| Capa | Carpeta | Qué hace | Qué NO hace |
|---|---|---|---|
| Contrato | `docs/openapi.yaml` | Describe qué endpoints hay, qué reciben y qué devuelven. | No tiene código. |
| Tipos | `src/types/` | Define la forma de los datos (`Autor`, `Libro`, `Prestamo`). | No tiene lógica. |
| Rutas | `src/routes/` | Dice qué función atiende cada verbo + URL. | No tiene lógica. |
| Controllers | `src/controllers/` | Lee el pedido (`req`), valida los datos y elige el status de la respuesta (`res`). | No conoce la base de datos. |
| Services | `src/services/` | Aplica las reglas del negocio ("no se puede prestar un libro prestado"). | No conoce `req` ni `res`. |
| Repositories | `src/repositories/` | Lee y guarda datos. Es el único que habla con la base. | No valida ni decide status. |

En cada paso te digo **qué archivo crear**, **qué escribir** y **cómo probar** que funciona. No pases al paso siguiente hasta que la prueba del paso actual te dé lo esperado.

📖 Los números como **5.5** son secciones de la carpeta `teoria/`. Si algo no se entiende, andá a buscarlo ahí.

---

## Reglas que valen para toda la API

Leelas ahora y volvé a ellas cuando tengas dudas.

1. **Todos los errores** se responden con un JSON de esta forma: `{ "error": "mensaje" }`. Por ejemplo: `{ "error": "Libro no encontrado" }`.
2. Si el `id` de la URL **no es un número entero** (por ejemplo `/libros/abc`) → **400**.
3. Si el `id` es un número pero **no existe** (por ejemplo `/libros/999`) → **404**.
4. Si un dato del body o de la query **está mal** (falta, tiene otro tipo o está fuera de rango) → **400**.
5. Cada capa solo llama a la capa de abajo: rutas → controllers → services → repositories. Nunca al revés, nunca saltando una.
6. En los `import` entre archivos tuyos, la extensión se escribe **`.js`** aunque el archivo sea `.ts`. Ejemplo: `import * as AutoresService from "../services/autores.service.js";`. Es una regla de Node, no un error.

**Status que vas a usar:**

| Status | Cuándo |
|---|---|
| 200 | Todo bien, devuelvo datos. |
| 201 | Todo bien, creé algo nuevo. |
| 204 | Todo bien, lo borré. No devuelvo nada. |
| 400 | Me mandaste algo mal. |
| 404 | Lo que buscás no existe. |
| 409 | El pedido está bien, pero choca con el estado actual (ej.: el libro ya está prestado). |

---

## Los 12 endpoints

Esta es la lista completa de lo que vas a construir. Todos los pasos se refieren a esta tabla.

| # | Verbo | Ruta | Qué hace |
|---|---|---|---|
| 1 | GET | `/autores` | Lista todos los autores. |
| 2 | GET | `/autores/{id}` | Devuelve un autor. |
| 3 | DELETE | `/autores/{id}` | Borra un autor. Solo si no tiene libros. |
| 4 | GET | `/libros` | Busca libros con filtros y paginación. |
| 5 | GET | `/libros/{id}` | Devuelve un libro. |
| 6 | POST | `/libros` | Crea un libro. |
| 7 | PATCH | `/libros/{id}` | Modifica **algunos** campos de un libro. |
| 8 | PUT | `/libros/{id}` | Reemplaza **todos** los campos de un libro. |
| 9 | DELETE | `/libros/{id}` | Borra un libro. |
| 10 | GET | `/prestamos` | Lista los préstamos. Con `?activos=true`, solo los no devueltos. |
| 11 | POST | `/prestamos` | Presta un libro. |
| 12 | PATCH | `/prestamos/{id}` | Registra que un préstamo se devolvió. |

---

## Paso 0 · Levantar el proyecto

📖 4.3

**Primero, la base de datos.** Necesitás tener Postgres y pgAdmin instalados.

1. Abrí **pgAdmin** y conectate a tu servidor.
2. Clic derecho en **Databases** → **Create** → **Database...** → en **Database** escribí `biblioteca` (todo en minúscula) → **Save**. La base queda vacía; las tablas se crean solas en el punto siguiente.
3. Abrí `biblioteca-api/src/db/connection.ts` y cambiá `USUARIO` y `CONTRASENIA` por los que elegiste al instalar Postgres.

**Después, el proyecto.** En una terminal, dentro de la carpeta `biblioteca-api`:

```bash
npm install      # instala las dependencias (solo la primera vez)
npm run seed     # crea las tablas en la base `biblioteca` y carga datos de ejemplo
npm run dev      # levanta el servidor
```

Dejá esa terminal abierta: el servidor se reinicia solo cada vez que guardás un archivo.

**Prueba.**

- Abrí `http://localhost:3000` en el navegador. Tiene que aparecer `{ "mensaje": "API Biblioteca funcionando", ... }`.
- Abrí `http://localhost:3000/docs`. Tiene que aparecer Swagger UI (una página que por ahora dice que no hay operaciones).

- En pgAdmin, en **biblioteca** → **Schemas** → **public** → **Tables** (clic derecho → **Refresh** si no las ves), tienen que aparecer las tablas `autores`, `libros` y `prestamos`.

Si `npm run seed` falla, leé el mensaje de error:

| Mensaje | Qué revisar |
|---|---|
| `password authentication failed` | El usuario o la contraseña en `src/db/connection.ts`. |
| `database "biblioteca" does not exist` | Que creaste la base en pgAdmin con ese nombre exacto. |
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
| `Autor` | `id` (integer), `nombre` (string), `nacionalidad` (string) | todos |
| `Libro` | `id` (integer), `titulo` (string), `anio` (integer), `autor_id` (integer), `disponible` (boolean) | todos |
| `NuevoLibro` | `titulo` (string, `minLength: 1`, `maxLength: 200`), `anio` (integer, `minimum: 1000`, `maximum: 2100`), `autor_id` (integer) | todos |
| `EditarLibro` | los mismos 3 campos y reglas que `NuevoLibro` | **ninguno** (no lleva `required`) |
| `PaginaDeLibros` | `datos` (array de `Libro`), `total` (integer), `pagina` (integer), `limite` (integer) | todos |
| `Prestamo` | `id` (integer), `libro_id` (integer), `socio_nombre` (string), `fecha_prestamo` (string), `fecha_devolucion` (string, `nullable: true`) | todos |
| `NuevoPrestamo` | `libro_id` (integer), `socio_nombre` (string, `minLength: 1`) | todos |
| `Devolucion` | `fecha_devolucion` (string, ejemplo `2026-09-30`) | todos |

Un array de `Libro` se escribe así:

```yaml
datos:
  type: array
  items:
    $ref: "#/components/schemas/Libro"
```

### 1.b · Endpoints de autores (1, 2 y 3)

Reemplazá `paths: {}` por `paths:` y escribí los endpoints. Este es el endpoint 2 completo, para que lo uses de modelo:

```yaml
paths:
  /autores/{id}:
    get:
      summary: Devuelve un autor por id
      tags: [Autores]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer }
      responses:
        "200":
          description: Autor encontrado
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Autor"
        "400":
          description: El id no es un número
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Autor no encontrado
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
```

Fijate que el `get` y el `delete` de `/autores/{id}` van **dentro del mismo bloque** `/autores/{id}:`, uno debajo del otro.

| # | Endpoint | Respuestas |
|---|---|---|
| 1 | `GET /autores` | 200 con un array de `Autor` |
| 2 | `GET /autores/{id}` | 200 con `Autor` · 400 · 404 |
| 3 | `DELETE /autores/{id}` | 204 (sin `content`) · 400 · 404 · 409 "El autor tiene libros" |

### 1.c · Endpoints de libros (4 a 9)

| # | Endpoint | Body | Respuestas |
|---|---|---|---|
| 4 | `GET /libros` | — | 200 con `PaginaDeLibros` · 400 |
| 5 | `GET /libros/{id}` | — | 200 con `Libro` · 400 · 404 |
| 6 | `POST /libros` | `NuevoLibro` | 201 con `Libro` · 400 · 404 "Autor no encontrado" |
| 7 | `PATCH /libros/{id}` | `EditarLibro` | 200 con `Libro` · 400 · 404 |
| 8 | `PUT /libros/{id}` | `NuevoLibro` | 200 con `Libro` · 400 · 404 |
| 9 | `DELETE /libros/{id}` | — | 204 · 400 · 404 |

El endpoint 4 tiene estos **query params**, todos con `in: query` y `required: false`:

| Param | Tipo | Qué hace |
|---|---|---|
| `titulo` | string | Trae los libros cuyo título **contiene** ese texto, sin importar mayúsculas. |
| `disponible` | boolean | `true` trae solo los disponibles; `false`, solo los prestados. |
| `autor_id` | integer | Trae solo los libros de ese autor. |
| `pagina` | integer, `minimum: 1`, `default: 1` | Qué página devolver. |
| `limite` | integer, `minimum: 1`, `default: 10` | Cuántos libros por página. Si piden más de 50, se usa 50. |

El body se escribe con `requestBody`, igual que en la plantilla que está comentada en el archivo.

### 1.d · Endpoints de préstamos (10, 11 y 12)

| # | Endpoint | Body | Respuestas |
|---|---|---|---|
| 10 | `GET /prestamos` | — | 200 con un array de `Prestamo` · 400 |
| 11 | `POST /prestamos` | `NuevoPrestamo` | 201 con `Prestamo` · 400 · 404 "Libro no encontrado" · 409 "El libro no está disponible" |
| 12 | `PATCH /prestamos/{id}` | `Devolucion` | 200 con `Prestamo` · 400 · 404 · 409 "El préstamo ya fue devuelto" |

El endpoint 10 tiene un query param `activos` (boolean, opcional).

En el `description` del endpoint 11 escribí: *"Al prestar un libro, el libro pasa a `disponible: false`."* En el del 12: *"Al devolver, el libro vuelve a `disponible: true`."*

**Prueba del paso 1.** En `http://localhost:3000/docs` se ven los 12 endpoints, agrupados en Autores, Libros y Préstamos, sin ningún mensaje de error. Abajo de todo se ven los 9 schemas.

> Todavía no podés usar "Try it out": el código no existe. Eso viene ahora.

---

## Paso 2 · Los tipos (`src/types/`)

📖 3.4 · 3.6 · 3.7 · 5.5

Los tipos son el contrato escrito en TypeScript. Tienen que coincidir campo por campo con los schemas del paso 1.

Creá **`src/types/autor.ts`**:

```ts
export interface Autor {
  id: number;
  nombre: string;
  nacionalidad: string;
}
```

Creá **`src/types/libro.ts`** con:

- `interface Libro` con los 5 campos del schema `Libro`.
- `type NuevoLibro = Omit<Libro, "id" | "disponible">;` → un libro sin `id` ni `disponible` (esos los pone la API).
- `type EditarLibro = Partial<NuevoLibro>;` → los mismos campos, pero todos opcionales.
- `interface FiltrosLibro` con `titulo?: string`, `disponible?: boolean`, `autor_id?: number`. El `?` significa "puede no venir".
- `interface Paginacion` con `pagina: number` y `limite: number`.
- `interface PaginaDe<T>` con `datos: T[]`, `total: number`, `pagina: number`, `limite: number`.

Creá **`src/types/prestamo.ts`** con:

- `interface Prestamo` con los 5 campos. Ojo: `fecha_devolucion: string | null;`
- `interface NuevoPrestamo` con `libro_id: number` y `socio_nombre: string`.
- `interface Devolucion` con `fecha_devolucion: string`.

**Prueba del paso 2.** En otra terminal (dejá el servidor corriendo en la primera), corré `npm run build`. Tiene que terminar sin errores.

---

## Paso 3 · Las rutas (`src/routes/`)

📖 4.4 · 4.5 · 5.5

En este paso conectás cada URL con una función. Esas funciones van a estar en los controllers, pero **por ahora solo responden "todavía no está hecho"** (status 501). Así podés probar que todas las rutas existen antes de programarlas.

### 3.a · Autores

Creá **`src/controllers/autores.controller.ts`** con tres funciones vacías:

```ts
import { Request, Response } from "express";

export async function listar(req: Request, res: Response) {
  res.status(501).json({ error: "Todavía no implementado" });
}

export async function obtenerUno(req: Request, res: Response) {
  res.status(501).json({ error: "Todavía no implementado" });
}

export async function eliminar(req: Request, res: Response) {
  res.status(501).json({ error: "Todavía no implementado" });
}
```

Creá **`src/routes/autores.routes.ts`**:

```ts
import { Router } from "express";
import * as controller from "../controllers/autores.controller.js";

const router = Router();

router.get("/", controller.listar);
router.get("/:id", controller.obtenerUno);
router.delete("/:id", controller.eliminar);

export default router;
```

En **`src/server.ts`**, arriba de todo agregá `import autoresRoutes from "./routes/autores.routes.js";` y, donde dice "Acá vas a montar tus routers", descomentá la línea `app.use("/autores", autoresRoutes);`.

Fijate que en el router la ruta es `"/"` y `"/:id"`, no `"/autores"`. El `/autores` ya lo pone el `app.use`. En Express, `:id` es lo que en el contrato escribiste como `{id}`.

### 3.b · Libros

Igual que 3.a, pero con **`src/controllers/libros.controller.ts`** y **`src/routes/libros.routes.ts`**, montado en `/libros`. Funciones:

| Endpoint | Función del controller |
|---|---|
| `GET /` | `buscar` |
| `GET /:id` | `obtenerUno` |
| `POST /` | `crear` |
| `PATCH /:id` | `modificar` |
| `PUT /:id` | `reemplazar` |
| `DELETE /:id` | `eliminar` |

### 3.c · Préstamos

Igual, con **`src/controllers/prestamos.controller.ts`** y **`src/routes/prestamos.routes.ts`**, montado en `/prestamos`. Funciones:

| Endpoint | Función del controller |
|---|---|
| `GET /` | `listar` |
| `POST /` | `crear` |
| `PATCH /:id` | `devolver` |

**Prueba del paso 3.** En Swagger, probá con "Try it out" los 12 endpoints. **Todos** tienen que responder `501` con `{ "error": "Todavía no implementado" }`. Si alguno responde `404` con una página HTML que dice `Cannot GET ...`, esa ruta está mal escrita o el router no está montado en `server.ts`.

---

## Paso 4 · Los controllers: validar lo que llega

📖 4.8 · 4.11 · 4.12 · 5.5

El controller es la puerta de entrada. Todo lo que llega en `req.params`, `req.query` y `req.body` puede venir mal, así que el controller lo **revisa y lo convierte** al tipo correcto antes de seguir.

Todo lo que llega en `req.params` y `req.query` es **texto** (string), aunque parezca un número. `"5"` no es lo mismo que `5`.

En este paso, cuando los datos están **bien**, el controller sigue respondiendo 501. Cuando están **mal**, responde 400. Los 404 y 409 todavía no: esos necesitan buscar en los datos y eso se hace en los pasos siguientes.

Escribí siempre **primero los errores**, cada uno con `return`, y al final el caso feliz. El `return` hace que la función termine ahí y no siga.

### 4.a · Una función para leer ids

Creá **`src/controllers/validaciones.ts`**. Vas a ir agregando acá las funciones de validación que usan varios controllers. La primera:

```ts
// Convierte el texto a número entero positivo.
// Devuelve null si no se puede (ej.: "abc", "2.5", "-3").
export function leerId(texto: string): number | null {
  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero < 1) return null;
  return numero;
}
```

Y usala en `obtenerUno` de autores:

```ts
import { leerId } from "./validaciones.js";

export async function obtenerUno(req: Request, res: Response) {
  const id = leerId(req.params.id);
  if (id === null) return res.status(400).json({ error: "El id debe ser un número entero" });

  res.status(501).json({ error: "Todavía no implementado" });
}
```

Hacé lo mismo en **todos** los endpoints que tienen `:id` (son 6 en total).

### 4.b · Query params de `GET /libros`

En `buscar`, leé cada query param y convertilo. Si un param **no viene**, no es un error: simplemente no se filtra por eso.

| Param | Si no viene | Cómo se convierte | Es 400 si... |
|---|---|---|---|
| `titulo` | no se filtra | se usa tal cual | nunca |
| `disponible` | no se filtra | `"true"` → `true`, `"false"` → `false` | es cualquier otra cosa |
| `autor_id` | no se filtra | con `leerId` | `leerId` devuelve `null` |
| `pagina` | vale `1` | con `Number` | no es un entero, o es menor que 1 |
| `limite` | vale `10` | con `Number` | no es un entero, o es menor que 1. Si es mayor que 50, **no** es error: se usa 50. |

Para saber si un query param vino: `if (req.query.disponible !== undefined)`. Para usarlo como texto: `String(req.query.disponible)`.

Agregá a `validaciones.ts` una función `leerBooleano(texto: string): boolean | null` que devuelva `true`, `false` o `null` si el texto no es ni `"true"` ni `"false"`. La vas a usar también en préstamos.

Al terminar de validar, armá un objeto `FiltrosLibro` y uno `Paginacion`. Por ahora no los usás: en el paso 5 se los vas a pasar al service.

### 4.c · Body de libros (`POST`, `PUT` y `PATCH`)

Las reglas de un libro son las mismas en los tres endpoints, así que conviene escribirlas **una sola vez**. Agregá a `validaciones.ts`:

```ts
// Revisa los campos de un libro que vienen en el body.
// Si `todosObligatorios` es true (POST y PUT), falta un campo → error.
// Si es false (PATCH), cada campo es opcional, pero si viene tiene que estar bien.
// Devuelve el mensaje de error, o null si está todo bien.
export function validarLibro(body: any, todosObligatorios: boolean): string | null {
  const { titulo, anio, autor_id } = body;

  if (titulo === undefined) {
    if (todosObligatorios) return "Falta el campo titulo";
  } else if (typeof titulo !== "string" || titulo.length < 1 || titulo.length > 200) {
    return "titulo debe ser un texto de 1 a 200 caracteres";
  }

  // Completá vos: `anio` (entero de 1000 a 2100) y `autor_id` (entero mayor que 0),
  // con la misma forma que `titulo`. Para ver si es entero: Number.isInteger(anio).

  return null;
}
```

En los controllers:

- `crear` y `reemplazar`: `validarLibro(req.body, true)`. Si devuelve un mensaje → 400 con ese mensaje.
- `modificar`: primero, si el body está vacío (`Object.keys(req.body).length === 0`) → 400 "El body no puede estar vacío". Después `validarLibro(req.body, false)`.

### 4.d · Préstamos

- `listar`: si viene `activos`, convertilo con `leerBooleano`. Si da `null` → 400.
- `crear`: `libro_id` tiene que ser un entero mayor que 0 y `socio_nombre` un texto no vacío. Si no → 400.
- `devolver`: `fecha_devolucion` tiene que ser un texto con formato `YYYY-MM-DD`. Para revisarlo usá: `/^\d{4}-\d{2}-\d{2}$/.test(fecha_devolucion)`. Si no → 400.

**Prueba del paso 4.**

| Pedido | Esperado |
|---|---|
| `GET /autores/abc` | 400 |
| `GET /autores/1` | 501 |
| `GET /libros?disponible=banana` | 400 |
| `GET /libros?pagina=0` | 400 |
| `GET /libros?limite=500` | 501 (no es error) |
| `POST /libros` con `{ "titulo": "Nuevo" }` | 400, falta `anio` |
| `POST /libros` con `{ "titulo": "Nuevo", "anio": "mil", "autor_id": 1 }` | 400, `anio` no es número |
| `POST /libros` con `{ "titulo": "Nuevo", "anio": 50, "autor_id": 1 }` | 400, `anio` fuera de rango |
| `POST /libros` con `{ "titulo": "Nuevo", "anio": 2000, "autor_id": 1 }` | 501 |
| `PATCH /libros/1` con `{}` | 400 |
| `PATCH /libros/1` con `{ "titulo": "Otro" }` | 501 |
| `PUT /libros/1` con `{ "titulo": "Otro" }` | 400, al PUT le faltan campos |
| `GET /prestamos?activos=quizas` | 400 |
| `PATCH /prestamos/1` con `{ "fecha_devolucion": "ayer" }` | 400 |

---

## Paso 5 · Los services: las reglas del negocio

📖 5.6

El service tiene las reglas de la biblioteca. **No conoce `req` ni `res`**: recibe datos ya validados (números, objetos con los tipos del paso 2) y devuelve un resultado.

El service le pide los datos al repository. En este paso vas a escribir los services **llamando a funciones del repository que todavía no existen**. Las creás en el paso 6.

> ⚠️ Mientras hacés este paso, el servidor va a mostrar errores en la terminal porque faltan los repositories. **Es normal.** Este paso se prueba al terminar el paso 6.

### Cómo avisa el service que algo salió mal

- Si lo que se busca no existe, el service devuelve `null`. El controller lo convierte en 404.
- Si hay más de un error posible, el service devuelve un **texto en mayúsculas** que dice qué pasó (por ejemplo `"AUTOR_NO_ENCONTRADO"`), y el controller elige el status.

El service **nunca** elige un status. Eso es trabajo del controller.

### 5.a · Autores

Creá **`src/services/autores.service.ts`**:

```ts
import * as AutoresRepository from "../repositories/autores.repository.js";
import * as LibrosRepository from "../repositories/libros.repository.js";
import { Autor } from "../types/autor.js";

export async function listar(): Promise<Autor[]> {
  return AutoresRepository.obtenerTodos();
}

export async function obtenerUno(id: number): Promise<Autor | null> {
  return AutoresRepository.obtenerPorId(id);
}

// Regla: no se puede borrar un autor que tiene libros.
export async function eliminar(id: number): Promise<"ELIMINADO" | "AUTOR_NO_ENCONTRADO" | "TIENE_LIBROS"> {
  const autor = await AutoresRepository.obtenerPorId(id);
  if (!autor) return "AUTOR_NO_ENCONTRADO";

  const cantidad = await LibrosRepository.contarPorAutor(id);
  if (cantidad > 0) return "TIENE_LIBROS";

  await AutoresRepository.eliminar(id);
  return "ELIMINADO";
}
```

Y en el controller, reemplazá cada `501` por la llamada al service. Por ejemplo:

```ts
import * as AutoresService from "../services/autores.service.js";

export async function eliminar(req: Request, res: Response) {
  const id = leerId(req.params.id);
  if (id === null) return res.status(400).json({ error: "El id debe ser un número entero" });

  const resultado = await AutoresService.eliminar(id);
  if (resultado === "AUTOR_NO_ENCONTRADO") return res.status(404).json({ error: "Autor no encontrado" });
  if (resultado === "TIENE_LIBROS") return res.status(409).json({ error: "El autor tiene libros" });

  res.status(204).send();
}
```

Escribí vos `listar` (responde 200 con el array) y `obtenerUno` (404 si el service devuelve `null`, 200 si no).

### 5.b · Libros

Creá **`src/services/libros.service.ts`** con estas funciones:

| Función | Qué hace | Devuelve |
|---|---|---|
| `buscar(filtros, paginacion)` | Llama a `LibrosRepository.buscar`. | `PaginaDe<Libro>` |
| `obtenerUno(id)` | Llama a `LibrosRepository.obtenerPorId`. | `Libro \| null` |
| `crear(datos: NuevoLibro)` | Si el autor `datos.autor_id` no existe → `"AUTOR_NO_ENCONTRADO"`. Si existe, crea el libro. | `Libro \| "AUTOR_NO_ENCONTRADO"` |
| `actualizar(id, cambios: EditarLibro)` | Si el libro no existe → `"LIBRO_NO_ENCONTRADO"`. Si en los cambios viene `autor_id` y ese autor no existe → `"AUTOR_NO_ENCONTRADO"`. Si no, actualiza. | `Libro \| "LIBRO_NO_ENCONTRADO" \| "AUTOR_NO_ENCONTRADO"` |
| `eliminar(id)` | Llama a `LibrosRepository.eliminar`. | `boolean` (`false` = no existía) |

`modificar` (PATCH) y `reemplazar` (PUT) del controller llaman **los dos** a `actualizar`. La diferencia entre PATCH y PUT ya la resolvió la validación del paso 4.

En el controller, conectá las 6 funciones. En `crear` respondé **201**; en `eliminar` respondé **204** con `res.status(204).send()`. Los dos errores de `actualizar` son 404, con mensajes distintos.

### 5.c · Préstamos

Creá **`src/services/prestamos.service.ts`**:

| Función | Qué hace | Devuelve |
|---|---|---|
| `listar(soloActivos: boolean)` | Llama a `PrestamosRepository.obtenerTodos(soloActivos)`. | `Prestamo[]` |
| `crear(datos: NuevoPrestamo)` | Ver abajo. | `Prestamo \| "LIBRO_NO_ENCONTRADO" \| "LIBRO_NO_DISPONIBLE"` |
| `devolver(id, datos: Devolucion)` | Ver abajo. | `Prestamo \| "PRESTAMO_NO_ENCONTRADO" \| "YA_DEVUELTO"` |

**`crear`**, en este orden:

1. Buscar el libro con `LibrosRepository.obtenerPorId(datos.libro_id)`. Si no existe → `"LIBRO_NO_ENCONTRADO"`.
2. Si `libro.disponible` es `false` → `"LIBRO_NO_DISPONIBLE"`.
3. Calcular la fecha de hoy: `const hoy = new Date().toISOString().slice(0, 10);` (da algo como `"2026-09-22"`).
4. Crear el préstamo con `PrestamosRepository.crear(datos, hoy)`.
5. Marcar el libro como prestado: `LibrosRepository.cambiarDisponibilidad(datos.libro_id, false)`.
6. Devolver el préstamo creado.

**`devolver`**, en este orden:

1. Buscar el préstamo con `PrestamosRepository.obtenerPorId(id)`. Si no existe → `"PRESTAMO_NO_ENCONTRADO"`.
2. Si `prestamo.fecha_devolucion` **no** es `null`, ya se devolvió → `"YA_DEVUELTO"`.
3. Guardar la devolución con `PrestamosRepository.registrarDevolucion(id, datos.fecha_devolucion)`.
4. Marcar el libro como disponible: `LibrosRepository.cambiarDisponibilidad(prestamo.libro_id, true)`.
5. Devolver el préstamo actualizado.

En el controller: `listar` → 200 (si `activos` no vino, pasale `false`); `crear` → 201, 404 o 409; `devolver` → 200, 404 o 409.

**Prueba del paso 5.** Corré `npm run build`. Los únicos errores que tienen que aparecer son del tipo `Cannot find module '../repositories/...'`. Si aparece otro error, corregilo antes de seguir.

---

## Paso 6 · Los repositories (con datos en memoria)

📖 5.9

El repository es el que guarda y busca los datos. Antes de conectarlo a la base de datos, lo vas a hacer con **arrays comunes** de JavaScript. Así ves la API entera funcionando, y en el paso 7 cambiás solo el interior del repository.

> Los datos en memoria **se pierden cada vez que el servidor se reinicia** (o sea, cada vez que guardás un archivo). Es normal: en el paso 7 pasan a la base de datos, donde sí se guardan.

### 6.a · Los datos

Creá **`src/repositories/memoria.ts`** y copiá esto tal cual. Son los mismos datos que tiene la base de ejemplo:

```ts
import { Autor } from "../types/autor.js";
import { Libro } from "../types/libro.js";
import { Prestamo } from "../types/prestamo.js";

export const autores: Autor[] = [
  { id: 1, nombre: "Julio Cortázar", nacionalidad: "Argentina" },
  { id: 2, nombre: "Jorge Luis Borges", nacionalidad: "Argentina" },
  { id: 3, nombre: "Silvina Ocampo", nacionalidad: "Argentina" },
  { id: 4, nombre: "Roberto Bolaño", nacionalidad: "Chile" },
  { id: 5, nombre: "Mariana Enriquez", nacionalidad: "Argentina" },
];

export const libros: Libro[] = [
  { id: 1, titulo: "Rayuela", anio: 1963, autor_id: 1, disponible: true },
  { id: 2, titulo: "Bestiario", anio: 1951, autor_id: 1, disponible: false },
  { id: 3, titulo: "Ficciones", anio: 1944, autor_id: 2, disponible: true },
  { id: 4, titulo: "El Aleph", anio: 1949, autor_id: 2, disponible: false },
  { id: 5, titulo: "La furia", anio: 1959, autor_id: 3, disponible: true },
  { id: 6, titulo: "Los detectives salvajes", anio: 1998, autor_id: 4, disponible: true },
];

export const prestamos: Prestamo[] = [
  { id: 1, libro_id: 2, socio_nombre: "Ana Pérez", fecha_prestamo: "2026-08-01", fecha_devolucion: "2026-08-15" },
  { id: 2, libro_id: 2, socio_nombre: "Luis Gómez", fecha_prestamo: "2026-09-10", fecha_devolucion: null },
  { id: 3, libro_id: 4, socio_nombre: "Ana Pérez", fecha_prestamo: "2026-09-18", fecha_devolucion: null },
];
```

### 6.b · Autores

Creá **`src/repositories/autores.repository.ts`**:

```ts
import { autores } from "./memoria.js";
import { Autor } from "../types/autor.js";

export async function obtenerTodos(): Promise<Autor[]> {
  return autores;
}

export async function obtenerPorId(id: number): Promise<Autor | null> {
  const autor = autores.find((a) => a.id === id);
  return autor ?? null; // si no lo encontró, find devuelve undefined → lo cambiamos por null
}

export async function eliminar(id: number): Promise<boolean> {
  const posicion = autores.findIndex((a) => a.id === id);
  if (posicion === -1) return false;
  autores.splice(posicion, 1); // saca 1 elemento en esa posición
  return true;
}
```

### 6.c · Libros

Creá **`src/repositories/libros.repository.ts`** con:

| Función | Devuelve | Pista |
|---|---|---|
| `obtenerPorId(id)` | `Libro \| null` | Igual que en autores. |
| `buscar(filtros, paginacion)` | `PaginaDe<Libro>` | Ver abajo. |
| `crear(datos: NuevoLibro)` | `Libro` | El `id` nuevo es el `id` más grande + 1. `disponible` empieza en `true`. Agregalo con `libros.push(...)`. |
| `actualizar(id, cambios: EditarLibro)` | `Libro \| null` | Buscá el libro y usá `Object.assign(libro, cambios)` para copiarle los cambios. |
| `eliminar(id)` | `boolean` | Igual que en autores. |
| `contarPorAutor(autorId)` | `number` | `libros.filter(...).length` |
| `cambiarDisponibilidad(id, disponible)` | `void` | Buscá el libro y cambiale `disponible`. |

Para el `id` nuevo: `const nuevoId = Math.max(...libros.map((l) => l.id)) + 1;`

`buscar` tiene dos partes. Primero **filtrar**, después **cortar la página**:

```ts
let resultado = libros;

if (filtros.titulo !== undefined) {
  const texto = filtros.titulo.toLowerCase();
  resultado = resultado.filter((l) => l.titulo.toLowerCase().includes(texto));
}
// Completá vos: el filtro por `disponible` y el filtro por `autor_id`.

const desde = (paginacion.pagina - 1) * paginacion.limite;
const datos = resultado.slice(desde, desde + paginacion.limite);

return { datos, total: resultado.length, pagina: paginacion.pagina, limite: paginacion.limite };
```

`total` es la cantidad de libros que cumplen los filtros **en total**, no los de esta página.

### 6.d · Préstamos

Creá **`src/repositories/prestamos.repository.ts`** con:

| Función | Devuelve | Pista |
|---|---|---|
| `obtenerTodos(soloActivos: boolean)` | `Prestamo[]` | Si `soloActivos` es `true`, solo los que tienen `fecha_devolucion === null`. |
| `obtenerPorId(id)` | `Prestamo \| null` | |
| `crear(datos: NuevoPrestamo, fechaPrestamo: string)` | `Prestamo` | `id` nuevo como en libros; `fecha_devolucion: null`. |
| `registrarDevolucion(id, fecha: string)` | `Prestamo \| null` | Buscá el préstamo y cambiale `fecha_devolucion`. |

**Prueba del paso 6.** Ahora la API funciona entera. Probá **en este orden** (sin guardar archivos en el medio, porque se reinician los datos):

| # | Pedido | Esperado |
|---|---|---|
| 1 | `GET /autores` | 200, 5 autores |
| 2 | `GET /autores/1` | 200, Julio Cortázar |
| 3 | `GET /autores/999` | 404 |
| 4 | `GET /libros` | 200, `total: 6` |
| 5 | `GET /libros?titulo=EL` | `total: 2` (Rayuela y El Aleph) |
| 6 | `GET /libros?disponible=true&autor_id=2` | `total: 1` (Ficciones) |
| 7 | `GET /libros?pagina=2&limite=2` | 2 libros (ids 3 y 4), `pagina: 2` |
| 8 | `GET /libros?limite=500` | `limite: 50` |
| 9 | `POST /libros` con `{ "titulo": "Nuevo", "anio": 2000, "autor_id": 99 }` | 404, el autor no existe |
| 10 | `POST /libros` con `{ "titulo": "Nuevo", "anio": 2000, "autor_id": 1 }` | 201, `id: 7`, `disponible: true` |
| 11 | `PATCH /libros/1` con `{ "titulo": "Otro" }` | 200, `titulo: "Otro"` y `anio` sigue en `1963` |
| 12 | `PUT /libros/999` con `{ "titulo": "X", "anio": 2000, "autor_id": 1 }` | 404 |
| 13 | `DELETE /libros/7` | 204 |
| 14 | `DELETE /libros/7` | 404, ya no existe |
| 15 | `DELETE /autores/1` | 409, tiene libros |
| 16 | `DELETE /autores/5` | 204 |
| 17 | `GET /prestamos?activos=true` | 200, 2 préstamos |
| 18 | `POST /prestamos` con `{ "libro_id": 3, "socio_nombre": "Sofía" }` | 201, `fecha_devolucion: null` |
| 19 | `GET /libros/3` | `disponible: false` |
| 20 | `POST /prestamos` con `{ "libro_id": 3, "socio_nombre": "Tomás" }` | 409, ya está prestado |
| 21 | `PATCH /prestamos/4` con `{ "fecha_devolucion": "2026-09-30" }` | 200 |
| 22 | `GET /libros/3` | `disponible: true` |
| 23 | `PATCH /prestamos/4` con `{ "fecha_devolucion": "2026-09-30" }` | 409, ya fue devuelto |

---

## Paso 7 · Conectar la base de datos

📖 5.8 · README, sección "Sequelize en cinco líneas"

Ahora cambiás el **interior** de los tres repositories para que usen la base de datos PostgreSQL a través de Sequelize, en vez de los arrays.

**La regla de este paso:** solo tocás archivos de `src/repositories/`. Los nombres de las funciones, lo que reciben y lo que devuelven **no cambian**. Si los cambiás, se rompen los services. Esa es justamente la ventaja de tener repositories.

Dos cosas importantes de Sequelize:

- Los modelos (`Autor`, `Libro`, `Prestamo`) ya están hechos en `src/models/`. Importalos **siempre** desde `../models/index.js`.
- Lo que devuelve Sequelize **no** es un objeto común: es una "instancia" con muchas cosas más adentro. Convertila siempre con `.toJSON()` antes de devolverla.

Como el modelo y tu tipo se llaman igual (`Autor`), al importar el modelo le cambiás el nombre con `as`:

```ts
import { Autor as AutorModel } from "../models/index.js";
import { Autor } from "../types/autor.js";

export async function obtenerTodos(): Promise<Autor[]> {
  const filas = await AutorModel.findAll({ order: [["id", "ASC"]] });
  return filas.map((fila) => fila.toJSON());
}

export async function obtenerPorId(id: number): Promise<Autor | null> {
  const fila = await AutorModel.findByPk(id);
  return fila ? fila.toJSON() : null;
}

export async function eliminar(id: number): Promise<boolean> {
  const fila = await AutorModel.findByPk(id);
  if (!fila) return false;
  await fila.destroy();
  return true;
}
```

Hacé lo mismo con **`libros.repository.ts`** y **`prestamos.repository.ts`**. Todo lo que necesitás está en el README, sección "Sequelize en cinco líneas":

| En memoria | Con Sequelize |
|---|---|
| `find` | `findByPk(id)` |
| `filter` | `findAll({ where: { ... } })` |
| `filter(...).length` | `count({ where: { ... } })` |
| `push` | `create(datos)` (el `id` lo pone la base solo) |
| `Object.assign(libro, cambios)` | `fila.update(cambios)` |
| `splice` | `fila.destroy()` |
| `toLowerCase().includes(texto)` | ``{ [Op.iLike]: `%${texto}%` }``. Usá `iLike` y no `like`: en Postgres, `like` distingue mayúsculas. `Op` se importa con `import { Op } from "sequelize";` |
| filtrar + `slice` en `buscar` | `findAndCountAll({ where, limit, offset, order })` |

Cuando termines, **borrá `src/repositories/memoria.ts`**. Si algo todavía lo importa, `npm run build` te lo va a marcar.

**Prueba del paso 7.**

1. Corré `npm run seed` para dejar la base como al principio.
2. Repetí **toda** la tabla de prueba del paso 6. Tiene que dar exactamente lo mismo.
3. Ahora los datos quedan guardados: reiniciá el servidor y hacé `GET /libros/1`. El título tiene que seguir siendo `"Otro"`.
4. Buscá con el buscador de VS Code `models/` dentro de `src/`: solo tiene que aparecer en los archivos de `src/repositories/` (y en `src/db/`, que ya venía hecho).

---

## Entrega

- [ ] `docs/openapi.yaml` con los 12 endpoints y los 9 schemas. `/docs` carga sin errores.
- [ ] `src/types/`: `autor.ts`, `libro.ts`, `prestamo.ts`.
- [ ] `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`: un archivo por recurso (autores, libros, préstamos), más `controllers/validaciones.ts`.
- [ ] Los repositories usan Sequelize y ya no existe `memoria.ts`.
- [ ] La tabla de prueba del paso 6 da todo lo esperado.
- [ ] `npm run build` termina sin errores.
