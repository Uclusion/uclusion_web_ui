import config from '../../config';

export const DEFAULT_TOKEN_AUDIT_BUCKETS = 'planning, research, implementation, testing, review';

export function tokenAuditBucketsError(value) {
  const buckets = value.split(',').map((bucket) => bucket.trim());
  if (buckets.some((bucket) => !/^[A-Za-z0-9][A-Za-z0-9._:/+@ -]{0,79}$/.test(bucket))) {
    return 'Use 1–80 letters, numbers, spaces, or ._:/+@- per bucket.';
  }
  if (new Set(buckets).size !== buckets.length) {
    return 'Each bucket must have a different name.';
  }
  if (!buckets.includes('planning')) {
    return 'Keep planning, the initial audit bucket.';
  }
  if (buckets.length > 32) {
    return 'Use up to 32 buckets.';
  }
  return '';
}

// Derive which Uclusion environment this UI is serving so the setup commands hit the
// same environment (the installer and CLI take dev | stage | production).
export function getUclusionEnvironment() {
  const uiUrl = config.ui_base_url || '';
  if (uiUrl.includes('stage.uclusion.com')) {
    return 'stage';
  }
  if (uiUrl.includes('localhost')) {
    return 'dev';
  }
  return 'production';
}

export function buildInstallArgs(marketId, viewId, environment, clients, scope, tokenAudit,
  tokenCollector, workClaims, tokenAuditBuckets = DEFAULT_TOKEN_AUDIT_BUCKETS) {
  if (tokenAudit && tokenAuditBucketsError(tokenAuditBuckets)) {
    return null;
  }
  const buckets = tokenAuditBuckets.split(',').map((bucket) => bucket.trim()).join(',');
  return `${marketId} ${viewId}${environment === 'production' ? '' : ` ${environment}`}` +
    ` --clients ${clients.join(',')}${scope === 'project' ? ' --project' : ''}` +
    ` ${tokenAudit ? '--token-audit' : '--no-token-audit'}` +
    ` ${tokenCollector ? '--token-collector' : '--no-token-collector'}` +
    ` ${workClaims ? '--work-claims' : '--no-work-claims'}` +
    (tokenAudit ? ` --token-audit-buckets '${buckets}'` : '');
}
