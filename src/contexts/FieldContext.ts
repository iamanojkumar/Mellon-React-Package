import { createContext } from 'react';

export interface FieldContextValue {
  id: string;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
  /** id of the helper/error text this field's control should be described by. */
  describedById: string | undefined;
}

export const FieldContext = createContext<FieldContextValue | undefined>(undefined);
