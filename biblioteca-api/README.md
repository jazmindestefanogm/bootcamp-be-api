# API Biblioteca · Starter

Proyecto base para la clase **De la base de datos a la API**. Trae la base de datos y los modelos ya hechos. Vos vas a escribir el contrato, los repositorios, los controladores y las rutas.

## Requisitos

- Node.js 18 o superior
- Un cliente HTTP: Thunder Client, REST Client, Postman o Insomnia

## Instalar y correr

```bash
npm install
npm run seed     # crea biblioteca.sqlite y carga datos de ejemplo
npm run dev      # levanta el servidor en http://localhost:3000
```

Si entrás a `http://localhost:3000` y ves `{ "mensaje": "API Biblioteca funcionando" }`, está todo bien.

En `http://localhost:3000/docs` está **Swagger UI** mostrando el contrato de `docs/openapi.yaml`. Arranca vacío. Cada vez que guardás el YAML, recargá la página: no hace falta reiniciar el servidor. Desde ahí también podés probar los endpoints con **Try it out**.

`npm run seed` se puede correr las veces que quieras: borra todo y vuelve a cargar los datos de ejemplo.

## Qué hay adentro

```
src/
├── server.ts            ← arranca Express. Acá montás tus routers.
├── docs.ts              ← YA HECHO. Sirve docs/openapi.yaml en /docs con Swagger UI.
├── db/
│   ├── connection.ts    ← conexión a SQLite (archivo biblioteca.sqlite)
│   └── seed.ts          ← crea las tablas y carga datos de ejemplo
├── models/              ← YA HECHO. Modelos de Sequelize = tablas de la DB.
│   ├── Autor.ts
│   ├── Libro.ts
│   ├── Prestamo.ts
│   └── index.ts         ← relaciones. Importá los modelos siempre desde acá.
├── types/               ← VOS. Interfaces del dominio y tipos derivados.
├── repositories/        ← VOS. Acceso a datos. El único lugar que usa Sequelize.
├── controllers/         ← VOS. HTTP: lee req, valida, llama al repositorio, responde.
└── routes/              ← VOS. Mapa verbo + ruta → controlador.

docs/
├── DER.md               ← YA HECHO. Diagrama entidad-relación de la base.
└── openapi.yaml         ← VOS. El contrato de la API en OpenAPI. Se escribe ANTES del código.
```

## Base de datos

```
autores              libros                     prestamos
──────────           ──────────────             ────────────────
id                   id                         id
nombre               titulo                     libro_id
nacionalidad         anio                       socio_nombre
                     autor_id  → autores.id     fecha_prestamo
                     disponible                 fecha_devolucion  (null = no devuelto)
```

El diagrama entidad-relación completo, con cardinalidades y claves, está en `docs/DER.md`.

Datos de ejemplo: 5 autores (el último sin libros), 6 libros (2 prestados), 3 préstamos (2 activos).

Para mirar la base directamente podés abrir `biblioteca.sqlite` con la extensión **SQLite Viewer** de VS Code, o con **DB Browser for SQLite**.

## Sequelize en cinco líneas

Lo que vas a usar en los repositorios:

```ts
import { Op } from "sequelize";
import { Libro, Autor } from "../models/index.js";

await Libro.findAll();                                  // SELECT * FROM libros
await Libro.findAll({ where: { disponible: true } });   // ... WHERE disponible = 1
await Libro.findByPk(3);                                // ... WHERE id = 3   → Libro | null
await Libro.findAll({ include: { model: Autor, as: "autor" } }); // JOIN con autores
await Libro.create({ titulo: "...", anio: 1963, autor_id: 7 });  // INSERT
await libro.update({ disponible: false });              // UPDATE de una instancia
await libro.destroy();                                  // DELETE de una instancia
await Libro.count({ where: { autor_id: 2 } });          // SELECT COUNT(*) ...
```

Para la búsqueda con paginación:

```ts
// Búsqueda parcial: LIKE '%ray%'. En SQLite, LIKE no distingue mayúsculas.
const where: Record<string, unknown> = {};
if (filtros.titulo) where.titulo = { [Op.like]: `%${filtros.titulo}%` };
if (filtros.disponible !== undefined) where.disponible = filtros.disponible;

// Devuelve las filas de la página Y el total de filas que cumplen el where.
const { rows, count } = await Libro.findAndCountAll({
  where,
  limit: limite,                    // cuántas filas
  offset: (pagina - 1) * limite,    // cuántas saltar
  order: [["id", "ASC"]],           // siempre ordená al paginar, o las páginas se mezclan
});
```

Cada instancia tiene los campos como propiedades (`libro.titulo`) y `libro.toJSON()` para convertirla a un objeto plano. `findAndCountAll` devuelve `rows` (instancias) y `count` (número).

## OpenAPI en cinco líneas

Lo que vas a usar en `docs/openapi.yaml`:

```yaml
paths:
  /libros/{id}:                          # la ruta; los parámetros van entre llaves
    get:                                 # el verbo, en minúscula
      summary: Obtiene un libro por id
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
      responses:
        "200":                           # el status, entre comillas
          description: Libro encontrado
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Libro" }

components:
  schemas:
    Libro:                               # un schema por forma de dato
      type: object
      required: [id, titulo]             # qué campos son obligatorios
      properties:
        id:     { type: integer, example: 3 }
        titulo: { type: string,  example: Rayuela }
```

Un `requestBody` se escribe igual que un `content` de respuesta. Tipos: `integer`, `number`, `string`, `boolean`. Reglas: `minLength`, `maxLength`, `minimum`, `maximum`, `nullable: true`. Un query param es un parámetro con `in: query` y `required: false`.

## Arquitectura esperada

```
Cliente → routes → controllers → repositories → models (Sequelize) → SQLite
```

Reglas:

- Los **controladores** no importan nada de `models/` ni de Sequelize.
- Los **repositorios** no conocen `req` ni `res`. Reciben y devuelven tipos de `types/`.
- Las **rutas** solo mapean. Sin lógica.
