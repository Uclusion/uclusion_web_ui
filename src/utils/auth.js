
export function isAuthorised () {
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
