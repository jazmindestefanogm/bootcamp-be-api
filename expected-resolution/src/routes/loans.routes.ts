import { Router } from "express";
import * as LoansController from "../controllers/loans.controller.js";

const router = Router();

router.get("/", LoansController.list);
router.get("/:id", LoansController.getOne);
router.post("/", LoansController.create);
router.patch("/:id", LoansController.registerReturn);
router.delete("/:id", LoansController.remove);

export default router;
