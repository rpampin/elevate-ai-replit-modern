import fs from 'fs';
import path from 'path';

// Migration script to convert string client references to Client model with IDs

function migrateToClientModel() {
  const dataPath = path.join(process.cwd(), 'data', 'skills-data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('No data file found, skipping migration');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Extract all unique client names from existing data
  const clientNames = new Set();
  
  // Extract from members currentClient
  data.members?.forEach(member => {
    if (member.currentClient && typeof member.currentClient === 'string') {
      clientNames.add(member.currentClient);
    }
  });
  
  // Extract from member profiles
  data.memberProfiles?.forEach(profile => {
    // From assignments
    profile.assignments?.forEach(assignment => {
      if (assignment.client && typeof assignment.client === 'string') {
        clientNames.add(assignment.client);
      }
    });
    
    // From appreciations
    profile.appreciations?.forEach(appreciation => {
      if (appreciation.client && typeof appreciation.client === 'string') {
        clientNames.add(appreciation.client);
      }
    });
    
    // From client history
    profile.clientHistory?.forEach(history => {
      if (history.client && typeof history.client === 'string') {
        clientNames.add(history.client);
      }
    });
  });
  
  console.log('Found unique clients:', Array.from(clientNames));
  
  // Create Client records
  const clients = Array.from(clientNames).map((name, index) => ({
    id: index + 1,
    name: name,
    description: null,
    isActive: true
  }));
  
  // Create client name to ID mapping
  const clientNameToId = {};
  clients.forEach(client => {
    clientNameToId[client.name] = client.id;
  });
  
  console.log('Client mapping:', clientNameToId);
  
  // Update members to use currentClientId instead of currentClient
  data.members?.forEach(member => {
    if (member.currentClient && typeof member.currentClient === 'string') {
      member.currentClientId = clientNameToId[member.currentClient];
      delete member.currentClient;
    }
  });
  
  // Update member profiles to use clientId instead of client strings
  data.memberProfiles?.forEach(profile => {
    // Update assignments
    profile.assignments?.forEach(assignment => {
      if (assignment.client && typeof assignment.client === 'string') {
        assignment.clientId = clientNameToId[assignment.client];
        delete assignment.client;
      }
    });
    
    // Update appreciations
    profile.appreciations?.forEach(appreciation => {
      if (appreciation.client && typeof appreciation.client === 'string') {
        appreciation.clientId = clientNameToId[appreciation.client];
        delete appreciation.client;
      }
    });
    
    // Update client history
    profile.clientHistory?.forEach(history => {
      if (history.client && typeof history.client === 'string') {
        history.clientId = clientNameToId[history.client];
        delete history.client;
      }
    });
  });
  
  // Add clients to data structure
  data.clients = clients;
  
  // Initialize client counter
  if (!data.counters) {
    data.counters = {};
  }
  data.counters.clientId = clients.length + 1;
  
  // Write updated data back to file
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  
  console.log(`Migration completed! Created ${clients.length} client records.`);
  console.log('Client records created:', clients.map(c => `${c.id}: ${c.name}`));
}

// Run migration
try {
  migrateToClientModel();
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}