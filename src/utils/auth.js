
export default function isGranted(state, grant) {
  // const { auth, lists, paths } = state
  //
  // const userGrants = lists[`user_grants/${auth.uid}`]
  // const isAdmin = paths[`admins/${auth.uid}`]
  //
  // if (auth.isAuthorised !== true) {
  //   return false
  // }
  //
  // if (isAdmin === true) {
  //   return true
  // }
  //
  // if (userGrants !== undefined) {
  //   for (let userGrant of userGrants) {
  //     if (userGrant.key === grant) {
  //       return userGrant.val === true
  //     }
  //   }
  // }

  return true
}

export function isAnyGranted(state, grants) {
  if (grants !== undefined) {
    for (let grant of grants) {
      if (isGranted(state, grant) === true) {
        return true
      }
    }
  }

  return false
}

export function isAuthorised() {
  try {
    const key = Object.keys(localStorage).find(e => e.match(/uclusion:root/))
    if (key) {
      const data = JSON.parse(localStorage.getItem(key))
      if (data && data.auth) {
        return true
      }
    }
  } catch (ex) {
    console.error(ex)
  }
  return false
}
