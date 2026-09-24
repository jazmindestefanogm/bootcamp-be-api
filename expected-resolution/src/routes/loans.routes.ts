import { Router } from "express";
import * as LoansController from "../controllers/loans.controller.js";

const router = Router();

router.get("/", LoansController.list);
router.post("/", LoansController.create);
router.patch("/:id", LoansController.registerReturn);

export default router;
