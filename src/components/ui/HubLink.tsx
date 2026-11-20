import type { ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import type { ButtonVariant } from './Button';

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant | 'text';
  className?: string;
};

type InternalLinkProps = BaseProps &
  Omit<LinkProps, keyof BaseProps | 'to'> & {
    to: string;
    href?: never;
  };

type ExternalLinkProps = BaseProps & {
  href: string;
  to?: never;
  target?: '_self' | '_blank';
  rel?: string;
  title?: string;
};

export type HubLinkProps = InternalLinkProps | ExternalLinkProps;

export function HubLink(props: HubLinkProps) {
  const { children, variant = 'text', className = '' } = props;
  const classes = ['ds-link', 'ds-link--' + variant, className].filter(Boolean).join(' ');

  if (props.href !== undefined) {
    const { href, target, rel, title } = props;
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : rel}
        title={title}
        className={classes}
      >
        {children}
      </a>
    );
  }

  const { to, variant: _variant, className: _className, children: _children, ...rest } = props;
  void _variant;
  void _className;
  void _children;

  return (
    <Link {...rest} to={to} className={classes}>
      {children}
    </Link>
  );
}
