
export function filterCommentsToSearch(results, comments) {
  if (!results) {
    return comments;
  }
  if (!comments) {
    return undefined;
  }
  const found = [];
  const resultsHash = {};
  results.forEach((item) => {
    resultsHash[item.id] = true;
  })
  comments.forEach((comment) => {
    if (resultsHash[comment.id]) {
      found.push(comment);
    }
  });
  return found;
}