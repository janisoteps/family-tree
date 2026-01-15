import { Router } from 'express';
import { createPersonController, deletePersonController, updatePersonController } from '../controllers/person.controller';

const personRouter = Router();

personRouter.post('/', createPersonController);
personRouter.put('/:id', updatePersonController);
personRouter.delete('/:id', deletePersonController);

export default personRouter;
