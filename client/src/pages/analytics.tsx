import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import StatsCard from "@/components/ui/stats-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target,
  Brain,
  Award,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { getCategoryColor, getInitials } from "@/lib/constants";
import { getAllClientIdsFromMembers, getClientIdFromMember, getClientNameFromId } from "@/lib/client-utils";
import type { MemberWithSkills, Client } from "@shared/schema";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function Analytics() {
  const { t } = useLanguage();
  
  // State for radar chart filters
  const [radarView, setRadarView] = useState<"knowledge-areas" | "categories" | "skills">("knowledge-areas");
  const [selectedMemberCategory, setSelectedMemberCategory] = useState<string>("all");
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Show top 10 goals
  const topGoalsLimit = 10;

  // Fetch data
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: companyStrengths = [], isLoading: strengthsLoading } = useQuery({
    queryKey: ["/api/analytics/company-strengths"],
  });

  const { data: skillGaps = [], isLoading: gapsLoading } = useQuery({
    queryKey: ["/api/analytics/skill-gaps"],
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: knowledgeAreas = [], isLoading: knowledgeAreasLoading } = useQuery({
    queryKey: ["/api/knowledge-areas"],
  });

  const { data: skillCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/skill-categories"],
  });

  const { data: skills = [], isLoading: skillsLoading } = useQuery({
    queryKey: ["/api/skills"],
  });

  const { data: scales = [], isLoading: scalesLoading } = useQuery({
    queryKey: ["/api/scales"],
  });

  const { data: learningGoals = [], isLoading: learningGoalsLoading } = useQuery({
    queryKey: ["/api/learning-goals"],
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: memberCategories = [], isLoading: memberCategoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Helper function to convert skill levels to numeric values
  const getNumericLevel = (scale: any, level: string): number => {
    if (!scale || !level) return 0;
    
    if (scale.values && typeof scale.values === 'object' && !Array.isArray(scale.values)) {
      const levelValue = (scale.values as any)[level];
      if (levelValue !== undefined) {
        const values = Object.values(scale.values as Record<string, number>);
        const maxValue = Math.max(...values.filter(v => typeof v === 'number'));
        return (levelValue / maxValue) * 100;
      }
    } else if (scale.values && Array.isArray(scale.values)) {
      const valueIndex = scale.values.findIndex((v: any) => 
        (typeof v === 'string' ? v : v.value) === level
      );
      if (valueIndex !== -1) {
        return ((valueIndex + 1) / scale.values.length) * 100;
      }
    } else if (scale.type === 'quantitative' && !isNaN(Number(level))) {
      const maxValue = 5;
      return (Number(level) / maxValue) * 100;
    }
    
    return 0;
  };

  // Knowledge Areas radar data preparation (shows knowledge areas, filters by member category only)
  const prepareKnowledgeAreasRadarData = () => {
    if (!members || !knowledgeAreas || !scales || !skillCategories || !skills || 
        !Array.isArray(members) || !Array.isArray(knowledgeAreas) || !Array.isArray(scales)) {
      return [];
    }

    // Filter members by member category
    let filteredMembers = members;
    if (selectedMemberCategory !== "all") {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.category === selectedMemberCategory);
    }

    // Calculate average skill levels per knowledge area
    const areaStats = new Map();
    
    knowledgeAreas.forEach((area: any) => {
      areaStats.set(area.id, {
        name: area.name,
        totalLevels: 0,
        memberCount: 0,
        averageLevel: 0
      });
    });

    filteredMembers.forEach((member: MemberWithSkills) => {
      if (!member.skills || !Array.isArray(member.skills)) return;
      
      const memberAreaLevels = new Map();
      
      member.skills.forEach((memberSkill: any) => {
        const skill = skills?.find((s: any) => s.id === memberSkill.skillId);
        const category = skillCategories?.find((c: any) => c.id === skill?.categoryId);
        const areaId = category?.knowledgeAreaId;
        
        if (!areaId) return;

        const scale = scales.find((s: any) => s.id === memberSkill.scaleId) || scales[0];
        const numericLevel = getNumericLevel(scale, memberSkill.level);

        if (!memberAreaLevels.has(areaId)) {
          memberAreaLevels.set(areaId, { total: 0, count: 0 });
        }
        
        const areaLevel = memberAreaLevels.get(areaId);
        areaLevel.total += numericLevel;
        areaLevel.count += 1;
      });

      // Add this member's area averages to the overall stats
      memberAreaLevels.forEach((level, areaId) => {
        const areaData = areaStats.get(areaId);
        if (areaData) {
          const memberAverage = level.total / level.count;
          areaData.totalLevels += memberAverage;
          areaData.memberCount += 1;
          areaData.averageLevel = areaData.totalLevels / areaData.memberCount;
        }
      });
    });

    return Array.from(areaStats.values())
      .filter(area => area.memberCount > 0)
      .map(area => ({
        category: area.name,
        level: Math.round(area.averageLevel),
        memberCount: area.memberCount
      }));
  };

  // Categories radar data preparation (shows categories, filters by knowledge areas + member categories)
  const prepareCategoriesRadarData = () => {
    if (!members || !skillCategories || !scales || !Array.isArray(members) || !Array.isArray(skillCategories) || !Array.isArray(scales)) return [];

    // Filter members by member category
    let filteredMembers = members;
    if (selectedMemberCategory !== "all") {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.category === selectedMemberCategory);
    }

    // Calculate average skill levels per category across filtered members
    const categoryStats = new Map();
    
    skillCategories.forEach((category: any) => {
      categoryStats.set(category.id, {
        name: category.name,
        totalLevels: 0,
        memberCount: 0,
        averageLevel: 0
      });
    });

    filteredMembers.forEach((member: MemberWithSkills) => {
      if (!member.skills || !Array.isArray(member.skills)) return;
      
      const memberCategoryLevels = new Map();
      
      member.skills.forEach((memberSkill: any) => {
        const skill = skills?.find((s: any) => s.id === memberSkill.skillId);
        const categoryId = skill?.categoryId;
        if (!categoryId || !categoryStats.has(categoryId)) return;

        const scale = scales.find((s: any) => s.id === memberSkill.scaleId) || scales[0];
        const numericLevel = getNumericLevel(scale, memberSkill.level);

        if (!memberCategoryLevels.has(categoryId)) {
          memberCategoryLevels.set(categoryId, { total: 0, count: 0 });
        }
        
        const categoryLevel = memberCategoryLevels.get(categoryId);
        categoryLevel.total += numericLevel;
        categoryLevel.count += 1;
      });

      // Add this member's category averages to the overall stats
      memberCategoryLevels.forEach((level, categoryId) => {
        const categoryData = categoryStats.get(categoryId);
        if (categoryData) {
          const memberAverage = level.total / level.count;
          categoryData.totalLevels += memberAverage;
          categoryData.memberCount += 1;
          categoryData.averageLevel = categoryData.totalLevels / categoryData.memberCount;
        }
      });
    });

    return Array.from(categoryStats.values())
      .filter(cat => cat.memberCount > 0)
      .map(cat => ({
        category: cat.name,
        level: Math.round(cat.averageLevel),
        memberCount: cat.memberCount
      }));
  };

  // Skills radar data preparation (shows skills, filters by knowledge areas + categories + member categories)
  const prepareSkillsRadarData = () => {
    if (!members || !skills || !scales || !Array.isArray(members) || !Array.isArray(skills) || !Array.isArray(scales)) {
      return [];
    }

    // Filter members by member category
    let filteredMembers = members;
    if (selectedMemberCategory !== "all") {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.category === selectedMemberCategory);
    }

    // Filter skills by knowledge area and category
    let relevantSkills = skills;
    
    if (selectedKnowledgeArea !== "all" && knowledgeAreas && skillCategories) {
      const areaId = knowledgeAreas.find((area: any) => area.name === selectedKnowledgeArea)?.id;
      if (areaId) {
        const categoryIds = skillCategories.filter((cat: any) => cat.knowledgeAreaId === areaId).map((cat: any) => cat.id);
        relevantSkills = skills.filter((skill: any) => categoryIds.includes(skill.categoryId));
      }
    }
    
    if (selectedCategory !== "all" && skillCategories) {
      const categoryId = skillCategories.find((cat: any) => cat.name === selectedCategory)?.id;
      if (categoryId) {
        relevantSkills = relevantSkills.filter((skill: any) => skill.categoryId === categoryId);
      }
    }

    // Calculate average skill levels per skill across filtered members
    const skillStats = new Map();
    
    relevantSkills.forEach((skill: any) => {
      skillStats.set(skill.id, {
        name: skill.name,
        totalLevels: 0,
        memberCount: 0,
        averageLevel: 0
      });
    });

    filteredMembers.forEach((member: MemberWithSkills) => {
      if (!member.skills || !Array.isArray(member.skills)) return;
      
      member.skills.forEach((memberSkill: any) => {
        const skillId = memberSkill.skillId;
        if (!skillId || !skillStats.has(skillId)) return;

        const scale = scales.find((s: any) => s.id === memberSkill.scaleId) || scales[0];
        const numericLevel = getNumericLevel(scale, memberSkill.level);

        const skillData = skillStats.get(skillId);
        if (skillData) {
          skillData.totalLevels += numericLevel;
          skillData.memberCount += 1;
          skillData.averageLevel = skillData.totalLevels / skillData.memberCount;
        }
      });
    });

    const result = Array.from(skillStats.values())
      .filter(skill => skill.memberCount > 0)
      .sort((a, b) => b.averageLevel - a.averageLevel)
      .slice(0, 12) // Limit to top 12 skills for readability
      .map(skill => ({
        category: skill.name,
        level: Math.round(skill.averageLevel),
        memberCount: skill.memberCount
      }));

    return result;
  };

  // Analytics calculations
  const getCategoryDistribution = () => {
    if (!Array.isArray(members)) return [];
    
    const distribution = (members as MemberWithSkills[]).reduce((acc: Record<string, number>, member: MemberWithSkills) => {
      const category = member.category || 'Unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count as number,
    }));
  };

  const getClientDistribution = () => {
    if (!Array.isArray(members)) return [];
    
    const distribution = (members as MemberWithSkills[]).reduce((acc: Record<string, number>, member: MemberWithSkills) => {
      const client = member.currentClientId ? getClientNameFromId(member.currentClientId, clients) : "Talent Pool";
      acc[client] = (acc[client] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution)
      .map(([client, count]) => ({
        name: client,
        value: count as number,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  const getTopPerformers = () => {
    if (!Array.isArray(members)) return [];
    
    return (members as MemberWithSkills[])
      .filter((member: MemberWithSkills) => member.skills && member.skills.length > 0)
      .sort((a: MemberWithSkills, b: MemberWithSkills) => b.skills.length - a.skills.length)
      .slice(0, 5)
      .map((member: MemberWithSkills) => ({
        name: member.name || 'Unknown',
        skills: member.skills.length,
        category: member.category || 'Unknown',
        id: member.id,
      }));
  };

  const getActiveGoalsBySkill = () => {
    if (!Array.isArray(learningGoals) || !Array.isArray(skills)) return [];
    
    const goalsBySkill = (learningGoals as any[]).reduce((acc: Record<string, number>, goal: any) => {
      const skill = (skills as any[]).find((s: any) => s.id === goal.skillId);
      if (skill) {
        acc[skill.name] = (acc[skill.name] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(goalsBySkill)
      .map(([skill, count]) => ({
        name: skill,
        goals: count as number,
      }))
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 8);
  };

  // Get unique member categories from members
  const getUniqueMemberCategories = () => {
    if (!members || !Array.isArray(members)) return [];
    return Array.from(new Set((members as MemberWithSkills[]).map((m: MemberWithSkills) => m.category).filter(Boolean)));
  };

  // Prepare data based on current view
  const getCurrentRadarData = () => {
    switch (radarView) {
      case "knowledge-areas":
        return prepareKnowledgeAreasRadarData();
      case "categories":
        return prepareCategoriesRadarData();
      case "skills":
        return prepareSkillsRadarData();
      default:
        return [];
    }
  };

  const currentRadarData = getCurrentRadarData();
  const uniqueMemberCategories = getUniqueMemberCategories();
  
  // Prepare analytics data
  const categoryData = getCategoryDistribution();
  const clientData = getClientDistribution();
  const topPerformers = getTopPerformers();
  const goalsBySkill = getActiveGoalsBySkill();

  // Reset filters when view changes
  const handleViewChange = (newView: "knowledge-areas" | "categories" | "skills") => {
    setRadarView(newView);
    setSelectedKnowledgeArea("all");
    setSelectedCategory("all");
    setSelectedMemberCategory("all");
  };

  return (
    <>
      <Header
        title={t("analytics")}
        subtitle="Análisis avanzado del talento y capacidades"
        showActions={false}
      />

      <main className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Techies"
            value={statsLoading ? "..." : (stats as any)?.totalMembers || 0}
            icon={Users}
            change={{ value: "+12%", trend: "up", period: "vs mes anterior" }}
          />
          <StatsCard
            title="Habilidades Únicas"
            value={statsLoading ? "..." : (stats as any)?.activeSkills || 0}
            icon={Brain}
            change={{ value: "+8%", trend: "up", period: "nuevas este mes" }}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="En Talent Pool"
            value={statsLoading ? "..." : (stats as any)?.talentPool || 0}
            icon={AlertTriangle}
            change={{ value: "-3%", trend: "down", period: "vs mes anterior" }}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Metas Activas"
            value={statsLoading ? "..." : (stats as any)?.learningGoals || 0}
            icon={Target}
            change={{ value: "+24%", trend: "up", period: "este mes" }}
            iconColor="text-green-600"
          />
        </div>

        {/* Team Skills Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Team Skills Radar
            </CardTitle>
            <CardDescription>
              {radarView === "knowledge-areas" 
                ? "View skill proficiency levels grouped by knowledge areas, filtered by member categories"
                : radarView === "categories"
                ? "View skill proficiency levels grouped by categories, filtered by member categories"
                : "View individual skill proficiency levels, filtered by knowledge areas, categories, and member categories"
              }
            </CardDescription>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={radarView === "knowledge-areas" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewChange("knowledge-areas")}
              >
                Knowledge Areas
              </Button>
              <Button
                variant={radarView === "categories" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewChange("categories")}
              >
                Categories
              </Button>
              <Button
                variant={radarView === "skills" ? "default" : "outline"}
                size="sm"
                onClick={() => handleViewChange("skills")}
              >
                Individual Skills
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-4">
              {/* Member Category Filter - Available for all views */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Member Category:</label>
                <Select value={selectedMemberCategory} onValueChange={setSelectedMemberCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {(memberCategories as any[])?.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Knowledge Area Filter - Available for Skills view only */}
              {radarView === "skills" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Knowledge Area:</label>
                  <Select value={selectedKnowledgeArea} onValueChange={setSelectedKnowledgeArea}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Areas</SelectItem>
                      {(knowledgeAreas as any[])?.map((area: any) => (
                        <SelectItem key={area.id} value={area.name}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Category Filter - Available only for Skills view */}
              {radarView === "skills" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Category:</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {(skillCategories as any[])?.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Clear Filters */}
              {(selectedMemberCategory !== "all" || selectedKnowledgeArea !== "all" || selectedCategory !== "all") && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedMemberCategory("all");
                    setSelectedKnowledgeArea("all");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentRadarData.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={currentRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={false}
                    />
                    <Radar
                      name="Team Average"
                      dataKey="level"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length > 0) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
                              <p className="font-medium">{data.category}</p>
                              <p className="text-blue-600">Level: {data.level}%</p>
                              <p className="text-gray-600 text-sm">{data.memberCount} members</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No data available for the selected filters</p>
                  <p className="text-sm">Try adjusting your filter selection</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Distribución por Categoría
              </CardTitle>
              <CardDescription>
                Composición del equipo por nivel de experiencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={true}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Client Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top 5 Clientes
              </CardTitle>
              <CardDescription>
                Los 5 clientes con mayor asignación de talento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Techies con más habilidades registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {getInitials(performer.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{performer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{performer.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">{performer.skills}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">skills</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Learning Goals by Skill */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Metas de Aprendizaje Activas
              </CardTitle>
              <CardDescription>
                Habilidades más demandadas para desarrollo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goalsBySkill.slice(0, topGoalsLimit).map((skill, index) => (
                  <div key={skill.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{skill.name}</span>
                    </div>
                    <Badge variant="secondary">{skill.goals} metas</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Fortalezas de la Empresa
              </CardTitle>
              <CardDescription>
                Habilidades con mayor presencia en el equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strengthsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  companyStrengths.slice(0, 10).map((strength: any, index: number) => (
                    <div key={strength.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{strength.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{strength.count} personas</span>
                        <Badge variant="secondary">{strength.percentage}%</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Skill Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Brechas de Habilidades
              </CardTitle>
              <CardDescription>
                Habilidades con menor presencia en el equipo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gapsLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  skillGaps.slice(0, 10).map((gap: any, index: number) => (
                    <div key={gap.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{gap.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{gap.count} personas</span>
                        <Badge variant="destructive">{gap.percentage}%</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}