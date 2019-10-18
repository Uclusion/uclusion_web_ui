export function getFlags(user) {
  return (user && user.flags) || {};
}