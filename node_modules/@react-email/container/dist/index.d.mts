import * as React from 'react';

type ContainerProps = Readonly<React.ComponentPropsWithoutRef<"table">>;
declare const Container: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>, "ref">> & React.RefAttributes<HTMLTableElement>>;

export { Container, type ContainerProps };
