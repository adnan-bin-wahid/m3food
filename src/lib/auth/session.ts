export function createAdminSession() {
  return {
    authenticated: true,
  };
}

export function clearAdminSession() {
  return {
    authenticated: false,
  };
}
