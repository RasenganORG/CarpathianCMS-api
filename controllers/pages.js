import firebase from '../db.js'
import fetch from "node-fetch";
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
        console.log(data)
        res.status(200).send("ok")
    }
    catch (error){
        res.status(400).send(error.message);
    }
}