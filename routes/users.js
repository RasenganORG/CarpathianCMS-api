import express from 'express';

import { getUsers, createUser, getUser, deleteUser, updateUser } from '../controllers/users.js';

const router = express.Router();

router.post('/', createUser);

router.get('/', getUsers);

router.get('/:id', getUser);

router.patch('/:id', updateUser);

router.delete('/:id', deleteUser);



export default router;