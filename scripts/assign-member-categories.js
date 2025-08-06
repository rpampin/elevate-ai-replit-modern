const { Storage } = await import('../server/storage.js');

const storage = new Storage();

async function assignMemberCategories() {
  console.log('Starting member category assignment...');
  
  try {
    // Get all members and their skills
    const members = await storage.getMembers();
    console.log(`Found ${members.length} members`);
    
    // Get all categories to map names to IDs
    const categories = await storage.getCategories();
    console.log('Available categories:', categories.map(c => `${c.id}: ${c.name}`));
    
    const categoryMap = {
      'Starter': categories.find(c => c.name === 'Starter')?.id,
      'Builder': categories.find(c => c.name === 'Builder')?.id, 
      'Solver': categories.find(c => c.name === 'Solver')?.id,
      'Wizard': categories.find(c => c.name === 'Wizard')?.id
    };
    
    console.log('Category mapping:', categoryMap);

    for (const member of members) {
      if (!member.skills || member.skills.length === 0) {
        // No skills - assign Starter
        const categoryId = categoryMap['Starter'];
        if (categoryId) {
          await storage.updateMember(member.id, { categoryId });
          console.log(`Member ${member.id} (${member.name}) - No skills -> Starter`);
        }
        continue;
      }

      // Calculate skill levels and assign category based on expertise
      let totalSkills = member.skills.length;
      let highLevelSkills = 0; // Level 4+ skills
      let mediumLevelSkills = 0; // Level 3 skills
      let lowLevelSkills = 0; // Level 1-2 skills
      
      member.skills.forEach(skill => {
        const level = skill.level;
        if (level === 'Perfecto' || level === "(5) Perfecto" || level === "5") {
          highLevelSkills++;
        } else if (level === "(4) I have wide knowledge, I can be reference for others" || level === "4") {
          highLevelSkills++;
        } else if (level === "(3) I know well, used it several times" || level === "3") {
          mediumLevelSkills++;
        } else {
          lowLevelSkills++;
        }
      });

      // Determine category based on skill distribution
      let assignedCategory;
      let averageLevel = (highLevelSkills * 4 + mediumLevelSkills * 3 + lowLevelSkills * 2) / totalSkills;
      
      if (totalSkills >= 20 && highLevelSkills >= 8) {
        // Wizard: 20+ skills with 8+ high-level skills
        assignedCategory = 'Wizard';
      } else if (totalSkills >= 15 && (highLevelSkills >= 5 || averageLevel >= 3.5)) {
        // Solver: 15+ skills with 5+ high-level skills or high average
        assignedCategory = 'Solver';
      } else if (totalSkills >= 8 && (mediumLevelSkills + highLevelSkills >= 5)) {
        // Builder: 8+ skills with 5+ medium/high level skills
        assignedCategory = 'Builder';
      } else {
        // Starter: Everyone else
        assignedCategory = 'Starter';
      }

      const categoryId = categoryMap[assignedCategory];
      if (categoryId) {
        await storage.updateMember(member.id, { categoryId });
        console.log(`Member ${member.id} (${member.name}) - ${totalSkills} skills (${highLevelSkills} high, ${mediumLevelSkills} medium) -> ${assignedCategory}`);
      }
    }

    console.log('✅ Member category assignment completed');
    
    // Show final distribution
    const updatedMembers = await storage.getMembers();
    const distribution = {};
    updatedMembers.forEach(member => {
      const categoryName = categories.find(c => c.id === member.categoryId)?.name || 'Unknown';
      distribution[categoryName] = (distribution[categoryName] || 0) + 1;
    });
    
    console.log('Final category distribution:', distribution);
    
  } catch (error) {
    console.error('Error assigning member categories:', error);
  }
}

assignMemberCategories().catch(console.error);