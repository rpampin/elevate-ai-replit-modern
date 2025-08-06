import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateMemberLocations() {
  const dataPath = path.join(process.cwd(), 'data', 'skills-data.json');
  
  try {
    // Read existing data
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    // Country location IDs: 1=Argentina, 2=Uruguay, 3=Chile, 4=Brazil, 5=Colombia
    const locationIds = [1, 2, 3, 4, 5];
    
    console.log(`Updating locations for ${data.members.length} members...`);
    
    // Update each member with a random location
    data.members.forEach((member, index) => {
      const randomLocationId = locationIds[Math.floor(Math.random() * locationIds.length)];
      member.locationId = randomLocationId;
      
      const locationName = data.locations.find(loc => loc.id === randomLocationId)?.name || 'Unknown';
      console.log(`Member ${member.id} (${member.name}) -> ${locationName}`);
    });
    
    // Update counter to reflect the new locations
    data.counters.locationId = 6;
    
    // Write updated data back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log('\nLocation update completed successfully!');
    console.log('Summary by country:');
    
    // Show distribution summary
    const distribution = {};
    data.members.forEach(member => {
      const locationName = data.locations.find(loc => loc.id === member.locationId)?.name;
      distribution[locationName] = (distribution[locationName] || 0) + 1;
    });
    
    Object.entries(distribution).forEach(([country, count]) => {
      console.log(`${country}: ${count} members`);
    });
    
  } catch (error) {
    console.error('Error updating member locations:', error);
  }
}

updateMemberLocations();