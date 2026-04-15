import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'surface-1' | 'surface-2' | 'surface-3' | 'glass';
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children, className, variant = 'surface-1', hover = false, glow = false, onClick,
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -3, transition: { type: 'spring', stiffness: 300, damping: 20 } } : undefined}
      className={cn(
        variant === 'glass' ? 'glass' : variant,
        'rounded-xl p-6 transition-all duration-300 relative overflow-hidden',
        hover && 'cursor-pointer',
        glow && 'glow-border',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default Card;
