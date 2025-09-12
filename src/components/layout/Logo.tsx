import React from 'react';
import { cn } from '@/lib/utils';

export interface LogoProps {
  className?: string;
  size?: 'small' | 'default' | 'large';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = "default" }) => {
  const sizeClasses = {
    small: "h-6",
    default: "h-8",
    large: "h-12"
  };

  return (
    <div className={cn("flex items-center", className)}>
      <div className={cn(sizeClasses[size], "flex items-center")}>
        {/* Sphyr Logo - Using text for now, can be replaced with actual logo */}
        <span className="font-bold text-2xl sphyr-text-gradient tracking-tight">
          Sphyr
        </span>
      </div>
    </div>
  );
};

export default Logo;
