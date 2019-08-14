

export function getHashKeyAndValue(history) {
  const { location: { hash } } = history;
  if (hash) {
    const hashPart = hash.substr(1).split(':');
    if (hashPart.length >= 2) {
      const key = hashPart[0];
      const value = hashPart[1];
      return { key, value }
    }
  }
  return { key: '', value: '' };
}

export function getInvestibleIdFromHash(history) {
  const { key, value } = getHashKeyAndValue(history);
  if (key === 'investible') {
    return value;
  }
  return ''
}


export function getInvestibleForUrl(history, investibles) {
  const investibleId = getInvestibleIdFromHash(history);
  if (investibleId) {
    return investibles.find(investible => investible.id === investibleId);
  }
  return undefined;
}
