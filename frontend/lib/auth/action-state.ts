export type AuthActionState = {
  fieldErrors?: {
    displayName?: string[];
    email?: string[];
    password?: string[];
  };
  message?: string;
  success?: boolean;
};

export const initialAuthActionState: AuthActionState = {};
