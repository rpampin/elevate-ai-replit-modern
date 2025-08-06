import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import SalesDashboard from "@/pages/sales-dashboard";
import SolutionsDashboard from "@/pages/solutions-dashboard";
import PeopleDashboard from "@/pages/people-dashboard";
import ProductionDashboard from "@/pages/production-dashboard";
import Members from "@/pages/members";
import MemberView from "@/pages/member-view";
import Skills from "@/pages/skills";
import KnowledgeAreas from "@/pages/knowledge-areas";
import Categories from "@/pages/categories";
import Scales from "@/pages/scales";
import Analytics from "@/pages/analytics";
import AIAssistant from "@/pages/ai-assistant";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/sales-dashboard" component={SalesDashboard} />
          <Route path="/solutions-dashboard" component={SolutionsDashboard} />
          <Route path="/people-dashboard" component={PeopleDashboard} />
          <Route path="/production-dashboard" component={ProductionDashboard} />
          <Route path="/members" component={Members} />
          <Route path="/members/:id" component={MemberView} />
          <Route path="/skills" component={Skills} />
          <Route path="/knowledge-areas" component={KnowledgeAreas} />
          <Route path="/categories" component={Categories} />
          <Route path="/scales" component={Scales} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
