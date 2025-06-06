import type { MemberWithSkills, Scale, Skill, MemberSkill } from "@shared/schema";
import { getScaleOrder, compareScaleValues, getSortedScaleValues } from "./scale-utils";

export interface SkillAnalytics {
  skillId: number;
  skillName: string;
  totalMembers: number;
  averageLevel: number;
  levelDistribution: { level: string; count: number; percentage: number }[];
  topPerformers: { memberId: number; memberName: string; level: string }[];
  skillGap: number; // Percentage of members below average
}

export interface TeamStrength {
  name: string;
  count: number;
  percentage: number;
  averageLevel: number;
}

/**
 * Analyze skill levels across all members for a specific skill
 */
export function analyzeSkillLevel(
  skill: Skill,
  scale: Scale,
  memberSkills: (MemberSkill & { skill: Skill })[], 
  members: MemberWithSkills[]
): SkillAnalytics {
  const skillMembers = memberSkills.filter(ms => ms.skillId === skill.id);
  const sortedLevels = getSortedScaleValues(scale);
  
  // Calculate level distribution
  const levelCounts = new Map<string, number>();
  sortedLevels.forEach(level => levelCounts.set(level, 0));
  
  skillMembers.forEach(ms => {
    const current = levelCounts.get(ms.level) || 0;
    levelCounts.set(ms.level, current + 1);
  });
  
  const levelDistribution = sortedLevels.map(level => ({
    level,
    count: levelCounts.get(level) || 0,
    percentage: skillMembers.length > 0 ? Math.round(((levelCounts.get(level) || 0) / skillMembers.length) * 100) : 0
  }));
  
  // Calculate average level
  const totalLevelScore = skillMembers.reduce((sum, ms) => sum + getScaleOrder(scale, ms.level), 0);
  const averageLevel = skillMembers.length > 0 ? totalLevelScore / skillMembers.length : 0;
  
  // Find top performers (highest level members)
  const topPerformers = skillMembers
    .sort((a, b) => compareScaleValues(scale, b.level, a.level))
    .slice(0, 5)
    .map(ms => {
      const member = members.find(m => m.id === ms.memberId);
      return {
        memberId: ms.memberId!,
        memberName: member?.fullName || 'Unknown',
        level: ms.level
      };
    });
  
  // Calculate skill gap (percentage below average)
  const belowAverage = skillMembers.filter(ms => getScaleOrder(scale, ms.level) < averageLevel).length;
  const skillGap = skillMembers.length > 0 ? Math.round((belowAverage / skillMembers.length) * 100) : 0;
  
  return {
    skillId: skill.id,
    skillName: skill.name,
    totalMembers: skillMembers.length,
    averageLevel,
    levelDistribution,
    topPerformers,
    skillGap
  };
}

/**
 * Get team strengths based on high-level skills across knowledge areas
 */
export function getTeamStrengths(
  members: MemberWithSkills[],
  scales: Scale[]
): TeamStrength[] {
  const knowledgeAreaCounts = new Map<string, { total: number; highLevel: number; totalLevels: number }>();
  
  members.forEach(member => {
    const memberKnowledgeAreas = new Set<string>();
    
    member.skills.forEach(memberSkill => {
      const skill = memberSkill.skill;
      const scale = scales.find(s => s.id === memberSkill.scaleId);
      
      if (!skill || !scale) return;
      
      const knowledgeAreaName = skill.knowledgeArea?.name || 'Other';
      const levelOrder = getScaleOrder(scale, memberSkill.level);
      const maxOrder = Math.max(...getSortedScaleValues(scale).map(v => getScaleOrder(scale, v)));
      const isHighLevel = levelOrder >= maxOrder * 0.75; // Top 25% of scale
      
      if (!memberKnowledgeAreas.has(knowledgeAreaName)) {
        memberKnowledgeAreas.add(knowledgeAreaName);
        
        const current = knowledgeAreaCounts.get(knowledgeAreaName) || { total: 0, highLevel: 0, totalLevels: 0 };
        knowledgeAreaCounts.set(knowledgeAreaName, {
          total: current.total + 1,
          highLevel: current.highLevel + (isHighLevel ? 1 : 0),
          totalLevels: current.totalLevels + levelOrder
        });
      }
    });
  });
  
  const totalMembers = members.length;
  
  return Array.from(knowledgeAreaCounts.entries())
    .map(([name, data]) => ({
      name,
      count: data.highLevel,
      percentage: Math.round((data.highLevel / totalMembers) * 100),
      averageLevel: data.total > 0 ? data.totalLevels / data.total : 0
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Identify skill gaps where the team has low coverage or low average levels
 */
export function getSkillGaps(
  skills: Skill[],
  members: MemberWithSkills[],
  scales: Scale[]
): TeamStrength[] {
  const skillCoverage = new Map<string, { total: number; totalLevels: number; members: Set<number> }>();
  
  members.forEach(member => {
    member.skills.forEach(memberSkill => {
      const skill = memberSkill.skill;
      const scale = scales.find(s => s.id === memberSkill.scaleId);
      
      if (!skill || !scale) return;
      
      const levelOrder = getScaleOrder(scale, memberSkill.level);
      const current = skillCoverage.get(skill.name) || { total: 0, totalLevels: 0, members: new Set() };
      
      current.members.add(member.id);
      current.total += 1;
      current.totalLevels += levelOrder;
      
      skillCoverage.set(skill.name, current);
    });
  });
  
  const totalMembers = members.length;
  
  return skills
    .map(skill => {
      const data = skillCoverage.get(skill.name) || { total: 0, totalLevels: 0, members: new Set() };
      const coverage = data.members.size;
      const averageLevel = data.total > 0 ? data.totalLevels / data.total : 0;
      
      return {
        name: skill.name,
        count: coverage,
        percentage: Math.round((coverage / totalMembers) * 100),
        averageLevel
      };
    })
    .filter(item => item.percentage < 50 || item.averageLevel < 2.5) // Low coverage or low average
    .sort((a, b) => a.percentage - b.percentage);
}

/**
 * Get member skill comparison data for benchmarking
 */
export function getMemberSkillComparison(
  member: MemberWithSkills,
  allMembers: MemberWithSkills[],
  scales: Scale[]
): { skillName: string; memberLevel: string; teamAverage: number; percentile: number }[] {
  return member.skills.map(memberSkill => {
    const skill = memberSkill.skill;
    const scale = scales.find(s => s.id === memberSkill.scaleId);
    
    if (!skill || !scale) {
      return {
        skillName: skill?.name || 'Unknown',
        memberLevel: memberSkill.level,
        teamAverage: 0,
        percentile: 0
      };
    }
    
    // Get all team members with this skill
    const teamSkillLevels = allMembers
      .flatMap(m => m.skills)
      .filter(ms => ms.skillId === skill.id && ms.scaleId === memberSkill.scaleId)
      .map(ms => getScaleOrder(scale, ms.level));
    
    const teamAverage = teamSkillLevels.length > 0 
      ? teamSkillLevels.reduce((sum, level) => sum + level, 0) / teamSkillLevels.length 
      : 0;
    
    const memberOrder = getScaleOrder(scale, memberSkill.level);
    const betterThanCount = teamSkillLevels.filter(level => memberOrder > level).length;
    const percentile = teamSkillLevels.length > 0 
      ? Math.round((betterThanCount / teamSkillLevels.length) * 100) 
      : 0;
    
    return {
      skillName: skill.name,
      memberLevel: memberSkill.level,
      teamAverage,
      percentile
    };
  }).sort((a, b) => b.percentile - a.percentile);
}