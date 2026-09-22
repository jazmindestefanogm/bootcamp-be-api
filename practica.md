# De la base de datos a la API — Práctica

Proyecto: **biblioteca-api**. Ya tiene la base SQLite, el DER y los modelos de Sequelize. Vos escribís `types/`, `repositories/`, `controllers/`, `routes/` y el contrato en `docs/openapi.yaml`.

Cada endpoint se hace en este orden: **contrato → código → prueba en Swagger** (`http://localhost:3000/docs`).

Reglas fijas para toda la API:

- Errores siempre con la forma `{ "error": "mensaje" }`.
- Id no numérico → 400. Id inexistente → 404. Query param inválido → 400.
- Solo los repositorios importan de `models/`. Los controladores no.

---

## 1 · Levantar el proyecto

📖 4.3 · 5.8

```bash
npm install
npm run seed
npm run dev
```

Verificá que respondan `http://localhost:3000` y `http://localhost:3000/docs`. Leé `docs/DER.md` y la sección "Sequelize en cinco líneas" del README.

---

## 2 · Diseñar las rutas

📖 1.3 · 1.5 · 1.6 · 1.7 · 1.10

En `docs/RUTAS.md`:

**a)** Tabla `Verbo | Ruta | Status OK | Errores` para estas operaciones:

1. Listar autores
2. Ver un autor
3. Borrar un autor
4. Ver un libro
5. Buscar libros por título parcial, disponibilidad y autor, con paginación (un solo endpoint)
6. Crear un libro
7. Modificar parcialmente un libro
8. Reemplazar un libro
9. Borrar un libro
10. Listar préstamos, con opción de solo activos
11. Registrar un préstamo
12. Registrar una devolución

**b)** Para cada dato, indicá si viaja como `path`, `query` o `body`:

| Dato | ¿Dónde? |
|---|---|
| Id del libro a ver | |
| Texto a buscar en el título | |
| Solo disponibles | |
| Número de página | |
| Título de un libro nuevo | |
| Id del libro a prestar | |
| Fecha de devolución | |
| Id del préstamo a cerrar | |

**c)** Corregí estas rutas:

- `GET /obtenerLibros`
- `GET /libros/buscar?titulo=ray`
- `POST /libros/5/borrar`
- `GET /Libro/5`
- `GET /libros?id=5`
- `GET /libros/disponibles`
- `PUT /prestamos/12/devolver`
- `GET /autores/2/libros/5/prestamos/12`
- `DELETE /libros?id=5`
- `POST /libros/5` (para editar)

---

## 3 · Autores: GET lista y GET por id

📖 2.6 · 2.7 · 3.4 · 5.5 · 5.9 · 4.11

**Contrato.** Schema `Autor` (`id`, `nombre`, `nacionalidad`). `GET /autores` → 200. `GET /autores/{id}` → 200, 400, 404.

**Código.**

- `types/autor.ts`: `interface Autor`.
- `repositories/autores.repository.ts`: `obtenerTodos()`, `obtenerPorId(id)`. Devolver `toJSON()`, nunca instancias.
- `controllers/autores.controller.ts`: `listar`, `obtenerUno`.
- `routes/autores.routes.ts` montado en `/autores`.

**Prueba.** `GET /autores` → 5 autores. `/autores/1` → 200. `/autores/999` → 404. `/autores/abc` → 400.

---

## 4 · Libros: GET por id y búsqueda paginada

📖 1.5 · 3.9 · 4.12 · 5.8

**Contrato.** Schemas `Libro` y `PaginaDeLibros` (`datos`, `total`, `pagina`, `limite`). `GET /libros/{id}`. `GET /libros` con query params opcionales:

| Param | Tipo | Regla |
|---|---|---|
| `titulo` | string | búsqueda parcial, sin distinguir mayúsculas |
| `disponible` | boolean | |
| `autor_id` | integer | |
| `pagina` | integer | default 1, mínimo 1 |
| `limite` | integer | default 10, mínimo 1, máximo 50 (si es mayor, se usa 50) |

**Código.**

- `types/libro.ts`: `Libro`, `FiltrosLibro`, `Paginacion`, `PaginaDe<T>`.
- Repositorio: `obtenerPorId(id)`, `buscar(filtros, paginacion)` con `Op.like`, `findAndCountAll`, `limit`, `offset`, `order`.
- Controlador: convertir y validar cada query param antes de llamar al repositorio.
- Router en `/libros`.

