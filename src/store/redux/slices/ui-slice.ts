import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type UiState = {
  commandPaletteOpen: boolean;
  mobileNavOpen: boolean;
};

const initialState: UiState = {
  commandPaletteOpen: false,
  mobileNavOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCommandPaletteOpen(state, action: PayloadAction<boolean>) {
      state.commandPaletteOpen = action.payload;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.mobileNavOpen = action.payload;
    },
  },
});

export const { setCommandPaletteOpen, setMobileNavOpen } = uiSlice.actions;
export default uiSlice.reducer;
