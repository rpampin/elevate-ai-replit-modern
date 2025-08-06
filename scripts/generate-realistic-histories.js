import { JsonStorage } from '../server/json-storage.js';

// Generate realistic client histories for all members

async function generateRealisticHistories() {
  const storage = new JsonStorage();
  
  // Get all members and clients
  const members = await storage.getMembers();
  const clients = await storage.getClients();
  
  console.log(`Updating client histories for ${members.length} members across ${clients.length} clients...`);
  
  // Career progression data
  const careerStages = {
    'Starter': { experience: 0.5, maxAssignments: 2, avgDuration: 4 },
    'Junior': { experience: 1.5, maxAssignments: 3, avgDuration: 6 },
    'Mid-level': { experience: 3, maxAssignments: 4, avgDuration: 8 },
    'Senior': { experience: 5, maxAssignments: 5, avgDuration: 10 },
    'Wizard': { experience: 7, maxAssignments: 6, avgDuration: 12 },
    'Guru': { experience: 10, maxAssignments: 7, avgDuration: 14 }
  };

  // Process each member
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const memberProfile = await storage.getMemberProfile(member.id);
    
    if (!memberProfile) continue;

    // Determine status distribution
    const statusSeed = (member.id * 7 + i * 3) % 100;
    let memberStatus;
    
    if (statusSeed < 25) {
      memberStatus = 'talent_pool'; // 25% in Talent Pool
    } else if (statusSeed < 40) {
      memberStatus = 'ending_soon'; // 15% ending assignments soon
    } else {
      memberStatus = 'active_work'; // 60% actively working
    }

    // Generate work history
    const stage = careerStages[member.category] || careerStages['Mid-level'];
    const workHistory = generateMemberHistory(member, stage, clients, memberStatus, i);
    
    // Update member profile
    const updatedProfile = {
      ...memberProfile,
      clientHistory: workHistory.history,
      assignments: generateAssignments(workHistory.history, clients),
      roles: generateRoles(member.category, workHistory.history.length),
      appreciations: generateAppreciations(workHistory.history, clients),
      feedbackComments: generateFeedback(member.category, workHistory.history.length)
    };

    await storage.updateMemberProfile(memberProfile.id, updatedProfile);
    
    // Update member's current client
    await storage.updateMember(member.id, { 
      currentClientId: workHistory.currentClientId 
    });

    const currentClient = clients.find(c => c.id === workHistory.currentClientId);
    console.log(`${member.name} (${member.category}): ${workHistory.history.length} periods, current: ${currentClient?.name}, status: ${memberStatus}`);
  }

  console.log('Client histories updated successfully!');
}

