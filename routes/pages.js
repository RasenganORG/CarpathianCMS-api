import express from 'express';
import {addNewPage} from "../controllers/pages.js";
const router = express.Router();

router.post('/add-new-page',addNewPage);

export default router