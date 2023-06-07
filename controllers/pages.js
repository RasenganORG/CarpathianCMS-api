import firebase from '../db.js'
import Response from "../models/response.js";
import pages from "../routes/pages.js";
import storage from '@google-cloud/storage'

const firestore = firebase.firestore()
import { ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";


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
        const response = await pageRef.create(data);

        await firestore.collection("sites")
            .doc(siteId).update({
                flagNavBarValid: false
            })
        res.status(201).send(new Response(
            'success',
            pageRef.id,
            "Page created successfully",
            data,
            response.writeTime.seconds
        ));
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while creating a new page",
            error.message,
            Date.now()
        ));
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
            res.status(201).send(new Response(
                'success',
                pageRef.id,
                "Page retrieved successfully",
                pageData.data(),
                pageData.readTime.seconds
            ));
        }

    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while retrieving the requested page",
            error.message,
            Date.now()
        ));
    }
}

export const getPagesBySiteId = async (req, res) => {
    try {
        let responseArray = []
        const siteId = req.params.siteId;
        const pagesRef = firestore.collection('sites').doc(siteId).collection('pages');
        const querySnapshot = await pagesRef.get()
        if (querySnapshot.empty) {
            res.status(400).send(new Response(
                'error',
                'empty',
                "Pages not found",
                error.message,
                Date.now()
            ));
        } else {
            querySnapshot.forEach((doc) => {
                responseArray.push({
                    id: doc.id,
                    data: doc.data()
                })
            });
            res.status(201).send(new Response(
                'success',
                'empty',
                "Pages retrieved successfully",
                responseArray,
                querySnapshot.readTime.seconds,
            ));
        }

    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while retrieving the requested pages",
            error.message,
            Date.now()
        ));
    }
}

export const getNavbarBySiteId = async (req, res) => {
    try {
        let responseObject = {}
        const siteId = req.params.siteId;


        const flagRef = firestore.collection('sites').doc(siteId)
        const result = (await flagRef.get()).data()

        if (result.flagNavBarValid === false) {
            let pagesArray = []
            const pagesRef = firestore.collection('sites').doc(siteId).collection('pages');
            const querySnapshot = await pagesRef.get()
            if (querySnapshot.empty) {
                res.status(400).send(new Response(
                    'error',
                    'empty',
                    "Pages not found",
                    error.message,
                    Date.now()
                ));
            } else {
                querySnapshot.forEach((doc) => {
                    pagesArray.push({
                        id: doc.id,
                        data: doc.data()
                    })
                });
            }

            responseObject = generateNavBar(pagesArray, 'none')

            await firestore.collection("sites")
                .doc(siteId).update({
                    flagNavBarValid: true,
                    navBar: responseObject
                })
        } else {
            responseObject = result.navBar
        }

        res.status(201).send(new Response(
            'success',
            'empty',
            "Navbar configuration retrieved successfully",
            responseObject,
            Date.now(),
        ));
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to retrieve the navbar configuration",
            error.message,
            Date.now()
        ));
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
        const response = await pageRef.update(data);
        await firestore.collection("sites")
            .doc(siteId).update({
                flagNavBarValid: false
            })
        res.status(201).send(new Response(
            'success',
            pageRef.id,
            "Page updated successfully",
            data,
            response.writeTime.seconds
        ));

    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to update the requested page",
            error.message,
            Date.now()
        ));
    }
};


export const deletePage = async (req, res) => {
    try {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        const pagerRef = await firestore.collection('sites')
            .doc(siteId)
            .collection('pages')
            .doc(pageId)

        const pageParent = (await pagerRef.get()).data().metadata.parent
        const navBar = (await firestore.collection('sites').doc(siteId).get()).data().navBar
        const page = getPageFromNavBar(navBar, pageId)
        for (let key of Object.keys(page.children)) {
            let metadata = page.children[key].metadata
            metadata.parent = pageParent
            await firestore.collection('sites')
                .doc(siteId)
                .collection('pages')
                .doc(key).update({
                    "metadata": metadata
                })
        }

        const response = await pagerRef.delete()

        await firestore.collection("sites")
            .doc(siteId).update({
                flagNavBarValid: false
            })
        res.status(201).send(new Response(
            'success',
            'empty',
            "Page deleted successfully",
            'empty',
            response.writeTime.seconds
        ));
        ;
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to delete the requested page",
            error.message,
            Date.now()
        ));
    }
};

function getPageFromNavBar(navBar, pageId) {
    if (Object.keys(navBar).includes(pageId)) {
        return navBar[pageId]
    } else {
        for (let key of Object.keys(navBar)) {
            if (Object.keys(navBar[key].children).length > 0) {
                return getPageFromNavBar(navBar[key].children, pageId)
            }
        }
    }
}

const generateNavBar = (pagesArray, parentId) => {
    let responseObject = {}

    for (let page of pagesArray) {
        if (page.data.metadata.parent === parentId) {
            let children = generateNavBar(pagesArray, page.id)
            responseObject[page.id] = {...page.data, children: children}
        }
    }
    return responseObject
}

import formidable from "formidable"
import fs from "fs"
const bucket = firebase.storage().bucket();

export const addImage = (req, res) => {
    const siteId = req.params.siteId
    const pageId = req.params.pageId
    const form = formidable({ multiples: false });

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(500).json({ message: 'Upload failed' });
        }

        const file = files.filename;

        // Check if a file was submitted
        if (!file || !file.newFilename || !file.filepath) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(file)


        // Generate a unique file name
        const fileName = `${file.newFilename}_${file.originalFilename}`;

        // Define the path where the file will be saved in Firebase Storage
        const storageFilePath = `${siteId}/${pageId}/content/images/${fileName}`;


        // Upload the file to Firebase Storage
        const uploadOptions = {
            destination: storageFilePath,
            public: true, // Set to false if you want to restrict access to the file
        };

        bucket.upload(file.filepath, uploadOptions, (err, uploadedFile) => {
            if (err) {
                console.error('Error uploading file:', err);
                return res.status(500).json({ message: 'Upload failed' });
            }

            // Delete the temporary file from the local filesystem
            fs.unlinkSync(file.filepath);

            // Get the public URL of the uploaded file
            const publicUrl = uploadedFile.publicUrl();

            // Return the public URL in the response
            res.json({
                imageUrl: publicUrl,
                originalFilename: file.originalFilename,
                newFilename: fileName,
            });
        });
    });
};

export async function deleteImage(req,res) {
    const bucketName = bucket.name;

    const siteId = req.params.siteId
    const pageId = req.params.pageId
    const imageName = req.params.imageName

    const storageFilePath = `${siteId}/${pageId}/content/images/${imageName}`

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

export async function getImagesByPage(req,res) {

    const siteId = req.params.siteId
    const pageId = req.params.pageId

    try {
        const options = {
            prefix: `${siteId}/${pageId}/content/images`,
        };

        const [files] = await bucket.getFiles(options);
        const imagesList = files.map(file => {
            return {
                name: file.name,
                timeCreated: file.metadata.timeCreated,
                contentType:file.metadata.contentType,
                url: file.publicUrl(),
                size: file.metadata.size,
                downloadUrl:file.metadata.mediaLink,
            }
        });

        res.status(201).send(new Response(
            'success',
            'empty',
            "Image deleted successfully",
            imagesList,
            Date.now()
        ));
    } catch (error) {
        res.status(400).send(new Response(
            'error',
            'empty',
            "Error while trying to delete the requested image",
            error.message,
            Date.now()
        ));
    }
}