function generateMemberHistory(member, stage, clients, memberStatus, seed) {
  const now = new Date();
  const startDate = new Date(member.hireDate);
  
  // Filter out Talent Pool for regular assignments
  const workClients = clients.filter(c => c.name !== 'Talent Pool');
  const talentPool = clients.find(c => c.name === 'Talent Pool');
  
  const history = [];
  let currentDate = new Date(startDate);
  let usedClients = new Set();
  let assignmentCount = 0;
  const maxAssignments = Math.min(stage.maxAssignments, Math.floor(Math.random() * 3) + 2);

  // Generate work periods
  while (currentDate < now && assignmentCount < maxAssignments) {
    // Select client (prefer not recently used)
    let availableClients = workClients.filter(c => !usedClients.has(c.id));
    if (availableClients.length === 0) {
      availableClients = workClients;
      usedClients.clear();
    }
    
    const clientIndex = (seed + assignmentCount * 7) % availableClients.length;
    const selectedClient = availableClients[clientIndex];
    usedClients.add(selectedClient.id);

    // Assignment duration (3-15 months based on seniority)
    const baseDuration = stage.avgDuration;
    const variation = Math.floor(Math.random() * 6) - 3; // ±3 months
    const durationMonths = Math.max(3, Math.min(15, baseDuration + variation));
    
    const assignmentStart = new Date(currentDate);
    const assignmentEnd = new Date(currentDate);
    assignmentEnd.setMonth(assignmentEnd.getMonth() + durationMonths);
    
    // Don't extend beyond current date
    if (assignmentEnd > now) {
      assignmentEnd.setTime(now.getTime());
    }

    const isCurrentAssignment = assignmentEnd >= now;
    
    history.push({
      id: `assignment-${member.id}-${assignmentCount + 1}`,
      clientId: selectedClient.id,
      startDate: assignmentStart.toISOString().split('T')[0],
      endDate: isCurrentAssignment ? null : assignmentEnd.toISOString().split('T')[0],
      status: isCurrentAssignment ? 'active' : 'completed'
    });

    currentDate = new Date(assignmentEnd);
    
    // Add gap period (Talent Pool) if not the last assignment and assignment is completed
    if (!isCurrentAssignment && assignmentCount < maxAssignments - 1 && currentDate < now) {
      const gapDuration = Math.floor(Math.random() * 3) + 1; // 1-3 months
      const gapEnd = new Date(currentDate);
      gapEnd.setMonth(gapEnd.getMonth() + gapDuration);
      
      if (gapEnd > now) {
        gapEnd.setTime(now.getTime());
      }

      const isCurrentGap = gapEnd >= now;
      
      history.push({
        id: `gap-${member.id}-${assignmentCount + 1}`,
        clientId: talentPool.id,
        startDate: assignmentEnd.toISOString().split('T')[0],
        endDate: isCurrentGap ? null : gapEnd.toISOString().split('T')[0],
        status: isCurrentGap ? 'active' : 'completed'
      });

      currentDate = new Date(gapEnd);
    }

    assignmentCount++;
  }

  // Adjust final status based on desired member status
  let currentClientId = talentPool.id; // Default

  if (history.length > 0) {
    const lastPeriod = history[history.length - 1];
    
    switch (memberStatus) {
      case 'talent_pool':
        // Ensure member is in Talent Pool
        if (lastPeriod.clientId !== talentPool.id) {
          // End current assignment and add Talent Pool period
          const endDate = new Date();
          endDate.setDate(endDate.getDate() - Math.floor(Math.random() * 30)); // Ended recently
          
          lastPeriod.endDate = endDate.toISOString().split('T')[0];
          lastPeriod.status = 'completed';
          
          history.push({
            id: `current-pool-${member.id}`,
            clientId: talentPool.id,
            startDate: lastPeriod.endDate,
            endDate: null,
            status: 'active'
          });
        }
        currentClientId = talentPool.id;
        break;
        
      case 'ending_soon':
        // Assignment ending within 1-2 months
        if (lastPeriod.clientId !== talentPool.id && lastPeriod.status === 'active') {
          const futureEnd = new Date();
          futureEnd.setMonth(futureEnd.getMonth() + 1 + Math.floor(Math.random() * 2));
          lastPeriod.endDate = futureEnd.toISOString().split('T')[0];
          currentClientId = lastPeriod.clientId;
        } else {
          currentClientId = talentPool.id;
        }
        break;
        
      case 'active_work':
        // Actively working
        if (lastPeriod.status === 'active' && lastPeriod.clientId !== talentPool.id) {
          currentClientId = lastPeriod.clientId;
        } else {
          // Create new active assignment
          const activeClient = workClients[seed % workClients.length];
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - Math.floor(Math.random() * 6)); // Started 0-6 months ago
          
          history.push({
            id: `current-work-${member.id}`,
            clientId: activeClient.id,
            startDate: startDate.toISOString().split('T')[0],
            endDate: null,
            status: 'active'
          });
          
          currentClientId = activeClient.id;
        }
        break;
    }
  }

  return {
    history: history.sort((a, b) => new Date(a.startDate) - new Date(b.startDate)),
    currentClientId
  };
}

