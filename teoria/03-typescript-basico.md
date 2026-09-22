# Módulo 3 · TypeScript básico

**En este archivo**

- 3.1 ¿Qué es TypeScript y por qué lo usamos?
- 3.2 Tipos básicos
- 3.3 Tipar funciones
- 3.4 Interfaces: la forma de un objeto
- 3.5 `type`: alias y combinaciones
- 3.6 Tipos derivados: `Omit`, `Partial`, `Pick`
- 3.7 `any` y `unknown`: cuando no sabés el tipo
- 3.8 Instalar y correr TypeScript
- 3.9 Genéricos: tipos con parámetros
- 3.10 `async` y `Promise<T>`

---

## 3.1 · ¿Qué es TypeScript y por qué lo usamos?

**TypeScript** es JavaScript con **tipos**. Todo el JS que sabés sigue valiendo; TypeScript agrega la posibilidad de declarar *qué tipo de dato* es cada variable, parámetro y retorno. El compilador revisa que los uses bien **antes** de ejecutar.

En una API esto importa muchísimo porque el trabajo es, básicamente, **mover datos con una forma definida** (el contrato). TypeScript te deja escribir esa forma en código y te avisa cuando la rompés.

```ts
// JavaScript: esto explota en tiempo de ejecución, quizás en producción
const producto = { nombre: "Teclado" };
console.log(producto.nombre_.toUpperCase()); // TypeError: cannot read 'toUpperCase' of undefined

// TypeScript: el editor lo marca en rojo antes de correr nada
// Error: Property 'nombre_' does not exist on type '{ nombre: string }'. Did you mean 'nombre'?
```

Los archivos son `.ts` en vez de `.js`. Node no ejecuta `.ts` directamente: se **compila** a JS (con `tsc`) o se usa una herramienta que lo hace al vuelo (`tsx`). Para desarrollar se usa `tsx`; para producción se compila.

## 3.2 · Tipos básicos

```ts
let nombre: string = "Teclado";
let precio: number = 15000;
let activo: boolean = true;
let etiquetas: string[] = ["periferico", "oferta"];
let ids: number[] = [1, 2, 3];
let nada: null = null;
```

Casi siempre TypeScript **infiere** el tipo, así que no hace falta escribirlo:

```ts
let nombre = "Teclado"; // TypeScript ya sabe que es string
nombre = 5;             // Error: Type 'number' is not assignable to type 'string'
```

**Regla práctica:** anotá el tipo en **parámetros y retornos de funciones** y en **estructuras de datos** (interfaces). En variables locales, dejá que infiera.

## 3.3 · Tipar funciones

```ts
//                       parámetro: tipo              → tipo de retorno
function buscarProducto(productos: Producto[], id: number): Producto | null {
  return productos.find((p) => p.id === id) ?? null;
}

// Arrow function
const conStock = (productos: Producto[]): Producto[] => productos.filter((p) => p.stock > 0);

// Función que no devuelve nada
function loguear(mensaje: string): void {
  console.log(mensaje);
}
```

`Producto | null` es una **unión**: "un Producto o null". Te obliga a chequear antes de usar:

```ts
const producto = buscarProducto(productos, 3);
producto.nombre;                    // Error: 'producto' is possibly 'null'
if (producto) producto.nombre;      // ✅ TypeScript sabe que acá no es null
```

Ese "te obliga a chequear" es el punto. El compilador no te deja olvidarte del caso "no existe", que es exactamente el que en una API se traduce a un 404.

## 3.4 · Interfaces: la forma de un objeto

Una **interface** describe qué propiedades tiene un objeto y de qué tipo son. Es el equivalente en código a una tabla de la base de datos o a un schema del contrato.

```ts
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria_id: number;
  stock: number;
  descripcion: string | null;   // ← la columna acepta NULL
}

interface Pedido {
  id: number;
  producto_id: number;
  cliente_nombre: string;
  cantidad: number;
  fecha_envio?: string;         // ← el ? lo hace opcional: puede no estar
}
```

Un objeto cumple la interface si tiene **todas** las propiedades obligatorias con el tipo correcto:

```ts
const teclado: Producto = { id: 1, nombre: "Teclado", precio: 15000, categoria_id: 2, stock: 10, descripcion: null }; // ✅
const roto: Producto = { id: 2, nombre: "Mouse" };          // Error: faltan precio, categoria_id, stock, descripcion
const conTypo: Producto = { ...teclado, nobre: "x" };       // Error: 'nobre' does not exist in type 'Producto'
```

Mirá la relación entre las cuatro vistas de la misma forma:

| DER / SQL | Sequelize | OpenAPI | TypeScript |
|---|---|---|---|
| `nombre VARCHAR(100) NOT NULL` | `DataTypes.STRING(100), allowNull: false` | `nombre: { type: string, maxLength: 100 }` + en `required` | `nombre: string` |
| `precio DECIMAL NOT NULL` | `DataTypes.DECIMAL, allowNull: false` | `precio: { type: number }` + en `required` | `precio: number` |
| `stock INT NOT NULL DEFAULT 0` | `DataTypes.INTEGER, defaultValue: 0` | `stock: { type: integer, default: 0 }` | `stock: number` |
| `descripcion TEXT NULL` | `DataTypes.TEXT, allowNull: true` | `descripcion: { type: string, nullable: true }` | `descripcion: string \| null` |

Si cambia una, cambian las cuatro.

**`?` contra `| null`.** No son lo mismo:

- `fecha_envio?: string` significa que la propiedad **puede no estar** en el objeto. Si está, es string.
- `descripcion: string | null` significa que la propiedad **siempre está**, pero su valor puede ser `null`.

