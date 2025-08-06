import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const locations = await storage.getLocations();
    res.json(locations.filter(l => l.isActive));
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newLocation = await storage.createLocation({
      name: name.trim(),
      description: description || null,
      isActive: true,
    });

    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

export default router;