import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, hover = false, onClick }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)' } : undefined}
      className={cn('glass rounded-xl p-6 transition-all duration-300', hover && 'cursor-pointer glass-hover', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

export default Card;
