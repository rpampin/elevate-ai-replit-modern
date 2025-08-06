import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const categories = await storage.getCategories();
    res.json(categories.filter(c => c.isActive));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newCategory = await storage.createCategory({
      name: name.trim(),
      description: description || null,
      isActive: true,
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default router;