import express from 'express';
import {
    addNewPage,
    deletePage,
    getNavbarBySiteId,
    getPage,
    getPagesBySiteId,
    updatePage,
    addImage
} from "../controllers/pages.js";
import multer from "multer";
const router = express.Router();



router.post('/addNewPage/:siteId',addNewPage);
router.get('/getPage/:siteId/:pageId',getPage);
router.get('/getPages/:siteId',getPagesBySiteId);
router.get('/getNavbar/:siteId',getNavbarBySiteId);
router.put('/updatePage/:siteId/:pageId',updatePage);
router.delete('/deletePage/:siteId/:pageId',deletePage);
router.post('/addImage/:siteId/:pageId',  addImage);

export default router