import express from 'express';

import {
    getUsers,
    createUser,
    getUser,
    deleteUser,
    updateUser,
    logInUser,
    refreshToken,
    searchUser,
    uploadGoogleAccount,
    addUserProfilePicture,
    deleteImage,
    sendPasswordReset,
    changePassword
} from '../controllers/users.js';

const router = express.Router();

router.post('/createUser', createUser);

router.post('/loginUser', logInUser);

router.post('/uploadGoogleAccount', uploadGoogleAccount);

router.post('/refreshToken', refreshToken);

router.get('/', getUsers);

router.get('/:id', getUser);

router.patch('/:id', updateUser);

router.patch('/resetPassword/:email', sendPasswordReset);

router.put('/changePassword', changePassword);

router.delete('/:id', deleteUser);

router.get('/searchUser/:query', searchUser);

router.post('/profilePicture/:userId', addUserProfilePicture);

router.delete('/profilePicture/:userId/:imageName', deleteImage);



export default router;