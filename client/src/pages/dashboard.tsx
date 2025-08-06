import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingCart, Lightbulb, Heart, Factory, Users, Target, TrendingUp, Brain } from "lucide-react";

export default function Dashboard() {
  const { language } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ['/api/analytics/stats'],
  });

  const { data: members = [] } = useQuery({
    queryKey: ['/api/members'],
  });

  const dashboards = [
    {
      title: language === 'es' ? 'Panel de Ventas' : 'Sales Dashboard',
      description: language === 'es' ? 'Encuentra talento disponible y rastrea expertise tecnológico' : 'Find available talent and track technology expertise',
      icon: ShoppingCart,
      href: '/sales-dashboard',
      color: 'bg-blue-500',
    },
    {
      title: language === 'es' ? 'Panel de Soluciones' : 'Solutions Dashboard',
      description: language === 'es' ? 'Identifica personas clave y analiza brechas de habilidades' : 'Identify key people and analyze skill gaps',
      icon: Lightbulb,
      href: '/solutions-dashboard',
      color: 'bg-yellow-500',
    },
    {
      title: language === 'es' ? 'Panel de Personas' : 'People Dashboard',
      description: language === 'es' ? 'Ve rutas de carrera y oportunidades de desarrollo' : 'View career paths and development opportunities',
      icon: Heart,
      href: '/people-dashboard',
      color: 'bg-pink-500',
    },
    {
      title: language === 'es' ? 'Panel de Producción' : 'Production Dashboard',
      description: language === 'es' ? 'Conecta con colegas e intercambia conocimiento' : 'Network with colleagues and exchange knowledge',
      icon: Factory,
      href: '/production-dashboard',
      color: 'bg-green-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title={language === 'es' ? 'Centro de Control de Talento' : 'Talent Command Center'}
        subtitle={language === 'es' ? 'Paneles especializados para cada función' : 'Specialized dashboards for every function'}
      />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'es' ? 'Centro de Control de Talento' : 'Talent Command Center'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {language === 'es' 
                ? 'Accede a paneles especializados para diferentes funciones de negocio'
                : 'Access specialized dashboards for different business functions'
              }
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'es' ? 'Total Miembros' : 'Total Members'}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'es' ? 'Habilidades Totales' : 'Total Skills'}
                </CardTitle>
                <Brain className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSkills || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'es' ? 'Objetivos de Aprendizaje' : 'Learning Goals'}
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLearningGoals || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'es' ? 'Clientes Activos' : 'Active Clients'}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeClients || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Specialized Dashboards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              {language === 'es' ? 'Paneles Especializados' : 'Specialized Dashboards'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dashboards.map((dashboard) => {
                const Icon = dashboard.icon;
                return (
                  <Card key={dashboard.href} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${dashboard.color}`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{dashboard.title}</CardTitle>
                          <CardDescription className="text-base">
                            {dashboard.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={dashboard.href}>
                        <Button className="w-full">
                          {language === 'es' ? 'Acceder al Panel' : 'Access Dashboard'}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Access */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'es' ? 'Acceso Rápido' : 'Quick Access'}
              </CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Acciones comunes para gestión de talento'
                  : 'Common actions for talent management'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Link href="/members">
                  <Button variant="outline">
                    {language === 'es' ? 'Gestionar Miembros' : 'Manage Members'}
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="outline">
                    {language === 'es' ? 'Ver Análisis' : 'View Analytics'}
                  </Button>
                </Link>
                <Link href="/ai-assistant">
                  <Button variant="outline">
                    {language === 'es' ? 'Asistente IA' : 'AI Assistant'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}