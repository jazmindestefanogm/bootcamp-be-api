// Crea las tablas desde cero y carga datos de ejemplo.
// Correr con: npm run seed
// ⚠️ Borra todo lo que hubiera en las tablas autores, libros y prestamos de la base `biblioteca`.

import { sequelize } from "./connection.js";
import { Autor, Libro, Prestamo } from "../models/index.js";

async function seed() {
  await sequelize.sync({ force: true });

  const [cortazar, borges, ocampo, bolano] = await Autor.bulkCreate([
    { nombre: "Julio Cortázar", nacionalidad: "Argentina" },
    { nombre: "Jorge Luis Borges", nacionalidad: "Argentina" },
    { nombre: "Silvina Ocampo", nacionalidad: "Argentina" },
    { nombre: "Roberto Bolaño", nacionalidad: "Chile" },
    // sin libros a propósito: sirve para probar el DELETE exitoso de un autor
    { nombre: "Mariana Enriquez", nacionalidad: "Argentina" },
  ]);

  const libros = await Libro.bulkCreate([
    { titulo: "Rayuela", anio: 1963, autor_id: cortazar.id, disponible: true },
    { titulo: "Bestiario", anio: 1951, autor_id: cortazar.id, disponible: false },
    { titulo: "Ficciones", anio: 1944, autor_id: borges.id, disponible: true },
    { titulo: "El Aleph", anio: 1949, autor_id: borges.id, disponible: false },
    { titulo: "La furia", anio: 1959, autor_id: ocampo.id, disponible: true },
    { titulo: "Los detectives salvajes", anio: 1998, autor_id: bolano.id, disponible: true },
  ]);

  const bestiario = libros[1];
  const elAleph = libros[3];

  await Prestamo.bulkCreate([
    // préstamo ya devuelto
    { libro_id: bestiario.id, socio_nombre: "Ana Pérez", fecha_prestamo: "2026-08-01", fecha_devolucion: "2026-08-15" },
    // préstamos activos (coinciden con los libros que están en disponible: false)
    { libro_id: bestiario.id, socio_nombre: "Luis Gómez", fecha_prestamo: "2026-09-10", fecha_devolucion: null },
    { libro_id: elAleph.id, socio_nombre: "Ana Pérez", fecha_prestamo: "2026-09-18", fecha_devolucion: null },
  ]);

  console.log("✅ Base de datos creada y cargada:");
  console.log(`   ${await Autor.count()} autores, ${await Libro.count()} libros, ${await Prestamo.count()} préstamos`);
  await sequelize.close();
}

seed().catch((error) => {
  console.error("❌ Error al cargar la base:", error);
  process.exit(1);
});
