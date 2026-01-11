import { Router } from 'express';
import { createPersonController } from '../controllers/person.controller';

const personRouter = Router();

personRouter.post('/', createPersonController);

export default personRouter;
