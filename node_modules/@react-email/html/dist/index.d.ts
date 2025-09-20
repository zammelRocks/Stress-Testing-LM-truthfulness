import * as React from 'react';

type HtmlProps = Readonly<React.ComponentPropsWithoutRef<"html">>;
declare const Html: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>, "ref">> & React.RefAttributes<HTMLHtmlElement>>;

export { Html, type HtmlProps };
