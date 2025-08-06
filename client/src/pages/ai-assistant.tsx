import Header from "@/components/layout/header";
import AIChat from "@/components/ai-agent/ai-chat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Search, Users, Zap } from "lucide-react";

export default function AIAssistant() {
  return (
    <>
      <Header
        title="AI Assistant"
        subtitle="Get intelligent insights about your team's skills and talent"
        showActions={false}
      />

      <main className="p-6 space-y-6">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="w-5 h-5 text-blue-600" />
                Smart Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Find team members by asking natural language questions like "Who knows React and is available?"
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-5 h-5 text-green-600" />
                Team Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Get analysis of your team's strengths, skill gaps, and optimal project assignments.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="w-5 h-5 text-purple-600" />
                Quick Answers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                Instantly get answers about availability, expertise levels, and team capabilities.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* AI Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AIChat />
          </div>

          {/* Tips Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Tips for Better Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Be Specific</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    "Who has React experience?" vs "Show me all developers"
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Ask About Availability</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    "Which JavaScript developers are available for new projects?"
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Skill Combinations</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    "Who knows both Python and AWS?"
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Team Analysis</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    "What are our strongest technical areas?"
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Learning Goals</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    "Who is learning new skills this quarter?"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}