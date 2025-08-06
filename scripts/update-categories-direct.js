import fs from 'fs';
import path from 'path';

// Parse CSV data
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 4) {
        const row = {
          date: values[0],
          email: values[1],
          skill: values[2],
          expertise: values[3]
        };
        data.push(row);
      }
    }
  }
  return data;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// Map expertise levels to numeric scores for categorization
function getExpertiseScore(expertise) {
  if (!expertise || expertise.trim() === '') return 0;

  const level = expertise.toLowerCase();

  if (level.includes("don't know") || level.includes("heard of it") || level.includes("(1)")) {
    return 0; // Skip these entirely
  } else if (level.includes("didn't use it") || level.includes("tried it out") || level.includes("(2)")) {
    return 2; // Beginner level
  } else if (level.includes("know well") || level.includes("several times") || level.includes("(3)")) {
    return 3; // Advanced level
  } else if (level.includes("wide knowledge") || level.includes("reference for others") || level.includes("(4)")) {
    return 4; // Expert level
  }

  return 0;
}

// Categorize member based on skill profile
function categorizeFromSkills(memberSkills) {
  const validSkills = memberSkills.filter(skill => getExpertiseScore(skill.expertise) > 0);
  const totalSkills = validSkills.length;
  
  const expertSkills = validSkills.filter(skill => getExpertiseScore(skill.expertise) === 4);
  const advancedSkills = validSkills.filter(skill => getExpertiseScore(skill.expertise) === 3);
  const beginnerSkills = validSkills.filter(skill => getExpertiseScore(skill.expertise) === 2);

  const expertCount = expertSkills.length;
  const advancedCount = advancedSkills.length;
  const beginnerCount = beginnerSkills.length;

  console.log(`  Skills analysis: ${totalSkills} total, ${expertCount} expert, ${advancedCount} advanced, ${beginnerCount} beginner`);

  // Categorization logic based on skill distribution
  if (expertCount >= 8 || (expertCount >= 5 && advancedCount >= 10)) {
    return "Wizard";
  } else if (expertCount >= 3 || (expertCount >= 1 && advancedCount >= 8)) {
    return "Solver";
  } else if (advancedCount >= 4 || (advancedCount >= 2 && totalSkills >= 8)) {
    return "Builder";
  } else {
    return "Starter";
  }
}

async function updateMemberCategoriesFromCSV() {
  console.log('Starting member category update from CSV...');
  
  try {
    // Parse CSV data
    const csvData = parseCSV('attached_assets/Bootcamp - skills - skills_1749674596307.csv');
    console.log(`Parsed ${csvData.length} CSV rows`);

    // Load current JSON data
    const dataPath = path.join(process.cwd(), 'data', 'skills-data.json');
    const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    
    console.log(`Found ${jsonData.members.length} members in system`);
    console.log('Available categories:', jsonData.categories?.map(c => `${c.id}: ${c.name}`) || 'No categories found');

    // Create category mapping
    const categoryMap = {
      'Starter': 1,
      'Builder': 2,
      'Solver': 3,
      'Wizard': 4
    };

    console.log('Category mapping:', categoryMap);

    // Group CSV data by email
    const csvByEmail = new Map();
    csvData.forEach(row => {
      if (!csvByEmail.has(row.email)) {
        csvByEmail.set(row.email, []);
      }
      csvByEmail.get(row.email).push(row);
    });

    console.log(`Found skills data for ${csvByEmail.size} unique emails`);

    let updatedCount = 0;
    let matchedCount = 0;

    // Process each member
    for (const member of jsonData.members) {
      console.log(`\nProcessing member: ${member.name} (${member.email})`);
      
      // Find member's skills in CSV
      const memberSkills = csvByEmail.get(member.email) || [];
      
      if (memberSkills.length === 0) {
        console.log(`  No CSV data found for ${member.email} - keeping current category`);
        continue;
      }

      matchedCount++;
      console.log(`  Found ${memberSkills.length} skills in CSV`);

      // Determine category based on skills
      const newCategory = categorizeFromSkills(memberSkills);
      const newCategoryId = categoryMap[newCategory];

      if (!newCategoryId) {
        console.log(`  Could not find category ID for ${newCategory}`);
        continue;
      }

      const currentCategoryName = Object.keys(categoryMap).find(key => categoryMap[key] === member.categoryId) || 'Unknown';
      
      if (member.categoryId !== newCategoryId) {
        console.log(`  Updating category: ${currentCategoryName} -> ${newCategory}`);
        member.categoryId = newCategoryId;
        updatedCount++;
      } else {
        console.log(`  Category already correct: ${newCategory}`);
      }
    }

    // Save updated JSON data
    fs.writeFileSync(dataPath, JSON.stringify(jsonData, null, 2));

    console.log('\n✅ Member category update completed');
    console.log(`Members processed: ${jsonData.members.length}`);
    console.log(`Members with CSV data: ${matchedCount}`);
    console.log(`Members updated: ${updatedCount}`);
    
    // Show final distribution
    const distribution = {};
    jsonData.members.forEach(member => {
      const categoryName = Object.keys(categoryMap).find(key => categoryMap[key] === member.categoryId) || 'Unknown';
      distribution[categoryName] = (distribution[categoryName] || 0) + 1;
    });
    
    console.log('\nFinal category distribution:', distribution);
    
  } catch (error) {
    console.error('Error updating member categories:', error);
  }
}

// Execute the update
updateMemberCategoriesFromCSV().catch(console.error);