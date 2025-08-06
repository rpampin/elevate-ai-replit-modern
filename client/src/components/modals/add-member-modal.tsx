import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Location } from "@shared/schema";
import { ProfilePictureUpload } from "@/components/ui/profile-picture-upload";
import { cn } from "@/lib/utils";
import DatePicker from "react-datepicker";
import InputMask from "react-input-mask";
import "react-datepicker/dist/react-datepicker.css";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const TECHIE_CATEGORIES = [
  "Starter",
  "Builder",
  "Solver",
  "Wizard"
];

const addMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  profilePicture: z.string().nullable().optional(),
  hireDate: z.date().nullable().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
});

type AddMemberForm = z.infer<typeof addMemberSchema>;

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMemberModal({ open, onOpenChange }: AddMemberModalProps) {
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Load locations data from API
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ['/api/locations']
  });

  const form = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      profilePicture: null,
      hireDate: null,
      category: "Starter",
      location: "",
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: AddMemberForm) => {
      return apiRequest("POST", "/api/members", data);
    },
    onSuccess: (newMember: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      onOpenChange(false);
      form.reset();
      showToast({
        title: "Success",
        description: "Techie created successfully",
      });
      
      // Navigate to the newly created member's profile page
      if (newMember && newMember.id) {
        setTimeout(() => {
          setLocation(`/members/${newMember.id}`);
        }, 100);
      }
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to create techie",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddMemberForm) => {
    createMemberMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Techie</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex justify-center mb-6">
              <FormField
                control={form.control}
                name="profilePicture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <ProfilePictureUpload
                        currentImage={field.value}
                        onImageChange={field.onChange}
                        size="lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Name - Email */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
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
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location - Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name}
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
            </div>

            {/* Hire Date */}
            <FormField
              control={form.control}
              name="hireDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hire Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker
                      selected={field.value}
                      onChange={(date: Date | null) => field.onChange(date)}
                      dateFormat="dd/MM/yyyy"
                      showYearDropdown
                      showMonthDropdown
                      dropdownMode="select"
                      yearDropdownItemNumber={50}
                      maxDate={new Date()}
                      placeholderText="DD/MM/YYYY"
                      customInput={
                        <InputMask
                          mask="99/99/9999"
                          placeholder="DD/MM/YYYY"
                          className={cn(
                            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            form.formState.errors.hireDate && "border-red-500"
                          )}
                        />
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMemberMutation.isPending}>
                {createMemberMutation.isPending ? "Creating..." : "Create Techie"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}