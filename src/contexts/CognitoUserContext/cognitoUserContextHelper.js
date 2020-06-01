/**
 * Returns whether or not the user is a federated user. That is it comes from
 * google, github, etc. We can't change attributes on those users. If the user
 * is empty, returns false.
 * @param user
 */
export function isFederated(user) {
  // external users have an identities value in their user attributes
  if (!user) {
    return false;
  }
  return !!user.identities;
}