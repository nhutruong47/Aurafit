import { createSlice } from '@reduxjs/toolkit';
import { loadJson } from './browserStorage';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: loadJson('aurafitCurrentUser', null),
  },
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
});

export const { setCurrentUser, clearCurrentUser } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.currentUser;

export default authSlice.reducer;
