import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import StatsCard from "@/components/ui/stats-card";
import DataTable from "@/components/ui/data-table";
import AddMemberModal from "@/components/modals/add-member-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Cog, Clock, Target, Filter } from "lucide-react";
import { getCategoryColor, getInitials } from "@/lib/constants";
import type { MemberWithSkills } from "@shared/schema";

export default function Dashboard() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    knowledgeArea: "all",
    category: "all",
    skill: "",
    client: "all"
  });

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
    queryKey: ["/api/members", filters],
  });

  const columns = [
    {
      key: "fullName",
      title: t("techie"),
      render: (value: string, member: MemberWithSkills) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {getInitials(member.fullName)}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {member.fullName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {member.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: t("category"),
      render: (value: string) => (
        <Badge className={getCategoryColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "currentClient",
      title: t("client"),
      render: (value: string) => (
        <span className={value === "Talent Pool" ? "text-yellow-600" : "text-gray-900 dark:text-white"}>
          {value || "Talent Pool"}
        </span>
      ),
    },
    {
      key: "skills",
      title: t("topSkills"),
      render: (skills: any[], member: MemberWithSkills) => (
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map((skill) => (
            <Badge key={skill.id} variant="secondary" className="text-xs">
              {skill.skill.name}
            </Badge>
          ))}
          {member.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{member.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "learningGoals",
      title: t("goals"),
      render: (goals: any[], member: MemberWithSkills) => (
        <div className="flex items-center">
          <Target className="w-4 h-4 text-orange-500 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {member.learningGoals?.length || 0} {t("active")}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      title: t("actions"),
      render: () => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm">
            {t("view")}
          </Button>
          <Button variant="ghost" size="sm">
            {t("edit")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title={t("dashboardTitle")}
        subtitle={t("dashboardSubtitle")}
        onAddClick={() => setShowAddModal(true)}
        onImportClick={() => console.log("Import Excel")}
      />

      <main className="p-6">
        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Filter className="text-primary mr-2 w-5 h-5" />
            {t("searchFilters")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("name")}
              </label>
              <Input
                placeholder={t("searchByName")}
                value={filters.name}
                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("knowledgeArea")}
              </label>
              <Select
                value={filters.knowledgeArea}
                onValueChange={(value) => setFilters({ ...filters, knowledgeArea: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allAreas")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allAreas")}</SelectItem>
                  <SelectItem value="Programming">Programming</SelectItem>
                  <SelectItem value="Data Engineering">Data Engineering</SelectItem>
                  <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Project Management">Project Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("techieCategory")}
              </label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allCategories")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  <SelectItem value="Starter">{t("starter")}</SelectItem>
                  <SelectItem value="Builder">{t("builder")}</SelectItem>
                  <SelectItem value="Solver">{t("solver")}</SelectItem>
                  <SelectItem value="Wizard">{t("wizard")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("assignedClient")}
              </label>
              <Select
                value={filters.client}
                onValueChange={(value) => setFilters({ ...filters, client: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("allClients")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allClients")}</SelectItem>
                  <SelectItem value="Talent Pool">Talent Pool</SelectItem>
                  <SelectItem value="Lunavi">Lunavi</SelectItem>
                  <SelectItem value="TechCorp">TechCorp</SelectItem>
                  <SelectItem value="InnovateLab">InnovateLab</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatsCard
            title={t("totalMembers")}
            value={statsLoading ? "..." : stats?.totalMembers || 0}
            icon={Users}
            change={{ value: "+12%", trend: "up", period: "vs mes anterior" }}
          />
          <StatsCard
            title={t("activeSkills")}
            value={statsLoading ? "..." : stats?.activeSkills || 0}
            icon={Cog}
            change={{ value: "+8%", trend: "up", period: "nuevas este mes" }}
            iconColor="text-orange-600"
          />
          <StatsCard
            title={t("talentPool")}
            value={statsLoading ? "..." : stats?.talentPool || 0}
            icon={Clock}
            change={{ value: "-3%", trend: "down", period: "vs mes anterior" }}
            iconColor="text-yellow-600"
          />
          <StatsCard
            title={t("learningGoals")}
            value={statsLoading ? "..." : stats?.learningGoals || 0}
            icon={Target}
            change={{ value: "+24%", trend: "up", period: "activas" }}
            iconColor="text-green-600"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Company Strengths */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              {t("companyStrengths")}
            </h3>
            <div className="space-y-4">
              {strengthsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-4 w-full"></div>
                  ))}
                </div>
              ) : (
                companyStrengths?.slice(0, 4).map((strength: any) => (
                  <div key={strength.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {strength.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill bg-green-500" 
                          style={{ width: `${strength.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {strength.count} personas
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Skill Gaps */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              {t("developmentOpportunities")}
            </h3>
            <div className="space-y-4">
              {gapsLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton h-4 w-full"></div>
                  ))}
                </div>
              ) : (
                skillGaps?.slice(0, 4).map((gap: any) => (
                  <div key={gap.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {gap.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="progress-bar">
                        <div 
                          className="progress-bar-fill bg-red-500" 
                          style={{ width: `${gap.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {gap.count} personas
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm">
                <Target className="w-4 h-4 mr-1" />
                {t("createDevelopmentProgram")}
              </Button>
            </div>
          </div>
        </div>

        {/* Members Table */}
        <DataTable
          data={members || []}
          columns={columns}
          searchPlaceholder="Buscar techies..."
          isLoading={membersLoading}
        />
      </main>

      <AddMemberModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </>
  );
}
