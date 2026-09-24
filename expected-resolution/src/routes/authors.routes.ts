import { Router } from "express";
import * as AuthorsController from "../controllers/authors.controller.js";

const router = Router();

router.get("/", AuthorsController.list);
router.get("/:id", AuthorsController.getOne);
router.post("/", AuthorsController.create);
router.patch("/:id", AuthorsController.update);
router.put("/:id", AuthorsController.replace);
router.delete("/:id", AuthorsController.remove);

export default router;
