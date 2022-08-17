import express from 'express';
import {
    addNewPage,
    deletePage,
    getNavbarBySiteId,
    getPage,
    getPagesBySiteId,
    updatePage
} from "../controllers/pages.js";
const router = express.Router();

router.post('/addNewPage/:siteId',addNewPage);
router.get('/getPage/:siteId/:pageId',getPage);
router.get('/getPages/:siteId',getPagesBySiteId);
router.get('/getNavbar/:siteId',getNavbarBySiteId);
router.put('/updatePage/:siteId/:pageId',updatePage);
router.delete('/deletePage/:siteId/:pageId',deletePage);

export default router