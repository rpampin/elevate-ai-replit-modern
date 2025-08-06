import { Router, Request, Response } from "express";
import { JsonStorage } from "../json-storage.js";

const storage = new JsonStorage();

const router = Router();

// Sample data generators
function getRandomClient() {
  // Use actual client IDs that exist in the system
  const clientIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return { id: clientIds[Math.floor(Math.random() * clientIds.length)] };
}

function getRandomRole() {
  const roles = [
    'Frontend Developer',
    'Backend Developer', 
    'Full Stack Developer',
    'DevOps Engineer',
    'QA Engineer',
    'Product Manager',
    'Technical Lead',
    'Senior Developer',
    'Software Architect',
    'UI/UX Designer'
  ];
  return roles[Math.floor(Math.random() * roles.length)];
}

function getRandomSkills() {
  const skills = [
    'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'AWS', 
    'Docker', 'Kubernetes', 'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL',
    'Next.js', 'Express.js', 'REST APIs', 'Microservices', 'Git', 'CI/CD'
  ];
  const numSkills = Math.floor(Math.random() * 5) + 2; // 2-6 skills
  const selectedSkills = [];
  
  for (let i = 0; i < numSkills; i++) {
    const skill = skills[Math.floor(Math.random() * skills.length)];
    if (!selectedSkills.includes(skill)) {
      selectedSkills.push(skill);
    }
  }
  
  return selectedSkills;
}

function getRandomDateBetween(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
}

function generateAssignments(memberId: number, clientHistory: any[]) {
  const assignments = [];
  const numAssignments = Math.floor(Math.random() * 4) + 2; // 2-5 assignments
  
  for (let i = 0; i < numAssignments; i++) {
    const client = clientHistory[i % clientHistory.length] || getRandomClient();
    const startDate = getRandomDateBetween('2022-01-01', '2024-12-01');
    const endDate = Math.random() > 0.3 ? getRandomDateBetween(startDate, '2024-12-31') : null;
    
    assignments.push({
      id: `assign-${memberId}-${i + 1}`,
      title: `${getRandomRole()} Project`,
      description: `Working on ${getRandomRole().toLowerCase()} responsibilities for ${client.name}`,
      clientId: client.id,
      startDate,
      endDate,
      status: endDate ? 'Completed' : 'Active'
    });
  }
  
  return assignments;
}

function generateRoles(memberId: number) {
  const roles = [];
  const numRoles = Math.floor(Math.random() * 3) + 1; // 1-3 roles
  
  for (let i = 0; i < numRoles; i++) {
    const role = getRandomRole();
    roles.push({
      id: `role-${memberId}-${i + 1}`,
      title: role,
      description: `Experienced ${role.toLowerCase()} with expertise in modern development practices`,
      skills: getRandomSkills()
    });
  }
  
  return roles;
}

