import React, { createContext, useContext, useState, useEffect } from "react";

interface LanguageContextType {
  language: "es" | "en";
  setLanguage: (lang: "es" | "en") => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  es: {
    // Navigation
    dashboard: "Dashboard",
    members: "Techies",
    skills: "Habilidades",
    knowledgeAreas: "Áreas de Conocimiento",
    categories: "Categorías",
    scales: "Escalas",
    analytics: "Análisis",
    
    // Dashboard
    dashboardTitle: "Dashboard de Habilidades",
    dashboardSubtitle: "Gestiona y visualiza el talento de tu equipo",
    addTechie: "Agregar Techie",
    importExcel: "Importar Excel",
    searchFilters: "Filtros de Búsqueda",
    
    // Stats
    totalMembers: "Total Techies",
    activeSkills: "Habilidades Activas",
    talentPool: "En Talent Pool",
    learningGoals: "Metas de Aprendizaje",
    
    // Company Analysis
    companyStrengths: "Fortalezas de la Empresa",
    developmentOpportunities: "Oportunidades de Desarrollo",
    createDevelopmentProgram: "Crear programa de desarrollo",
    
    // Filters
    name: "Nombre",
    searchByName: "Buscar por nombre...",
    knowledgeArea: "Área de Conocimiento",
    allAreas: "Todas las áreas",
    techieCategory: "Categoría Techie",
    allCategories: "Todas las categorías",
    assignedClient: "Cliente Asignado",
    allClients: "Todos los clientes",
    
    // Categories
    starter: "Starter",
    builder: "Builder",
    solver: "Solver",
    wizard: "Wizard",
    
    // Common
    search: "Buscar",
    filter: "Filtrar",
    export: "Exportar",
    view: "Ver",
    edit: "Editar",
    delete: "Eliminar",
    save: "Guardar",
    cancel: "Cancelar",
    actions: "Acciones",
    
    // Table headers
    techie: "Techie",
    category: "Categoría",
    client: "Cliente",
    topSkills: "Habilidades Top",
    goals: "Metas",
    
    // Form labels
    fullName: "Nombre Completo",
    corporateEmail: "Email Corporativo",
    categoryLabel: "Categoría",
    location: "Ubicación",
    hireDate: "Fecha de Contratación",
    mainSkills: "Habilidades Principales",
    learningGoalsLabel: "Metas de Aprendizaje",
    
    // Placeholders
    selectCategory: "Seleccionar categoría",
    cityExample: "Ej: Ciudad de México, México",
    addSkillPlaceholder: "Escriba una habilidad y presione Enter",
    learningGoalsPlaceholder: "Describa las metas de desarrollo profesional...",
    
    // Status
    active: "activas",
    completed: "completadas",
    paused: "pausadas"
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    members: "Techies",
    skills: "Skills",
    knowledgeAreas: "Knowledge Areas",
    categories: "Categories",
    scales: "Scales",
    analytics: "Analytics",
    
    // Dashboard
    dashboardTitle: "Skills Dashboard",
    dashboardSubtitle: "Manage and visualize your team's talent",
    addTechie: "Add Techie",
    importExcel: "Import Excel",
    searchFilters: "Search Filters",
    
    // Stats
    totalMembers: "Total Techies",
    activeSkills: "Active Skills",
    talentPool: "In Talent Pool",
    learningGoals: "Learning Goals",
    
    // Company Analysis
    companyStrengths: "Company Strengths",
    developmentOpportunities: "Development Opportunities",
    createDevelopmentProgram: "Create development program",
    
    // Filters
    name: "Name",
    searchByName: "Search by name...",
    knowledgeArea: "Knowledge Area",
    allAreas: "All areas",
    techieCategory: "Techie Category",
    allCategories: "All categories",
    assignedClient: "Assigned Client",
    allClients: "All clients",
    
    // Categories
    starter: "Starter",
    builder: "Builder",
    solver: "Solver",
    wizard: "Wizard",
    
    // Common
    search: "Search",
    filter: "Filter",
    export: "Export",
    view: "View",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    actions: "Actions",
    
    // Table headers
    techie: "Techie",
    category: "Category",
    client: "Client",
    topSkills: "Top Skills",
    goals: "Goals",
    
    // Form labels
    fullName: "Full Name",
    corporateEmail: "Corporate Email",
    categoryLabel: "Category",
    location: "Location",
    hireDate: "Hire Date",
    mainSkills: "Main Skills",
    learningGoalsLabel: "Learning Goals",
    
    // Placeholders
    selectCategory: "Select category",
    cityExample: "E.g: Mexico City, Mexico",
    addSkillPlaceholder: "Type a skill and press Enter",
    learningGoalsPlaceholder: "Describe professional development goals...",
    
    // Status
    active: "active",
    completed: "completed",
    paused: "paused"
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<"es" | "en">("es");

  useEffect(() => {
    const savedLanguage = localStorage.getItem("techie-skills-language") as "es" | "en";
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: "es" | "en") => {
    setLanguage(lang);
    localStorage.setItem("techie-skills-language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.es] || key;
  };

  const value = {
    language,
    setLanguage: handleSetLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
