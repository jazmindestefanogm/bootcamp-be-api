import { Router } from "express";
import * as controller from "../controllers/books.controller.js";

const router = Router();

router.get("/", controller.search);
router.get("/:id", controller.getOne);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.put("/:id", controller.replace);
router.delete("/:id", controller.remove);

export default router;
