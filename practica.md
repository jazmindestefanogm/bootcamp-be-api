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

1. **Contrato.** Lo escribís en `docs/openapi.yaml` antes de tocar código, y lo mirás renderizado en `http://localhost:3000/docs` (Swagger UI).
2. **Código.** Tipos → repositorio → controlador → ruta.
3. **Prueba.** Desde el botón **Try it out** de Swagger, verificás que la respuesta real es exactamente la que dice el contrato. Si no coincide, algo está mal: o el código o el contrato.

**Lo que no vamos a hacer hoy:** middlewares propios, logs, tests, autenticación ni capa de servicios. Solo arquitectura y documentación.

**Lo que sí vas a tener al final:** los siete tipos de endpoint que existen en casi cualquier API.

| Tipo | Lo aprendés en |
|---|---|
| GET lista | `GET /autores` |
| GET por id | `GET /autores/{id}` |
| GET con búsqueda, filtros y paginación | `GET /libros?titulo=&disponible=&autor_id=&pagina=&limite=` |
| POST | `POST /libros` |
| PATCH | `PATCH /libros/{id}` |
| PUT | `PUT /libros/{id}` |
| DELETE | `DELETE /libros/{id}` y `DELETE /autores/{id}` |

---

## Ejercicio 1 · Levantar el proyecto y conocer la base

📖 Teoría: 0.1 Cliente y servidor · 4.3 El servidor mínimo · 1.9 Del DER a los recursos · 5.8 ORM: hablar con la base sin escribir SQL

**a)** Cloná el repositorio `biblioteca-api` y seguí el README: `npm install`, `npm run seed`, `npm run dev`. Entrá a `http://localhost:3000` y confirmá que responde. Después entrá a `http://localhost:3000/docs`: es Swagger UI mostrando `docs/openapi.yaml`, que por ahora está vacío. Ahí va a ir apareciendo tu contrato a medida que lo escribas.

**b)** Abrí `docs/DER.md`. Con el diagrama a la vista, respondé:
- ¿Cuántas tablas hay y cómo se relacionan?
- ¿Qué columna de `libros` es clave foránea y a qué apunta?
- ¿Qué significa que `fecha_devolucion` acepte `NULL`?

**c)** Abrí `biblioteca.sqlite` con un visor (SQLite Viewer en VS Code, o DB Browser for SQLite). Anotá cuántos libros tienen `disponible = false` y qué préstamos tienen `fecha_devolucion` en `NULL`. ¿Coinciden?

**d)** Leé `src/models/Libro.ts` y `src/models/index.ts`. ¿Qué nombre tiene la relación cuando pedís el autor desde un libro (`as: ...`)?

**e)** Leé la sección "Sequelize en cinco líneas" del README. Esas funciones son todo lo que vas a necesitar hoy.

---

## Ejercicio 2 · Diseñar las rutas

📖 Teoría: 0.2 Anatomía de un pedido HTTP · 1.3 Paso 2: aplicar el estilo REST · 1.4 Paso 3: relaciones entre recursos · 1.5 Paso 4: filtros, orden y paginación con query params · 1.6 Paso 5: acciones que no son CRUD · 1.7 Convenciones de nombres · 1.9 Del DER a los recursos · 1.10 Path params, query params y body: dónde viaja cada dato

Todavía sin código ni contrato. Solo papel, o un archivo `docs/RUTAS.md`. Acá se decide la forma de toda la API; lo que quede mal diseñado ahora se arrastra hasta el final.

**a)** A partir del DER, listá los **recursos** de la API y la URL base de cada uno.

**b)** Armá la tabla completa de endpoints para todo esto. Una fila por endpoint, con las columnas `Verbo | Ruta | Qué hace | Status de éxito | Errores posibles`:

- Listar y ver un autor.
- Borrar un autor.
- Ver un libro.
- Buscar libros por parte del título, filtrar por disponibilidad y por autor, y pedir los resultados de a páginas.
- Crear, modificar parcialmente, reemplazar y borrar un libro.
- Listar préstamos, solo los activos si se pide.
- Registrar un préstamo.
- Registrar la devolución de un préstamo.

