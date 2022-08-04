import express from 'express';

import {getUsers, createUser, getUser, deleteUser, updateUser, logInUser, refreshToken} from '../controllers/users.js';

const router = express.Router();

router.post('/createUser', createUser);

router.post('/loginUser', logInUser);

router.post('/refreshToken', refreshToken);

router.get('/', getUsers);

router.get('/:id', getUser);

router.patch('/:id', updateUser);

router.delete('/:id', deleteUser);



export default router;