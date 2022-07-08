import {v4 as uuid} from 'uuid';
import firebase from '../db.js'

const firestore = firebase.firestore()
import {collection, getDocs} from "firebase/firestore";
import User from "../models/user.js";




export const createUser = async (req, res) => {
    try {
        const data = req.body;
        await firestore.collection('users').doc().set(data);
        res.send('User saved successfully');
    } catch (error) {
        res.status(400).send(error.message);
    }
};

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
        const id = req.params.id;
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