**Prueba.**

| Pedido | Esperado |
|---|---|
| `GET /libros` | `total: 6` |
| `?titulo=EL` | `total: 2` |
| `?disponible=true&autor_id=2` | `total: 1` |
| `?pagina=2&limite=2` | 2 libros, `pagina: 2` |
| `?limite=500` | `limite: 50` |
| `?disponible=banana` · `?pagina=0` | 400 |

---

## 5 · Libros: POST

📖 2.2 · 3.6 · 3.7 · 4.8

**Contrato.** Schema `NuevoLibro`: `titulo` (1 a 200 caracteres), `anio` (1000 a 2100), `autor_id`. Los tres obligatorios. `POST /libros` → 201 con `Libro`; 400 por campo faltante, tipo incorrecto o fuera de rango; 404 si `autor_id` no existe.

**Código.**

- `type NuevoLibro = Omit<Libro, "id" | "disponible">`.
- Repositorio: `crear(datos)`.
- Controlador: validar body con `typeof`, verificar el autor con el repositorio de autores, crear, 201.

**Prueba.** Un pedido por cada fila de errores del contrato, más el caso feliz. El libro nuevo tiene `id: 7` y `disponible: true`.

---

## 6 · Libros: PATCH y PUT

📖 0.5 · 3.6 · 6.1

**Contrato.** Schema `EditarLibro`: igual a `NuevoLibro` sin `required`. `PATCH /libros/{id}` con `EditarLibro` (400 si el body está vacío). `PUT /libros/{id}` con `NuevoLibro`. Ambos: 200, 400, 404.

**Código.**

- `type EditarLibro = Partial<NuevoLibro>`.
- Repositorio: `actualizar(id, cambios)` → `Libro | null`.
- Extraer la validación de campos de libro a una función y usarla en POST, PUT y PATCH.
- Controlador: `modificar`, `reemplazar`.

**Prueba.** Sobre el libro 1, body `{ "titulo": "Otro" }`: PATCH → 200 y `anio` sigue en 1963. PUT → 400. PATCH con `{}` → 400.

---

## 7 · DELETE de libros y de autores

📖 0.4

**Contrato.** `DELETE /libros/{id}` → 204, 400, 404. `DELETE /autores/{id}` → 204, 400, 404, y **409 si el autor tiene libros**.

**Código.**

- Repositorio de libros: `eliminar(id)` → `boolean`, `contarPorAutor(autorId)` → `number`.
- Repositorio de autores: `eliminar(id)`.
- Controladores: `eliminar` en ambos. El de autores cuenta los libros antes de borrar.

**Prueba.** `DELETE /libros/7` → 204. `DELETE /autores/1` → 409. `DELETE /autores/5` → 204.

---

## 8 · Préstamos

📖 1.6 · 5.5 · 6.1

**Contrato.** Schemas `Prestamo` (`fecha_devolucion` nullable), `NuevoPrestamo` (`libro_id`, `socio_nombre`), `Devolucion` (`fecha_devolucion`).

- `GET /prestamos?activos=true` → 200.
- `POST /prestamos` → 201; 400; 404 si el libro no existe; **409 si no está disponible**. Efecto: el libro pasa a `disponible: false`. Escribilo en la `description`.
- `PATCH /prestamos/{id}` con `Devolucion` → 200; 400; 404; **409 si ya estaba devuelto**. Efecto: el libro vuelve a `disponible: true`.

**Código.**

- `types/prestamo.ts`: `Prestamo`, `NuevoPrestamo`, `Devolucion`.
- Repositorio de préstamos: `obtenerTodos(soloActivos)`, `obtenerPorId(id)`, `crear(datos, fechaPrestamo)`, `registrarDevolucion(id, fecha)`.
- Repositorio de libros: `cambiarDisponibilidad(id, disponible)`.
- Controlador: `listar`, `crear`, `devolver`. Errores primero con `return`, caso feliz al final.
- Router en `/prestamos`.

**Prueba.** Sobre el libro 3, en orden: prestar → 201 · `GET /libros/3` → `disponible: false` · prestar de nuevo → 409 · devolver → 200 · `GET /libros/3` → `disponible: true` · devolver de nuevo → 409.

---

## Entrega

- `docs/RUTAS.md`
- `docs/openapi.yaml` con los doce endpoints. `/docs` carga sin errores.
- Código en `types / repositories / controllers / routes`, un archivo por recurso.
- `npm run build` sin errores.
