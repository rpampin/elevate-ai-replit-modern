import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { User, Briefcase, Award, History, Star, Target, ExternalLink, ChevronLeft, ChevronRight, Mail, MapPin, Calendar, Trophy, MessageSquare } from "lucide-react";
import { MemberWithSkills, Client } from "@shared/schema";
import { getClientNameFromId, getCurrentClientName } from "@/lib/client-utils";

interface ViewMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberWithSkills | null;
}

export default function ViewMemberModal({ open, onOpenChange, member }: ViewMemberModalProps) {
  const [currentSkillPage, setCurrentSkillPage] = useState(1);
  const [skillSearchTerm, setSkillSearchTerm] = useState("");
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(1);
  const [currentRolePage, setCurrentRolePage] = useState(1);
  const [currentAppreciationPage, setCurrentAppreciationPage] = useState(1);
  const [currentFeedbackPage, setCurrentFeedbackPage] = useState(1);
  const skillsPerPage = 6;
  const itemsPerPage = 5;

  // Fetch clients data - always call this hook
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    enabled: !!member
  });

  // Reset to first page when modal opens - always call this hook
  useEffect(() => {
    if (open) {
      setCurrentSkillPage(1);
      setCurrentHistoryPage(1);
      setCurrentAssignmentPage(1);
      setCurrentRolePage(1);
      setCurrentAppreciationPage(1);
      setCurrentFeedbackPage(1);
    }
  }, [open]);

  // Early return after all hooks are called
  if (!member) return null;

  // Filter skills based on search term
  const filteredSkills = member.skills?.filter(skill => 
    skill.skill?.name?.toLowerCase().includes(skillSearchTerm.toLowerCase())
  ) || [];

  // Pagination for skills
  const totalSkillPages = Math.ceil(filteredSkills.length / skillsPerPage);
  const skillStartIndex = (currentSkillPage - 1) * skillsPerPage;
  const paginatedSkills = filteredSkills.slice(skillStartIndex, skillStartIndex + skillsPerPage);

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  // Sort and paginate assignments by newest first
  const sortedAssignments = (member.profile?.assignments || [])
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const totalAssignmentPages = Math.ceil(sortedAssignments.length / itemsPerPage);
  const assignmentStartIndex = (currentAssignmentPage - 1) * itemsPerPage;
  const paginatedAssignments = sortedAssignments.slice(assignmentStartIndex, assignmentStartIndex + itemsPerPage);

  // Sort and paginate roles by newest first
  const sortedRoles = (member.profile?.roles || [])
    .sort((a, b) => (b.title || '').localeCompare(a.title || ''));
  const totalRolePages = Math.ceil(sortedRoles.length / itemsPerPage);
  const roleStartIndex = (currentRolePage - 1) * itemsPerPage;
  const paginatedRoles = sortedRoles.slice(roleStartIndex, roleStartIndex + itemsPerPage);

  // Sort and paginate appreciations by newest first
  const sortedAppreciations = (member.profile?.appreciations || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalAppreciationPages = Math.ceil(sortedAppreciations.length / itemsPerPage);
  const appreciationStartIndex = (currentAppreciationPage - 1) * itemsPerPage;
  const paginatedAppreciations = sortedAppreciations.slice(appreciationStartIndex, appreciationStartIndex + itemsPerPage);

  // Sort and paginate feedback by newest first
  const sortedFeedback = (member.profile?.feedbackComments || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalFeedbackPages = Math.ceil(sortedFeedback.length / itemsPerPage);
  const feedbackStartIndex = (currentFeedbackPage - 1) * itemsPerPage;
  const paginatedFeedback = sortedFeedback.slice(feedbackStartIndex, feedbackStartIndex + itemsPerPage);

  // Sort client history by newest first and add pagination
  const sortedClientHistory = (member.profile?.clientHistory || [])
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const totalHistoryPages = Math.ceil(sortedClientHistory.length / itemsPerPage);
  const historyStartIndex = (currentHistoryPage - 1) * itemsPerPage;
  const paginatedHistory = sortedClientHistory.slice(historyStartIndex, historyStartIndex + itemsPerPage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {member.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="appreciations">Appreciations</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{member.location || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Joined: {formatDate(member.hireDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Category: </span> 
                      <Badge variant="secondary">{member.category}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Current Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <Badge variant={getCurrentClientName(member.profile, clients) !== "Talent Pool" ? "default" : "secondary"}>
                        {getCurrentClientName(member.profile, clients)}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={getCurrentClientName(member.profile, clients) !== "Talent Pool" ? "default" : "outline"}>
                        {getCurrentClientName(member.profile, clients) !== "Talent Pool" ? "Assigned" : "Available"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Skills & Expertise</CardTitle>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearchTerm}
                        onChange={(e) => {
                          setSkillSearchTerm(e.target.value);
                          setCurrentSkillPage(1);
                        }}
                        className="px-3 py-1 text-sm border rounded-md w-48"
                      />
                    </div>
                  </div>
                  <CardDescription>
                    Total skills: {member.skills?.length || 0}
                    {skillSearchTerm && ` (${filteredSkills.length} filtered)`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredSkills.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedSkills.map((skill, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{skill.skill?.name || "Unknown Skill"}</h4>
                                <p className="text-sm text-gray-500">{skill.skill?.purpose || "No description"}</p>
                              </div>
                              <Badge variant="secondary">{skill.level}</Badge>
                            </div>
                          </Card>
                        ))}
                      </div>

                      {totalSkillPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <div className="text-sm text-gray-500">
                            Showing {skillStartIndex + 1} to {Math.min(skillStartIndex + skillsPerPage, filteredSkills.length)} of {filteredSkills.length} skills
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSkillPage(Math.max(1, currentSkillPage - 1))}
                              disabled={currentSkillPage <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                              Page {currentSkillPage} of {totalSkillPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentSkillPage(Math.min(totalSkillPages, currentSkillPage + 1))}
                              disabled={currentSkillPage >= totalSkillPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {skillSearchTerm ? "No skills found matching your search" : "No skills recorded"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Assignments
                  </CardTitle>
                  <CardDescription>Project assignments and work history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paginatedAssignments && paginatedAssignments.length > 0 ? (
                      paginatedAssignments.map((assignment: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{String(assignment.title || "Untitled Assignment")}</h4>
                              <p className="text-sm text-gray-600 mt-1">{String(assignment.description || "No description")}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>Client: {getClientNameFromId(assignment.clientId, clients)}</span>
                                <span>Start: {formatDate(assignment.startDate)}</span>
                                {assignment.endDate && <span>End: {formatDate(assignment.endDate)}</span>}
                              </div>
                            </div>
                            <Badge variant={assignment.status === "Active" ? "default" : "secondary"}>
                              {String(assignment.status || "Unknown")}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No assignments recorded</p>
                    )}
                  </div>
                  {totalAssignmentPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {assignmentStartIndex + 1} to {Math.min(assignmentStartIndex + itemsPerPage, sortedAssignments.length)} of {sortedAssignments.length} assignments
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAssignmentPage(Math.max(1, currentAssignmentPage - 1))}
                          disabled={currentAssignmentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          Page {currentAssignmentPage} of {totalAssignmentPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAssignmentPage(Math.min(totalAssignmentPages, currentAssignmentPage + 1))}
                          disabled={currentAssignmentPage >= totalAssignmentPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Roles & Responsibilities
                  </CardTitle>
                  <CardDescription>Professional roles and key responsibilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paginatedRoles && paginatedRoles.length > 0 ? (
                      paginatedRoles.map((role: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{String(role.title || "Untitled Role")}</h4>
                              {role.description && (
                                <p className="text-sm text-gray-600 mt-1">{String(role.description)}</p>
                              )}
                              {role.skills && Array.isArray(role.skills) && role.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {role.skills.map((skill: any, skillIndex: number) => (
                                    <Badge key={skillIndex} variant="outline" className="text-xs">
                                      {String(skill)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No roles defined</p>
                    )}
                  </div>
                  {totalRolePages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {roleStartIndex + 1} to {Math.min(roleStartIndex + itemsPerPage, sortedRoles.length)} of {sortedRoles.length} roles
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentRolePage(Math.max(1, currentRolePage - 1))}
                          disabled={currentRolePage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          Page {currentRolePage} of {totalRolePages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentRolePage(Math.min(totalRolePages, currentRolePage + 1))}
                          disabled={currentRolePage >= totalRolePages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appreciations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    Client Appreciations
                  </CardTitle>
                  <CardDescription>Recognition and positive feedback from clients</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paginatedAppreciations && paginatedAppreciations.length > 0 ? (
                      paginatedAppreciations.map((appreciation: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">Client Appreciation</span>
                                <span className="text-sm text-gray-500">from {getClientNameFromId(appreciation.clientId, clients)}</span>
                                {((appreciation as any).rating || appreciation.rating) && (
                                  <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`w-4 h-4 ${i < ((appreciation as any).rating || appreciation.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                        fill={i < ((appreciation as any).rating || appreciation.rating || 0) ? 'currentColor' : 'none'}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">{String((appreciation as any).text || (appreciation as any).message || "No message")}</p>
                              <p className="text-xs text-gray-500 mt-2">{formatDate(appreciation.date)}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No appreciations recorded</p>
                    )}
                  </div>
                  {totalAppreciationPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {appreciationStartIndex + 1} to {Math.min(appreciationStartIndex + itemsPerPage, sortedAppreciations.length)} of {sortedAppreciations.length} appreciations
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAppreciationPage(Math.max(1, currentAppreciationPage - 1))}
                          disabled={currentAppreciationPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          Page {currentAppreciationPage} of {totalAppreciationPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAppreciationPage(Math.min(totalAppreciationPages, currentAppreciationPage + 1))}
                          disabled={currentAppreciationPage >= totalAppreciationPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Feedback & Reviews
                  </CardTitle>
                  <CardDescription>Performance feedback and development notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paginatedFeedback && paginatedFeedback.length > 0 ? (
                      paginatedFeedback.map((feedback: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{String(feedback.author || "Unknown")}</span>
                                <Badge variant="outline" className="text-xs">{String(feedback.type || "General")}</Badge>
                              </div>
                              <p className="text-sm text-gray-700">{String(feedback.comment || "No comment")}</p>
                              <p className="text-xs text-gray-500 mt-2">{formatDate(feedback.date)}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No feedback recorded</p>
                    )}
                  </div>
                  {totalFeedbackPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {feedbackStartIndex + 1} to {Math.min(feedbackStartIndex + itemsPerPage, sortedFeedback.length)} of {sortedFeedback.length} feedback
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentFeedbackPage(Math.max(1, currentFeedbackPage - 1))}
                          disabled={currentFeedbackPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          Page {currentFeedbackPage} of {totalFeedbackPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentFeedbackPage(Math.min(totalFeedbackPages, currentFeedbackPage + 1))}
                          disabled={currentFeedbackPage >= totalFeedbackPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Client History
                  </CardTitle>
                  <CardDescription>Complete client engagement history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paginatedHistory && paginatedHistory.length > 0 ? (
                      paginatedHistory.map((history: any, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">{getClientNameFromId(history.clientId, clients)}</span>
                                <Badge variant="outline" className="text-xs">{String(history.status || "Active")}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Start: {formatDate(history.startDate)}</span>
                                {history.endDate && <span>End: {formatDate(history.endDate)}</span>}
                              </div>
                            </div>
                            <Badge variant={history.status === "Active" ? "default" : "secondary"}>
                              {String(history.status || "Unknown")}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">No client history recorded</p>
                    )}
                  </div>
                   {totalHistoryPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                          <div className="text-sm text-gray-500">
                            Showing {historyStartIndex + 1} to {Math.min(historyStartIndex + itemsPerPage, sortedClientHistory.length)} of {sortedClientHistory.length} history
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentHistoryPage(Math.max(1, currentHistoryPage - 1))}
                              disabled={currentHistoryPage <= 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium">
                              Page {currentHistoryPage} of {totalHistoryPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentHistoryPage(Math.min(totalHistoryPages, currentHistoryPage + 1))}
                              disabled={currentHistoryPage >= totalHistoryPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}