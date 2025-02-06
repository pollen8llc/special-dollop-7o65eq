// react@18.x - Core React functionality and TypeScript types
import React from 'react';

// Standard interface for all icon components
interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  ariaLabel?: string;
}

// Utility function to merge classNames
const mergeClassNames = (...classes: (string | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const UserIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ariaLabel = 'User profile',
}) => {
  const normalizedSize = Math.max(0, size);
  const classes = mergeClassNames('icon user-icon', className);

  return (
    <svg
      width={normalizedSize}
      height={normalizedSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={classes}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SearchIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ariaLabel = 'Search',
}) => {
  const normalizedSize = Math.max(0, size);
  const classes = mergeClassNames('icon search-icon', className);

  return (
    <svg
      width={normalizedSize}
      height={normalizedSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={classes}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 21L16.65 16.65"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const EditIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ariaLabel = 'Edit',
}) => {
  const normalizedSize = Math.max(0, size);
  const classes = mergeClassNames('icon edit-icon', className);

  return (
    <svg
      width={normalizedSize}
      height={normalizedSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={classes}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const CloseIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ariaLabel = 'Close',
}) => {
  const normalizedSize = Math.max(0, size);
  const classes = mergeClassNames('icon close-icon', className);

  return (
    <svg
      width={normalizedSize}
      height={normalizedSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={classes}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M18 6L6 18"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6L18 18"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MenuIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ariaLabel = 'Menu',
}) => {
  const normalizedSize = Math.max(0, size);
  const classes = mergeClassNames('icon menu-icon', className);

  return (
    <svg
      width={normalizedSize}
      height={normalizedSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={classes}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M3 12H21"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 6H21"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 18H21"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const LinkedInIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  ariaLabel = 'LinkedIn',
}) => {
  const normalizedSize = Math.max(0, size);
  const classes = mergeClassNames('icon linkedin-icon', className);

  return (
    <svg
      width={normalizedSize}
      height={normalizedSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      className={classes}
      aria-label={ariaLabel}
      role="img"
    >
      <path
        d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9H2V21H6V9Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};