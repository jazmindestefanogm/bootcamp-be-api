// Punto único de entrada a los modelos.
// Importá siempre desde acá: `import { Book, Author } from "../models/index.js"`.
// Así las relaciones quedan definidas antes de usarlas.

import { Author } from "./Author.js";
import { Book } from "./Book.js";
import { Loan } from "./Loan.js";

// Relaciones
// ──────────
// Un autor tiene muchos libros.    Author 1 ──< N Book
// Un libro tiene muchos préstamos. Book   1 ──< N Loan

// onDelete: "RESTRICT" → la base NO deja borrar un autor que tiene libros,
// ni un libro que tiene préstamos. Si lo intentás, Sequelize tira un error.

Author.hasMany(Book, { foreignKey: "author_id", as: "books", onDelete: "RESTRICT" });
Book.belongsTo(Author, { foreignKey: "author_id", as: "author", onDelete: "RESTRICT" });

Book.hasMany(Loan, { foreignKey: "book_id", as: "loans", onDelete: "RESTRICT" });
Loan.belongsTo(Book, { foreignKey: "book_id", as: "book", onDelete: "RESTRICT" });

export { Author, Book, Loan };
