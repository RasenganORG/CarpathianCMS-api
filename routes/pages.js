import express from 'express';
import {addNewPage, deletePage, getPage, getPagesBySiteId, updatePage} from "../controllers/pages.js";
const router = express.Router();

router.post('/add-new-page',addNewPage);
router.get('/get-page-by-id',getPage);
router.get('/get-pages-by-siteid',getPagesBySiteId);
router.get('/update-page',updatePage);
router.delete('/delete-page',deletePage);

export default router