function generateAssignments(clientHistory, clients) {
  return clientHistory
    .filter(period => period.clientId !== 1) // Exclude Talent Pool
    .map((period, index) => {
      const client = clients.find(c => c.id === period.clientId);
      const assignmentTypes = [
        'Frontend Development', 'Backend Development', 'Full-Stack Development',
        'API Integration', 'Database Design', 'UI/UX Implementation',
        'Testing & QA', 'DevOps Setup', 'Mobile Development',
        'System Architecture', 'Performance Optimization', 'Security Implementation'
      ];
      
      return {
        id: `assign-${period.id}`,
        title: assignmentTypes[index % assignmentTypes.length],
        description: `${assignmentTypes[index % assignmentTypes.length]} for ${client?.name}`,
        clientId: period.clientId,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status
      };
    });
}

function generateRoles(category, historyLength) {
  const rolesByCategory = {
    'Starter': ['Junior Developer', 'Trainee Developer'],
    'Junior': ['Junior Developer', 'Developer'],
    'Mid-level': ['Developer', 'Senior Developer'],
    'Senior': ['Senior Developer', 'Technical Lead'],
    'Wizard': ['Technical Lead', 'Principal Developer', 'Solution Architect'],
    'Guru': ['Principal Developer', 'Solution Architect', 'Technical Director']
  };
  
  const roles = rolesByCategory[category] || rolesByCategory['Mid-level'];
  return Array.from({ length: Math.min(historyLength, 3) }, (_, i) => ({
    id: `role-${i + 1}`,
    title: roles[i % roles.length],
    description: `Role progression in ${category} category`,
    startDate: new Date(Date.now() - (historyLength - i) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: i === 0 ? null : new Date(Date.now() - (historyLength - i - 1) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
}

function generateAppreciations(clientHistory, clients) {
  const appreciationTemplates = [
    'Outstanding performance on project delivery',
    'Excellent technical leadership and mentoring',
    'Exceptional problem-solving skills demonstrated',
    'Outstanding client communication and satisfaction',
    'Innovative solution design and implementation',
    'Excellent teamwork and collaboration'
  ];
  
  return clientHistory
    .filter(period => period.clientId !== 1 && period.status === 'completed')
    .slice(-3) // Last 3 assignments
    .map((period, index) => {
      const client = clients.find(c => c.id === period.clientId);
      return {
        id: `appreciation-${period.id}`,
        text: appreciationTemplates[index % appreciationTemplates.length],
        clientId: period.clientId,
        date: period.endDate
      };
    });
}

function generateFeedback(category, historyLength) {
  const feedbackTemplates = {
    'Starter': [
      'Shows great potential and eagerness to learn',
      'Good progress in technical skill development',
      'Needs guidance but very receptive to feedback'
    ],
    'Junior': [
      'Solid technical foundation with room for growth',
      'Good problem-solving approach',
      'Improving communication and collaboration skills'
    ],
    'Mid-level': [
      'Strong technical skills and reliable delivery',
      'Good at working independently on complex tasks',
      'Shows leadership potential in team settings'
    ],
    'Senior': [
      'Excellent technical expertise and solution design',
      'Strong mentoring abilities for junior team members',
      'Consistently delivers high-quality work on time'
    ],
    'Wizard': [
      'Outstanding technical leadership and innovation',
      'Excellent at complex problem solving and architecture',
      'Valuable mentor and knowledge contributor to the team'
    ],
    'Guru': [
      'Exceptional technical vision and strategic thinking',
      'Outstanding leadership in complex technical challenges',
      'Invaluable contributor to technical excellence and innovation'
    ]
  };
  
  const feedback = feedbackTemplates[category] || feedbackTemplates['Mid-level'];
  return Array.from({ length: Math.min(historyLength, 3) }, (_, i) => ({
    id: `feedback-${i + 1}`,
    text: feedback[i % feedback.length],
    date: new Date(Date.now() - (historyLength - i) * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
}

// Execute the update
generateRealisticHistories().catch(console.error);