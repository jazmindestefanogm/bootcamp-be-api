import { Router } from "express";
import * as BooksController from "../controllers/books.controller.js";

const router = Router();

router.get("/", BooksController.search);
router.get("/:id", BooksController.getOne);
router.post("/", BooksController.create);
router.patch("/:id", BooksController.update);
router.put("/:id", BooksController.replace);
router.delete("/:id", BooksController.remove);

export default router;
