import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, AlertTriangle } from 'lucide-react';
import { useMemo } from 'react';

export default function SolutionsDashboard() {
  const { language } = useLanguage();

  // Fetch data
  const { data: members = [] } = useQuery({ queryKey: ['/api/members'] });
  const { data: knowledgeAreas = [] } = useQuery({ queryKey: ['/api/knowledge-areas'] });

  // Solutions Intelligence: Key People by Knowledge Area
  const keyPeopleByArea = useMemo(() => {
    const areaExperts: { [key: string]: any[] } = {};
    
    knowledgeAreas.forEach((area: any) => {
      areaExperts[area.name] = [];
    });

    members.forEach((member: any) => {
      const memberAreas = new Set<string>();
      let totalSkills = 0;
      
      member.skills?.forEach((memberSkill: any) => {
        const knowledgeArea = knowledgeAreas.find((ka: any) => ka.id === memberSkill.skill.knowledgeAreaId);
        if (knowledgeArea) {
          memberAreas.add(knowledgeArea.name);
          totalSkills++;
        }
      });
      
      memberAreas.forEach((areaName) => {
        if (areaExperts[areaName]) {
          areaExperts[areaName].push({
            name: member.name,
            category: member.category || 'Unknown',
            skillCount: totalSkills,
            area: areaName
          });
        }
      });
    });

    // Get top experts from each area
    const result: any[] = [];
    Object.entries(areaExperts).forEach(([areaName, experts]) => {
      const topExperts = experts
        .sort((a, b) => {
          // Sort by category first (Wizard > Solver > Builder > Starter), then by skill count
          const categoryOrder = { 'Wizard': 4, 'Solver': 3, 'Builder': 2, 'Starter': 1, 'Unknown': 0 };
          const categoryDiff = (categoryOrder[b.category as keyof typeof categoryOrder] || 0) - (categoryOrder[a.category as keyof typeof categoryOrder] || 0);
          if (categoryDiff !== 0) return categoryDiff;
          return b.skillCount - a.skillCount;
        })
        .slice(0, 2); // Top 2 from each area
      
      result.push(...topExperts);
    });

    return result.sort((a, b) => {
      const categoryOrder = { 'Wizard': 4, 'Solver': 3, 'Builder': 2, 'Starter': 1, 'Unknown': 0 };
      return (categoryOrder[b.category as keyof typeof categoryOrder] || 0) - (categoryOrder[a.category as keyof typeof categoryOrder] || 0);
    });
  }, [members, knowledgeAreas]);

  // Areas with Least Talent
  const leastTalentAreas = useMemo(() => {
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
      .sort((a, b) => a.count - b.count)
      .slice(0, 6); // Show bottom 6 areas
  }, [members, knowledgeAreas]);

  // Strategic Skills Analysis
  const strategicSkillsAnalysis = useMemo(() => {
    const strategicSkills = new Set<string>();
    const skillCoverage: { [key: string]: number } = {};

    // Identify strategic skills and calculate coverage
    members.forEach((member: any) => {
      member.skills?.forEach((memberSkill: any) => {
        const skillName = memberSkill.skill.name;
        if (memberSkill.skill.strategicPriority) {
          strategicSkills.add(skillName);
        }
        skillCoverage[skillName] = (skillCoverage[skillName] || 0) + 1;
      });
    });

    return Array.from(strategicSkills).map(skill => ({
      skill,
      coverage: skillCoverage[skill] || 0,
      percentage: Math.round(((skillCoverage[skill] || 0) / members.length) * 100),
      isStrategic: true
    })).sort((a, b) => a.coverage - b.coverage);
  }, [members]);

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Panel de Soluciones' : 'Solutions Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-2">
          {language === 'es' 
            ? 'Identificación de personas clave y análisis de brechas de talento'
            : 'Key people identification and talent gap analysis'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key People by Knowledge Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              {language === 'es' ? 'Personas Clave por Área' : 'Key People by Area'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Expertos destacados para desarrollo profesional' : 'Top experts for professional development'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {keyPeopleByArea.slice(0, 12).map((person, index) => (
                <div key={`${person.name}-${person.area}`} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{person.area}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">{person.category}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{person.skillCount} skills</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Areas with Least Talent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              {language === 'es' ? 'Áreas con Menor Talento' : 'Areas with Least Talent'}
            </CardTitle>
            <CardDescription>
              {language === 'es' ? 'Dominios que necesitan desarrollo o más oportunidades' : 'Domains needing development or more opportunities'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leastTalentAreas.map((area, index) => (
                <div key={area.name} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="text-xs">{area.count}</Badge>
                    <span className="font-medium text-sm">{area.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {area.percentage}% coverage
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Skills Analysis */}
      {strategicSkillsAnalysis.length > 0 && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                {language === 'es' ? 'Análisis de Habilidades Estratégicas' : 'Strategic Skills Analysis'}
              </CardTitle>
              <CardDescription>
                {language === 'es' ? 'Cobertura de habilidades marcadas como prioridad estratégica' : 'Coverage of skills marked as strategic priority'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {strategicSkillsAnalysis.map((skill, index) => (
                  <div key={skill.skill} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{skill.skill}</span>
                      <Badge variant="outline" className="text-xs">Strategic</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{skill.coverage} people</span>
                      <span>{skill.percentage}% coverage</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Expertos Wizard' : 'Wizard Experts'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {keyPeopleByArea.filter(p => p.category === 'Wizard').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Nivel más alto' : 'Highest level'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Áreas Críticas' : 'Critical Areas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leastTalentAreas.filter(a => a.percentage < 25).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Menos del 25% cobertura' : 'Less than 25% coverage'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'es' ? 'Habilidades Estratégicas' : 'Strategic Skills'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{strategicSkillsAnalysis.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Identificadas' : 'Identified'}
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
            <div className="text-2xl font-bold">{knowledgeAreas.length}</div>
            <p className="text-xs text-muted-foreground">
              {language === 'es' ? 'Total cubiertas' : 'Total covered'}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}