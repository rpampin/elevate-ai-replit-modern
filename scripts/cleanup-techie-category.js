
const fs = require('fs');
const path = require('path');

// Read the current data
const dataPath = path.join(__dirname, '../data/skills-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Remove techieCategory from all members
data.members = data.members.map(member => {
  // Create a new object without techieCategory
  const cleanMember = { ...member };
  delete cleanMember.techieCategory;
  return cleanMember;
});

// Write the cleaned data back
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('Successfully removed techieCategory field from all members');
console.log(`Processed ${data.members.length} members`);