**c)** Para cada dato que la API recibe, decidí **dónde viaja** y justificalo en una palabra:

| Dato | ¿Path param, query param o body? | Por qué |
|---|---|---|
| El id del libro que quiero ver | | |
| El texto a buscar en el título | | |
| Si quiero solo los disponibles | | |
| El número de página | | |
| El título de un libro nuevo | | |
| El id del libro que quiero prestar | | |
| La fecha en que devolvieron un préstamo | | |
| El id del préstamo que quiero cerrar | | |

**d)** Estas rutas están mal diseñadas. Decí qué regla rompe cada una y escribí la versión correcta:

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

**e)** Comparalo con un compañero. Donde no coincidan, discutan cuál es la correcta y por qué. Si las dos son válidas, es una decisión de diseño: anoten cuál eligen.

Esta tabla es el mapa de todo lo que sigue. Los ejercicios 3 a 12 van llenando el contrato y el código de cada fila.

**Preguntas rápidas**
- `GET /libros/5` y `GET /libros?id=5` devuelven lo mismo. ¿Por qué la primera es correcta y la segunda no?
- `GET /autores/2/libros` y `GET /libros?autor_id=2` también devuelven lo mismo. ¿Acá cuál es la correcta? ¿Cambia la respuesta respecto de la pregunta anterior?
- Un query param nunca es obligatorio. ¿Por qué? ¿Qué pasa con un path param?
- ¿Por qué el body no viaja en un `GET`?

---

## Ejercicio 3 · Contrato de autores

📖 Teoría: 1.2 Paso 1: identificar recursos · 1.3 Paso 2: aplicar el estilo REST · 2.2 Qué tiene que definir el contrato de un endpoint · 2.3 OpenAPI / Swagger: el estándar · 2.6 Anatomía de un documento OpenAPI · 2.7 Schemas: la forma de los datos

En `docs/openapi.yaml`, usando la plantilla comentada que ya está ahí, escribí el contrato de:

- `GET /autores`
- `GET /autores/{id}`

**a)** Primero el schema `Autor` en `components.schemas`, con un `example` real sacado del seed.

**b)** Después los dos `paths`. Para cada uno: parámetros, respuesta exitosa apuntando al schema con `$ref`, y todos los errores posibles con su status y el schema `Error`.

**c)** Guardá, recargá `/docs` y revisá que Swagger lo muestre sin errores. Si hay un error de sintaxis YAML, la página lo dice arriba.

**Preguntas rápidas**
- ¿Qué pasa si `GET /autores` no encuentra ningún autor? ¿Es un error?
- ¿Qué devolvés si piden `GET /autores/abc`? ¿Es 400 o 404? Elegí y dejalo escrito en el contrato.

---

## Ejercicio 4 · Primer flujo completo: autores

📖 Teoría: 3.4 Interfaces: la forma de un objeto · 3.10 `async` y `Promise<T>` · 5.3 Cómo fluye un pedido en MVC · 5.5 El código, capa por capa · 5.9 La capa de repositorios · 4.5 Leer datos del pedido · 4.6 Responder · 4.11 Routers

Implementá los dos endpoints del ejercicio 3, en este orden:

**a)** `src/types/autor.ts`: la `interface Autor`. Tiene que coincidir con la tabla del DER y con el schema del contrato.

**b)** `src/repositories/autores.repository.ts`: dos funciones.
- `obtenerTodos(): Promise<Autor[]>`
- `obtenerPorId(id: number): Promise<Autor | null>`

Es el **único archivo que importa de `models/`**. Convertí las instancias de Sequelize a objetos planos con `toJSON()` antes de devolverlas.

**c)** `src/controllers/autores.controller.ts`: dos funciones que reciben `req` y `res`. Leen params, llaman al repositorio, responden según el contrato. **No importan nada de `models/`.**

