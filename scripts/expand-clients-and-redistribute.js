import fs from 'fs';
import path from 'path';

// Script to expand client list and redistribute work history for more variety

const dataPath = path.join(process.cwd(), '..', 'data', 'skills-data.json');

function expandClientsAndRedistribute() {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Expanded client list with diverse industries
    const newClients = [
      {
        id: 1,
        name: "Talent Pool",
        description: "Internal talent pool for unassigned resources",
        isActive: true
      },
      {
        id: 2,
        name: "TechCorp",
        description: "Enterprise software solutions company",
        isActive: true
      },
      {
        id: 3,
        name: "Buildertrend",
        description: "Construction management software platform",
        isActive: true
      },
      {
        id: 4,
        name: "FinanceFlow",
        description: "Financial technology and banking solutions",
        isActive: true
      },
      {
        id: 5,
        name: "HealthTech Solutions",
        description: "Healthcare technology and medical software",
        isActive: true
      },
      {
        id: 6,
        name: "RetailMax",
        description: "E-commerce and retail management platform",
        isActive: true
      },
      {
        id: 7,
        name: "EduTech Pro",
        description: "Educational technology and learning platforms",
        isActive: true
      },
      {
        id: 8,
        name: "DataVault Systems",
        description: "Data analytics and business intelligence",
        isActive: true
      },
      {
        id: 9,
        name: "CloudFirst Technologies",
        description: "Cloud infrastructure and migration services",
        isActive: true
      },
      {
        id: 10,
        name: "MobileApp Innovations",
        description: "Mobile application development and consulting",
        isActive: true
      },
      {
        id: 11,
        name: "SecureNet Solutions",
        description: "Cybersecurity and network protection services",
        isActive: true
      },
      {
        id: 12,
        name: "AgriTech Partners",
        description: "Agricultural technology and farming solutions",
        isActive: true
      }
    ];

    // Update clients
    data.clients = newClients;
    data.counters.clientId = 13;

    // Function to get random client ID (excluding Talent Pool for assignments)
    function getRandomClientId(excludeIds = []) {
      const availableIds = newClients
        .filter(client => !excludeIds.includes(client.id) && client.id !== 1)
        .map(client => client.id);
      return availableIds[Math.floor(Math.random() * availableIds.length)];
    }

    // Function to get random date in past 2 years
    function getRandomPastDate() {
      const now = new Date();
      const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
      return new Date(twoYearsAgo.getTime() + Math.random() * (now.getTime() - twoYearsAgo.getTime()));
    }

    // Update member current client assignments for better distribution
    let currentClientCounter = 2; // Start from TechCorp
    data.members?.forEach((member, index) => {
      if (member.currentClientId && member.currentClientId !== 1) {
        // Distribute members across different clients
        member.currentClientId = currentClientCounter;
        currentClientCounter++;
        if (currentClientCounter > 12) currentClientCounter = 2; // Reset to TechCorp, skip Talent Pool
      }
    });

    // Update member profiles with varied client history
    data.memberProfiles?.forEach((profile, profileIndex) => {
      const usedClientIds = new Set();
      
      // Update assignments with diverse clients
      if (profile.assignments) {
        profile.assignments.forEach((assignment, assignmentIndex) => {
          let newClientId;
          do {
            newClientId = getRandomClientId(Array.from(usedClientIds));
          } while (usedClientIds.has(newClientId) && usedClientIds.size < 8);
          
          assignment.clientId = newClientId;
          usedClientIds.add(newClientId);
          
          // Update dates
          assignment.startDate = getRandomPastDate().toISOString();
          if (assignment.endDate) {
            const startDate = new Date(assignment.startDate);
            const endDate = new Date(startDate.getTime() + (Math.random() * 365 * 24 * 60 * 60 * 1000)); // Random duration up to 1 year
            assignment.endDate = endDate.toISOString();
          }
        });
      }

      // Update appreciations with diverse clients
      if (profile.appreciations) {
        profile.appreciations.forEach((appreciation, appreciationIndex) => {
          let newClientId;
          do {
            newClientId = getRandomClientId(Array.from(usedClientIds));
          } while (usedClientIds.has(newClientId) && usedClientIds.size < 8);
          
          appreciation.clientId = newClientId;
          usedClientIds.add(newClientId);
          
          // Update date
          appreciation.date = getRandomPastDate().toISOString();
        });
      }

      // Update client history with diverse clients and roles
      if (profile.clientHistory) {
        const roles = [
          "Software Developer", "Senior Developer", "Tech Lead", "Project Manager",
          "QA Engineer", "DevOps Engineer", "Data Analyst", "Business Analyst",
          "Scrum Master", "Product Owner", "UI/UX Designer", "Solutions Architect"
        ];

        profile.clientHistory.forEach((history, historyIndex) => {
          let newClientId;
          do {
            newClientId = getRandomClientId(Array.from(usedClientIds));
          } while (usedClientIds.has(newClientId) && usedClientIds.size < 8);
          
          history.clientId = newClientId;
          history.role = roles[Math.floor(Math.random() * roles.length)];
          usedClientIds.add(newClientId);
          
          // Update dates
          history.startDate = getRandomPastDate().toISOString();
          if (history.endDate) {
            const startDate = new Date(history.startDate);
            const endDate = new Date(startDate.getTime() + (Math.random() * 365 * 24 * 60 * 60 * 1000));
            history.endDate = endDate.toISOString();
          }
        });
      }
    });

    // Write updated data back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log('✓ Successfully expanded client list to 12 diverse clients');
    console.log('✓ Redistributed member current client assignments');
    console.log('✓ Updated work history with varied client assignments');
    console.log('✓ Refreshed dates and roles for realistic diversity');
    
  } catch (error) {
    console.error('Error expanding clients and redistributing:', error);
  }
}

expandClientsAndRedistribute();