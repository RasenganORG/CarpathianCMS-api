import firebase from '../db.js'
import fetch from "node-fetch";
import {collection, query, where, getDocs} from "firebase/firestore";


const firestore = firebase.firestore()
//import Page from '../controllers/pages'

const {
    PORT,
    API_KEY,
    API_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
} = process.env;

export const addNewPage = async (req, res) => {
    try {
        const data = req.body;
        let siteId = req.params.siteId
        const pageRef = await firestore.collection("sites")
            .doc(siteId)
            .collection('pages')
            .doc();
        await pageRef.create(data);
        res.status(200).send("Page created successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
}

export const getPage = async (req, res) => {
    try {
        const params = req.params;
        console.log(params)
        const pageId = params.pageId;
        const siteId = params.siteId;
        const pageRef = await firestore.collection('sites')
            .doc(siteId)
            .collection('pages')
            .doc(pageId);
        const pageData = await pageRef.get();
        if (!pageData.exists) {
            res.status(404).send('Page with the given ID not found');
        } else {
            res.send(pageData.data());
        }

    } catch (error) {
        res.status(400).send(error.message);
    }
}

export const getPagesBySiteId = async (req, res) => {
    try {
        let responseArray = []
        const siteId = req.params.siteId;
        const pagesRef = firestore.collection('sites').doc(siteId).collection('pages');
        const querySnapshot = await pagesRef.get()
        if (querySnapshot.empty) {
            res.status(404).send("Page not found")
        } else {
            querySnapshot.forEach((doc) => {
                responseArray.push({
                    id: doc.id,
                    data: doc.data()
                })
            });
            res.send(responseArray)
        }

    } catch (error) {
        res.status(400).send(error.message);
    }
}


export const updatePage = async (req, res) => {
    try {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        const data = req.body.data
        const pageRef = await firestore.collection('sites')
            .doc(siteId)
            .collection('pages')
            .doc(pageId)
        await pageRef.update(data);
        res.send('User record updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deletePage  = async (req, res) => {
    try {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        await firestore.collection('sites')
            .doc(siteId)
            .collection('pages')
            .doc(pageId)
            .delete();
        res.send('Page deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

