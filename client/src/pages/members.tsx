import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import AddMemberModal from "@/components/modals/add-member-modal";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Target } from "lucide-react";

import { getCategoryColor, getInitials } from "@/lib/constants";

import type { MemberWithSkills } from "@shared/schema";

export default function Members() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members", { name: searchTerm }],
  });

  // Filter and paginate members
  const allMembers = Array.isArray(members) ? members as MemberWithSkills[] : [];
  const filteredMembers = allMembers.filter((member: MemberWithSkills) =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMembers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + pageSize);

  // Reset page when search changes
  const handleSearchChange = (term: string) => {
    // Only reset page if search term actually changed
    if (term !== searchTerm) {
      setSearchTerm(term);
      setCurrentPage(1);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const handleRowClick = (member: MemberWithSkills) => {
    setLocation(`/members/${member.id}`);
  };

  const columns = [
    {
      key: "name",
      title: t("techie"),
      render: (value: string, member: MemberWithSkills) => (
        <div className="flex items-center">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={member.profilePicture || undefined} 
              alt={member.name || 'Profile'} 
            />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {getInitials(member.name || '')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {member.name}
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
        <span className={!value ? "text-yellow-600" : "text-gray-900 dark:text-white"}>
          {value || "Available"}
        </span>
      ),
    },
    {
      key: "location",
      title: t("location"),
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
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

  ];

  return (
    <>
      <Header
        title={t("members")}
        subtitle="Gestiona el talento de tu equipo"
        onAddClick={() => setShowAddModal(true)}
        onImportClick={() => console.log("Import Excel")}
        showAddTechie={true}
      />

      <main className="p-6">
        <DataTable
          data={paginatedMembers}
          columns={columns}
          searchPlaceholder="Buscar miembros..."
          onSearch={handleSearchChange}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredMembers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            const newTotalPages = Math.ceil(filteredMembers.length / newSize);
            setPageSize(newSize);
            // Only reset to page 1 if current page would be out of bounds
            if (currentPage > newTotalPages) {
              setCurrentPage(Math.max(1, newTotalPages));
            }
          }}
          paginationLabel="members"
          showPaginationDivider={false}
        />
      </main>

      <AddMemberModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </>
  );
}
