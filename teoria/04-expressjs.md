# Módulo 4 · Express.js

**En este archivo**

- 4.1 ¿Qué es Express?
- 4.2 Crear el proyecto
- 4.3 El servidor mínimo
- 4.4 Anatomía de una ruta
- 4.5 Leer datos del pedido (`req`)
- 4.6 Responder (`res`)
- 4.7 Ejemplo completo: GET uno y POST
- 4.8 TypeScript y el body: la frontera con el mundo exterior
- 4.9 Middleware: funciones que se ejecutan "en el medio"
- 4.10 Probar la API
- 4.11 Routers: agrupar rutas por recurso
- 4.12 Convertir lo que llega por query string

---

## 4.1 · ¿Qué es Express?

**Node.js** te permite ejecutar JavaScript fuera del navegador. Con Node "pelado" podés crear un servidor HTTP, pero es incómodo: hay que parsear URLs a mano, leer el body byte a byte, etc.

**Express** es una librería que hace eso por vos. Te da una forma simple de decir: *"cuando llegue un GET a `/productos`, ejecutá esta función"*.

## 4.2 · Crear el proyecto

Así se arma un proyecto Express con TypeScript desde cero. Si te dan un proyecto ya armado, esto ya está hecho y solo sirve como referencia para entender qué hay en el `package.json`.

```bash
mkdir mi-api && cd mi-api
npm init -y
npm install express
npm install -D typescript tsx @types/node @types/express
npx tsc --init
mkdir src
```

`@types/express` son las definiciones de tipos de Express: gracias a eso TypeScript sabe qué es `req.params`, `res.json()`, etc.

En `package.json`, `"type": "module"` para usar `import` en vez de `require`, y un script `"dev": "tsx watch src/server.ts"`. El `tsconfig.json` es el del módulo 3.

## 4.3 · El servidor mínimo

```ts
import express, { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.use(express.json()); // permite leer JSON del body

app.get("/", (req: Request, res: Response) => {
  res.json({ mensaje: "funcionando" });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
```

Tres cosas pasan acá: se crea la aplicación, se le enseña a leer JSON, se declara una ruta, y se pone a escuchar en un puerto. `app.use(express.json())` es imprescindible: sin eso, `req.body` es `undefined` en todos los POST.

## 4.4 · Anatomía de una ruta

```ts
app.get("/productos/:id", (req: Request, res: Response) => {
  //  │       │              │              └── res: la respuesta que vas a construir
  //  │       │              └── req: todo lo que mandó el cliente
  //  │       └── la ruta; :id es un parámetro
  //  └── el verbo HTTP (get, post, put, patch, delete)
});
```

La función `(req, res) => {}` se llama **handler**. `Request` y `Response` son los tipos que exporta Express; con ellos el editor te autocompleta `req.params`, `res.status`, etc.

Express tiene un método por verbo: `app.get`, `app.post`, `app.put`, `app.patch`, `app.delete`. La misma ruta puede tener varios verbos, cada uno con su handler.

## 4.5 · Leer datos del pedido (`req`)

| Dónde viene el dato | Cómo lo leés | Ejemplo | Tipo en TypeScript |
|---|---|---|---|
| Parámetro de ruta `/productos/:id` | `req.params.id` | `"3"` | `string` |
| Query param `/productos?stock=0` | `req.query.stock` | `"0"` | `string` (o `undefined` si no vino) |
| Body JSON | `req.body` | `{ nombre: "...", precio: 15000 }` | `any` |
| Header | `req.headers["content-type"]` | `"application/json"` | `string` |

**Ojo:** `req.params` y `req.query` son siempre strings, porque vienen de la URL, que es texto. `req.body` es `any` porque Express no puede saber qué mandó el cliente. Las tres cosas hay que **convertirlas y validarlas** antes de usarlas. Ver 4.8 y 4.12.

## 4.6 · Responder (`res`)

```ts
res.json({ id: 3, nombre: "Teclado" });           // 200 con JSON
res.status(201).json(nuevoProducto);              // 201 con JSON
res.status(404).json({ error: "No encontrado" }); // error con JSON
res.status(204).send();                           // sin body
```

`res.status()` fija el código; `res.json()` o `res.send()` envían la respuesta. **Solo podés responder una vez** por pedido; si llamás dos veces a `res.json()`, Express tira error `Cannot set headers after they are sent`. Ese error casi siempre significa que te faltó un `return` después de responder un error.

## 4.7 · Ejemplo completo: GET uno y POST

Con un array en memoria para no depender de nada:

```ts
interface Producto {
  id: number;
  nombre: string;
  precio: number;
}

type NuevoProducto = Omit<Producto, "id">;

let productos: Producto[] = [
  { id: 1, nombre: "Teclado", precio: 15000 },
  { id: 2, nombre: "Mouse", precio: 8000 },
];

app.get("/productos/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const producto = productos.find((p) => p.id === id);

  if (!producto) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  res.json(producto);
});

app.post("/productos", (req: Request, res: Response) => {
  const { nombre, precio } = req.body;

  if (typeof nombre !== "string" || typeof precio !== "number") {
    return res.status(400).json({ error: "nombre (string) y precio (number) son obligatorios" });
  }

  const datos: NuevoProducto = { nombre, precio };
  const nuevo: Producto = { id: productos.length + 1, ...datos };
  productos.push(nuevo);

  res.status(201).json(nuevo);
});
```

