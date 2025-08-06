// Direct update of member client histories using storage interface

async function updateMemberHistories() {
  // Import the storage instance
  const { storage } = await import('../server/storage.js');
  
  console.log('Starting client history updates...');
  
  const members = await storage.getMembers();
  const clients = await storage.getClients();
  
  console.log(`Found ${members.length} members and ${clients.length} clients`);
  
  // Status distribution: 25% Talent Pool, 15% ending soon, 60% active work
  const statusDistribution = ['talent_pool', 'ending_soon', 'active_work'];
  
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const profile = await storage.getMemberProfile(member.id);
    
    if (!profile) continue;
    
    // Determine member status based on index
    let memberStatus;
    const statusIndex = i % 100;
    if (statusIndex < 25) memberStatus = 'talent_pool';
    else if (statusIndex < 40) memberStatus = 'ending_soon';
    else memberStatus = 'active_work';
    
    // Generate work history
    const workHistory = generateHistory(member, clients, memberStatus, i);
    
    // Update profile with new client history
    await storage.updateMemberProfile(profile.id, {
      clientHistory: workHistory.history,
      assignments: generateAssignments(workHistory.history, clients, member.id),
      roles: generateRoles(member.category, member.id),
      appreciations: generateAppreciations(workHistory.history, clients, member.id),
      feedbackComments: generateFeedback(member.category, member.id)
    });
    
    // Update member's current client
    await storage.updateMember(member.id, {
      currentClientId: workHistory.currentClientId
    });
    
    const currentClient = clients.find(c => c.id === workHistory.currentClientId);
    console.log(`Updated ${member.name}: ${workHistory.history.length} periods, current: ${currentClient?.name || 'Unknown'}, status: ${memberStatus}`);
  }
  
  console.log('All member histories updated successfully!');
}

