import firebase from '../db.js'
import PageResponse from "../models/pageResponse.js";
import pages from "../routes/pages.js";

const firestore = firebase.firestore()

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

        res.status(201).send(new PageResponse(
            'success',
            pageRef.id,
            "Page created successfully",
            data,
            response.writeTime.seconds
        ));
    } catch (error) {
        res.status(400).send(new PageResponse(
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
            res.status(201).send(new PageResponse(
                'success',
                pageRef.id,
                "Page retrieved successfully",
                pageData.data(),
                pageData.readTime.seconds
            ));
        }

    } catch (error) {
        res.status(400).send(new PageResponse(
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
            res.status(400).send(new PageResponse(
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
            res.status(201).send(new PageResponse(
                'success',
                'empty',
                "Pages retrieved successfully",
                responseArray,
                querySnapshot.readTime.seconds,

            ));
        }

    } catch (error) {
        res.status(400).send(new PageResponse(
            'error',
            'empty',
            "Error while retrieving the requested pages",
            error.message,
            Date.now()
        ));
    }
}

export const getNavbarBySiteId = async (req,res) => {
    try{
        let responseObject = {}
        const siteId = req.params.siteId;


        const flagRef = firestore.collection('sites').doc(siteId)
        const result = (await flagRef.get()).data()

        if(result.flagNavBarValid === false) {
            let pagesArray = []
            const pagesRef = firestore.collection('sites').doc(siteId).collection('pages');
            const querySnapshot = await pagesRef.get()
            if (querySnapshot.empty) {
                res.status(400).send(new PageResponse(
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
        }
        else{
            responseObject = result.navBar
        }

        res.status(201).send(new PageResponse(
            'success',
            'empty',
            "Navbar configuration retrieved successfully",
            responseObject,
            Date.now(),

        ));
    }
    catch (error){
        res.status(400).send(new PageResponse(
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
        res.status(201).send(new PageResponse(
            'success',
            pageRef.id,
            "Page updated successfully",
            data,
            response.writeTime.seconds
        ));

    } catch (error) {
        res.status(400).send(new PageResponse(
            'error',
            'empty',
            "Error while trying to update the requested page",
            error.message,
            Date.now()
        ));
    }
};

export const deletePage  = async (req, res) => {
    try {
        const siteId = req.params.siteId
        const pageId = req.params.pageId
        const response = await firestore.collection('sites')
            .doc(siteId)
            .collection('pages')
            .doc(pageId)
            .delete();
        res.status(201).send(new PageResponse(
            'success',
            'empty',
            "Page deleted successfully",
            'empty',
            response.writeTime.seconds
        ));;
    } catch (error) {
        res.status(400).send(new PageResponse(
            'error',
            'empty',
            "Error while trying to delete the requested page",
            error.message,
            Date.now()
        ));
    }
};

const generateNavBar = (pagesArray, parentId) => {
    let responseObject = {}

    for(let page of pagesArray){
        if(page.data.metadata.parent === parentId){
            let children = generateNavBar(pagesArray, page.id)
            responseObject[page.id] = {...page.data, children:children}
        }
    }
    return responseObject
}

