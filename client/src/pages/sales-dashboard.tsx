import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Brain } from 'lucide-react';
import { useMemo } from 'react';

export default function SalesDashboard() {
  const { language } = useLanguage();

  // Fetch data
  const { data: members = [] } = useQuery({ queryKey: ['/api/members'] });
  const { data: skills = [] } = useQuery({ queryKey: ['/api/skills'] });
  const { data: knowledgeAreas = [] } = useQuery({ queryKey: ['/api/knowledge-areas'] });
  const { data: clients = [] } = useQuery({ queryKey: ['/api/clients'] });

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

  // Sales Intelligence: Available Talent by Technology
  const availableTalentByTech = useMemo(() => {
    const skillTalent: { [key: string]: { total: number; available: number } } = {};
    
    skills.forEach((skill: any) => {
      skillTalent[skill.name] = { total: 0, available: 0 };
    });

    members.forEach((member: any) => {
      const currentClient = getCurrentClientName(member.profile, clients);
      const isAvailable = currentClient === 'Talent Pool';
      
      member.skills?.forEach((memberSkill: any) => {
        const skillName = memberSkill.skill.name;
        if (skillTalent[skillName]) {
          skillTalent[skillName].total++;
          if (isAvailable) {
            skillTalent[skillName].available++;
          }
        }
      });
    });

    return Object.entries(skillTalent)
      .map(([skill, counts]) => ({
        skill,
        total: counts.total,
        available: counts.available
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.available - a.available);
  }, [members, skills, clients]);

  // Knowledge Area Expertise
  const knowledgeAreaExpertise = useMemo(() => {
    const areaStats: { [key: string]: number } = {};
    
    knowledgeAreas.forEach((area: any) => {
      areaStats[area.name] = 0;
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
        areaStats[areaName as string]++;
      });
    });

    return Object.entries(areaStats)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / members.length) * 100)
      }))
      .filter(area => area.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [members, knowledgeAreas]);

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Panel de Ventas' : 'Sales Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'es' 
            ? 'Inteligencia de talento disponible y expertise por tecnología'
            : 'Available talent intelligence and technology expertise'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Talent by Technology */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              {language === 'es' ? 'Talento Disponible por Tecnología' : 'Available Talent by Technology'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Personas disponibles con habilidades específicas' : 'Available people with specific skills'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableTalentByTech.slice(0, 20).map((tech, index) => (
                <div key={tech.skill} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 border">
                  <div className="flex items-center gap-3">
                    <Badge variant={tech.available > 0 ? "default" : "secondary"} className="text-xs min-w-[2rem]">
                      {tech.available}
                    </Badge>
                    <span className="font-medium text-sm">{tech.skill}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tech.available} / {tech.total} available
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Area Expertise */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              {language === 'es' ? 'Áreas de Mayor Expertise' : 'Areas of Greatest Expertise'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Dominios con más talento y experiencia' : 'Domains with most talent and experience'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {knowledgeAreaExpertise.map((area, index) => (
                <div key={area.name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                    <span className="font-medium text-sm">{area.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={area.percentage} className="w-20" />
                    <span className="text-xs text-muted-foreground">{area.count} people</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Total Disponible' : 'Total Available'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter((m: any) => getCurrentClientName(m.profile, clients) === 'Talent Pool').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'En talent pool' : 'In talent pool'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Tecnologías Cubiertas' : 'Technologies Covered'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableTalentByTech.filter(t => t.available > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Con talento disponible' : 'With available talent'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Áreas de Conocimiento' : 'Knowledge Areas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{knowledgeAreaExpertise.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Con expertise' : 'With expertise'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Utilización' : 'Utilization'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(((members.length - members.filter((m: any) => getCurrentClientName(m.profile, clients) === 'Talent Pool').length) / members.length) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Asignados actualmente' : 'Currently assigned'}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}