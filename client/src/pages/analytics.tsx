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
  Download
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { getCategoryColor, getInitials } from "@/lib/constants";
import type { MemberWithSkills } from "@shared/schema";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function Analytics() {
  const { t } = useLanguage();
  
  // State for radar chart filters
  const [selectedSkillCategory, setSelectedSkillCategory] = useState<string>("all");
  const [selectedTeamCategory, setSelectedTeamCategory] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"categories" | "skills" | "knowledge-areas">("categories");

  // Fetch data
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
  });

  const { data: companyStrengths, isLoading: strengthsLoading } = useQuery({
    queryKey: ["/api/analytics/company-strengths"],
  });

  const { data: skillGaps, isLoading: gapsLoading } = useQuery({
    queryKey: ["/api/analytics/skill-gaps"],
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["/api/members"],
  });

  const { data: learningGoals, isLoading: goalsLoading } = useQuery({
    queryKey: ["/api/learning-goals"],
  });

  const { data: skillCategories } = useQuery({
    queryKey: ["/api/skill-categories"],
  });

  const { data: scales } = useQuery({
    queryKey: ["/api/scales"],
  });

  const { data: skills } = useQuery({
    queryKey: ["/api/skills"],
  });

  const { data: knowledgeAreas } = useQuery({
    queryKey: ["/api/knowledge-areas"],
  });

  // Analytics calculations
  const getCategoryDistribution = () => {
    if (!members) return [];
    
    const distribution = members.reduce((acc: any, member: MemberWithSkills) => {
      acc[member.category] = (acc[member.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count as number,
    }));
  };

  const getClientDistribution = () => {
    if (!members) return [];
    
    const distribution = members.reduce((acc: any, member: MemberWithSkills) => {
      const client = member.currentClient || "Talent Pool";
      acc[client] = (acc[client] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([client, count]) => ({
      name: client,
      value: count as number,
    }));
  };

  const getTopPerformers = () => {
    if (!members) return [];
    
    return members
      .filter((member: MemberWithSkills) => member.skills.length > 0)
      .sort((a: MemberWithSkills, b: MemberWithSkills) => b.skills.length - a.skills.length)
      .slice(0, 5)
      .map((member: MemberWithSkills) => ({
        name: member.fullName,
        skillCount: member.skills.length,
        category: member.category,
        client: member.currentClient || "Talent Pool",
      }));
  };

  const getActiveGoalsBySkill = () => {
    if (!learningGoals || !Array.isArray(learningGoals)) return [];
    
    const goalsBySkill = learningGoals.reduce((acc: any, goal: any) => {
      if (goal.status === "active") {
        acc[goal.skill.name] = (acc[goal.skill.name] || 0) + 1;
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

  // Radar chart data preparation
  const prepareTeamRadarData = () => {
    if (!members || !skillCategories || !scales || !Array.isArray(members) || !Array.isArray(skillCategories) || !Array.isArray(scales)) return [];

    // Filter members based on selection
    let filteredMembers = members;
    
    if (selectedTeamCategory !== "all") {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.category === selectedTeamCategory);
    }
    
    if (selectedClient !== "all") {
      const clientFilter = selectedClient === "talent-pool" ? null : selectedClient;
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.currentClient === clientFilter);
    }
    
    if (selectedMembers.length > 0) {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => 
        selectedMembers.includes(member.id.toString())
      );
    }

    // Calculate average skill levels per category across filtered members
    const categoryStats = new Map();
    
    skillCategories.forEach((category: any) => {
      categoryStats.set(category.id, {
        name: category.name,
        totalSkills: 0,
        totalLevels: 0,
        averageLevel: 0,
        memberCount: 0
      });
    });

    filteredMembers.forEach((member: MemberWithSkills) => {
      if (!member.skills || !Array.isArray(member.skills)) return;
      
      const memberCategoryLevels = new Map();
      
      member.skills.forEach((memberSkill: any) => {
        const categoryId = memberSkill.skill?.categoryId;
        if (!categoryId) return;

        const scale = scales.find((s: any) => s.id === memberSkill.scaleId);
        if (!scale) return;

        let numericLevel = 0;
        if (scale.values && Array.isArray(scale.values)) {
          const valueIndex = scale.values.findIndex((v: any) => 
            (typeof v === 'string' ? v : v.value) === memberSkill.level
          );
          if (valueIndex !== -1) {
            numericLevel = ((valueIndex + 1) / scale.values.length) * 100;
          }
        } else if (scale.type === 'quantitative' && !isNaN(Number(memberSkill.level))) {
          const maxValue = 5;
          numericLevel = (Number(memberSkill.level) / maxValue) * 100;
        }

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

  const getUniqueCategories = () => {
    if (!members || !Array.isArray(members)) return [];
    return [...new Set(members.map((m: MemberWithSkills) => m.category))];
  };

  const getUniqueClients = () => {
    if (!members || !Array.isArray(members)) return [];
    const clients = members.map((m: MemberWithSkills) => m.currentClient || "Talent Pool");
    return [...new Set(clients)];
  };

  // Skills radar data preparation
  const prepareSkillsRadarData = () => {
    if (!members || !skills || !scales || !Array.isArray(members) || !Array.isArray(skills) || !Array.isArray(scales)) return [];

    // Filter members based on selection
    let filteredMembers = members;
    
    if (selectedTeamCategory !== "all") {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.category === selectedTeamCategory);
    }
    
    if (selectedClient !== "all") {
      const clientFilter = selectedClient === "talent-pool" ? null : selectedClient;
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.currentClient === clientFilter);
    }

    // Get skills for the selected skill category or all skills
    let relevantSkills = skills;
    if (selectedSkillCategory !== "all" && skillCategories && Array.isArray(skillCategories)) {
      const categoryId = skillCategories.find((cat: any) => cat.name === selectedSkillCategory)?.id;
      if (categoryId) {
        relevantSkills = skills.filter((skill: any) => skill.categoryId === categoryId);
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
        const skillId = memberSkill.skill?.id;
        if (!skillId || !skillStats.has(skillId)) return;

        const scale = scales.find((s: any) => s.id === memberSkill.scaleId);
        if (!scale) return;

        let numericLevel = 0;
        if (scale.values && Array.isArray(scale.values)) {
          const valueIndex = scale.values.findIndex((v: any) => 
            (typeof v === 'string' ? v : v.value) === memberSkill.level
          );
          if (valueIndex !== -1) {
            numericLevel = ((valueIndex + 1) / scale.values.length) * 100;
          }
        } else if (scale.type === 'quantitative' && !isNaN(Number(memberSkill.level))) {
          const maxValue = 5;
          numericLevel = (Number(memberSkill.level) / maxValue) * 100;
        }

        const skillData = skillStats.get(skillId);
        if (skillData) {
          skillData.totalLevels += numericLevel;
          skillData.memberCount += 1;
          skillData.averageLevel = skillData.totalLevels / skillData.memberCount;
        }
      });
    });

    return Array.from(skillStats.values())
      .filter(skill => skill.memberCount > 0)
      .sort((a, b) => b.averageLevel - a.averageLevel)
      .slice(0, 12) // Limit to top 12 skills for readability
      .map(skill => ({
        category: skill.name,
        level: Math.round(skill.averageLevel),
        memberCount: skill.memberCount
      }));
  };

  // Knowledge areas radar data preparation
  const prepareKnowledgeAreasRadarData = () => {
    if (!members || !skills || !scales || !knowledgeAreas || !Array.isArray(members) || !Array.isArray(skills) || !Array.isArray(scales) || !Array.isArray(knowledgeAreas)) return [];

    // Filter members based on selection
    let filteredMembers = members;
    
    if (selectedTeamCategory !== "all") {
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.category === selectedTeamCategory);
    }
    
    if (selectedClient !== "all") {
      const clientFilter = selectedClient === "talent-pool" ? null : selectedClient;
      filteredMembers = filteredMembers.filter((member: MemberWithSkills) => member.currentClient === clientFilter);
    }

    // Calculate average skill levels per knowledge area across filtered members
    const knowledgeAreaStats = new Map();
    
    knowledgeAreas.forEach((area: any) => {
      knowledgeAreaStats.set(area.id, {
        name: area.name,
        totalLevels: 0,
        memberCount: 0,
        averageLevel: 0
      });
    });

    filteredMembers.forEach((member: MemberWithSkills) => {
      if (!member.skills || !Array.isArray(member.skills)) return;
      
      member.skills.forEach((memberSkill: any) => {
        const skill = skills.find((s: any) => s.id === memberSkill.skill?.id);
        if (!skill || !skill.knowledgeAreaId) return;

        const scale = scales.find((s: any) => s.id === memberSkill.scaleId);
        if (!scale) return;

        let numericLevel = 0;
        if (scale.values && Array.isArray(scale.values)) {
          const valueIndex = scale.values.findIndex((v: any) => 
            (typeof v === 'string' ? v : v.value) === memberSkill.level
          );
          if (valueIndex !== -1) {
            numericLevel = ((valueIndex + 1) / scale.values.length) * 100;
          }
        } else if (scale.type === 'quantitative' && !isNaN(Number(memberSkill.level))) {
          const maxValue = 5;
          numericLevel = (Number(memberSkill.level) / maxValue) * 100;
        }

        const areaData = knowledgeAreaStats.get(skill.knowledgeAreaId);
        if (areaData) {
          areaData.totalLevels += numericLevel;
          areaData.memberCount += 1;
          areaData.averageLevel = areaData.totalLevels / areaData.memberCount;
        }
      });
    });

    return Array.from(knowledgeAreaStats.values())
      .filter(area => area.memberCount > 0)
      .sort((a, b) => b.averageLevel - a.averageLevel)
      .map(area => ({
        category: area.name,
        level: Math.round(area.averageLevel),
        memberCount: area.memberCount
      }));
  };

  const categoryData = getCategoryDistribution();
  const clientData = getClientDistribution();
  const topPerformers = getTopPerformers();
  const goalsBySkill = getActiveGoalsBySkill();
  const teamRadarData = prepareTeamRadarData();
  const skillsRadarData = prepareSkillsRadarData();
  const knowledgeAreasRadarData = prepareKnowledgeAreasRadarData();
  const uniqueCategories = getUniqueCategories();
  const uniqueClients = getUniqueClients();
  
  // Get the appropriate data based on view mode
  const currentRadarData = 
    viewMode === "categories" ? teamRadarData :
    viewMode === "skills" ? skillsRadarData :
    knowledgeAreasRadarData;

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
            value={statsLoading ? "..." : stats?.totalMembers || 0}
            icon={Users}
            change={{ value: "+12%", trend: "up", period: "vs mes anterior" }}
          />
          <StatsCard
            title="Habilidades Únicas"
            value={statsLoading ? "..." : stats?.activeSkills || 0}
            icon={Brain}
            change={{ value: "+8%", trend: "up", period: "nuevas este mes" }}
            iconColor="text-purple-600"
          />
          <StatsCard
            title="En Talent Pool"
            value={statsLoading ? "..." : stats?.talentPool || 0}
            icon={AlertTriangle}
            change={{ value: "-3%", trend: "down", period: "vs mes anterior" }}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title="Metas Activas"
            value={statsLoading ? "..." : stats?.learningGoals || 0}
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
              {viewMode === "categories" 
                ? "Compare skill proficiency levels across categories with filtering options"
                : viewMode === "skills"
                ? "View individual skill proficiency levels with filtering options"
                : "View skill proficiency levels grouped by knowledge areas"
              }
            </CardDescription>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2 mt-4">
              <Button
                variant={viewMode === "categories" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("categories");
                  setSelectedSkillCategory("all"); // Reset skill category when not needed
                }}
              >
                Categories
              </Button>
              <Button
                variant={viewMode === "skills" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("skills")}
              >
                Individual Skills
              </Button>
              <Button
                variant={viewMode === "knowledge-areas" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setViewMode("knowledge-areas");
                  setSelectedSkillCategory("all"); // Reset skill category when not needed
                }}
              >
                Knowledge Areas
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mt-4">
              {/* Only show skill category filter for Individual Skills view */}
              {viewMode === "skills" && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Skill Category:</label>
                  <Select value={selectedSkillCategory} onValueChange={setSelectedSkillCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {skillCategories && Array.isArray(skillCategories) && skillCategories.map((category: any) => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Team Category:</label>
                <Select value={selectedTeamCategory} onValueChange={setSelectedTeamCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Teams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {uniqueCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Client:</label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {uniqueClients.map((client) => (
                      <SelectItem key={client} value={client === "Talent Pool" ? "talent-pool" : client}>
                        {client}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSkillCategory !== "all" || selectedTeamCategory !== "all" || selectedClient !== "all" ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedSkillCategory("all");
                    setSelectedTeamCategory("all");
                    setSelectedClient("all");
                    setSelectedMembers([]);
                  }}
                >
                  Clear Filters
                </Button>
              ) : null}
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
                              <p className="text-sm text-gray-500">{data.memberCount} members</p>
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
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No skill data available for the selected filters</p>
                  <p className="text-sm">Try adjusting your filter criteria</p>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500 text-center mt-4">
              {viewMode === "categories" 
                ? `Showing average skill proficiency levels across all skill categories`
                : viewMode === "skills"
                ? `Showing individual skill proficiency levels${selectedSkillCategory !== "all" ? ` for ${selectedSkillCategory}` : ""}`
                : `Showing skill proficiency levels grouped by knowledge areas`
              }
              {(selectedSkillCategory !== "all" || selectedTeamCategory !== "all" || selectedClient !== "all") && 
                " (filtered view)"
              }
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-primary" />
                  Distribución por Categoría
                </CardTitle>
                <CardDescription>
                  Distribución de Techies por nivel de experiencia
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="skeleton h-32 w-32 rounded-full"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Client Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Distribución por Cliente
              </CardTitle>
              <CardDescription>
                Asignación actual de Techies por cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="skeleton h-40 w-full"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={clientData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Skills and Goals Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learning Goals by Skill */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Metas de Aprendizaje Populares
              </CardTitle>
              <CardDescription>
                Habilidades más buscadas para desarrollo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {goalsLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton h-4 w-full"></div>
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={goalsBySkill} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="goals" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2 text-primary" />
                Top Performers
              </CardTitle>
              <CardDescription>
                Techies con más habilidades registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="skeleton h-10 w-10 rounded-full"></div>
                      <div className="flex-1">
                        <div className="skeleton h-4 w-32 mb-1"></div>
                        <div className="skeleton h-3 w-24"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {topPerformers.map((performer, index) => (
                    <div key={performer.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-medium text-sm">
                            {getInitials(performer.name)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {performer.name}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getCategoryColor(performer.category)} variant="secondary">
                              {performer.category}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {performer.client}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {performer.skillCount}
                        </div>
                        <div className="text-xs text-gray-500">skills</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Strengths - Detailed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                Fortalezas Detalladas
              </CardTitle>
              <CardDescription>
                Áreas donde tenemos mayor concentración de talento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {strengthsLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton h-6 w-full"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {companyStrengths?.slice(0, 8).map((strength: any, index: number) => (
                    <div key={strength.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {strength.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${strength.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {strength.count} personas
                          </div>
                          <div className="text-xs text-gray-500">
                            {strength.percentage}% del equipo
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skill Gaps - Detailed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                Oportunidades de Crecimiento
              </CardTitle>
              <CardDescription>
                Áreas con menor concentración de talento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {gapsLoading ? (
                <div className="space-y-3">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="skeleton h-6 w-full"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {skillGaps?.slice(0, 8).map((gap: any, index: number) => (
                    <div key={gap.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {gap.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${gap.percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {gap.count} personas
                          </div>
                          <div className="text-xs text-gray-500">
                            {gap.percentage}% del equipo
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button className="w-full" variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Crear Plan de Desarrollo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
