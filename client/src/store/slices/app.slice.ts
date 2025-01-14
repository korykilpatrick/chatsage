import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserStatus } from '@/types';

interface AppState {
  isLoading: boolean;
  currentUserStatus: UserStatus;
}

const initialState: AppState = {
  isLoading: false,
  currentUserStatus: UserStatus.OFFLINE
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setUserStatus: (state, action: PayloadAction<UserStatus>) => {
      state.currentUserStatus = action.payload;
    }
  }
});

export const { setLoading, setUserStatus } = appSlice.actions;
export default appSlice.reducer;
