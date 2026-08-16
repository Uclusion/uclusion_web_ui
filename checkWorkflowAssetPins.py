#!/usr/bin/python3
"""Deployment gate for the Uclusion workflow scripts.

The deploy scripts publish ``build/`` verbatim, so the workflow assets a
customer's installer downloads are the copies in ``build/scripts``. This gate
loads the ``uclusionInstall.py`` inside the target directory and validates the
assets beside it with that installer's own ``validate_workflow_bundle``, the
same coherence check every customer install performs. A release whose assets
do not match its installer's pinned digests therefore fails here, before any
byte reaches S3, instead of failing on every customer's ``uclusion update``.

Usage: ``python3 checkWorkflowAssetPins.py [scripts_dir]`` with the directory
defaulting to ``build/scripts``. Exits nonzero on any validation failure.
"""

import importlib.util
import os
import sys


def load_installer(scripts_dir):
    installer_path = os.path.join(scripts_dir, 'uclusionInstall.py')
    if not os.path.isfile(installer_path):
        raise RuntimeError(f'{installer_path} is missing')
    spec = importlib.util.spec_from_file_location(
        'deploy_gate_installer', installer_path
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_bundle(scripts_dir, asset_paths):
    bundle = {}
    for key, relative_path in asset_paths.items():
        asset_path = os.path.join(scripts_dir, relative_path)
        if not os.path.isfile(asset_path):
            raise RuntimeError(f'workflow asset {key} is missing at {asset_path}')
        with open(asset_path, encoding='utf-8') as handle:
            bundle[key] = handle.read()
    return bundle


def main(argv):
    scripts_dir = argv[1] if len(argv) > 1 else os.path.join('build', 'scripts')
    try:
        if not os.path.isdir(scripts_dir):
            raise RuntimeError(
                f'{scripts_dir} does not exist; run `npm run build` first'
            )
        installer = load_installer(scripts_dir)
        if not hasattr(installer, 'WORKFLOW_ASSET_PATHS') or not hasattr(
            installer, 'validate_workflow_bundle'
        ):
            raise RuntimeError(
                f'installer in {scripts_dir} predates the workflow pin table; '
                'the build is stale, run `npm run build` first'
            )
        bundle = read_bundle(scripts_dir, installer.WORKFLOW_ASSET_PATHS)
        installer.validate_workflow_bundle(bundle)
    except RuntimeError as error:
        print(f'❌ Workflow release gate failed: {error}', file=sys.stderr)
        return 1
    print(f'✅ Workflow release in {scripts_dir} matches its installer pins.')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
