import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/hooks/use-language";
import Sidebar from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import Members from "@/pages/members";
import Skills from "@/pages/skills";
import KnowledgeAreas from "@/pages/knowledge-areas";
import Categories from "@/pages/categories";
import Scales from "@/pages/scales";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/members" component={Members} />
          <Route path="/skills" component={Skills} />
          <Route path="/knowledge-areas" component={KnowledgeAreas} />
          <Route path="/categories" component={Categories} />
          <Route path="/scales" component={Scales} />
          <Route path="/analytics" component={Analytics} />
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
