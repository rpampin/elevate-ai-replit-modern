import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCategoryColor } from "@/lib/constants";
import { format } from "date-fns";
import { MapPin, Calendar, Building2, Mail, Target, Award } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import type { MemberWithSkills } from "@shared/schema";

interface ViewMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberWithSkills | null;
}

export default function ViewMemberModal({
  open,
  onOpenChange,
  member,
}: ViewMemberModalProps) {
  const { data: skillCategories } = useQuery({
    queryKey: ["/api/skill-categories"],
  });

  const { data: scales } = useQuery({
    queryKey: ["/api/scales"],
  });

  if (!member) return null;

  // Prepare radar chart data
  const prepareRadarData = () => {
    if (!skillCategories || !scales || !member.skills || !Array.isArray(skillCategories) || !Array.isArray(scales)) return [];

    const categoryStats = new Map();
    
    // Initialize all categories with 0
    skillCategories.forEach((category: any) => {
      categoryStats.set(category.id, {
        name: category.name,
        totalSkills: 0,
        totalLevels: 0,
        averageLevel: 0
      });
    });

    // Calculate average skill level per category
    member.skills.forEach((memberSkill: any) => {
      const categoryId = memberSkill.skill?.categoryId;
      if (!categoryId) return;

      const scale = scales.find((s: any) => s.id === memberSkill.scaleId);
      if (!scale) return;

      // Convert skill level to numeric value based on scale position
      let numericLevel = 0;
      if (scale.values && Array.isArray(scale.values)) {
        const valueIndex = scale.values.findIndex((v: any) => 
          (typeof v === 'string' ? v : v.value) === memberSkill.level
        );
        if (valueIndex !== -1) {
          numericLevel = ((valueIndex + 1) / scale.values.length) * 100;
        }
      } else if (scale.type === 'quantitative' && !isNaN(Number(memberSkill.level))) {
        // Handle numeric scales (assume 1-5 scale for now)
        const maxValue = 5;
        numericLevel = (Number(memberSkill.level) / maxValue) * 100;
      }

      const categoryData = categoryStats.get(categoryId);
      if (categoryData) {
        categoryData.totalSkills += 1;
        categoryData.totalLevels += numericLevel;
        categoryData.averageLevel = categoryData.totalLevels / categoryData.totalSkills;
      }
    });

    // Convert to radar chart format
    return Array.from(categoryStats.values())
      .filter(cat => cat.totalSkills > 0)
      .map(cat => ({
        category: cat.name,
        level: Math.round(cat.averageLevel),
        fullMark: 100
      }));
  };

  const radarData = prepareRadarData();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium text-lg">
                {member.fullName.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="text-xl">{member.fullName}</div>
              <div className="text-sm text-gray-500 font-normal">
                {member.email}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(member.category)}>
                  {member.category}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>{member.currentClient || "Talent Pool"}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{member.location || "-"}</span>
              </div>

              {member.hireDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Hired {format(new Date(member.hireDate), "MMM yyyy")}</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-orange-500" />
                <span>{member.learningGoals?.length || 0} Learning Goals</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-green-500" />
                <span>{member.skills?.length || 0} Skills</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Skills Radar Chart */}
          {radarData.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Skills Overview</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="category" 
                      tick={{ fontSize: 12 }}
                      className="text-xs"
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={false}
                    />
                    <Radar
                      name="Skill Level"
                      dataKey="level"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                Average skill proficiency by category (0-100%)
              </div>
            </div>
          )}

          <Separator />

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <div>
              <h3 className="font-medium mb-3">Skills</h3>
              <div className="grid grid-cols-1 gap-3">
                {member.skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <div className="font-medium">{skill.skill.name}</div>
                      {skill.skill.purpose && (
                        <div className="text-sm text-gray-500">{skill.skill.purpose}</div>
                      )}
                    </div>
                    <Badge variant="outline">{skill.level}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Information */}
          {member.profile && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-medium">Profile Details</h3>
                
                {member.profile.assignments && member.profile.assignments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assignments</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.profile.assignments.map((assignment, index) => (
                        <Badge key={index} variant="secondary">
                          {assignment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {member.profile.roles && member.profile.roles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Roles</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.profile.roles.map((role, index) => (
                        <Badge key={index} variant="outline">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {member.profile.appreciations && member.profile.appreciations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appreciations</h4>
                    <div className="space-y-2">
                      {member.profile.appreciations.map((appreciation, index) => (
                        <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                          {appreciation}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {member.profile.feedbackComments && member.profile.feedbackComments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback</h4>
                    <div className="space-y-2">
                      {member.profile.feedbackComments.map((feedback, index) => (
                        <div key={index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                          {feedback}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Learning Goals */}
          {member.learningGoals && member.learningGoals.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="font-medium mb-3">Learning Goals</h3>
                <div className="space-y-3">
                  {member.learningGoals.map((goal) => (
                    <div key={goal.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{goal.skill.name}</div>
                        <Badge variant="outline">{goal.targetLevel}</Badge>
                      </div>
                      {goal.description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {goal.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Status: {goal.status || "Active"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}