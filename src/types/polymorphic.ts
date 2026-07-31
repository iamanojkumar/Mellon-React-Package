import type React from 'react';

export type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, Props> = keyof (AsProp<C> & Props);

export type PolymorphicComponentProp<
  C extends React.ElementType,
  Props extends object = object,
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

export type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref'];

export type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  Props extends object = object,
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };
