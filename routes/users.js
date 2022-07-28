import express from 'express';

import {getUsers, createUser, getUser, deleteUser, updateUser, logInUser} from '../controllers/users.js';

const router = express.Router();

router.post('/create-user', createUser);

router.post('/login-user', logInUser);

router.get('/', getUsers);

router.get('/:id', getUser);

router.patch('/:id', updateUser);

router.delete('/:id', deleteUser);



export default router;