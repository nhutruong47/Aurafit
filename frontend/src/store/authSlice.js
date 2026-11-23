import { createSlice } from '@reduxjs/toolkit';
import { loadJson, saveJson } from './browserStorage';

// Older builds persisted the access token with the profile. Strip it on load
// and immediately rewrite storage so a reload never leaves a token behind.
const loadInitialUser = () => {
  const storedUser = loadJson('aurafitCurrentUser', null);
  if (!storedUser) return null;
  if (!storedUser.accessToken) return storedUser;

  const safeUser = { ...storedUser };
  delete safeUser.accessToken;
  saveJson('aurafitCurrentUser', safeUser);
  return safeUser;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: loadInitialUser(),
  },
  reducers: {
    setCurrentUser: (state, action) => {
      if (!action.payload) {
        state.currentUser = null;
        return;
      }

      const safeUser = { ...action.payload };
      delete safeUser.accessToken;
      state.currentUser = safeUser;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
});

export const { setCurrentUser, clearCurrentUser } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.currentUser;

export default authSlice.reducer;
