import config from '../../config';

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
