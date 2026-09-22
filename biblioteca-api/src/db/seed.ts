// Crea las tablas desde cero y carga datos de ejemplo.
// Correr con: npm run seed
// ⚠️ Borra todo lo que hubiera en las tablas authors, books y loans de la base `library`.

import { sequelize } from "./connection.js";
import { Author, Book, Loan } from "../models/index.js";

async function seed() {
  await sequelize.sync({ force: true });

  const [cortazar, borges, ocampo, bolano] = await Author.bulkCreate([
    { name: "Julio Cortázar", nationality: "Argentina" },
    { name: "Jorge Luis Borges", nationality: "Argentina" },
    { name: "Silvina Ocampo", nationality: "Argentina" },
    { name: "Roberto Bolaño", nationality: "Chile" },
    // sin libros a propósito: sirve para probar el DELETE exitoso de un autor
    { name: "Mariana Enriquez", nationality: "Argentina" },
  ]);

  const books = await Book.bulkCreate([
    { title: "Rayuela", year: 1963, author_id: cortazar.id, available: true },
    { title: "Bestiario", year: 1951, author_id: cortazar.id, available: false },
    { title: "Ficciones", year: 1944, author_id: borges.id, available: true },
    { title: "El Aleph", year: 1949, author_id: borges.id, available: false },
    { title: "La furia", year: 1959, author_id: ocampo.id, available: true },
    { title: "Los detectives salvajes", year: 1998, author_id: bolano.id, available: true },
  ]);

  const bestiario = books[1];
  const elAleph = books[3];

  await Loan.bulkCreate([
    // préstamo ya devuelto
    { book_id: bestiario.id, member_name: "Ana Pérez", loan_date: "2026-08-01", return_date: "2026-08-15" },
    // préstamos activos (coinciden con los libros que están en available: false)
    { book_id: bestiario.id, member_name: "Luis Gómez", loan_date: "2026-09-10", return_date: null },
    { book_id: elAleph.id, member_name: "Ana Pérez", loan_date: "2026-09-18", return_date: null },
  ]);

  console.log("✅ Database created and loaded:");
  console.log(`   ${await Author.count()} authors, ${await Book.count()} books, ${await Loan.count()} loans`);
  await sequelize.close();
}

seed().catch((error) => {
  console.error("❌ Error loading the database:", error);
  process.exit(1);
});
