import {v4 as uuid} from 'uuid';
import firebase from '../db.js'
import fetch from "node-fetch";
const firestore = firebase.firestore()
import {collection, getDocs} from "firebase/firestore";
import User from "../models/user.js";
import axios from "axios";

const {
    PORT,
    API_KEY,
    API_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
} = process.env;


export const createUser = async (req, res) => {
    try {
        const data = req.body;
        let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    returnSecureToken: true
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        let responseData = await response.json()
        await firestore.collection('users').doc(`${responseData.localId}`).set({
            email: data.email,
            role: data.role,
            firstName:data.firstName,
            lastName:data.lastName
        });
        res.send(responseData);
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const logInUser = async (req, res) => {
    const data = req.body;

    try{
        let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    returnSecureToken: true
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        let responseData = await response.json()
        const userRef = await firestore.collection('users').doc(responseData.localId);
        const userData = await userRef.get();
        if (!userData.exists) {
            res.status(404).send('User with the given ID not found');
        } else {
            res.send({
                data: userData.data(),
                ...responseData
            });
        }
    }
    catch (error){
        res.status(400).send(error.message);
    }
}

export const getUsers = async (req, res) => {
    let userArray = [];

    try {
        const users = await firestore.collection('users');
        const data = await users.get()
        if (data.empty) {
            res.status(404).send('No student record found');
        } else {
            data.forEach(doc => {
                const user = new User(
                    doc.id,
                    doc.data().firstName,
                    doc.data().lastName,
                    doc.data().age,
                );
                userArray.push(user);
            });
            res.send(userArray);
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
}

export const getUser = async (req, res) => {
    try {
        const id = req.params.id ;
        const user = await firestore.collection('users').doc(id);
        const data = await user.get();
        if (!data.exists) {
            res.status(404).send('User with the given ID not found');
        } else {
            res.send(data.data());
        }
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user = await firestore.collection('users').doc(id);
        await user.update(data);
        res.send('User record updated successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        await firestore.collection('users').doc(id).delete();
        res.send('User deleted successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

