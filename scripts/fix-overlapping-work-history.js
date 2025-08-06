import fs from 'fs';
import path from 'path';

// Script to fix overlapping work history and create realistic career progression

const dataPath = path.join(process.cwd(), '..', 'data', 'skills-data.json');

function fixOverlappingWorkHistory() {
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Function to generate non-overlapping date ranges
    function generateNonOverlappingDates(startYear = 2022, totalPeriods = 3) {
      const dates = [];
      let currentDate = new Date(startYear, 0, 1);
      
      for (let i = 0; i < totalPeriods; i++) {
        const startDate = new Date(currentDate);
        // Random duration between 3-18 months
        const durationMonths = Math.floor(Math.random() * 16) + 3;
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + durationMonths, startDate.getDate());
        
        dates.push({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        // Next period starts 1-3 months after previous ends
        currentDate = new Date(endDate.getFullYear(), endDate.getMonth() + Math.floor(Math.random() * 3) + 1, endDate.getDate());
      }
      
      return dates;
    }

    // Function to get random client excluding used ones
    function getRandomClient(usedClientIds = [], clientPool) {
      const availableClients = clientPool.filter(c => !usedClientIds.includes(c.id) && c.id !== 1); // Exclude Talent Pool
      if (availableClients.length === 0) {
        // If all used, pick random from pool except Talent Pool
        return clientPool.filter(c => c.id !== 1)[Math.floor(Math.random() * (clientPool.length - 1))];
      }
      return availableClients[Math.floor(Math.random() * availableClients.length)];
    }

    // Role progression based on experience level
    const roleProgression = {
      junior: ["Junior Developer", "Developer", "Software Developer"],
      mid: ["Software Developer", "Senior Developer", "Tech Lead"],
      senior: ["Senior Developer", "Tech Lead", "Solutions Architect", "Project Manager"]
    };

    let updatedProfiles = 0;

    // Process each member profile
    data.memberProfiles?.forEach((profile, profileIndex) => {
      if (!profile.clientHistory || profile.clientHistory.length === 0) return;

      const usedClientIds = new Set();
      
      // Generate non-overlapping dates for this member's career
      const dateRanges = generateNonOverlappingDates(2022, profile.clientHistory.length);
      
      // Determine member's experience level based on profile index (simulate seniority)
      let experienceLevel = 'junior';
      if (profileIndex > 25 && profileIndex <= 50) experienceLevel = 'mid';
      if (profileIndex > 50) experienceLevel = 'senior';

      // Sort client history by start date and update
      profile.clientHistory.forEach((history, historyIndex) => {
        // Assign unique client
        const client = getRandomClient(Array.from(usedClientIds), data.clients);
        history.clientId = client.id;
        usedClientIds.add(client.id);

        // Assign progressive role based on experience and time
        const roles = roleProgression[experienceLevel];
        const roleIndex = Math.min(historyIndex, roles.length - 1);
        history.role = roles[roleIndex];

        // Assign non-overlapping dates
        if (dateRanges[historyIndex]) {
          history.startDate = dateRanges[historyIndex].startDate;
          history.endDate = dateRanges[historyIndex].endDate;
        }
      });

      // Update assignments to align with client history timeline
      if (profile.assignments) {
        profile.assignments.forEach((assignment, assignmentIndex) => {
          // Pick a client from the member's history or a new one
          const historyClients = profile.clientHistory.map(h => h.clientId);
          if (historyClients.length > 0 && Math.random() > 0.3) {
            // 70% chance to use a client from history
            assignment.clientId = historyClients[Math.floor(Math.random() * historyClients.length)];
          } else {
            // 30% chance for new client
            const client = getRandomClient(historyClients, data.clients);
            assignment.clientId = client.id;
          }

          // Set assignment dates within one of the work periods
          if (profile.clientHistory.length > assignmentIndex) {
            const workPeriod = profile.clientHistory[assignmentIndex];
            const periodStart = new Date(workPeriod.startDate);
            const periodEnd = new Date(workPeriod.endDate);
            
            // Assignment starts somewhere in the middle of the work period
            const assignmentStart = new Date(
              periodStart.getTime() + (periodEnd.getTime() - periodStart.getTime()) * Math.random() * 0.7
            );
            
            assignment.startDate = assignmentStart.toISOString();
            
            // Assignment might complete before work period ends
            if (assignment.endDate && Math.random() > 0.4) {
              const assignmentEnd = new Date(
                assignmentStart.getTime() + Math.random() * (periodEnd.getTime() - assignmentStart.getTime())
              );
              assignment.endDate = assignmentEnd.toISOString();
            }
          }
        });
      }

      // Update appreciations to align with work history
      if (profile.appreciations) {
        profile.appreciations.forEach((appreciation, appreciationIndex) => {
          // Pick client from current work history
          const historyClients = profile.clientHistory.map(h => h.clientId);
          if (historyClients.length > 0) {
            appreciation.clientId = historyClients[Math.floor(Math.random() * historyClients.length)];
          }

          // Set appreciation date within a work period
          if (profile.clientHistory.length > 0) {
            const randomPeriod = profile.clientHistory[Math.floor(Math.random() * profile.clientHistory.length)];
            const periodStart = new Date(randomPeriod.startDate);
            const periodEnd = new Date(randomPeriod.endDate);
            
            const appreciationDate = new Date(
              periodStart.getTime() + Math.random() * (periodEnd.getTime() - periodStart.getTime())
            );
            appreciation.date = appreciationDate.toISOString();
          }
        });
      }

      updatedProfiles++;
    });

    // Write updated data back to file
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    
    console.log(`✓ Fixed overlapping work history for ${updatedProfiles} member profiles`);
    console.log('✓ Created realistic career progression timelines');
    console.log('✓ Aligned assignments and appreciations with work periods');
    console.log('✓ Ensured no date overlaps in client work history');
    
  } catch (error) {
    console.error('Error fixing overlapping work history:', error);
  }
}

fixOverlappingWorkHistory();