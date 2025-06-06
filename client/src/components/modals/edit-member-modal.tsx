import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertMemberSchema } from "@shared/schema";
import type { MemberWithSkills, Skill, Scale } from "@shared/schema";
import { Plus, X, Award, Target, Check, ChevronsUpDown, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const editMemberSchema = insertMemberSchema.extend({
  id: z.number(),
});

type EditMemberForm = z.infer<typeof editMemberSchema>;

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberWithSkills | null;
}

// Default client list that will be extended as new clients are added
const DEFAULT_CLIENTS = [
  "Talent Pool",
  "Lunavi", 
  "TechCorp",
  "InnovateLab"
];

// Default location list that will be extended as new locations are added
const DEFAULT_LOCATIONS = [
  "Remote",
  "Spain",
  "Argentina",
  "Mexico",
  "Colombia",
  "Chile",
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Peru",
  "Brazil"
];

// Techie categories - same as Add form
const TECHIE_CATEGORIES = [
  "Starter",
  "Builder",
  "Solver",
  "Wizard"
];

export default function EditMemberModal({
  open,
  onOpenChange,
  member,
}: EditMemberModalProps) {
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();
  const [profileData, setProfileData] = useState({
    assignments: [] as string[],
    roles: [] as string[],
    appreciations: [] as string[],
    feedbackComments: [] as string[],
  });

  // State for skill addition with scale-based levels
  const [availableScaleValues, setAvailableScaleValues] = useState<string[]>([]);
  const [goalScaleValues, setGoalScaleValues] = useState<string[]>([]);
  
  // Client management state
  const [availableClients, setAvailableClients] = useState<string[]>(() => {
    const savedClients = localStorage.getItem('techie-skills-clients');
    return savedClients ? JSON.parse(savedClients) : DEFAULT_CLIENTS;
  });
  const [clientComboOpen, setClientComboOpen] = useState(false);

  // Location management state
  const [availableLocations, setAvailableLocations] = useState<string[]>(() => {
    const savedLocations = localStorage.getItem('techie-skills-locations');
    return savedLocations ? JSON.parse(savedLocations) : DEFAULT_LOCATIONS;
  });
  const [locationComboOpen, setLocationComboOpen] = useState(false);

  // Function to add new client and save to localStorage
  const addNewClient = (newClient: string) => {
    if (newClient && !availableClients.includes(newClient)) {
      const updatedClients = [...availableClients, newClient];
      setAvailableClients(updatedClients);
      localStorage.setItem('techie-skills-clients', JSON.stringify(updatedClients));
    }
  };

  // Function to add new location and save to localStorage
  const addNewLocation = (newLocation: string) => {
    if (newLocation && !availableLocations.includes(newLocation)) {
      const updatedLocations = [...availableLocations, newLocation];
      setAvailableLocations(updatedLocations);
      localStorage.setItem('techie-skills-locations', JSON.stringify(updatedLocations));
    }
  };

  const form = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      id: 0,
      fullName: "",
      email: "",
      category: "",
      hireDate: null,
      currentClient: "",
      location: "",
    },
  });

  // Set form values when member changes
  useEffect(() => {
    if (member) {
      form.reset({
        id: member.id,
        fullName: member.fullName,
        email: member.email,
        category: member.category,
        hireDate: member.hireDate ? new Date(member.hireDate) : null,
        currentClient: member.currentClient || "",
        location: member.location || "",
      });
    }
  }, [member, form]);

  const updateMemberMutation = useMutation({
    mutationFn: async (data: EditMemberForm) => {
      return apiRequest("PUT", `/api/members/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      onOpenChange(false);
      showToast({
        title: "Member updated",
        description: "Member information has been updated successfully",
      });
    },
    onError: (error: any) => {
      showToast({
        title: "Error",
        description: error.message || "Failed to update member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditMemberForm) => {
    updateMemberMutation.mutate(data);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Techie Profile - {member.fullName}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* FullName - Email */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter email address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Location - HireDate */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Popover open={locationComboOpen} onOpenChange={setLocationComboOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select location"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search or add location..." 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const inputValue = e.currentTarget.value.trim();
                                    if (inputValue && !availableLocations.some(c => c.toLowerCase() === inputValue.toLowerCase())) {
                                      addNewLocation(inputValue);
                                      field.onChange(inputValue);
                                      setLocationComboOpen(false);
                                    }
                                  }
                                }}
                              />
                              <CommandEmpty className="py-2 px-3 text-sm">
                                Press Enter to add new location
                              </CommandEmpty>
                              <CommandGroup className="max-h-48 overflow-auto">
                                {availableLocations.map((location) => (
                                  <CommandItem
                                    value={location}
                                    key={location}
                                    onSelect={() => {
                                      field.onChange(location);
                                      setLocationComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        location === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {location}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hire Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Pick a date"}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date: Date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category - CurrentClient */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TECHIE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentClient"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Client</FormLabel>
                        <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value || "Select client"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search or add client..." 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const inputValue = e.currentTarget.value.trim();
                                    if (inputValue && !availableClients.some(c => c.toLowerCase() === inputValue.toLowerCase())) {
                                      addNewClient(inputValue);
                                      field.onChange(inputValue);
                                      setClientComboOpen(false);
                                    }
                                  }
                                }}
                              />
                              <CommandEmpty className="py-2 px-3 text-sm">
                                Press Enter to add new client
                              </CommandEmpty>
                              <CommandGroup className="max-h-48 overflow-auto">
                                {availableClients.map((client) => (
                                  <CommandItem
                                    value={client}
                                    key={client}
                                    onSelect={() => {
                                      field.onChange(client);
                                      setClientComboOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        client === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {client}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateMemberMutation.isPending}
                  >
                    {updateMemberMutation.isPending ? "Updating..." : "Update Member"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Skills management functionality will be restored after layout update is complete.
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Profile management functionality will be restored after layout update is complete.
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              Goals management functionality will be restored after layout update is complete.
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}