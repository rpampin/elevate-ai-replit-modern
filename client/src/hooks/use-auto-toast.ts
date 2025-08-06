import { useToast } from "@/hooks/use-toast";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useAutoToast() {
  const { toast } = useToast();

  const showToast = ({ title, description, variant = "default" }: ToastProps) => {
    const { dismiss } = toast({
      title,
      description,
      variant,
    });

    // Auto-dismiss after 2 seconds
    setTimeout(dismiss, 2000);
  };

  return { showToast };
}

// Also export as default for convenience
export default useAutoToast;