import { Request, Response } from 'express';
import { getFamilyTreeGraph } from '../services/graph.service';

export const getFamilyTreeGraphController = async (req: Request, res: Response): Promise<void> => {
  const graph = await getFamilyTreeGraph();
  res.status(200).json(graph);
};

