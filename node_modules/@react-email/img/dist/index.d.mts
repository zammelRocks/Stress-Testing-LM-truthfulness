import * as React from 'react';

type ImgProps = Readonly<React.ComponentPropsWithoutRef<"img">>;
declare const Img: React.ForwardRefExoticComponent<Readonly<Omit<React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>, "ref">> & React.RefAttributes<HTMLImageElement>>;

export { Img, type ImgProps };
