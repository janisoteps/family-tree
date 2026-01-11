import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { createPerson } from '../services/person.service';

export const createPersonController = async (req: Request, res: Response): Promise<void> => {
  const {
    first_name,
    last_name,
    maiden_name,
    birth_date,
    death_date,
    birth_place,
    death_place,
    gender,
    occupation,
    notes,
    photo_url,
    email,
    phone,
    current_address,
    data,
  } = req.body;
  const id = randomUUID();

  const person = await createPerson({
    id,
    first_name,
    last_name,
    maiden_name,
    birth_date,
    death_date,
    birth_place,
    death_place,
    gender,
    occupation,
    notes,
    photo_url,
    email,
    phone,
    current_address,
    data,
  });
  res.status(201).json(person);
};
