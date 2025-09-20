import * as React from 'react';

type SectionProps = Readonly<React.ComponentPropsWithoutRef<"table">>;
declare const Section: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>, "ref">> & React.RefAttributes<HTMLTableElement>>;

export { Section, type SectionProps };