function generateHistory(member, clients, memberStatus, seed) {
  const now = new Date();
  const hireDate = new Date(member.hireDate);
  
  // Career stage configurations
  const stages = {
    'Starter': { maxPeriods: 2, avgDuration: 4 },
    'Junior': { maxPeriods: 3, avgDuration: 6 },
    'Mid-level': { maxPeriods: 4, avgDuration: 8 },
    'Senior': { maxPeriods: 5, avgDuration: 10 },
    'Wizard': { maxPeriods: 6, avgDuration: 12 },
    'Guru': { maxPeriods: 7, avgDuration: 14 }
  };
  
  const stage = stages[member.category] || stages['Mid-level'];
  const workClients = clients.filter(c => c.name !== 'Talent Pool');
  const talentPool = clients.find(c => c.name === 'Talent Pool') || clients[0];
  
  const history = [];
  let currentDate = new Date(hireDate);
  let periodCount = 0;
  const maxPeriods = Math.min(stage.maxPeriods, 3 + Math.floor(seed % 3));
  
  // Generate work periods
  while (currentDate < now && periodCount < maxPeriods) {
    // Select client
    const clientIndex = (seed + periodCount * 7) % workClients.length;
    const selectedClient = workClients[clientIndex];
    
    // Duration (3-15 months)
    const baseDuration = stage.avgDuration;
    const variation = (seed + periodCount) % 6 - 3; // ±3 months
    const durationMonths = Math.max(3, Math.min(15, baseDuration + variation));
    
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
    // Don't go beyond current date
    if (endDate > now) endDate.setTime(now.getTime());
    
    const isActive = endDate >= now;
    
    history.push({
      id: `work-${member.id}-${periodCount + 1}`,
      clientId: selectedClient.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: isActive ? null : endDate.toISOString().split('T')[0],
      status: isActive ? 'active' : 'completed'
    });
    
    currentDate = new Date(endDate);
    
    // Add talent pool gap if not last period and completed
    if (!isActive && periodCount < maxPeriods - 1 && currentDate < now) {
      const gapMonths = 1 + (seed % 3); // 1-3 months
      const gapEnd = new Date(currentDate);
      gapEnd.setMonth(gapEnd.getMonth() + gapMonths);
      
      if (gapEnd > now) gapEnd.setTime(now.getTime());
      
      const gapActive = gapEnd >= now;
      
      history.push({
        id: `gap-${member.id}-${periodCount + 1}`,
        clientId: talentPool.id,
        startDate: endDate.toISOString().split('T')[0],
        endDate: gapActive ? null : gapEnd.toISOString().split('T')[0],
        status: gapActive ? 'active' : 'completed'
      });
      
      currentDate = new Date(gapEnd);
    }
    
    periodCount++;
  }
  
  // Adjust based on desired status
  let currentClientId = talentPool.id;
  
  if (history.length > 0) {
    const lastPeriod = history[history.length - 1];
    
    switch (memberStatus) {
      case 'talent_pool':
        if (lastPeriod.clientId !== talentPool.id) {
          // End current and add talent pool
          const recentEnd = new Date();
          recentEnd.setDate(recentEnd.getDate() - (seed % 30 + 1));
          
          lastPeriod.endDate = recentEnd.toISOString().split('T')[0];
          lastPeriod.status = 'completed';
          
          history.push({
            id: `pool-${member.id}-current`,
            clientId: talentPool.id,
            startDate: lastPeriod.endDate,
            endDate: null,
            status: 'active'
          });
        }
        currentClientId = talentPool.id;
        break;
        
      case 'ending_soon':
        if (lastPeriod.status === 'active' && lastPeriod.clientId !== talentPool.id) {
          // Set end date 1-2 months in future
          const futureEnd = new Date();
          futureEnd.setMonth(futureEnd.getMonth() + 1 + (seed % 2));
          lastPeriod.endDate = futureEnd.toISOString().split('T')[0];
          currentClientId = lastPeriod.clientId;
        } else {
          currentClientId = talentPool.id;
        }
        break;
        
      case 'active_work':
        if (lastPeriod.status === 'active' && lastPeriod.clientId !== talentPool.id) {
          currentClientId = lastPeriod.clientId;
        } else {
          // Add new active assignment
          const activeClient = workClients[seed % workClients.length];
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - (seed % 6)); // 0-6 months ago
          
          history.push({
            id: `current-${member.id}`,
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

function generateAssignments(clientHistory, clients, memberId) {
  const assignmentTypes = [
    'Frontend Development', 'Backend Development', 'Full-Stack Development',
    'API Integration', 'Database Design', 'UI/UX Implementation',
    'Testing & QA', 'DevOps Setup', 'Mobile Development'
  ];
  
  return clientHistory
    .filter(period => period.clientId !== 1) // Exclude Talent Pool
    .map((period, index) => {
      const client = clients.find(c => c.id === period.clientId);
      return {
        id: `assign-${memberId}-${index + 1}`,
        title: assignmentTypes[index % assignmentTypes.length],
        description: `${assignmentTypes[index % assignmentTypes.length]} for ${client?.name || 'Client'}`,
        clientId: period.clientId,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status
      };
    });
}

function generateRoles(category, memberId) {
  const rolesByCategory = {
    'Starter': ['Junior Developer'],
    'Junior': ['Junior Developer', 'Developer'],
    'Mid-level': ['Developer', 'Senior Developer'],
    'Senior': ['Senior Developer', 'Technical Lead'],
    'Wizard': ['Technical Lead', 'Principal Developer'],
    'Guru': ['Principal Developer', 'Solution Architect']
  };
  
  const roles = rolesByCategory[category] || ['Developer'];
  return roles.map((title, i) => ({
    id: `role-${memberId}-${i + 1}`,
    title,
    description: `${title} role`,
    startDate: new Date(Date.now() - (roles.length - i) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: i === 0 ? null : new Date(Date.now() - (roles.length - i - 1) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
}

function generateAppreciations(clientHistory, clients, memberId) {
  const templates = [
    'Outstanding performance and delivery',
    'Excellent technical skills demonstrated',
    'Great teamwork and collaboration'
  ];
  
  return clientHistory
    .filter(period => period.clientId !== 1 && period.status === 'completed')
    .slice(-2) // Last 2 completed assignments
    .map((period, index) => ({
      id: `appreciation-${memberId}-${index + 1}`,
      text: templates[index % templates.length],
      clientId: period.clientId,
      date: period.endDate
    }));
}

function generateFeedback(category, memberId) {
  const feedbackByCategory = {
    'Starter': ['Shows great potential and learning ability'],
    'Junior': ['Good technical foundation and growth'],
    'Mid-level': ['Strong technical skills and reliability'],
    'Senior': ['Excellent expertise and leadership'],
    'Wizard': ['Outstanding technical innovation'],
    'Guru': ['Exceptional strategic thinking and vision']
  };
  
  const feedback = feedbackByCategory[category] || ['Good performance'];
  return feedback.map((text, i) => ({
    id: `feedback-${memberId}-${i + 1}`,
    text,
    date: new Date(Date.now() - (feedback.length - i) * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
}

// Run the update
updateMemberHistories().catch(console.error);