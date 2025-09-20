import * as React from 'react';

type HeadProps = Readonly<React.ComponentPropsWithoutRef<"head">>;
declare const Head: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>, "ref">> & React.RefAttributes<HTMLHeadElement>>;

export { Head, type HeadProps };
