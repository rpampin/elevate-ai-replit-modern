// Direct bulk update of member client histories through API

async function bulkUpdateHistories() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('Fetching current data...');
  
  // Fetch current data
  const [membersRes, clientsRes] = await Promise.all([
    fetch(`${baseUrl}/api/members`),
    fetch(`${baseUrl}/api/clients`)
  ]);
  
  const members = await membersRes.json();
  const clients = await clientsRes.json();
  
  console.log(`Found ${members.length} members and ${clients.length} clients`);
  
  if (clients.length === 0) {
    console.log('No clients found - creating default clients first');
    return;
  }
  
  // Update each member's client history
  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    
    // Determine status distribution
    const statusSeed = i % 100;
    let memberStatus;
    if (statusSeed < 25) memberStatus = 'talent_pool';      // 25%
    else if (statusSeed < 40) memberStatus = 'ending_soon'; // 15%
    else memberStatus = 'active_work';                      // 60%
    
    // Generate work history
    const workData = generateMemberWorkHistory(member, clients, memberStatus, i);
    
    // Update member profile via API
    try {
      const profileRes = await fetch(`${baseUrl}/api/members/${member.id}/profile`);
      const profile = await profileRes.json();
      
      if (profile) {
        const updateData = {
          clientHistory: workData.history,
          assignments: workData.assignments,
          roles: workData.roles,
          appreciations: workData.appreciations,
          feedbackComments: workData.feedback
        };
        
        await fetch(`${baseUrl}/api/members/${member.id}/profile`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
      }
      
      // Update member's current client
      await fetch(`${baseUrl}/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentClientId: workData.currentClientId })
      });
      
      const currentClient = clients.find(c => c.id === workData.currentClientId);
      console.log(`${member.name}: ${workData.history.length} periods, current: ${currentClient?.name}, status: ${memberStatus}`);
      
    } catch (error) {
      console.error(`Error updating ${member.name}:`, error.message);
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log('Bulk update completed!');
}

function generateMemberWorkHistory(member, clients, memberStatus, seed) {
  const now = new Date();
  const hireDate = new Date(member.hireDate);
  
  // Career configurations
  const careerData = {
    'Starter': { maxPeriods: 2, avgMonths: 4 },
    'Junior': { maxPeriods: 3, avgMonths: 6 },
    'Mid-level': { maxPeriods: 4, avgMonths: 8 },
    'Senior': { maxPeriods: 5, avgMonths: 10 },
    'Wizard': { maxPeriods: 6, avgMonths: 12 },
    'Guru': { maxPeriods: 7, avgMonths: 14 }
  };
  
  const config = careerData[member.category] || careerData['Mid-level'];
  const workClients = clients.filter(c => c.name !== 'Talent Pool');
  const talentPool = clients.find(c => c.name === 'Talent Pool');
  
  const history = [];
  let currentDate = new Date(hireDate);
  let periodCount = 0;
  
  // Generate work periods
  while (currentDate < now && periodCount < config.maxPeriods) {
    // Select client
    const clientIndex = (seed + periodCount * 13) % workClients.length;
    const selectedClient = workClients[clientIndex];
    
    // Duration (3-15 months)
    const variation = (seed + periodCount * 7) % 7 - 3; // ±3 months
    const durationMonths = Math.max(3, Math.min(15, config.avgMonths + variation));
    
    const startDate = new Date(currentDate);
    const endDate = new Date(currentDate);
    endDate.setMonth(endDate.getMonth() + durationMonths);
    
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
    
    // Add talent pool gap between assignments
    if (!isActive && periodCount < config.maxPeriods - 1 && currentDate < now) {
      const gapMonths = 1 + ((seed + periodCount) % 3);
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
  
  // Adjust final status
  let currentClientId = talentPool.id;
  
  if (history.length > 0) {
    const lastPeriod = history[history.length - 1];
    
    switch (memberStatus) {
      case 'talent_pool':
        if (lastPeriod.clientId !== talentPool.id) {
          // End current assignment and add talent pool
          const endDate = new Date();
          endDate.setDate(endDate.getDate() - ((seed % 30) + 1));
          
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
          startDate.setMonth(startDate.getMonth() - (seed % 6));
          
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
    currentClientId,
    assignments: generateAssignments(history, clients, member.id),
    roles: generateRoles(member.category, member.id),
    appreciations: generateAppreciations(history, clients, member.id),
    feedback: generateFeedback(member.category, member.id)
  };
}

function generateAssignments(clientHistory, clients, memberId) {
  const types = [
    'Frontend Development', 'Backend Development', 'Full-Stack Development',
    'API Integration', 'Database Design', 'UI/UX Implementation',
    'Testing & QA', 'DevOps Setup', 'Mobile Development',
    'System Architecture', 'Performance Optimization'
  ];
  
  return clientHistory
    .filter(period => period.clientId !== 1) // Exclude Talent Pool
    .map((period, index) => {
      const client = clients.find(c => c.id === period.clientId);
      return {
        id: `assign-${memberId}-${index + 1}`,
        title: types[index % types.length],
        description: `${types[index % types.length]} for ${client?.name || 'Client'}`,
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
    description: `${title} role progression`,
    startDate: new Date(Date.now() - (roles.length - i) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: i === 0 ? null : new Date(Date.now() - (roles.length - i - 1) * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
}

function generateAppreciations(clientHistory, clients, memberId) {
  const templates = [
    'Outstanding performance and client satisfaction',
    'Excellent technical skills and innovation',
    'Great teamwork and project leadership',
    'Exceptional problem-solving abilities',
    'Outstanding mentoring and knowledge sharing'
  ];
  
  return clientHistory
    .filter(period => period.clientId !== 1 && period.status === 'completed')
    .slice(-3) // Last 3 completed
    .map((period, index) => ({
      id: `appreciation-${memberId}-${index + 1}`,
      text: templates[index % templates.length],
      clientId: period.clientId,
      date: period.endDate
    }));
}

function generateFeedback(category, memberId) {
  const feedbackByCategory = {
    'Starter': [
      'Shows excellent learning potential and growth mindset',
      'Demonstrates strong technical curiosity and adaptability'
    ],
    'Junior': [
      'Solid technical foundation with consistent improvement',
      'Good collaboration skills and receptive to mentoring'
    ],
    'Mid-level': [
      'Strong technical execution and reliable delivery',
      'Shows leadership potential and good problem-solving'
    ],
    'Senior': [
      'Excellent technical expertise and team leadership',
      'Outstanding mentoring abilities and strategic thinking'
    ],
    'Wizard': [
      'Exceptional technical innovation and solution architecture',
      'Outstanding leadership in complex technical challenges'
    ],
    'Guru': [
      'Visionary technical leadership and strategic expertise',
      'Invaluable contributor to technical excellence and innovation'
    ]
  };
  
  const feedback = feedbackByCategory[category] || ['Good technical performance'];
  return feedback.map((text, i) => ({
    id: `feedback-${memberId}-${i + 1}`,
    text,
    date: new Date(Date.now() - (feedback.length - i) * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }));
}

// Run the bulk update
bulkUpdateHistories().catch(console.error);