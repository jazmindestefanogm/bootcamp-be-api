import { Router } from "express";
import * as controller from "../controllers/authors.controller.js";

const router = Router();

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.delete("/:id", controller.remove);

export default router;
