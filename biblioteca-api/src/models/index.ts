// Punto único de entrada a los modelos.
// Importá siempre desde acá: `import { Libro, Autor } from "../models/index.js"`.
// Así las relaciones quedan definidas antes de usarlas.

import { Autor } from "./Autor.js";
import { Libro } from "./Libro.js";
import { Prestamo } from "./Prestamo.js";

// Relaciones
// ──────────
// Un autor tiene muchos libros.   Autor 1 ──< N Libro
// Un libro tiene muchos préstamos. Libro 1 ──< N Prestamo

Autor.hasMany(Libro, { foreignKey: "autor_id", as: "libros" });
Libro.belongsTo(Autor, { foreignKey: "autor_id", as: "autor" });

Libro.hasMany(Prestamo, { foreignKey: "libro_id", as: "prestamos" });
Prestamo.belongsTo(Libro, { foreignKey: "libro_id", as: "libro" });

export { Autor, Libro, Prestamo };
