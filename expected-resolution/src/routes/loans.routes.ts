import { Router } from "express";
import * as controller from "../controllers/loans.controller.js";

const router = Router();

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.registerReturn);

export default router;
