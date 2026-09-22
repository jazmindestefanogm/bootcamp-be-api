# Anexo A · Cheatsheet

## Express

```ts
import express, { Request, Response, Router } from "express";

const app = express();
app.use(express.json());                     // parsear JSON del body — ANTES de las rutas

app.get(ruta, handler);                      // leer
app.post(ruta, handler);                     // crear
app.put(ruta, handler);                      // reemplazar
app.patch(ruta, handler);                    // modificar
app.delete(ruta, handler);                   // borrar
app.use(prefijo, router);                    // montar un router bajo un prefijo

const router = Router();                     // un router por recurso
router.get("/", handler);                    // ruta relativa al prefijo
router.get("/:id", handler);

req.params.id       // parámetro de ruta      → string
req.query.campo     // query param            → string | undefined
req.body            // body JSON              → any (validar!)

res.json(obj)                     // 200 + JSON
res.status(201).json(obj)         // status + JSON
res.status(204).send()            // sin body
return res.status(404).json(...)  // siempre return después de responder un error

(req: Request, res: Response) => {}          // tipo de un handler
```

## TypeScript

```ts
interface Producto { id: number; nombre: string; stock: number; descripcion: string | null }
type NuevoProducto = Omit<Producto, "id">;              // quitar campos      → body de POST y PUT
type EditarProducto = Partial<NuevoProducto>;           // todos opcionales   → body de PATCH
type ProductoResumen = Pick<Producto, "id" | "nombre">; // elegir campos
type Estado = "pendiente" | "enviado";                  // unión de literales → enum
type Resultado = Producto | null;                       // unión
interface PaginaDe<T> { datos: T[]; total: number; pagina: number; limite: number } // genérico

function f(id: number): Producto | null { ... }         // parámetros y retorno
async function g(id: number): Promise<Producto | null> { ... } // async → Promise<T>
const x: Record<Estado, string> = { pendiente: "...", enviado: "..." }; // claves fijas

Number("3")            // 3        Number("abc") → NaN (chequear con Number.isNaN)
req.query.x === "true" // booleano desde string (NUNCA Boolean("false"))
```

## Sequelize

```ts
import { Op } from "sequelize";

await Modelo.findAll({ where: { campo: valor } });                // SELECT ... WHERE
await Modelo.findByPk(id);                                         // → instancia | null
await Modelo.findAll({ include: { model: Otro, as: "alias" } });   // JOIN
await Modelo.findAndCountAll({ where, limit, offset, order: [["id", "ASC"]] }); // → { rows, count }
await Modelo.count({ where });                                     // → number
await Modelo.create(datos);                                        // INSERT → instancia
await instancia.update(cambios);                                   // UPDATE
await instancia.destroy();                                         // DELETE
instancia.toJSON();                                                // → objeto plano

{ campo: { [Op.like]: `%${texto}%` } }    // LIKE (en Postgres distingue mayúsculas)
{ campo: { [Op.iLike]: `%${texto}%` } }   // ILIKE (no distingue mayúsculas)
{ campo: { [Op.gte]: 10 } }               // >=     Op.gt, Op.lt, Op.lte, Op.ne
{ campo: null }                           // IS NULL
{ campo: { [Op.ne]: null } }              // IS NOT NULL
offset: (pagina - 1) * limite             // paginación
```

## OpenAPI

```yaml
paths:
  /recurso/{id}:
    get:                                       # get | post | put | patch | delete
      summary: Una línea
      tags: [Recurso]
      parameters:
        - { name: id, in: path, required: true, schema: { type: integer } }
        - { name: q,  in: query, required: false, schema: { type: string } }
      requestBody:                             # solo post / put / patch
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/NuevoRecurso" }
      responses:
        "200":                                 # status entre comillas
          description: Texto
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Recurso" }
        "204": { description: Sin contenido }  # sin content
        "404":
          description: No encontrado
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Error" }
              example: { error: Recurso no encontrado }

components:
  schemas:
    Recurso:
      type: object
      required: [id, nombre]                   # lista aparte
      properties:
        id:     { type: integer, example: 3 }
        nombre: { type: string,  example: Teclado, minLength: 1, maxLength: 100 }
        precio: { type: number,  minimum: 0 }
        estado: { type: string,  enum: [pendiente, enviado] }
        fecha:  { type: string,  format: date, nullable: true }
        items:
          type: array
          items: { $ref: "#/components/schemas/Otro" }
```

Tipos: `integer` · `number` · `string` · `boolean` · `array` · `object`
Reglas: `minLength` · `maxLength` · `minimum` · `maximum` · `enum` · `format` · `nullable` · `default`
