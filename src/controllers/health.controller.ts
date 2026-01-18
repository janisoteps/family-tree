import { Request, Response } from 'express';

export const healthController = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
};
