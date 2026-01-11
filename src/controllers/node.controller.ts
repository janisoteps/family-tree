import { Request, Response } from 'express';
import { listAllNodes } from '../services/node.service';

export const listAllNodesController = async (req: Request, res: Response): Promise<void> => {
  const nodes = await listAllNodes();
  res.status(200).json(nodes);
};
