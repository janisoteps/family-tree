import { Router } from 'express';
import { createUnionController } from '../controllers/union.controller';

const unionRouter = Router();

unionRouter.post('/', createUnionController);

export default unionRouter;

