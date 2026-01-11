import { Request, Response } from 'express';
import { createUnion } from '../services/union.service';

export const createUnionController = async (req: Request, res: Response): Promise<void> => {
  const {
    person1_id,
    person2_id,
    unionId,
    type,
    startDate,
    endDate,
    place,
    status,
    notes,
  } = req.body;

  const union = await createUnion({
    person1_id,
    person2_id,
    unionId,
    type,
    startDate,
    endDate,
    place,
    status,
    notes,
  });
  res.status(201).json(union);
};