Una columna SQL que acepta `NULL` se parece más a `string | null`: la columna siempre existe en la fila, lo que puede faltar es el valor. El `?` se usa más para los bodies de entrada, donde un campo puede directamente no venir.

## 3.5 · `type`: alias y combinaciones

`type` sirve para darle nombre a cualquier tipo, no solo a objetos:

```ts
type Id = number;
type EstadoPedido = "pendiente" | "enviado" | "cancelado";   // unión de literales: solo acepta esos tres
type Resultado = Producto | null;

let estado: EstadoPedido = "pendiente";   // ✅
estado = "perdido";                        // Error
```

La unión de literales es la traducción directa de un `enum` de OpenAPI o de un `CHECK (estado IN (...))` de SQL.

**¿`interface` o `type`?** Para describir objetos son casi intercambiables. Convención simple: **`interface` para la forma de los objetos del dominio** (Producto, Categoria, Pedido), **`type` para uniones, alias y tipos derivados**.

## 3.6 · Tipos derivados: `Omit`, `Partial`, `Pick`

Muy útiles en APIs, porque el body de un POST **no es exactamente** el recurso completo:

```ts
// Lo que llega en POST /productos: sin id (lo pone el servidor)
type NuevoProducto = Omit<Producto, "id">;
// equivale a: { nombre: string; precio: number; categoria_id: number; stock: number; descripcion: string | null }

// Lo que llega en PATCH /productos/:id: cualquier subconjunto de campos
type EditarProducto = Partial<NuevoProducto>;
// equivale a: { nombre?: string; precio?: number; categoria_id?: number; ... }

// Solo algunos campos, por ejemplo para un listado resumido
type ProductoResumen = Pick<Producto, "id" | "nombre" | "precio">;
```

Con esto, la **interface `Producto` es la única fuente de verdad**: si le agregás un campo, `NuevoProducto` y `EditarProducto` se actualizan solos.

Fijate la correspondencia con los verbos: `NuevoProducto` es el body de `POST` y de `PUT` (todo obligatorio); `EditarProducto` es el body de `PATCH` (todo opcional). El tipo te dice qué verbo es.

## 3.7 · `any` y `unknown`: cuando no sabés el tipo

`any` apaga TypeScript para esa variable. **Evitalo**: es volver a JavaScript.

```ts
const datos: any = req.body;   // ❌ podés hacer datos.loQueSea sin que nadie te avise
```

Cuando de verdad no sabés qué llega (por ejemplo, el body de un pedido HTTP, que lo manda el cliente y puede ser cualquier cosa), usá `unknown` y **validá** antes de usar:

```ts
const body: unknown = req.body;
// body.nombre → Error: 'body' is of type 'unknown'. Hay que chequear primero.

if (typeof body === "object" && body !== null && "nombre" in body && typeof body.nombre === "string") {
  // acá TypeScript sabe que body.nombre es string
}
```

Escribir esas validaciones a mano es tedioso, y por eso existen librerías como `zod` que lo hacen a partir de un schema. Pero el concepto es el que importa: **lo que viene de afuera no tiene tipo hasta que lo validás**.

## 3.8 · Instalar y correr TypeScript

```bash
npm install -D typescript tsx @types/node
npx tsc --init
```

Y en `package.json`:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

`tsx watch` corre el `.ts` directamente y reinicia al guardar. `tsc` compila todo a `dist/` para producción.

Un `tsconfig.json` mínimo:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

`"strict": true` es lo importante: activa todos los chequeos. Sin eso, TypeScript deja pasar muchas cosas.

**Sobre los imports.** Con `"module": "NodeNext"`, los imports relativos llevan extensión `.js` aunque el archivo sea `.ts`: `import { Producto } from "../types/producto.js"`. Es raro la primera vez, pero es cómo funciona: TypeScript resuelve `.js` al `.ts` correspondiente.

## 3.9 · Genéricos: tipos con parámetros

A veces una forma se repite con distintos tipos adentro. Una respuesta paginada de productos y una de pedidos tienen la misma estructura: cambia solo qué hay en `datos`.

```ts
interface PaginaDe<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
}

// Se usa pasándole el tipo entre < >
const pagina: PaginaDe<Producto> = { datos: [teclado], total: 1, pagina: 1, limite: 10 };
const otra: PaginaDe<Pedido> = { datos: [], total: 0, pagina: 1, limite: 10 };
```

`T` es un **parámetro de tipo**: un hueco que se llena cuando usás la interface. `PaginaDe<Producto>` es un tipo concreto donde `datos` es `Producto[]`.

Ya venís usando genéricos sin saberlo: `string[]` es azúcar para `Array<string>`, y `Omit<Producto, "id">` es un genérico con dos parámetros.

## 3.10 · `async` y `Promise<T>`

Toda operación que va a la base de datos es asíncrona: la función devuelve una **promesa** de un valor, no el valor. En TypeScript eso se escribe `Promise<T>`:

```ts
async function obtenerPorId(id: number): Promise<Producto | null> {
  const fila = await Modelo.findByPk(id);   // esperamos la base
  return fila ? fila.toJSON() : null;
}

const producto = await obtenerPorId(3);    // producto es Producto | null, no Promise
```

Reglas:

- Una función `async` **siempre** devuelve `Promise<algo>`. Si devuelve `Producto | null`, su tipo de retorno es `Promise<Producto | null>`.
- Para sacar el valor de una promesa se usa `await`, y solo se puede usar dentro de otra función `async`.
- Si te olvidás el `await`, la variable queda con tipo `Promise<...>` y TypeScript te lo va a marcar cuando intentes usarla como si fuera el valor. Es uno de los errores más útiles del compilador.
