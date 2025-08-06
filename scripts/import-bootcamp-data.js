import fs from 'fs';
import path from 'path';

// Read and parse CSV data
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 4) {
        const row = {
          date: values[0],
          email: values[1],
          skill: values[2],
          expertise: values[3],
          // Try to extract category from additional columns if present
          category: values.length > 4 ? values[4] : null
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

// Extract skill name from various formats
function extractSkillName(rawSkill) {
  if (!rawSkill) return null;

  // Remove brackets and category prefixes
  let skill = rawSkill
    .replace(/^(Technologies|Tools|Testing|Cloud services|Databases|Servers and runtimes)\s*\[/, '')
    .replace(/\]$/, '')
    .trim();

  // Skip question/instruction rows
  if (skill.toLowerCase().includes('please share') || 
      skill.toLowerCase().includes('indicate your level') ||
      skill === '') {
    return null;
  }

  return skill;
}

// Map expertise levels to our scale
function mapExpertiseLevel(expertise) {
  if (!expertise || expertise.trim() === '') return null;

  const level = expertise.toLowerCase();

  // Skip level 1 entirely (don't include these skills)
  if (level.includes("don't know") || level.includes("heard of it") || level.includes("(1)")) {
    return null;
  } else if (level.includes("didn't use it") || level.includes("tried it out") || level.includes("(2)")) {
    return "Beginner";
  } else if (level.includes("know well") || level.includes("several times") || level.includes("(3)")) {
    return "Advanced";
  } else if (level.includes("wide knowledge") || level.includes("reference for others") || level.includes("(4)")) {
    return "Expert";
  }

  return null;
}

// Categorize skills
function categorizeSkill(skillName) {
  const skill = skillName.toLowerCase();

  // Programming Languages
  if (skill.includes('javascript') || skill.includes('typescript') || skill.includes('python') ||
      skill.includes('java') || skill.includes('c#') || skill.includes('.net') ||
      skill.includes('node') || skill.includes('react') || skill.includes('angular') ||
      skill.includes('vue') || skill.includes('scala') || skill.includes('golang') ||
      skill.includes('c++') || skill.includes('cobol') || skill.includes('php') ||
      skill.includes('ruby') || skill.includes('swift') || skill.includes('kotlin') ||
      skill.includes('objective c') || skill.includes('unity 3d')) {
    return { categoryId: 1, knowledgeAreaId: 1 }; // Programming Language
  }

  // Development Tools
  if (skill.includes('jenkins') || skill.includes('jira') || skill.includes('trello') ||
      skill.includes('kubernetes') || skill.includes('terraform') || skill.includes('postman') ||
      skill.includes('docker') || skill.includes('splunk') || skill.includes('kibana') ||
      skill.includes('grafana') || skill.includes('datadog') || skill.includes('nifi') ||
      skill.includes('chef') || skill.includes('puppet') || skill.includes('power bi')) {
    return { categoryId: 2, knowledgeAreaId: 2 }; // Development Tool
  }

  // Testing Tools
  if (skill.includes('cucumber') || skill.includes('selenium') || skill.includes('soap-ui') ||
      skill.includes('testrail') || skill.includes('testmonitor') || skill.includes('xrail') ||
      skill.includes('testpad') || skill.includes('testcomplete') || skill.includes('webload') ||
      skill.includes('loadrunner') || skill.includes('jmeter') || skill.includes('redmine') ||
      skill.includes('appium') || skill.includes('kobiton') || skill.includes('ranorex') ||
      skill.includes('katalon') || skill.includes('browserstack') || skill.includes('perfecto') ||
      skill.includes('k6') || skill.includes('cypress')) {
    return { categoryId: 3, knowledgeAreaId: 2 }; // Testing Tool
  }

  // Cloud Services
  if (skill.includes('google') || skill.includes('aws') || skill.includes('azure') ||
      skill.includes('compute') || skill.includes('storage') || skill.includes('database') ||
      skill.includes('analytics') || skill.includes('networking') || skill.includes('security') ||
      skill.includes('devops') || skill.includes('virtual machines') || skill.includes('blob storage') ||
      skill.includes('active directory') || skill.includes('cosmos db') || skill.includes('logic apps') ||
      skill.includes('data factory') || skill.includes('content delivery') || skill.includes('backup') ||
      skill.includes('api management') || skill.includes('functions')) {
    return { categoryId: 4, knowledgeAreaId: 3 }; // Cloud Service
  }

  // Databases
  if (skill.includes('sql server') || skill.includes('oracle') || skill.includes('mysql') ||
      skill.includes('postgresql') || skill.includes('mongodb') || skill.includes('cassandra') ||
      skill.includes('couchbase') || skill.includes('elasticsearch') || skill.includes('redis') ||
      skill.includes('firebase')) {
    return { categoryId: 5, knowledgeAreaId: 4 }; // Database
  }

  // Mobile Development
  if (skill.includes('ios') || skill.includes('android') || skill.includes('react native') ||
      skill.includes('xamarin') || skill.includes('ionic')) {
    return { categoryId: 6, knowledgeAreaId: 1 }; // Mobile Development
  }

  // Automation & RPA
  if (skill.includes('ui path') || skill.includes('power automate') || skill.includes('automation anywhere') ||
      skill.includes('bash') || skill.includes('powershell')) {
    return { categoryId: 7, knowledgeAreaId: 5 }; // Automation Tool
  }

  // Infrastructure & Servers
  if (skill.includes('iis') || skill.includes('vmware') || skill.includes('sharepoint')) {
    return { categoryId: 8, knowledgeAreaId: 5 }; // Infrastructure
  }

  // Default to Programming Language for unknown skills
  return { categoryId: 1, knowledgeAreaId: 1 };
}

// Extract techie category from CSV data or calculate as fallback
function extractTechieCategory(csvData, email) {
  // Look for category in the CSV data first
  const userRows = csvData.filter(row => row.email === email);
  
  for (const row of userRows) {
    if (row.category) {
      const category = row.category.trim();
      if (['Starter', 'Builder', 'Solver', 'Wizard'].includes(category)) {
        return category;
      }
    }
    
    // Check if category might be in the skill column
    if (row.skill) {
      const skill = row.skill.trim();
      if (['Starter', 'Builder', 'Solver', 'Wizard'].includes(skill)) {
        return skill;
      }
    }
  }
  
  // Fallback: calculate based on skill profile
  return categorizeTechieFromSkills(userRows);
}

// Fallback categorization based on skill levels
function categorizeTechieFromSkills(memberSkills) {
  const expertSkills = memberSkills.filter(skill => skill.expertise && skill.expertise.toLowerCase().includes('wide knowledge'));
  const advancedSkills = memberSkills.filter(skill => skill.expertise && skill.expertise.toLowerCase().includes('know well'));
  const beginnerSkills = memberSkills.filter(skill => skill.expertise && (skill.expertise.toLowerCase().includes('tried') || skill.expertise.toLowerCase().includes('didn\'t use')));

  const totalSkills = memberSkills.length;
  const expertCount = expertSkills.length;
  const advancedCount = advancedSkills.length;

  // Categorize based on skill distribution and expertise level
  if (expertCount >= 8 || (expertCount >= 5 && advancedCount >= 10)) {
    return "Wizard";
  } else if (expertCount >= 3 || (expertCount >= 1 && advancedCount >= 6)) {
    return "Solver";
  } else if (advancedCount >= 3 || totalSkills >= 5) {
    return "Builder";
  } else {
    return "Starter";
  }
}

// Main import function
function importBootcampData() {
  console.log('Starting bootcamp data import...');

  // Parse CSV data
  const csvData = parseCSV('attached_assets/Bootcamp - skills - skills_1749674596307.csv');
  console.log(`Parsed ${csvData.length} CSV rows`);

  // Process data
  const emailToMember = new Map();
  const skillToId = new Map();
  const skills = [];
  const memberSkills = [];

  let memberId = 1;
  let skillId = 1;
  let memberSkillId = 1;

  // First pass: collect unique emails and skills
  for (const row of csvData) {
    const skillName = extractSkillName(row.skill);
    const level = mapExpertiseLevel(row.expertise);

    if (!skillName || !level) continue;

    // Add member if not exists
    if (!emailToMember.has(row.email)) {
      const name = row.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      emailToMember.set(row.email, {
        id: memberId++,
        name,
        email: row.email,
        techieCategory: "Builder", // Default category, will be updated later
        currentClient: "Talent Pool",
        location: "Remote",
        hireDate: new Date('2023-02-01').toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    // Add skill if not exists
    if (!skillToId.has(skillName)) {
      const category = categorizeSkill(skillName);
      skills.push({
        id: skillId,
        name: skillName,
        purpose: `${skillName} technology skill`,
        categoryId: category.categoryId,
        knowledgeAreaId: category.knowledgeAreaId,
        createdAt: new Date().toISOString()
      });
      skillToId.set(skillName, skillId++);
    }

    // Add member skill
    memberSkills.push({
      id: memberSkillId++,
      memberId: emailToMember.get(row.email).id,
      skillId: skillToId.get(skillName),
      level,
      createdAt: new Date().toISOString()
    });
  }

  // Second pass: apply techie category based on CSV data or calculated from skills
  for (const [email, member] of emailToMember) {
    const techieCategory = extractTechieCategory(csvData, email);
    member.techieCategory = techieCategory;
  }

  console.log(`Found ${emailToMember.size} unique members`);
  console.log(`Found ${skills.length} unique skills`);
  console.log(`Created ${memberSkills.length} member skill assessments`);

  // Create comprehensive data structure
  const bootcampData = {
    knowledgeAreas: [
      { id: 1, name: "Programming & Development", description: "Software development and programming technologies" },
      { id: 2, name: "Development Tools & Testing", description: "Development tools, testing frameworks and methodologies" },
      { id: 3, name: "Cloud & Infrastructure", description: "Cloud services and infrastructure technologies" },
      { id: 4, name: "Data & Analytics", description: "Database and data analytics technologies" },
      { id: 5, name: "Infrastructure & DevOps", description: "Infrastructure, DevOps and automation tools" }
    ],
    skillCategories: [
      { id: 1, name: "Programming Language", description: "Programming languages and frameworks", knowledgeAreaId: 1, scaleId: 1 },
      { id: 2, name: "Development Tool", description: "Development and project management tools", knowledgeAreaId: 2, scaleId: 1 },
      { id: 3, name: "Testing Tool", description: "Testing frameworks and tools", knowledgeAreaId: 2, scaleId: 1 },
      { id: 4, name: "Cloud Service", description: "Cloud platforms and services", knowledgeAreaId: 3, scaleId: 1 },
      { id: 5, name: "Database", description: "Database systems and technologies", knowledgeAreaId: 4, scaleId: 1 },
      { id: 6, name: "Mobile Development", description: "Mobile application development", knowledgeAreaId: 1, scaleId: 1 },
      { id: 7, name: "Automation Tool", description: "Automation and RPA tools", knowledgeAreaId: 5, scaleId: 1 },
      { id: 8, name: "Infrastructure", description: "Infrastructure and server technologies", knowledgeAreaId: 5, scaleId: 1 }
    ],
    skills,
    scales: [{
      id: 1,
      name: "Programming Experience",
      type: "qualitative",
      values: {
        "Beginner": 1,
        "Advanced": 2,
        "Expert": 3
      },
      createdAt: new Date().toISOString()
    }],
    members: Array.from(emailToMember.values()),
    memberProfiles: [],
    memberSkills,
    learningGoals: [],
    counters: {
      knowledgeAreaId: 6,
      skillCategoryId: 9,
      skillId: skillId,
      scaleId: 2,
      memberId: memberId,
      memberProfileId: 1,
      memberSkillId: memberSkillId,
      learningGoalId: 1
    }
  };

  // Write to file
  fs.writeFileSync('data/skills-data.json', JSON.stringify(bootcampData, null, 2));
  console.log('Bootcamp data imported successfully!');

  return bootcampData;
}

// Execute import
const result = importBootcampData();
console.log(`\nImport Summary:
- Members: ${result.members.length}
- Skills: ${result.skills.length} 
- Member Skills: ${result.memberSkills.length}
- Knowledge Areas: ${result.knowledgeAreas.length}
- Skill Categories: ${result.skillCategories.length}`);