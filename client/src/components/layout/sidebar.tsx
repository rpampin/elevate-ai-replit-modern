import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { 
  BarChart3, 
  Users, 
  Cog, 
  Brain, 
  Tags, 
  Ruler, 
  TrendingUp,
  Globe,
  Settings,
  Bot,
  ShoppingCart,
  Lightbulb,
  Heart,
  Factory
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();

  const dashboardNavigation = [
    { name: t("dashboard"), href: "/dashboard", icon: BarChart3, current: location === "/" || location === "/dashboard" },
    { name: language === 'es' ? 'Panel de Ventas' : 'Sales Dashboard', href: "/sales-dashboard", icon: ShoppingCart, current: location === "/sales-dashboard" },
    { name: language === 'es' ? 'Panel de Soluciones' : 'Solutions Dashboard', href: "/solutions-dashboard", icon: Lightbulb, current: location === "/solutions-dashboard" },
    { name: language === 'es' ? 'Panel de Personas' : 'People Dashboard', href: "/people-dashboard", icon: Heart, current: location === "/people-dashboard" },
    { name: language === 'es' ? 'Panel de Producción' : 'Production Dashboard', href: "/production-dashboard", icon: Factory, current: location === "/production-dashboard" },
  ];

  const insightsNavigation = [
    { name: t("analytics"), href: "/analytics", icon: TrendingUp, current: location === "/analytics" },
    { name: "AI Assistant", href: "/ai-assistant", icon: Bot, current: location === "/ai-assistant" },
  ];

  const managementNavigation = [
    { name: t("members"), href: "/members", icon: Users, current: location === "/members" },
    { name: t("skills"), href: "/skills", icon: Cog, current: location === "/skills" },
    { name: t("knowledgeAreas"), href: "/knowledge-areas", icon: Brain, current: location === "/knowledge-areas" },
    { name: t("categories"), href: "/categories", icon: Tags, current: location === "/categories" },
    { name: t("scales"), href: "/scales", icon: Ruler, current: location === "/scales" },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 fixed h-full z-30">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Techie Skills</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Radar</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6 px-4 space-y-6">
        {/* Dashboards Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
            {language === 'es' ? 'Paneles' : 'Dashboards'}
          </h3>
          <div className="space-y-1">
            {dashboardNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.current 
                    ? "nav-item-active" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Insights Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
            {language === 'es' ? 'Análisis' : 'Insights'}
          </h3>
          <div className="space-y-1">
            {insightsNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.current 
                    ? "nav-item-active" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Management Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-3">
            Management
          </h3>
          <div className="space-y-1">
            {managementNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className={`nav-item flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  item.current 
                    ? "nav-item-active" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}>
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as "es" | "en")}
              className="text-sm text-gray-600 dark:text-gray-300 bg-transparent border-none focus:outline-none"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
