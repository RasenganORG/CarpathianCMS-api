import express from 'express';
import {addNewPage, deletePage, getPage, getPagesBySiteId, updatePage} from "../controllers/pages.js";
const router = express.Router();

router.post('/addNewPage',addNewPage);
router.get('/getPage',getPage);
router.get('/getPages',getPagesBySiteId);
router.patch('/updatePage',updatePage);
router.delete('/deletePage',deletePage);

export default router