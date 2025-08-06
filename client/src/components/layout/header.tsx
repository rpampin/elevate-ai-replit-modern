import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle: string;
  onAddClick?: () => void;
  onImportClick?: () => void;
  showActions?: boolean;
  showAddTechie?: boolean;
  addButtonText?: string;
}

export default function Header({ 
  title, 
  subtitle, 
  onAddClick, 
  onImportClick, 
  showActions = true,
  showAddTechie = false,
  addButtonText
}: HeaderProps) {
  const { t } = useLanguage();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        {showActions && (
          <div className="flex items-center space-x-4">
            {showAddTechie && (
              <Button 
                onClick={onAddClick}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("addTechie")}
              </Button>
            )}
            {!showAddTechie && addButtonText && onAddClick && (
              <Button 
                onClick={onAddClick}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {addButtonText}
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}