**d)** `src/routes/autores.routes.ts`: un `Router` con las dos rutas. Montalo en `server.ts` con `app.use("/autores", ...)`.

**e)** Probá los dos endpoints y el 404 desde Swagger con **Try it out**. Compará la respuesta real con el ejemplo del contrato, campo por campo.

**Preguntas rápidas**
- `req.params.id` es un string. ¿En qué capa lo convertís a número? ¿Por qué ahí y no en el repositorio?
- Si mañana cambian SQLite por PostgreSQL, ¿cuál de tus cuatro archivos cambia?

---

## Ejercicio 5 · Contrato de la búsqueda de libros

📖 Teoría: 1.5 Paso 4: filtros, orden y paginación con query params · 1.7 Convenciones de nombres · 1.8 Forma de las respuestas · 2.7 Schemas: la forma de los datos

Escribí el contrato de:

- `GET /libros/{id}`
- `GET /libros`, con **todos** estos query params, todos opcionales y combinables:

| Query param | Tipo | Qué hace |
|---|---|---|
| `titulo` | string | Búsqueda parcial, sin distinguir mayúsculas. `?titulo=ray` encuentra "Rayuela". |
| `disponible` | boolean | Filtro exacto. |
| `autor_id` | integer | Filtro exacto. |
| `pagina` | integer, default 1 | Qué página devolver. |
| `limite` | integer, default 10, máximo 50 | Cuántos libros por página. |

Como hay paginación, la respuesta de la lista **no es un array**. Definí un schema `PaginaDeLibros`:

```json
{ "datos": [ ...libros... ], "total": 6, "pagina": 1, "limite": 10 }
```

Decidí y documentá: ¿el libro se devuelve con `autor_id` solo, o con el autor completo adentro? Cualquiera es válida, pero tiene que estar escrito.

**Preguntas rápidas**
- ¿Qué devuelve `GET /libros?disponible=banana`? ¿Y `?pagina=0`? ¿Y `?limite=500`? Cada caso tiene que estar en el contrato: o se rechaza con 400, o se corrige en silencio. Elegí y escribilo.
- ¿Por qué `total` es la cantidad de libros que cumplen el filtro y no la cantidad de libros de la página?

---

## Ejercicio 6 · Implementar la búsqueda

📖 Teoría: 3.6 Tipos derivados · 3.9 Genéricos · 4.12 Convertir lo que llega por query string · 5.8 ORM · 5.5 El código, capa por capa

**a)** `src/types/libro.ts`: `interface Libro`, `interface FiltrosLibro` con los tres filtros opcionales, `interface Paginacion` con `pagina` y `limite`, e `interface PaginaDe<T>` genérica con `datos: T[]`, `total`, `pagina` y `limite`.

**b)** Repositorio: `obtenerPorId(id)` y `buscar(filtros: FiltrosLibro, paginacion: Paginacion): Promise<PaginaDe<Libro>>`. Armá el `where` agregando solo los filtros que vienen definidos. Para `titulo` usá `Op.like`. Para la paginación, `findAndCountAll` con `limit` y `offset`.

**c)** Controlador: todo lo que llega por `req.query` es string. Convertí `disponible` a booleano, `autor_id`, `pagina` y `limite` a número, y aplicá los defaults y el máximo que definiste en el contrato **antes** de llamar al repositorio.

**d)** Rutas y montaje. Probá desde Swagger: sin filtros, `?titulo=el`, `?disponible=true&autor_id=2`, `?pagina=2&limite=2`, y los casos raros de la pregunta rápida del ejercicio 5.

**e)** Si en el contrato decidiste incluir el autor, usá `include` con el alias `"autor"` en el repositorio. Ajustá la interface o el schema para que coincidan con el JSON real.

**Pregunta rápida**
- La conversión de `"true"` a `true` y de `"2"` a `2`, ¿es responsabilidad del controlador o del repositorio? ¿Qué pasaría si un día el mismo repositorio lo usa un script que no viene de HTTP?

---

## Ejercicio 7 · Contrato de `POST /libros`

