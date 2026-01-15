import { Router } from 'express';
import { createPersonController, deletePersonController, updatePersonController, updatePersonPositionController, clearPersonPositionController } from '../controllers/person.controller';

const personRouter = Router();

personRouter.post('/', createPersonController);
personRouter.patch('/:id/position', updatePersonPositionController);
personRouter.delete('/:id/position', clearPersonPositionController);
personRouter.put('/:id', updatePersonController);
personRouter.delete('/:id', deletePersonController);

export default personRouter;
