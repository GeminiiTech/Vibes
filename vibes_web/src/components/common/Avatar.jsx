import { getInitials, cn } from '../../utils/helpers';

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export function Avatar({ src, name, size = 'md', className = '', onClick }) {
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(
          sizeClass,
          'rounded-full object-cover ring-2 ring-white shadow-soft',
          onClick && 'cursor-pointer hover:ring-primary-200 transition-all',
          className
        )}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      className={cn(
        'avatar',
        sizeClass,
        onClick && 'cursor-pointer hover:ring-primary-200 transition-all',
        className
      )}
      onClick={onClick}
    >
      {getInitials(name)}
    </div>
  );
}
