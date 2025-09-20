import * as React from 'react';

type RowProps = Readonly<React.ComponentPropsWithoutRef<"table"> & {
    children: React.ReactNode;
}>;
declare const Row: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>, "ref"> & {
    children: React.ReactNode;
}> & React.RefAttributes<HTMLTableElement>>;

export { Row, type RowProps };
