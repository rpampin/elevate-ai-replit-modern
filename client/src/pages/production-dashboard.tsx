import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { useMemo } from 'react';

export default function ProductionDashboard() {
  const { language } = useLanguage();

  // Fetch data
  const { data: members = [] } = useQuery({ queryKey: ['/api/members'] });
  const { data: knowledgeAreas = [] } = useQuery({ queryKey: ['/api/knowledge-areas'] });
  const { data: clients = [] } = useQuery({ queryKey: ['/api/clients'] });

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

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

  // Production Intelligence: Colleague profiles for knowledge exchange
  const colleagueProfiles = useMemo(() => {
    return members
      .filter((member: any) => member.skills?.length > 0)
      .map((member: any) => {
        const topSkills = member.skills?.slice(0, 5).map((s: any) => s.skill.name) || [];
        const uniqueAreas = new Set(
          member.skills?.map((s: any) => {
            const knowledgeArea = knowledgeAreas.find((ka: any) => ka.id === s.skill.knowledgeAreaId);
            return knowledgeArea?.name;
          }).filter(Boolean)
        );
        
        return {
          name: member.name,
          category: member.category || 'Unknown',
          topSkills,
          currentClient: getCurrentClientName(member.profile, clients),
          canHelp: `Expert in ${Array.from(uniqueAreas).slice(0, 2).join(', ')}`,
          totalSkills: member.skills?.length || 0,
          email: member.email
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, clients, knowledgeAreas]);

  // Group colleagues by knowledge areas for better networking
  const colleaguesByArea = useMemo(() => {
    const areaGroups: { [key: string]: any[] } = {};
    
    knowledgeAreas.forEach((area: any) => {
      areaGroups[area.name] = [];
    });

    members.forEach((member: any) => {
      const memberAreas = new Set();
      member.skills?.forEach((memberSkill: any) => {
        const knowledgeArea = knowledgeAreas.find((ka: any) => ka.id === memberSkill.skill.knowledgeAreaId);
        if (knowledgeArea) {
          memberAreas.add(knowledgeArea.name);
        }
      });
      
      memberAreas.forEach((areaName: any) => {
        if (areaGroups[areaName]) {
          areaGroups[areaName].push({
            name: member.name,
            category: member.category || 'Unknown',
            currentClient: getCurrentClientName(member.profile, clients),
            skillCount: member.skills?.length || 0
          });
        }
      });
    });

    return Object.entries(areaGroups)
      .map(([area, colleagues]) => ({
        area,
        colleagues: colleagues.sort((a, b) => {
          const categoryOrder = { 'Wizard': 4, 'Solver': 3, 'Builder': 2, 'Starter': 1, 'Unknown': 0 };
          return (categoryOrder[b.category as keyof typeof categoryOrder] || 0) - (categoryOrder[a.category as keyof typeof categoryOrder] || 0);
        }),
        totalCount: colleagues.length
      }))
      .filter(group => group.totalCount > 0)
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [members, knowledgeAreas, clients]);

  // Collaboration opportunities (people working on similar projects or skills)
  const collaborationOpportunities = useMemo(() => {
    const opportunities: any[] = [];
    
    // Group by current client for collaboration opportunities
    const clientGroups: { [key: string]: any[] } = {};
    
    members.forEach((member: any) => {
      const currentClient = getCurrentClientName(member.profile, clients);
      if (!clientGroups[currentClient]) {
        clientGroups[currentClient] = [];
      }
      clientGroups[currentClient].push({
        name: member.name,
        category: member.category || 'Unknown',
        skills: member.skills?.map((s: any) => s.skill.name) || [],
        email: member.email
      });
    });

    // Find potential collaborations within each client
    Object.entries(clientGroups).forEach(([clientName, members]) => {
      if (members.length > 1 && clientName !== 'Talent Pool') {
        members.forEach((member1, i) => {
          members.slice(i + 1).forEach(member2 => {
            const commonSkills = member1.skills.filter((skill: string) => 
              member2.skills.includes(skill)
            );
            
            if (commonSkills.length > 0) {
              opportunities.push({
                person1: member1.name,
                person2: member2.name,
                client: clientName,
                commonSkills: commonSkills.slice(0, 3),
                category1: member1.category,
                category2: member2.category
              });
            }
          });
        });
      }
    });

    return opportunities.slice(0, 20);
  }, [members, clients]);

  // Skills exchange network (who can teach what to whom)
  const skillsExchangeNetwork = useMemo(() => {
    const exchanges: any[] = [];
    
    members.forEach((learner: any) => {
      const learnerSkills = new Set(learner.skills?.map((s: any) => s.skill.name) || []);
      
      members.forEach((teacher: any) => {
        if (learner.id !== teacher.id) {
          const teacherSkills = teacher.skills?.map((s: any) => s.skill.name) || [];
          const canTeach = teacherSkills.filter((skill: string) => !learnerSkills.has(skill));
          
          if (canTeach.length > 0 && teacher.category && 
              (teacher.category === 'Wizard' || teacher.category === 'Solver')) {
            exchanges.push({
              learner: learner.name,
              teacher: teacher.name,
              learnerCategory: learner.category || 'Unknown',
              teacherCategory: teacher.category,
              skillsToLearn: canTeach.slice(0, 3),
              potentialValue: canTeach.length
            });
          }
        }
      });
    });

    return exchanges
      .sort((a, b) => b.potentialValue - a.potentialValue)
      .slice(0, 30);
  }, [members]);

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Panel de Producción' : 'Production Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'es' 
            ? 'Perfiles de colegas para intercambio de conocimiento y colaboración'
            : 'Colleague profiles for knowledge exchange and collaboration'
          }
        </p>
      </div>

      {/* Colleague Profiles for Knowledge Exchange */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-cyan-600" />
              {language === 'es' ? 'Perfiles de Colegas para Intercambio' : 'Colleague Profiles for Exchange'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Conecta con colegas para aprender, compartir conocimiento y colaborar' : 'Connect with colleagues to learn, share knowledge and collaborate'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colleagueProfiles.slice(0, 12).map((colleague, index) => (
                <div key={colleague.name} className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center">
                      <span className="text-cyan-600 font-medium text-sm">{getInitials(colleague.name)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{colleague.name}</p>
                      <p className="text-xs text-muted-foreground">{colleague.category}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {colleague.topSkills.slice(0, 3).map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{colleague.currentClient}</p>
                    <p className="text-xs text-green-600">{colleague.canHelp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Area Networks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'es' ? 'Redes por Área de Conocimiento' : 'Knowledge Area Networks'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Encuentra expertos en cada dominio técnico' : 'Find experts in each technical domain'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {colleaguesByArea.slice(0, 8).map((group) => (
                <div key={group.area} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{group.area}</h4>
                    <Badge variant="outline" className="text-xs">{group.totalCount} people</Badge>
                  </div>
                  <div className="space-y-1">
                    {group.colleagues.slice(0, 3).map((colleague: any) => (
                      <div key={colleague.name} className="flex items-center justify-between text-xs">
                        <span>{colleague.name}</span>
                        <Badge variant="secondary" className="text-xs">{colleague.category}</Badge>
                      </div>
                    ))}
                    {group.colleagues.length > 3 && (
                      <p className="text-xs text-muted-foreground">+{group.colleagues.length - 3} more</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'es' ? 'Oportunidades de Colaboración' : 'Collaboration Opportunities'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Personas trabajando en proyectos similares' : 'People working on similar projects'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {collaborationOpportunities.slice(0, 10).map((opportunity, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <span className="font-medium">{opportunity.person1}</span>
                      <span className="mx-2">↔</span>
                      <span className="font-medium">{opportunity.person2}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{opportunity.client}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.commonSkills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Exchange Network */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'es' ? 'Red de Intercambio de Habilidades' : 'Skills Exchange Network'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Quién puede enseñar qué a quién' : 'Who can teach what to whom'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skillsExchangeNetwork.slice(0, 12).map((exchange, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      <div className="font-medium text-green-600">{exchange.teacher}</div>
                      <div className="text-xs text-muted-foreground">can teach</div>
                      <div className="font-medium text-blue-600">{exchange.learner}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">{exchange.teacherCategory}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {exchange.potentialValue} skills
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {exchange.skillsToLearn.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Total Colegas' : 'Total Colleagues'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{colleagueProfiles.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Con habilidades' : 'With skills'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Áreas Activas' : 'Active Areas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{colleaguesByArea.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Con expertos' : 'With experts'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Colaboraciones Posibles' : 'Possible Collaborations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collaborationOpportunities.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Identificadas' : 'Identified'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Intercambios de Habilidades' : 'Skill Exchanges'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillsExchangeNetwork.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Oportunidades' : 'Opportunities'}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}