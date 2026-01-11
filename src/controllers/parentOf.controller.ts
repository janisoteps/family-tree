import { Request, Response } from 'express';
import { createParentOf } from '../services/parentOf.service';

export const createParentOfController = async (req: Request, res: Response): Promise<void> => {
  const { parent_id, child_id, parent_type } = req.body;

  const parentOf = await createParentOf({
    parent_id,
    child_id,
    parent_type,
  });
  res.status(201).json(parentOf);
};

