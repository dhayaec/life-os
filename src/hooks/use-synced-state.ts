'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Local state seeded from a server-serialized prop. When the prop reference
 * changes (after `router.refresh()`), re-syncs local state via React's
 * documented render-phase "adjust state when a prop changes" pattern.
 */
export function useSyncedState<T>(serverValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(serverValue);
  const [seeded, setSeeded] = useState(serverValue);
  if (seeded !== serverValue) {
    setSeeded(serverValue);
    setValue(serverValue);
  }
  return [value, setValue];
}
