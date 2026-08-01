import { useContext } from 'react';
import { FieldContext } from '../contexts/FieldContext';
import type { FieldContextValue } from '../contexts/FieldContext';

/**
 * Returns the ancestor `Field`'s context, or `undefined` when there isn't
 * one — unlike `useTheme`, this doesn't throw, since form controls
 * (`Input`, etc.) must also work standalone outside a `Field`.
 */
export function useFieldContext(): FieldContextValue | undefined {
  return useContext(FieldContext);
}
