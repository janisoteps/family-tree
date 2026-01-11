import { Router } from 'express';
import { createParentOfController } from '../controllers/parentOf.controller';

const parentOfRouter = Router();

parentOfRouter.post('/', createParentOfController);

export default parentOfRouter;