📖 Teoría: 2.2 Qué tiene que definir el contrato de un endpoint · 0.4 Status codes que vas a usar siempre

Este es el contrato más importante del día. Tiene que definir:

- Un schema `NuevoLibro` para el `requestBody`: propiedades con tipo, lista `required`, y reglas con `minLength`, `minimum`, `maximum`. `id` y `disponible` **no** van: los pone el servidor.
- La respuesta **201** con el schema `Libro` completo.
- **Todos** los errores: falta un campo, un campo tiene el tipo equivocado, `anio` fuera de rango, `autor_id` no existe. Cada uno con su `example` de mensaje.

Intercambiá el contrato con un compañero. Cada uno busca un caso que el del otro **no cubre** y lo anota. Corregí el tuyo.

Cuando lo veas en Swagger, fijate que el formulario de **Try it out** ya te arma el body de ejemplo a partir de tu schema.

---

## Ejercicio 8 · Implementar `POST /libros`

📖 Teoría: 3.6 Tipos derivados · 3.7 `any` y `unknown` · 4.7 Ejemplo completo: GET uno y POST · 4.8 TypeScript y el body

**a)** En `types/libro.ts` agregá `type NuevoLibro = Omit<Libro, "id" | "disponible">`.

**b)** Repositorio: `crear(datos: NuevoLibro): Promise<Libro>`.

**c)** Controlador: `req.body` es `any`. Validá con `typeof` cada campo **antes** de armar un `NuevoLibro`. Para el error de autor inexistente, usá el repositorio de autores que ya tenés.

**d)** Probá cada error que documentaste desde Swagger, editando el body de ejemplo. Una prueba por error. Después el caso feliz, y verificá el libro nuevo con `GET /libros/{id}`.

**Preguntas rápidas**
- ¿Por qué el body se tipa como `NuevoLibro` y no como `Libro`?
- ¿El controlador de libros importó el repositorio de autores o el modelo `Autor`? ¿Cuál es la respuesta correcta y por qué?

---

## Ejercicio 9 · PATCH y PUT: la misma ruta, dos significados

📖 Teoría: 0.3 Los verbos HTTP · 0.5 PUT y PATCH no son lo mismo · 3.6 Tipos derivados · 4.8 TypeScript y el body

Contrato primero, después código, después prueba, para los dos juntos:

- `PATCH /libros/{id}`: modifica **algunos** campos. Body con schema `EditarLibro`, donde todo es opcional pero tiene que venir al menos un campo. En código, `type EditarLibro = Partial<NuevoLibro>`.
- `PUT /libros/{id}`: **reemplaza** el libro. Body con schema `NuevoLibro`, todos los campos obligatorios.

Los dos devuelven 200 con el libro resultante, 404 si no existe, y 400 si el body está mal. Los dos comparten la validación de tipos con `POST`: si te encontrás copiando y pegando, extraela a una función y usala en los tres lugares.

**La prueba que importa.** Mandá exactamente `{ "titulo": "Otro" }` a los dos endpoints, sobre el mismo libro. Anotá:
- ¿Qué status devolvió cada uno?
- ¿Qué quedó en `anio` y `autor_id` después de cada uno?
- ¿Cuál de los dos usarías desde un formulario que solo edita el título? ¿Y desde uno que edita la ficha completa?

---

## Ejercicio 10 · Los dos DELETE

📖 Teoría: 0.4 Status codes que vas a usar siempre · 6.1 Buenas prácticas básicas

**a)** `DELETE /libros/{id}`: 204 sin body, 404 si no existe. Es el endpoint más simple del día.

**b)** `DELETE /autores/{id}`: igual, pero con una regla: **no se puede borrar un autor que tiene libros**. En ese caso, **409 Conflict** con un mensaje que diga cuántos libros tiene. Al repositorio de libros le vas a tener que agregar una función para contar los libros de un autor.

Contrato primero. En el 409, escribí un `example` con el mensaje real.

