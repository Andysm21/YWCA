'use client';

import * as React from 'react';

export type Role = 'guest' | 'admin' | 'super-admin';

type RoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
  authed: boolean;
  setAuthed: (v: boolean) => void;
};

const RoleContext = React.createContext<RoleContextValue>({
  role: 'guest',
  setRole: () => {},
  authed: false,
  setAuthed: () => {},
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = React.useState<Role>('guest');
  const [authed, setAuthed] = React.useState(false);
  return (
    <RoleContext.Provider value={{ role, setRole, authed, setAuthed }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return React.useContext(RoleContext);
}
