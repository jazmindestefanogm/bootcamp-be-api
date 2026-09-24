import { Router } from "express";
import * as AuthorsController from "../controllers/authors.controller.js";

const router = Router();

router.get("/", AuthorsController.list);
router.get("/:id", AuthorsController.getOne);
router.delete("/:id", AuthorsController.remove);

export default router;