**Preguntas rápidas**
- ¿Por qué el 409 se decide en el controlador de autores y no en el repositorio?
- La alternativa a prohibir el borrado sería borrar el autor **y todos sus libros** en cascada. ¿Qué status y qué contrato tendría eso? ¿Por qué elegimos prohibirlo?

---

## Ejercicio 11 · Contrato de préstamos

📖 Teoría: 1.6 Paso 5: acciones que no son CRUD · 0.4 Status codes que vas a usar siempre

Escribí el contrato de:

- `GET /prestamos`, con el filtro opcional `?activos=true` (solo los que tienen `fecha_devolucion` en null).
- `POST /prestamos` con body `libro_id` y `socio_nombre`. Regla: si el libro no está disponible, **409 Conflict**. Efecto secundario: el libro pasa a `disponible: false`.
- `PATCH /prestamos/{id}` con body `fecha_devolucion`. Es la devolución. Efecto secundario: el libro vuelve a `disponible: true`. 409 si el préstamo ya estaba devuelto.

Documentá los efectos secundarios en la `description` de cada endpoint. Un cliente que lee el contrato tiene que saber que después de un `POST /prestamos` el libro cambia.

**Pregunta rápida**
- La teoría muestra dos formas de modelar la devolución: `PATCH /prestamos/{id}` o `POST /prestamos/{id}/devolucion`. Usamos la primera. ¿En qué caso elegirías la segunda?

---

## Ejercicio 12 · Implementar préstamos

📖 Teoría: 5.5 El código, capa por capa · 6.1 Buenas prácticas básicas

**a)** `types/prestamo.ts` con `interface Prestamo` (`fecha_devolucion: string | null`) y `NuevoPrestamo`.

**b)** Repositorio de préstamos: `obtenerTodos(soloActivos)`, `obtenerPorId`, `crear`, `registrarDevolucion`. Al repositorio de libros agregale `cambiarDisponibilidad(id, disponible)`.

**c)** Controlador. El `POST` coordina: busca el libro, verifica disponibilidad, crea el préstamo, marca el libro. Usá **early return** para los errores: primero el 404, después el 409, y al final el camino feliz sin indentación.

**d)** Probá la secuencia completa desde Swagger: prestar un libro disponible (201), intentar prestarlo de nuevo (409), devolverlo (200), intentar devolverlo otra vez (409), y verificar con `GET /libros/{id}` que volvió a estar disponible.

**Pregunta rápida**
- El controlador de préstamos ahora llama a dos repositorios y tiene dos reglas de negocio. ¿Qué capa de la teoría se encarga de eso cuando el proyecto crece?

---

## Entrega

El repositorio con:

1. `docs/openapi.yaml` completo: los once endpoints, todos sus errores, y `/docs` cargando sin errores.
2. Código con la estructura `types / repositories / controllers / routes`, un archivo por recurso en cada carpeta.
3. `npm run build` sin errores, con `strict: true` y cero `any` fuera de la línea donde leés `req.body`.

**Rúbrica de autoevaluación**

| Criterio | ✅ |
|---|---|
| Cada endpoint tiene su contrato escrito antes que su código | |
| Las URLs siguen REST: sustantivos, plural, sin verbos, filtros por query param | |
| Cada respuesta coincide con el contrato: mismo status, mismos campos, mismos tipos | |
| Todos los errores tienen la forma `{ "error": "..." }` | |
| El contrato cubre los errores de tipo, de campo faltante, de recurso inexistente y de conflicto | |
| La búsqueda combina filtros y pagina, y `total` es el total filtrado | |
| PATCH acepta parciales y PUT exige el objeto completo | |
| Solo los repositorios importan de `models/` | |
| Los repositorios no conocen `req` ni `res` | |
| Las rutas no tienen lógica | |
| Las interfaces de `types/` coinciden con el DER y con los schemas de OpenAPI | |
| La validación de body está en una función, no copiada en POST, PUT y PATCH | |
| Cada endpoint se puede probar desde Swagger y la respuesta real coincide con el ejemplo documentado | |
| Compila con `strict: true` | |
