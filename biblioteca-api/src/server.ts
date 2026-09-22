import express, { Request, Response } from "express";
import { sequelize } from "./db/connection.js";
import docsRouter from "./docs.js";

const app = express();
const PORT = 3000;

app.use(express.json()); // permite leer JSON del body en POST / PATCH

// Ruta de prueba: si esto responde, el servidor está levantado.
app.get("/", (req: Request, res: Response) => {
  res.json({ mensaje: "API Biblioteca funcionando", docs: `http://localhost:${PORT}/docs` });
});

// Documentación interactiva del contrato (docs/openapi.yaml). Ya hecho.
app.use("/docs", docsRouter);

// 👇 Acá vas a montar tus routers:
// app.use("/autores", autoresRoutes);
// app.use("/libros", librosRoutes);
// app.use("/prestamos", prestamosRoutes);

async function iniciar() {
  await sequelize.authenticate(); // falla si Postgres no está prendido, si la base `biblioteca` no existe o si la contraseña de src/db/connection.ts está mal
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
    console.log(`Documentación en      http://localhost:${PORT}/docs`);
  });
}

iniciar();
