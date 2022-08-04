import express from 'express';
import {addNewPage, getPage, getPagesBySiteId} from "../controllers/pages.js";
const router = express.Router();

router.post('/add-new-page',addNewPage);
router.get('/get-page-by-id',getPage);
router.get('/get-pages-by-siteid',getPagesBySiteId);

export default router