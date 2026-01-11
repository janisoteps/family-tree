import { Router } from 'express';
import { listAllNodesController } from '../controllers/node.controller';

const nodeRouter = Router();

nodeRouter.get('/', listAllNodesController);

export default nodeRouter;
