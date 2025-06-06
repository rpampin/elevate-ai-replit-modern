export const TECHIE_CATEGORIES = [
  { value: "Starter", label: "Starter", color: "bg-gray-100 text-gray-800" },
  { value: "Builder", label: "Builder", color: "bg-blue-100 text-blue-800" },
  { value: "Solver", label: "Solver", color: "bg-green-100 text-green-800" },
  { value: "Wizard", label: "Wizard", color: "bg-purple-100 text-purple-800" },
];

export const CLIENTS = [
  "Talent Pool",
  "Lunavi",
  "TechCorp",
  "InnovateLab",
  "Microsoft",
  "Amazon",
  "Google"
];

export const getCategoryColor = (category: string) => {
  const found = TECHIE_CATEGORIES.find(cat => cat.value === category);
  return found?.color || "bg-gray-100 text-gray-800";
};

export const getInitials = (fullName: string) => {
  return fullName
    .split(" ")
    .map(name => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const formatDate = (date: Date | string | null) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString();
};
