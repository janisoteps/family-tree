import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { createPerson, deletePerson, updatePerson, updatePersonPosition, clearPersonPosition } from '../services/person.service';

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
    position_x,
    position_y,
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
    position_x,
    position_y,
  });
  res.status(201).json(person);
};

export const deletePersonController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Person id is required' });
      return;
    }

    await deletePerson(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Person not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const updatePersonController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Person id is required' });
      return;
    }

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
      position_x,
      position_y,
    } = req.body;

    const person = await updatePerson(id, {
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
      position_x,
      position_y,
    });

    res.status(200).json(person);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Person not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('Invalid date format')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const updatePersonPositionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Person id is required' });
      return;
    }

    const { x, y } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number') {
      res.status(400).json({ error: 'x and y must be numbers' });
      return;
    }

    const person = await updatePersonPosition(id, x, y);

    res.status(200).json(person);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Person not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

export const clearPersonPositionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Person id is required' });
      return;
    }

    const person = await clearPersonPosition(id);

    res.status(200).json(person);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('Person not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};
