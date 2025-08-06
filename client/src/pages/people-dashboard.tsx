import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Target, Users, Filter, X, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getCategoryColor, getInitials } from '@/lib/constants';
import Header from '@/components/layout/header';
import { PaginationControls } from '@/components/ui/pagination-controls';



// Helper functions
const getCurrentClient = (member: any) => {
  if (!member.profile?.clientHistory || member.profile.clientHistory.length === 0) {
    return 'Talent Pool';
  }
  
  const currentAssignment = member.profile.clientHistory
    .filter((ch: any) => !ch.endDate)
    .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  
  return currentAssignment?.clientName || 'Talent Pool';
};

const getExperienceYears = (member: any) => {
  if (!member.hireDate) return 0;
  const hireDate = new Date(member.hireDate);
  const now = new Date();
  const yearsDiff = now.getFullYear() - hireDate.getFullYear();
  return yearsDiff;
};

export default function PeopleDashboard() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Filter states
  const [nameFilter, setNameFilter] = useState("");
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState(""); // For filtering skills dropdown
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]); // Multi-select skills
  const [clientFilter, setClientFilter] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch data
  const { data: members = [] } = useQuery({ queryKey: ['/api/members'] });
  const { data: knowledgeAreas = [] } = useQuery({ queryKey: ['/api/knowledge-areas'] });
  const { data: clients = [] } = useQuery({ queryKey: ['/api/clients'] });
  const { data: learningGoals = [] } = useQuery({ queryKey: ['/api/learning-goals'] });
  const { data: skills = [] } = useQuery({ queryKey: ['/api/skills'] });
  const { data: categories = [] } = useQuery({ queryKey: ['/api/categories'] });

  // Helper function to get current client name
  const getCurrentClientName = (profile: any, clients: any[]) => {
    if (!profile?.clientHistory?.length) return 'Talent Pool';
    
    const currentAssignment = profile.clientHistory
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
    
    if (!currentAssignment?.endDate) {
      const client = clients.find(c => c.id === currentAssignment.clientId);
      return client?.name || 'Talent Pool';
    }
    
    return 'Talent Pool';
  };

  // Helper function to calculate years of experience
  const getExperienceYears = (member: any) => {
    if (!member.hireDate) return 0;
    const hireDate = new Date(member.hireDate);
    const now = new Date();
    return Math.floor((now.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  };

  // Helper function to get current client name
  const getCurrentClient = (member: any) => {
    if (!member.profile?.clientHistory?.length) return 'Talent Pool';
    
    const currentAssignment = member.profile.clientHistory
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
    
    if (!currentAssignment?.endDate) {
      const client = clients.find(c => c.id === currentAssignment.clientId);
      return client?.name || 'Talent Pool';
    }
    
    return 'Talent Pool';
  };

  // Filter skills based on selected knowledge area
  const filteredSkills = useMemo(() => {
    if (!selectedKnowledgeArea || selectedKnowledgeArea === "all") {
      return skills;
    }
    return skills.filter((skill: any) => skill.knowledgeAreaId?.toString() === selectedKnowledgeArea);
  }, [skills, selectedKnowledgeArea]);

  // Filter members based on current filter criteria
  const filteredMembers = useMemo(() => {
    return members.filter((member: any) => {
      // Name filter
      if (nameFilter && !member.name.toLowerCase().includes(nameFilter.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter && member.category !== categoryFilter) {
        return false;
      }

      // Client filter
      if (clientFilter) {
        const currentClient = getCurrentClient(member);
        if (currentClient !== clientFilter) {
          return false;
        }
      }

      // Skills filter (multi-select)
      if (selectedSkills.length > 0) {
        const memberSkillIds = member.skills?.map((memberSkill: any) => memberSkill.skillId?.toString()) || [];
        const hasAnySelectedSkill = selectedSkills.some(skillId => memberSkillIds.includes(skillId));
        if (!hasAnySelectedSkill) return false;
      }

      return true;
    });
  }, [members, nameFilter, categoryFilter, clientFilter, selectedSkills, clients, skills]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [nameFilter, selectedKnowledgeArea, categoryFilter, selectedSkills, clientFilter]);

  // Pagination calculations for member display (using filteredMembers for display)
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setNameFilter("");
    setSelectedKnowledgeArea("");
    setCategoryFilter("");
    setSelectedSkills([]);
    setClientFilter("");
  };

  // People Intelligence: Career Path Analysis
  const careerPathAnalysis = useMemo(() => {
    return filteredMembers.map((member: any) => {
      const currentClient = getCurrentClientName(member.profile, clients);
      const experienceYears = getExperienceYears(member);
      const memberSkillCategories = new Set(
        member.skills?.map((s: any) => {
          const category = s.skill.categoryId;
          return category;
        }).filter(Boolean)
      );
      const skillDiversity = memberSkillCategories.size;
      
      // Calculate alignment score based on career progression and current assignment
      let alignment = 'Low';
      if (member.category === 'Wizard' && currentClient !== 'Talent Pool') alignment = 'High';
      else if (member.category === 'Solver' && experienceYears >= 3) alignment = 'Medium';
      else if (member.category === 'Builder' && experienceYears >= 2) alignment = 'Medium';
      else if (member.category === 'Starter' && experienceYears <= 1) alignment = 'Medium';

      return {
        name: member.name,
        category: member.category || 'Unknown',
        currentClient,
        experienceYears,
        skillDiversity,
        alignment
      };
    }).sort((a, b) => {
      const alignmentOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (alignmentOrder[b.alignment as keyof typeof alignmentOrder] || 0) - (alignmentOrder[a.alignment as keyof typeof alignmentOrder] || 0);
    });
  }, [filteredMembers, clients]);

  // Development Opportunities
  const developmentOpportunities = useMemo(() => {
    const opportunities: any[] = [];
    
    filteredMembers.forEach((member: any) => {
      const memberKnowledgeAreas = new Set(
        member.skills?.map((s: any) => {
          const knowledgeArea = knowledgeAreas.find((ka: any) => ka.id === s.skill.knowledgeAreaId);
          return knowledgeArea?.name;
        }).filter(Boolean)
      );

      knowledgeAreas.forEach((area: any) => {
        if (!memberKnowledgeAreas.has(area.name)) {
          let potential = 'Low';
          
          // Determine potential based on current category and areas they already know
          if (member.category === 'Wizard' || member.category === 'Solver') {
            potential = 'High';
          } else if (member.category === 'Builder') {
            potential = 'Medium';
          }

          opportunities.push({
            person: member.name,
            area: area.name,
            potential,
            category: member.category || 'Unknown'
          });
        }
      });
    });

    return opportunities
      .sort((a, b) => {
        const potentialOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return (potentialOrder[b.potential as keyof typeof potentialOrder] || 0) - (potentialOrder[a.potential as keyof typeof potentialOrder] || 0);
      });
  }, [filteredMembers, knowledgeAreas]);

  // Learning Goals Progress
  const learningGoalsProgress = useMemo(() => {
    const goalsByMember: { [key: string]: any[] } = {};
    
    learningGoals.forEach((goal: any) => {
      const memberName = goal.member?.name || 'Unknown';
      if (!goalsByMember[memberName]) {
        goalsByMember[memberName] = [];
      }
      goalsByMember[memberName].push(goal);
    });

    return Object.entries(goalsByMember).map(([memberName, goals]) => {
      const completedGoals = goals.filter(g => g.status === 'completed').length;
      const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;
      const totalGoals = goals.length;
      
      return {
        memberName,
        totalGoals,
        completedGoals,
        inProgressGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      };
    }).sort((a, b) => b.completionRate - a.completionRate);
  }, [learningGoals]);

  // Team Diversity Analysis
  const teamDiversity = useMemo(() => {
    const categoryStats: { [key: string]: number } = {};
    const experienceStats: { [key: string]: number } = {
      'Junior (0-2y)': 0,
      'Mid (3-5y)': 0,
      'Senior (6+y)': 0
    };

    filteredMembers.forEach((member: any) => {
      const category = member.category || 'Unknown';
      categoryStats[category] = (categoryStats[category] || 0) + 1;

      const experience = getExperienceYears(member);
      if (experience <= 2) experienceStats['Junior (0-2y)']++;
      else if (experience <= 5) experienceStats['Mid (3-5y)']++;
      else experienceStats['Senior (6+y)']++;
    });

    return {
      categories: Object.entries(categoryStats).map(([name, count]) => ({
        name,
        count,
        percentage: filteredMembers.length > 0 ? Math.round((count / filteredMembers.length) * 100) : 0
      })),
      experience: Object.entries(experienceStats).map(([name, count]) => ({
        name,
        count,
        percentage: filteredMembers.length > 0 ? Math.round((count / filteredMembers.length) * 100) : 0
      }))
    };
  }, [filteredMembers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title={language === 'es' ? 'Panel de Personas' : 'People Dashboard'}
        subtitle={language === 'es' ? 'Rutas de carrera y oportunidades de desarrollo' : 'Career paths and development opportunities'}
      />
      <main className="p-6">
        {/* Filter Members Component */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            {language === 'es' ? 'Filtrar Miembros' : 'Filter Members'}
          </CardTitle>
          <CardDescription>
            {language === 'es' ? 'Filtra los miembros del equipo para análisis específicos' : 'Filter team members for specific analysis'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Name Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'es' ? 'Nombre' : 'Name'}</label>
              <Input
                placeholder={language === 'es' ? 'Buscar por nombre...' : 'Search by name...'}
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'es' ? 'Categoría' : 'Category'}</label>
              <Select value={categoryFilter || "all"} onValueChange={(value) => setCategoryFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Todas las categorías' : 'All categories'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'es' ? 'Todas las categorías' : 'All categories'}</SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'es' ? 'Cliente' : 'Client'}</label>
              <Select value={clientFilter || "all"} onValueChange={(value) => setClientFilter(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Todos los clientes' : 'All clients'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'es' ? 'Todos los clientes' : 'All clients'}</SelectItem>
                  {clients.map((client: any) => (
                    <SelectItem key={client.name} value={client.name}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Knowledge Area Selector (for filtering skills) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'es' ? 'Área de Conocimiento' : 'Knowledge Area'}</label>
              <Select value={selectedKnowledgeArea || "all"} onValueChange={(value) => setSelectedKnowledgeArea(value === "all" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Todas las áreas' : 'All areas'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'es' ? 'Todas las áreas' : 'All areas'}</SelectItem>
                  {knowledgeAreas.map((area: any) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Skills Multi-Select Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{language === 'es' ? 'Habilidades' : 'Skills'}</label>
              <Select value="" onValueChange={(value) => {
                if (value && value !== "all") {
                  const isSelected = selectedSkills.includes(value);
                  if (isSelected) {
                    // Remove skill if already selected
                    setSelectedSkills(selectedSkills.filter(id => id !== value));
                  } else {
                    // Add skill if not selected
                    setSelectedSkills([...selectedSkills, value]);
                  }
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar habilidades...' : 'Select skills...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'es' ? 'Todas las habilidades' : 'All skills'}</SelectItem>
                  {filteredSkills.map((skill: any) => {
                    const isSelected = selectedSkills.includes(skill.id.toString());
                    return (
                      <SelectItem key={skill.id} value={skill.id.toString()}>
                        <div className="flex items-center gap-2 w-full">
                          {isSelected && <Check className="h-4 w-4 text-green-600" />}
                          <span className={isSelected ? "font-medium" : ""}>{skill.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium invisible">Clear</label>
              <Button onClick={clearFilters} variant="outline" className="w-full">
                {language === 'es' ? 'Limpiar Filtros' : 'Clear Filters'}
              </Button>
            </div>
          </div>

          {/* Selected Skills Tags - Full Width */}
          {selectedSkills.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">{language === 'es' ? 'Habilidades Seleccionadas:' : 'Selected Skills:'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skillId) => {
                  const skill = skills.find((s: any) => s.id.toString() === skillId);
                  return skill ? (
                    <Badge key={skillId} variant="secondary" className="flex items-center gap-1">
                      {skill.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => setSelectedSkills(selectedSkills.filter(id => id !== skillId))}
                      >
                        ×
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Filter Summary */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {language === 'es' 
                  ? `Mostrando ${filteredMembers.length} de ${members.length} miembros` 
                  : `Showing ${filteredMembers.length} of ${members.length} members`
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered Members Display */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            {language === 'es' ? 'Miembros del Equipo' : 'Team Members'}
            <Badge variant="secondary" className="ml-2">{filteredMembers.length}</Badge>
          </CardTitle>
          <CardDescription>
            {language === 'es' ? 'Haz clic en cualquier miembro para ver su perfil completo' : 'Click on any member to view their full profile'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'es' ? 'No se encontraron miembros con los filtros aplicados' : 'No members found with current filters'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedMembers.map((member: any) => (
                <Card 
                  key={member.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200 dark:hover:border-blue-800"
                  onClick={() => setLocation(`/members/${member.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{member.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {member.category && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getCategoryColor(member.category)}`}
                        >
                          {member.category}
                        </Badge>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>{language === 'es' ? 'Cliente:' : 'Client:'}</span>
                          <span className="font-medium">{getCurrentClient(member)}</span>
                        </div>
                        
                        {member.hireDate && (
                          <div className="flex items-center justify-between mt-1">
                            <span>{language === 'es' ? 'Experiencia:' : 'Experience:'}</span>
                            <span className="font-medium">{getExperienceYears(member)} {language === 'es' ? 'años' : 'years'}</span>
                          </div>
                        )}
                        
                        {member.skills && member.skills.length > 0 && (
                          <div className="flex items-center justify-between mt-1">
                            <span>{language === 'es' ? 'Habilidades:' : 'Skills:'}</span>
                            <span className="font-medium">{member.skills.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={filteredMembers.length}
                itemsPerPage={itemsPerPage}
                startIndex={startIndex}
                endIndex={endIndex}
              />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Career Path Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              {language === 'es' ? 'Análisis de Trayectorias' : 'Career Path Analysis'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Patrones de carrera y alineación con asignaciones' : 'Career patterns and assignment alignment'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {careerPathAnalysis.slice(0, 15).map((person, index) => (
                <div key={person.name} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.currentClient}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={person.alignment === 'High' ? 'default' : person.alignment === 'Medium' ? 'secondary' : 'outline'} className="text-xs">
                      {person.alignment}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{person.experienceYears}y exp</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Development Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              {language === 'es' ? 'Oportunidades de Desarrollo' : 'Development Opportunities'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Áreas potenciales para crecimiento profesional' : 'Potential areas for professional growth'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {developmentOpportunities.slice(0, 15).map((opportunity, index) => (
                <div key={`${opportunity.person}-${opportunity.area}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border">
                  <div>
                    <p className="font-medium text-sm">{opportunity.person}</p>
                    <p className="text-xs text-muted-foreground">{opportunity.area}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {opportunity.potential}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Goals Progress */}
      {learningGoalsProgress.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                {language === 'es' ? 'Progreso de Objetivos de Aprendizaje' : 'Learning Goals Progress'}
              </CardTitle>
              <CardDescription>
                {language === 'es' ? 'Seguimiento del desarrollo individual' : 'Individual development tracking'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningGoalsProgress.slice(0, 12).map((progress, index) => (
                  <div key={progress.memberName} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{progress.memberName}</span>
                      <Badge variant="secondary" className="text-xs">{progress.completionRate}%</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Total: {progress.totalGoals} goals</div>
                      <div>Completed: {progress.completedGoals}</div>
                      <div>In Progress: {progress.inProgressGoals}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team Diversity */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'es' ? 'Diversidad del Equipo' : 'Team Diversity'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Distribución por categorías y experiencia' : 'Distribution by categories and experience'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">{language === 'es' ? 'Por Categoría' : 'By Category'}</h4>
                <div className="space-y-2">
                  {teamDiversity.categories.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className="text-sm">{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
                        <span className="text-xs text-muted-foreground">{cat.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">{language === 'es' ? 'Por Experiencia' : 'By Experience'}</h4>
                <div className="space-y-2">
                  {teamDiversity.experience.map((exp) => (
                    <div key={exp.name} className="flex items-center justify-between p-2 rounded-lg border">
                      <span className="text-sm">{exp.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{exp.count}</Badge>
                        <span className="text-xs text-muted-foreground">{exp.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Alta Alineación' : 'High Alignment'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {careerPathAnalysis.filter(p => p.alignment === 'High').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Personas bien alineadas' : 'Well-aligned people'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Oportunidades Alto Potencial' : 'High Potential Opportunities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {developmentOpportunities.filter(o => o.potential === 'High').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Para desarrollo' : 'For development'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Objetivos Activos' : 'Active Goals'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {learningGoalsProgress.reduce((sum, p) => sum + p.inProgressGoals, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'En progreso' : 'In progress'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Promedio Experiencia' : 'Average Experience'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(careerPathAnalysis.reduce((sum, p) => sum + p.experienceYears, 0) / careerPathAnalysis.length)}y
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Años promedio' : 'Years average'}
            </p>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  );
}