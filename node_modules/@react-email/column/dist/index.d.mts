import * as React from 'react';

type ColumnProps = Readonly<React.ComponentPropsWithoutRef<"td">>;
declare const Column: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>, "ref">> & React.RefAttributes<HTMLTableCellElement>>;

export { Column, type ColumnProps };
