import firebase from '../db.js'
import fetch from "node-fetch";
import admin from 'firebase-admin';
const firestore = firebase.firestore()
import User from "../models/user.js";
import Response from "../models/response.js";
import axios from "axios";
import formidable from "formidable";
import fs from "fs";
import emailClient from "../utils/mailer.js";
import {getAuth} from "firebase-admin/auth";

const {
    PORT,
    API_KEY,
    API_DOMAIN,
    PROJECT_ID,
    STORAGE_BUCKET,
    MESSAGING_SENDER_ID,
    APP_ID,
    CLIENT_ID,
    CLIENT_SECRET,
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
                    returnSecureToken: true,
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        data.role ? null : data.role = 'user'
        let responseData = await response.json()
        await firestore.collection('users').doc(`${responseData.localId}`).set({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            isGoogleAccount: false,
            role: 'user',
            specialPermissions: {},
            profilePictureUrl: '',
            profilePictureName: '',
            phone: '',
        });

        res.send({
            data: data,
            ...responseData
        });
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to create the new account",
            error.message,
            Date.now()
        ));
    }
};

export const logInUser = async (req, res) => {

    try {
        const data = req.body;
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
            res.status(400).send(new Response(
                'error',
                'empty',
                'User with the given ID not found',
                'empty',
                Date.now()
            ));
        } else {
            res.send({
                data: userData.data(),
                ...responseData
            });
        }
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to log in the requested user",
            error.message,
            Date.now()
        ));
    }
}

function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

export const uploadGoogleAccount = async (req, res) => {

    try {
        const tokens = await axios.post("https://oauth2.googleapis.com/token", {
            'code': req.body.code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': 'postmessage',
            'grant_type': 'authorization_code'
        });
        const data = parseJwt(tokens.data.id_token);

        let responseData
        let userResponseData
        let localId

        //search user by email in our database
        const userRef = await firestore.collection('users').where("email", "==", data.email);
        const userSnap = await userRef.get()

        let userData
        userSnap.forEach(doc => {
            userData = doc.data()
            localId = doc.id;
        });

        if (userData) {
            //user already exits, so update his profile.
            userSnap.forEach(async (doc) => {
                await doc.ref.set({['profilePictureUrl']: data.picture}, {merge: true});
            });
            userResponseData = userData
        } else {
            //user is new to our database, get his data
            const docRef = await firestore.collection('users').doc()
            await docRef.set({
                profilePictureUrl: data.picture,
                email: data.email,
                firstName: data.given_name,
                lastName: data.family_name,
                isGoogleAccount: true,
                role: 'user',
                specialPermissions: {},
                phone: '',
            })
            localId = docRef.id
            userResponseData = {
                profilePictureUrl: data.picture,
                email: data.email,
                firstName: data.given_name,
                lastName: data.family_name,
                isGoogleAccount: true,
                role: 'user',
                specialPermission: {},
                phone: '',
            }
        }

        responseData = {
            kind: 'googlelogin',
            localId: localId,
            refreshToken: tokens.data.refresh_token,
            idToken: tokens.data.id_token,
        }


        res.send({
            data: userResponseData,
            ...responseData
        });
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to create an account for the given google account",
            error.message,
            Date.now()
        ));
    }
}

export const refreshToken = async (req, res) => {
    try {
        let data = req.body;
        const myHeaders = {"Content-Type": "application/x-www-form-urlencoded"};

        let urlencoded = new URLSearchParams();
        urlencoded.append("grant_type", "refresh_token");
        urlencoded.append("refresh_token", data.refreshToken);
        let requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: urlencoded,
            redirect: 'follow'
        };

        const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, requestOptions)
            .then(response => response.text())

        res.send(response)
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to generate a new refresh token",
            error.message,
            Date.now()
        ));
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
                    doc.data().profilePictureUrl,
                    doc.data().profilePictureName,
                    doc.data().isGoogleAccount,
                    doc.data().email,
                    doc.data().role,
                    doc.data().specialPermissions,
                    doc.data().phone
                );
                userArray.push(user);
            });
            res.send(userArray);
        }
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to retrieve the requested users data",
            error.message,
            Date.now()
        ));
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
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to retrieve the requested user data",
            error.message,
            Date.now()
        ));
    }
};

export const updateUser = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const user = await firestore.collection('users').doc(id);
        await user.update(data);
        res.send(new Response(
            'success',
            id,
            "Successfully updated the user data",
            {},
            Date.now()
        ));
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to update the requested user",
            error.message,
            Date.now()
        ));
    }
};

