import firebase from '../db.js'
import fetch from "node-fetch";
import { collection, query, where, getDocs } from "firebase/firestore";


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
        const pageRef = await firestore.collection("pages").doc();
        await pageRef.create(data);
        res.status(200).send("Page created successfully");
    } catch (error) {
        res.status(400).send(error.message);
    }
}

export const getPage = async (req, res) => {
    try {
        const data = req.body;
        const id = data.id;
        const pageRef = await firestore.collection('pages').doc(id);
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

export const getPagesBySiteId = async (req,res) => {
    try {
        let responseArray = []
        const data = req.body;
        const id = data.id;
        const pagesRef = firestore.collection('pages');
        const querySnapshot = await pagesRef.where('siteId', '==', id).get()
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
            responseArray.push(doc.data())
        });
        res.send(responseArray)

    } catch (error) {
        res.status(400).send(error.message);
    }
}