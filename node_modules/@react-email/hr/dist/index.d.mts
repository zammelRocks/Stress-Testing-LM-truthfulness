import * as React from 'react';

type HrProps = Readonly<React.ComponentPropsWithoutRef<"hr">>;
declare const Hr: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.HTMLAttributes<HTMLHRElement>, HTMLHRElement>, "ref">> & React.RefAttributes<HTMLHRElement>>;

export { Hr, type HrProps };
