import { describe, it, expect } from 'vitest';
import authReducer, { setCurrentUser } from '../authSlice';

describe('authSlice', () => {
  it('never keeps the access token inside the persisted user profile', () => {
    const state = authReducer(
      undefined,
      setCurrentUser({ id: 1, email: 'customer@aurafit.com', accessToken: 'secret-token' })
    );

    expect(state.currentUser).toMatchObject({ id: 1, email: 'customer@aurafit.com' });
    expect(state.currentUser.accessToken).toBeUndefined();
  });
});
