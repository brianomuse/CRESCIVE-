import React from "react";
import {
  GraduationCap,
  Briefcase,
  Coins,
  Brain,
  Heart,
  Users,
  Palette,
  Rocket,
  Compass,
  Home,
  Target,
  Hourglass,
  Navigation,
  Sparkles,
  Feather,
  CircleDot
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = "w-5 h-5", size }) => {
  switch (name) {
    case "GraduationCap":
      return <GraduationCap className={className} size={size} />;
    case "Briefcase":
      return <Briefcase className={className} size={size} />;
    case "Coins":
      return <Coins className={className} size={size} />;
    case "Brain":
      return <Brain className={className} size={size} />;
    case "Heart":
      return <Heart className={className} size={size} />;
    case "Users":
      return <Users className={className} size={size} />;
    case "Palette":
      return <Palette className={className} size={size} />;
    case "Rocket":
      return <Rocket className={className} size={size} />;
    case "Compass":
      return <Compass className={className} size={size} />;
    case "Home":
      return <Home className={className} size={size} />;
    case "Target":
      return <Target className={className} size={size} />;
    case "Hourglass":
      return <Hourglass className={className} size={size} />;
    case "Navigation":
      return <Navigation className={className} size={size} />;
    case "Sparkles":
      return <Sparkles className={className} size={size} />;
    case "Feather":
      return <Feather className={className} size={size} />;
    default:
      return <CircleDot className={className} size={size} />;
  }
};
