import { Router } from 'express';
import personRouter from './person.route';
import nodeRouter from './node.route';
import unionRouter from './union.route';
import parentOfRouter from './parentOf.route';
import graphRouter from './graph.route';

const v1Router = Router();

v1Router.use('/node', nodeRouter);
v1Router.use('/person', personRouter);
v1Router.use('/union', unionRouter);
v1Router.use('/parent_of', parentOfRouter);
v1Router.use('/graph', graphRouter);

export default v1Router;