export const deleteUser = async (re, res) => {
    try {
        const id = req.params.id;
        console.log(id)
        await firestore.collection('users').doc(id).delete();
        // delete the user from Firebase Authentication
        // let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${API_KEY}`, {
        //     method: 'POST',
        //     body: JSON.stringify({
        //         localId: id,
        //     }),
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // });

        // console.log(response)

        res.send(new Response(
            'success',
            id,
            "Successfully deleted the user data",
            {},
            Date.now()
        ));
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to delete the requested user",
            error.message,
            Date.now()
        ));
    }
};


const bucket = firebase.storage().bucket();
export const addUserProfilePicture = (req, res) => {
    const userId = req.params.userId

    const form = formidable({multiples: false});

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(500).json({message: 'Upload failed'});
        }

        const file = files.filename;

        // Check if a file was submitted
        if (!file || !file.newFilename || !file.filepath) {
            return res.status(400).json({message: 'No file uploaded'});
        }

        console.log(file)


        // Generate a unique file name
        const fileName = file.originalFilename;

        // Define the path where the file will be saved in Firebase Storage
        const storageFilePath = `users/${userId}/profilePicture/${fileName}`;


        // Upload the file to Firebase Storage
        const uploadOptions = {
            destination: storageFilePath,
            public: true, // Set to false if you want to restrict access to the file
        };

        bucket.upload(file.filepath, uploadOptions, (err, uploadedFile) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({message: 'Upload failed'});
            }

            // Delete the temporary file from the local filesystem
            fs.unlinkSync(file.filepath);

            // Get the public URL of the uploaded file
            const publicUrl = uploadedFile.publicUrl();

            // Return the public URL in the response
            res.json({
                imageUrl: publicUrl,
                originalFilename: fileName,
            });
        });
    });
};

export async function deleteImage(req, res) {
    const bucketName = bucket.name;

    const userId = req.params.userId
    const imageName = req.params.imageName

    const storageFilePath = `users/${userId}/profilePicture/${imageName}`;

    try {
        // Deletes the file from the bucket
        await bucket.file(storageFilePath).delete();

        console.log(`Successfully deleted ${storageFilePath} from ${bucketName}`);
        res.status(201).send(new Response(
            'success',
            'empty',
            "Image deleted successfully",
            'empty',
        ));
    } catch (error) {
        console.error(`Failed to remove file: ${storageFilePath}`, error);
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to delete the requested image",
            error.message,
            Date.now()
        ));
    }
}

export const searchUser = async (req, res) => {
    let userArray = [];

    try {
        const query = req.params.query
        const users = await firestore.collection('users');
        const data = await users.get()
        if (data.empty) {
            res.status(404).send('No student record found');
        } else {
            data.forEach(doc => {
                const user = {
                    id: doc.id,
                    firstName: doc.data().firstName,
                    lastName: doc.data().lastName,
                    role: doc.data().role,
                    email: doc.data().email
                }
                userArray.push(user);
            });
            const filteredFirstName = userArray.filter(user => user.firstName.toLowerCase().indexOf(query) !== -1)
            const filteredLastName = userArray.filter(user => user.lastName.toLowerCase().indexOf(query) !== -1)
            const filteredEmail = userArray.filter(user => user.email.toLowerCase().indexOf(query) !== -1)
            const filtered = filteredEmail.concat(filteredFirstName)
                .concat(filteredLastName)
                .filter((value, index, self) => {
                    return self.indexOf(value) === index;
                })

            res.send(filtered);
        }

    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to search the requested user",
            error.message,
            Date.now()
        ));
    }
}

export const sendPasswordReset = async (req, res) => {
    try {
        const  email  = req.params.email;

        let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${API_KEY}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    requestType: "PASSWORD_RESET",
                    email:email
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        res.send(new Response(
            'success',
            {},
            "Password reset email sent",
            {},
            Date.now()
        ));
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to send password reset email",
            error.message,
            Date.now()
        ));
    }
};

export const changePassword = async (req, res) => {
    try {
        const newPass  = req.body.newPassword;
        const oldPass  = req.body.oldPassword;
        const idToken = req.body.idToken;
        const email = req.body.email;

        let response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
            {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: oldPass,
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        let responseData = await response.json()
        console.log("A",responseData)
        if(responseData.error?.code === 400){
            res.status(400).send(new Response(
                'error',
                'empty',
                "Old password invalid",
                Date.now()
            ));
        }
        if(responseData.registered === true) {

            let responseChange = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        requestType: "PASSWORD_RESET",
                        password: newPass,
                        idToken: responseData.idToken
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            let responseChangeData = await responseChange.json()
            console.log("C",responseChangeData)
            if(responseChangeData){
                res.send(new Response(
                    'success',
                    {},
                    "Password reset successfully",
                    {
                        idToken: responseChangeData.idToken,
                        localId:responseChangeData.localId
                    },
                    Date.now()
                ));
            }
        }
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to reset password",
            error.message,
            Date.now()
        ));
    }
};

