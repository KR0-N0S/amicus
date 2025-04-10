import React from 'react';
import { Chip, SvgIcon } from '@mui/material';
import { FiX } from 'react-icons/fi';
import './Tag.css';

export type TagColor = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

interface TagProps {
  id: string | number;
  label: string;
  color?: TagColor;
  onDelete?: (id: string | number) => void;
  onClick?: (id: string | number) => void;
  className?: string;
}

const Tag: React.FC<TagProps> = ({ 
  id, 
  label, 
  color = 'default', 
  onDelete, 
  onClick,
  className = ''
}) => {
  // Mapowanie kolorów na style MUI
  const colorMap: Record<TagColor, any> = {
    default: undefined,
    primary: 'primary',
    secondary: 'secondary',
    success: 'success',
    warning: 'warning',
    danger: 'error',
    info: 'info'
  };

  return (
    <Chip
      label={label}
      color={colorMap[color]}
      onClick={onClick ? () => onClick(id) : undefined}
      onDelete={onDelete ? () => onDelete(id) : undefined}
      deleteIcon={
        <SvgIcon component={FiX} fontSize="small" />
      }
      className={`custom-tag ${className} tag-${color}`}
      size="small"
    />
  );
};

export default Tag;