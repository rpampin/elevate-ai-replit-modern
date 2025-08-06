import fs from 'fs';
import path from 'path';

// Script to update all member client histories with realistic work progression

function updateClientHistories() {
  const dataPath = path.join(process.cwd(), 'data', 'skills-data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.log('Data file not found, updating in-memory storage...');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  
  // Available clients (12 total)
  const clients = [
    { id: 1, name: "Talent Pool" },
    { id: 2, name: "TechCorp Solutions" },
    { id: 3, name: "FinanceFlow" },
    { id: 4, name: "HealthTech Solutions" },
    { id: 5, name: "RetailMax" },
    { id: 6, name: "EduTech Pro" },
    { id: 7, name: "DataVault Systems" },
    { id: 8, name: "CloudFirst Technologies" },
    { id: 9, name: "MobileApp Innovations" },
    { id: 10, name: "SecureNet Solutions" },
    { id: 11, name: "AgriTech Partners" },
    { id: 12, name: "InnovateLab" }
  ];

  // Generate realistic work history for each member
  data.memberProfiles?.forEach((profile, index) => {
    const memberId = profile.memberId;
    const member = data.members?.find(m => m.id === memberId);
    
    if (!member) return;

    // Determine member's career stage based on category
    const careerStages = {
      'Starter': { minYears: 0.5, maxYears: 1.5, maxClients: 2 },
      'Junior': { minYears: 1, maxYears: 2.5, maxClients: 3 },
      'Mid-level': { minYears: 2, maxYears: 4, maxClients: 4 },
      'Senior': { minYears: 3, maxYears: 6, maxClients: 5 },
      'Wizard': { minYears: 4, maxYears: 8, maxClients: 6 },
      'Guru': { minYears: 5, maxYears: 10, maxClients: 7 }
    };

    const stage = careerStages[member.category] || careerStages['Mid-level'];
    
    // Generate work history
    const workHistory = generateWorkHistory(memberId, stage, clients, index);
    
    // Update member profile with new client history
    profile.clientHistory = workHistory.history;
    
    // Update member's current client based on work history
    member.currentClientId = workHistory.currentClientId;
    
    console.log(`Updated ${member.fullName} (${member.category}): ${workHistory.history.length} work periods, current client: ${clients.find(c => c.id === workHistory.currentClientId)?.name}`);
  });

  // Write updated data back to file
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log('Client histories updated successfully!');
}

function generateWorkHistory(memberId, stage, clients, memberIndex) {
  const now = new Date();
  const startYear = 2022;
  const currentYear = now.getFullYear();
  
  // Determine member status (30% in Talent Pool, 15% ending soon, 55% actively working)
  const statusRoll = (memberId + memberIndex) % 100;
  let memberStatus;
  
  if (statusRoll < 30) {
    memberStatus = 'talent_pool'; // Currently in Talent Pool
  } else if (statusRoll < 45) {
    memberStatus = 'ending_soon'; // Ending assignment soon (within 2 months)
  } else {
    memberStatus = 'active'; // Actively working with client
  }

  const history = [];
  let currentDate = new Date(startYear, 0, 1); // Start from beginning of 2022
  let usedClientIds = new Set();
  let periodCount = 0;
  const maxPeriods = Math.min(stage.maxClients, Math.floor(Math.random() * 3) + 2);

  while (currentDate < now && periodCount < maxPeriods) {
    // Select client (avoid Talent Pool for first assignment if possible)
    let availableClients = clients.filter(c => 
      c.id !== 1 && !usedClientIds.has(c.id)
    );
    
    if (availableClients.length === 0) {
      availableClients = clients.filter(c => c.id !== 1);
    }
    
    const client = availableClients[Math.floor(Math.random() * availableClients.length)];
    usedClientIds.add(client.id);

    // Generate assignment duration (3-18 months)
    const minDuration = 3;
    const maxDuration = Math.min(18, 12 + (periodCount * 3)); // Longer assignments for experienced members
    const durationMonths = Math.floor(Math.random() * (maxDuration - minDuration + 1)) + minDuration;
    
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
    // Ensure we don't go beyond current date for completed assignments
    if (endDate > now) {
      endDate.setTime(now.getTime());
    }

    history.push({
      id: `work-${memberId}-${periodCount + 1}`,
      clientId: client.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate >= now ? null : endDate.toISOString().split('T')[0],
      status: endDate >= now ? 'active' : 'completed'
    });

    // Move to next period (add 1-3 month gap for Talent Pool periods)
    currentDate = new Date(endDate);
    if (endDate < now && periodCount < maxPeriods - 1) {
      const gapMonths = Math.floor(Math.random() * 3) + 1;
      currentDate.setMonth(currentDate.getMonth() + gapMonths);
      
      // Add Talent Pool period if there's a gap
      if (currentDate < now) {
        const talentPoolEnd = new Date(currentDate);
        talentPoolEnd.setMonth(talentPoolEnd.getMonth() + Math.floor(Math.random() * 2) + 1);
        
        if (talentPoolEnd > now) {
          talentPoolEnd.setTime(now.getTime());
        }

        history.push({
          id: `talent-${memberId}-${periodCount + 1}`,
          clientId: 1, // Talent Pool
          startDate: endDate.toISOString().split('T')[0],
          endDate: talentPoolEnd >= now ? null : talentPoolEnd.toISOString().split('T')[0],
          status: talentPoolEnd >= now ? 'active' : 'completed'
        });

        currentDate = talentPoolEnd;
      }
    }

    periodCount++;
  }

  // Determine current client based on status and last assignment
  let currentClientId = 1; // Default to Talent Pool

  if (history.length > 0) {
    const lastAssignment = history[history.length - 1];
    
    if (memberStatus === 'talent_pool') {
      // Force into Talent Pool
      if (lastAssignment.clientId !== 1) {
        // End current assignment and add Talent Pool period
        lastAssignment.endDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        lastAssignment.status = 'completed';
        
        history.push({
          id: `talent-${memberId}-current`,
          clientId: 1,
          startDate: lastAssignment.endDate,
          endDate: null,
          status: 'active'
        });
      }
      currentClientId = 1;
    } else if (memberStatus === 'ending_soon') {
      // Ending assignment within 2 months
      if (lastAssignment.status === 'active' && lastAssignment.clientId !== 1) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + Math.floor(Math.random() * 2) + 1);
        lastAssignment.endDate = endDate.toISOString().split('T')[0];
        currentClientId = lastAssignment.clientId;
      } else {
        currentClientId = 1; // Talent Pool
      }
    } else {
      // Active assignment
      if (lastAssignment.status === 'active') {
        currentClientId = lastAssignment.clientId;
      } else {
        // Start new assignment
        const availableClients = clients.filter(c => c.id !== 1);
        const newClient = availableClients[Math.floor(Math.random() * availableClients.length)];
        
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6));
        
        history.push({
          id: `work-${memberId}-current`,
          clientId: newClient.id,
          startDate: startDate.toISOString().split('T')[0],
          endDate: null,
          status: 'active'
        });
        
        currentClientId = newClient.id;
      }
    }
  }

  return {
    history: history.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    currentClientId
  };
}

// Run the update
updateClientHistories();