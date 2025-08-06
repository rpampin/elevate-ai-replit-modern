import { Router } from 'express';
import { storage } from '../storage';
import { insertClientSchema } from '../../shared/schema';

export const clientsRouter = Router();

// Get all clients
clientsRouter.get('/', async (req, res) => {
  try {
    const clients = await storage.getClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Get client by ID
clientsRouter.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const client = await storage.getClient(id);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// Create new client
clientsRouter.post('/', async (req, res) => {
  try {
    const validatedData = insertClientSchema.parse(req.body);
    const client = await storage.createClient(validatedData);
    res.status(201).json(client);
  } catch (error) {
    res.status(400).json({ error: 'Invalid client data' });
  }
});

// Update client
clientsRouter.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertClientSchema.partial().parse(req.body);
    const client = await storage.updateClient(id, validatedData);
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(400).json({ error: 'Invalid client data' });
  }
});

// Delete client
clientsRouter.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await storage.deleteClient(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});