import * as React from 'react';

type LinkProps = Readonly<React.ComponentPropsWithoutRef<"a">>;
declare const Link: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>, "ref">> & React.RefAttributes<HTMLAnchorElement>>;

export { Link, type LinkProps };
