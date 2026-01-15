import { Router } from 'express';
import { getFamilyTreeGraphController } from '../controllers/graph.controller';

const graphRouter = Router();

graphRouter.get('/', getFamilyTreeGraphController);

export default graphRouter;

