// Sirve el contrato (docs/openapi.yaml) como documentación interactiva en /docs.
// Ya está hecho: no hace falta tocarlo. Vos escribís el YAML; esto lo muestra.

import { readFileSync } from "node:fs";
import { Router, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const CONTRACT_PATH = new URL("../docs/openapi.yaml", import.meta.url);

function loadContract() {
  return YAML.parse(readFileSync(CONTRACT_PATH, "utf-8"));
}

const router = Router();

// El contrato crudo, para pegarlo en otras herramientas.
router.get("/openapi.json", (req: Request, res: Response) => {
  res.json(loadContract());
});

// Swagger UI. Se relee el YAML en cada carga de página, así con guardar y
// refrescar el navegador alcanza (no hace falta reiniciar el servidor).
router.use(
  "/",
  swaggerUi.serve,
  (req: Request, res: Response, next: () => void) => {
    swaggerUi.setup(loadContract())(req, res, next);
  }
);

export default router;