function generateAppreciations(memberId: number, clientHistory: any[]) {
  const appreciations = [];
  const numAppreciations = Math.floor(Math.random() * 4) + 1; // 1-4 appreciations
  
  const messages = [
    'Outstanding performance on the project delivery.',
    'Excellent problem-solving skills and team collaboration.',
    'Delivered high-quality code ahead of schedule.',
    'Great mentorship and knowledge sharing with the team.',
    'Innovative approach to solving complex technical challenges.'
  ];
  
  const authors = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 
    'Robert Wilson', 'Jessica Martinez', 'David Anderson', 'Lisa Thompson'
  ];
  
  for (let i = 0; i < numAppreciations; i++) {
    const client = clientHistory[i % clientHistory.length] || getRandomClient();
    appreciations.push({
      id: `appr-${memberId}-${i + 1}`,
      clientId: client.id,
      author: authors[Math.floor(Math.random() * authors.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      date: getRandomDateBetween('2023-01-01', '2024-12-01'),
      rating: Math.floor(Math.random() * 2) + 4 // 4-5 rating
    });
  }
  
  return appreciations;
}

function generateFeedback(memberId: number) {
  const feedback = [];
  const numFeedback = Math.floor(Math.random() * 3) + 1; // 1-3 feedback items
  
  const comments = [
    'Strong technical skills, could improve on communication during standups.',
    'Excellent code quality and documentation. Keep up the great work!',
    'Great progress on learning new technologies. Consider taking on more leadership responsibilities.',
    'Outstanding problem-solving abilities. Would benefit from more cross-team collaboration.',
    'Consistent delivery and attention to detail. Consider mentoring junior developers.'
  ];
  
  const types = ['Performance Review', 'Project Feedback', '360 Review', 'Peer Feedback'];
  const authors = [
    'Team Lead', 'Project Manager', 'Senior Developer', 'Product Owner', 
    'Engineering Manager', 'Tech Lead', 'Scrum Master'
  ];
  
  for (let i = 0; i < numFeedback; i++) {
    feedback.push({
      id: `feedback-${memberId}-${i + 1}`,
      author: authors[Math.floor(Math.random() * authors.length)],
      comment: comments[Math.floor(Math.random() * comments.length)],
      date: getRandomDateBetween('2023-01-01', '2024-12-01'),
      type: types[Math.floor(Math.random() * types.length)]
    });
  }
  
  return feedback;
}

function generateClientHistory(memberId: number) {
  const history = [];
  const numPeriods = Math.floor(Math.random() * 3) + 2; // 2-4 client periods
  
  let currentDate = new Date('2022-01-01');
  
  for (let i = 0; i < numPeriods; i++) {
    const client = getRandomClient();
    const startDate = new Date(currentDate);
    const duration = Math.floor(Math.random() * 12) + 3; // 3-14 months
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);
    
    const isLast = i === numPeriods - 1;
    const actualEndDate = isLast && Math.random() > 0.5 ? null : endDate; // Some current assignments
    
    history.push({
      id: `client-${memberId}-${i + 1}`,
      clientId: client.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: actualEndDate ? actualEndDate.toISOString().split('T')[0] : null,
      role: getRandomRole(),
      status: actualEndDate ? 'Completed' : 'Active',
      projects: getRandomSkills().slice(0, 2) // 1-2 project names
    });
    
    // Move to next period
    currentDate = actualEndDate || new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  return history;
}

// Route to update all member profiles with complete data
router.post("/update-all-profiles", async (req: Request, res: Response) => {
  try {
    console.log('Starting complete member data update...');
    const allMembers = await storage.getMembers();
    console.log(`Found ${allMembers.length} members to update`);
    
    let updatedCount = 0;
    
    for (const member of allMembers) {
      console.log(`Updating member ${member.id}: ${member.name}`);
      
      // Generate comprehensive profile data
      const clientHistory = generateClientHistory(member.id);
      const assignments = generateAssignments(member.id, clientHistory);
      const roles = generateRoles(member.id);
      const appreciations = generateAppreciations(member.id, clientHistory);
      const feedbackComments = generateFeedback(member.id);
      
      const profileData = {
        memberId: member.id,
        assignments,
        roles,
        appreciations,
        feedbackComments,
        clientHistory
      };
      
      // Check if profile exists
      let existingProfile = await storage.getMemberProfile(member.id);
      
      if (existingProfile) {
        // Update existing profile
        await storage.updateMemberProfile(existingProfile.id, profileData);
        console.log(`  ✓ Updated profile for ${member.name}`);
      } else {
        // Create new profile
        await storage.createMemberProfile(profileData);
        console.log(`  ✓ Created profile for ${member.name}`);
      }
      
      console.log(`  - Assignments: ${assignments.length}`);
      console.log(`  - Roles: ${roles.length}`);
      console.log(`  - Appreciations: ${appreciations.length}`);
      console.log(`  - Feedback: ${feedbackComments.length}`);
      console.log(`  - Client History: ${clientHistory.length}`);
      
      updatedCount++;
    }
    
    console.log(`✅ Successfully updated ${updatedCount} member profiles!`);
    res.json({ 
      success: true, 
      message: `Updated ${updatedCount} member profiles with complete data`,
      updatedCount 
    });
    
  } catch (error) {
    console.error('❌ Error updating member profiles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating member profiles', 
      error: error.message 
    });
  }
});

export default router;