Fijate el `return` antes de `res.status(404)`: es para **cortar la ejecución** y no seguir hasta el `res.json(producto)` de abajo. Este patrón se llama *early return* y es la forma estándar de manejar errores en un handler: primero los casos que fallan, cada uno con su `return`, y al final el caso feliz sin indentación.

## 4.8 · TypeScript y el body: la frontera con el mundo exterior

`req.body` es de tipo `any` en Express: el cliente puede mandar **cualquier cosa** y TypeScript no lo puede saber de antemano. Por eso el `POST` de arriba valida con `typeof` **antes** de asignar a `datos: NuevoProducto`. Después de esa línea, todo el código de adentro trabaja con datos tipados y confiables.

Ese es el patrón: **validar en la frontera, confiar hacia adentro**. Todo lo que entra por HTTP (body, params, query) es desconocido; una vez validado, se convierte a tus tipos y no se vuelve a chequear.

Consecuencia práctica: la validación vive **en el handler**, que es la frontera. Las funciones que el handler llama después ya reciben tipos correctos y no tienen que volver a preguntar "¿esto es un string?".

Cuando la misma validación se repite en varios handlers (el POST y el PUT de un mismo recurso validan el mismo body), se extrae a una función que recibe `unknown` y devuelve el tipo validado o una lista de errores. Escribirla una vez, usarla en todos.

## 4.9 · Middleware: funciones que se ejecutan "en el medio"

Un **middleware** es una función que se ejecuta **antes** del handler, para todas las rutas (o algunas). Recibe `req`, `res` y `next`:

```ts
import { Request, Response, NextFunction } from "express";

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next(); // ← sin esto, el pedido queda colgado
});
```

`express.json()` es un middleware: lee el body y lo deja en `req.body`. Otros usos típicos: autenticación, validación, manejo de errores. No hace falta escribir middlewares propios para armar una API básica; sí hace falta entender que `express.json()` es uno y que va **antes** de las rutas.

El orden importa: Express ejecuta las cosas **en el orden en que las declarás**.

## 4.10 · Probar la API

Tres formas, de la más cómoda a la más manual:

**Swagger UI**, si la API sirve su contrato OpenAPI. Cada endpoint tiene un botón *Try it out* que arma el pedido a partir del contrato y muestra la respuesta real al lado de la documentada. Es la mejor forma de verificar que código y contrato coinciden.

**Un cliente HTTP** (Thunder Client, Postman, Insomnia, REST Client):

```
GET    http://localhost:3000/productos
POST   http://localhost:3000/productos
       Body (JSON): { "nombre": "Monitor", "precio": 90000 }
```

**`curl`** desde la terminal:

```bash
curl http://localhost:3000/productos
curl -X POST http://localhost:3000/productos \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Monitor","precio":90000}'
```

Sea cual sea la herramienta, lo que se prueba es lo mismo: **cada caso del contrato**, no solo el caso feliz.

## 4.11 · Routers: agrupar rutas por recurso

Con más de un recurso, declarar todas las rutas con `app.get(...)` en un solo archivo se vuelve inmanejable. Express tiene `Router`: un mini-`app` que agrupa rutas y se monta bajo un prefijo.

```ts
// productos.routes.ts
import { Router } from "express";
const router = Router();

router.get("/", listar);           // ← "/" y no "/productos"
router.get("/:id", obtenerUno);
router.post("/", crear);

export default router;
```

```ts
// server.ts
import productosRoutes from "./routes/productos.routes.js";

app.use("/productos", productosRoutes);   // todo lo del router cuelga de /productos
```

El prefijo lo pone `app.use`. Dentro del router las rutas son relativas: `"/"` es `/productos`, `"/:id"` es `/productos/:id`. Un router por recurso, montado en `server.ts`, es la estructura estándar.

## 4.12 · Convertir lo que llega por query string

Todo lo que viene en `req.query` es `string` o `undefined`. Si tu contrato dice que `stock_minimo` es un entero y `activo` es un booleano, convertir es tu trabajo:

```ts
// Entero opcional
const stockMinimo = req.query.stock_minimo !== undefined
  ? Number(req.query.stock_minimo)
  : undefined;

// Booleano opcional: "true" → true, "false" → false, otra cosa → inválido
const activo = req.query.activo === "true" ? true
             : req.query.activo === "false" ? false
             : undefined;

// Entero con default y máximo
const limite = Math.min(Number(req.query.limite ?? 10), 50);
```

Dos trampas:

- `Number("abc")` es `NaN`, no un error. Hay que chequear `Number.isNaN(...)` si el contrato dice que eso es un 400.
- `Boolean("false")` es `true`, porque cualquier string no vacío es truthy. Nunca conviertas un booleano con `Boolean()`; compará con el string `"true"`.

Lo que el contrato decida para los valores inválidos (rechazar con 400 o corregir al default) se implementa acá, en la frontera, antes de pasar nada hacia adentro.
