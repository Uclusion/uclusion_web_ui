"""Contract tests for the resident-stub/native-skill Uclusion install.

The workflow package is intentionally tested separately from the much larger
Codex bridge suite.  These tests protect the small, client-specific resident
instructions and the portable skill without depending on a live AI client.
"""

import importlib.util
import hashlib
import os
import re
import shutil
import tempfile
import unittest
from unittest import mock


SCRIPT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INSTALL_PATH = os.path.join(SCRIPT_DIR, 'uclusionInstall.py')
CLI_PATH = os.path.join(SCRIPT_DIR, 'uclusionCLI.py')
SKILL_SOURCE_DIR = os.path.join(SCRIPT_DIR, 'skills', 'uclusion')
SKILL_SOURCE_PATH = os.path.join(SKILL_SOURCE_DIR, 'SKILL.md')


def load_module(module_name, path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


INSTALL = load_module('uclusion_install_skills_under_test', INSTALL_PATH)

# S-all-338: install_global also removes a home-directory project install's
# leftovers. Point those paths into scratch so no test reaches the real home.
_HOME_PROJECT_SCRATCH = tempfile.TemporaryDirectory()
INSTALL.HOME_PROJECT_MCP_JSON_PATH = os.path.join(
    _HOME_PROJECT_SCRATCH.name, '.mcp.json'
)
INSTALL.HOME_PROJECT_CLAUDE_SETTINGS_PATH = os.path.join(
    _HOME_PROJECT_SCRATCH.name, '.claude', 'settings.local.json'
)
CLI = load_module('uclusion_cli_skill_detection_under_test', CLI_PATH)


def read_text(path):
    with open(path, encoding='utf-8') as source:
        return source.read()


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as target:
        target.write(content)


def source_bundle():
    """Read the exact assets that the production fetcher publishes."""
    return {
        key: read_text(os.path.join(SCRIPT_DIR, relative_path))
        for key, relative_path in INSTALL.WORKFLOW_ASSET_PATHS.items()
    }


def installed_skill_files(bundle):
    """Map package-relative paths to expected contents, excluding stubs."""
    result = {}
    prefix = 'skills/uclusion/'
    for key, source_path in INSTALL.WORKFLOW_ASSET_PATHS.items():
        normalized = source_path.replace(os.sep, '/')
        if normalized.startswith(prefix):
            result[normalized[len(prefix):]] = (
                INSTALL.render_work_claims_reference(bundle[key], False)
                if key == 'claims_reference' else bundle[key]
            )
    return result


class SkillPackageContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skill = read_text(SKILL_SOURCE_PATH)

    def test_skill_entrypoint_routes_to_packaged_references(self):
        self.assertEqual(1, self.skill.count(INSTALL.SKILL_MARKER))
        self.assertEqual(1, self.skill.count(INSTALL.SKILL_END_MARKER))
        self.assertLess(
            self.skill.index(INSTALL.SKILL_MARKER),
            self.skill.index(INSTALL.SKILL_END_MARKER),
        )

        references = set(re.findall(
            r'(?<![A-Za-z0-9_./-])(references/[A-Za-z0-9_.\-/]+\.md)',
            self.skill,
        ))
        self.assertTrue(
            references,
            'SKILL.md must route detailed workflow instructions to references/',
        )
        packaged_paths = {
            destination.replace(os.sep, '/')
            for _key, destination in INSTALL.SKILL_PACKAGE_ASSETS
        }
        self.assertEqual(
            ('skill', 'SKILL.md'),
            INSTALL.SKILL_PACKAGE_ASSETS[-1],
        )
        shipped_markdown = {
            os.path.relpath(os.path.join(root, name), SKILL_SOURCE_DIR)
            .replace(os.sep, '/')
            for root, _dirs, names in os.walk(SKILL_SOURCE_DIR)
            for name in names if name.endswith('.md')
        }
        self.assertEqual(
            shipped_markdown - {'README.md'},
            {path for path in packaged_paths if path.endswith('.md')},
            'Every action and helper body must ship in ordinary and demo installs',
        )
        self.assertNotIn('README.md', packaged_paths,
                         'The maintainer README is not an installed agent instruction')
        for relative_path in references:
            self.assertNotIn('..', relative_path.split('/'))
            target = os.path.join(SKILL_SOURCE_DIR, *relative_path.split('/'))
            self.assertTrue(
                os.path.isfile(target),
                f'SKILL.md references missing file {relative_path}',
            )
            reference = read_text(target)
            self.assertEqual(1, reference.count(INSTALL.SKILL_REFERENCE_MARKER))
            self.assertEqual(
                1, reference.count(INSTALL.SKILL_REFERENCE_END_MARKER)
            )
            self.assertIn(
                relative_path,
                packaged_paths,
                f'SKILL.md reference is not packaged: {relative_path}',
            )

        for _key, source_path in INSTALL.SKILL_PACKAGE_ASSETS:
            if not source_path.endswith('.md'):
                continue
            source = read_text(os.path.join(SKILL_SOURCE_DIR, source_path))
            for link in re.findall(r'\[[^]]+\]\(([^)]+\.md)\)', source):
                destination = os.path.normpath(os.path.join(
                    os.path.dirname(source_path), link
                )).replace(os.sep, '/')
                self.assertIn(
                    destination,
                    packaged_paths,
                    f'{source_path} routes to an unpackaged unit: {link}',
                )

    def test_skill_package_does_not_capture_workspace_specific_short_codes(self):
        # Product docs use wildcard forms (for example J-*).  A concrete code
        # would accidentally couple every installation to the workspace where
        # the package was authored.
        # Tool descriptions name the placeholder example workspace, such as
        # Q-example-1_O-1, which couples to no real workspace.
        concrete_code = re.compile(
            r'\b(?:J|T|B|Q|S|O|I|R|C)-(?!example-)[A-Za-z0-9][A-Za-z0-9_-]*-\d+\b'
        )
        package_files = []
        for root, _dirs, names in os.walk(SKILL_SOURCE_DIR):
            package_files.extend(
                os.path.join(root, name)
                for name in names
                if name.endswith(('.md', '.yaml', '.yml'))
            )
        self.assertTrue(package_files)
        for path in package_files:
            relative = os.path.relpath(path, SKILL_SOURCE_DIR)
            self.assertIsNone(
                concrete_code.search(read_text(path)),
                f'{relative} contains a workspace-specific Uclusion short code',
            )


class WorkflowBundleFetcherTests(unittest.TestCase):
    class Response:
        def __init__(self, content):
            self.status = 200
            self.content = content.encode('utf-8')

        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return self.content

    def test_fetcher_downloads_each_validated_asset_once(self):
        expected = source_bundle()
        asset_by_url = {
            'https://assets.invalid/' + relative_path: expected[key]
            for key, relative_path in INSTALL.WORKFLOW_ASSET_PATHS.items()
        }

        def open_asset(url, timeout):
            self.assertEqual(INSTALL.HTTP_TIMEOUT, timeout)
            return self.Response(asset_by_url[url])

        with mock.patch.object(
            INSTALL, 'get_scripts_base_url', return_value='https://assets.invalid/'
        ), mock.patch.object(
            INSTALL.urllib.request, 'urlopen', side_effect=open_asset
        ) as urlopen:
            fetch_bundle = INSTALL.make_workflow_bundle_fetcher('stage')
            first = fetch_bundle()
            second = fetch_bundle()

        self.assertEqual(expected, first)
        self.assertIs(first, second)
        self.assertEqual(len(INSTALL.WORKFLOW_ASSET_PATHS), urlopen.call_count)

    def test_bundle_validation_rejects_one_structurally_valid_mixed_asset(self):
        bundle = source_bundle()
        bundle['claude_stub'] += '\n'
        with self.assertRaisesRegex(RuntimeError, 'installer release'):
            INSTALL.validate_workflow_bundle(bundle)

    def test_fetcher_caches_and_raises_a_partial_download_failure(self):
        expected = source_bundle()
        failing_path = next(iter(INSTALL.WORKFLOW_ASSET_PATHS.values()))
        calls = []

        def open_asset(url, timeout):
            self.assertEqual(INSTALL.HTTP_TIMEOUT, timeout)
            calls.append(url)
            if url.endswith(failing_path):
                raise OSError('offline')
            relative_path = url.removeprefix('https://assets.invalid/')
            key = next(
                key for key, value in INSTALL.WORKFLOW_ASSET_PATHS.items()
                if value == relative_path
            )
            return self.Response(expected[key])

        with mock.patch.object(
            INSTALL, 'get_scripts_base_url', return_value='https://assets.invalid/'
        ), mock.patch.object(
            INSTALL.urllib.request, 'urlopen', side_effect=open_asset
        ):
            fetch_bundle = INSTALL.make_workflow_bundle_fetcher('stage')
            with self.assertRaisesRegex(RuntimeError, 'failed to download'):
                fetch_bundle()
            first_call_count = len(calls)
            with self.assertRaisesRegex(RuntimeError, 'could not be downloaded'):
                fetch_bundle()

        self.assertEqual(first_call_count, len(calls))


class SkillAndStubInstallerTests(unittest.TestCase):
    def setUp(self):
        self.bundle = source_bundle()
        self.fetch_bundle = mock.Mock(return_value=self.bundle)

    def install(self, skill_dir, resident_path, client='codex'):
        return INSTALL.install_skill_and_stub(
            self.fetch_bundle,
            skill_dir,
            resident_path,
            client,
            client.title(),
            assume_yes=True,
        )

    def assert_skill_package_installed(self, skill_dir):
        expected_files = installed_skill_files(self.bundle)
        self.assertTrue(expected_files)
        for relative_path, expected in expected_files.items():
            with self.subTest(path=relative_path):
                self.assertEqual(
                    expected,
                    read_text(os.path.join(skill_dir, *relative_path.split('/'))),
                )

    def add_retired_references(self, skill_dir):
        retired = {
            relative_path: (
                f'{INSTALL.SKILL_REFERENCE_MARKER}\n'
                f'Old managed reference: {relative_path}\n'
                f'{INSTALL.SKILL_REFERENCE_END_MARKER}\n'
            )
            for relative_path in INSTALL.RETIRED_SKILL_REFERENCE_PATHS
        }
        for relative_path, content in retired.items():
            write_text(os.path.join(skill_dir, relative_path), content)
        return retired

    def test_old_full_workflow_migrates_to_stub_and_native_skill(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, '.agents', 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            old_resident = (
                '# User instructions\n\n'
                f'{INSTALL.CLAUDE_MD_MARKER}\n'
                '# Legacy resident workflow\n'
                'This deliberately large protocol moves into the skill.\n'
                f'{INSTALL.CLAUDE_MD_END_MARKER}\n\n'
                '# Keep this project note\n'
            )
            write_text(resident_path, old_resident)

            self.install(skill_dir, resident_path)

            resident = read_text(resident_path)
            self.assertTrue(resident.startswith('# User instructions\n\n'))
            self.assertTrue(resident.endswith('# Keep this project note\n'))
            self.assertNotIn('Legacy resident workflow', resident)
            self.assertEqual(self.bundle['codex_stub'], resident[
                resident.index(INSTALL.CLAUDE_MD_MARKER):
                resident.index(INSTALL.CLAUDE_MD_END_MARKER)
                + len(INSTALL.CLAUDE_MD_END_MARKER) + 1
            ])
            self.assert_skill_package_installed(skill_dir)

    def test_old_markerless_cursor_rule_migrates_as_a_managed_refresh(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, '.cursor', 'skills', 'uclusion')
            resident_path = os.path.join(
                temp_dir, '.cursor', 'rules', 'uclusion.mdc'
            )
            old_resident = (
                INSTALL.CURSOR_MDC_FRONTMATTER
                + '# Legacy resident workflow\n'
                + ('Full workflow line.\n' * 100)
            )
            write_text(resident_path, old_resident)

            with mock.patch.object(
                INSTALL, 'prompt_yes_no', return_value=True
            ) as prompt:
                result = INSTALL.install_skill_and_stub(
                    self.fetch_bundle,
                    skill_dir,
                    resident_path,
                    'cursor',
                    'Cursor',
                    assume_yes=False,
                )

            self.assertTrue(result)
            self.assertTrue(prompt.call_args.kwargs['default'])
            self.assertEqual(
                self.bundle['cursor_stub'],
                read_text(resident_path),
            )
            self.assert_skill_package_installed(skill_dir)

    def test_cursor_refresh_replaces_frontmatter_with_the_bundle_version(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, '.cursor', 'skills', 'uclusion')
            resident_path = os.path.join(
                temp_dir, '.cursor', 'rules', 'uclusion.mdc'
            )
            stale = self.bundle['cursor_stub'].replace(
                'alwaysApply: true', 'alwaysApply: false'
            )
            write_text(resident_path, stale)

            self.install(skill_dir, resident_path, client='cursor')

            self.assertEqual(self.bundle['cursor_stub'], read_text(resident_path))

    def test_reinstall_is_idempotent(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')

            self.install(skill_dir, resident_path)
            first_resident = read_text(resident_path)
            first_skill = {
                relative_path: read_text(
                    os.path.join(skill_dir, *relative_path.split('/'))
                )
                for relative_path in installed_skill_files(self.bundle)
            }
            self.install(skill_dir, resident_path)

            self.assertEqual(first_resident, read_text(resident_path))
            self.assertEqual(1, first_resident.count(INSTALL.CLAUDE_MD_MARKER))
            self.assertEqual(1, first_resident.count(INSTALL.CLAUDE_MD_END_MARKER))
            self.assertEqual(
                first_skill,
                {
                    relative_path: read_text(
                        os.path.join(skill_dir, *relative_path.split('/'))
                    )
                    for relative_path in installed_skill_files(self.bundle)
                },
            )

    def test_bundle_callback_renders_environment_only_in_resident_stub(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')

            def bundle_callback():
                return self.bundle

            bundle_callback.workflow_environment = 'stage'
            result = INSTALL.install_skill_and_stub(
                bundle_callback,
                skill_dir,
                resident_path,
                'codex',
                'Codex',
                assume_yes=True,
            )

            self.assertTrue(result)
            resident = read_text(resident_path)
            self.assertNotIn(INSTALL.WORKFLOW_ENV_PLACEHOLDER, resident)
            self.assertIn('uclusion -e stage', resident)
            self.assert_skill_package_installed(skill_dir)

    def test_unmarked_skill_collision_preserves_skill_and_resident(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            user_skill = (
                '---\nname: uclusion\ndescription: User-owned content\n---\n'
                '# Do not overwrite me\n'
            )
            old_resident = (
                '# Before\n'
                f'{INSTALL.CLAUDE_MD_MARKER}\nold workflow\n'
                f'{INSTALL.CLAUDE_MD_END_MARKER}\n'
            )
            write_text(os.path.join(skill_dir, 'SKILL.md'), user_skill)
            write_text(resident_path, old_resident)

            with self.assertRaisesRegex(RuntimeError, 'not a Uclusion-managed'):
                self.install(skill_dir, resident_path)

            self.assertEqual(user_skill, read_text(os.path.join(skill_dir, 'SKILL.md')))
            self.assertEqual(old_resident, read_text(resident_path))
            self.assertEqual(
                ['SKILL.md'],
                [
                    os.path.relpath(os.path.join(root, name), skill_dir)
                    for root, _dirs, names in os.walk(skill_dir)
                    for name in names
                ],
            )

    def test_bundle_failure_leaves_existing_resident_workflow_intact(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            old_resident = (
                f'{INSTALL.CLAUDE_MD_MARKER}\nold complete workflow\n'
                f'{INSTALL.CLAUDE_MD_END_MARKER}\n'
            )
            write_text(resident_path, old_resident)
            self.fetch_bundle.return_value = None

            with self.assertRaisesRegex(RuntimeError, 'bundle is unavailable'):
                self.install(skill_dir, resident_path)

            self.assertEqual(old_resident, read_text(resident_path))
            self.assertFalse(os.path.exists(skill_dir))

    def test_skill_write_failure_happens_before_resident_replacement(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            old_resident = (
                f'{INSTALL.CLAUDE_MD_MARKER}\nold complete workflow\n'
                f'{INSTALL.CLAUDE_MD_END_MARKER}\n'
            )
            write_text(resident_path, old_resident)
            with mock.patch.object(
                INSTALL,
                '_write_staged_asset',
                side_effect=OSError('skill disk full'),
            ):
                with self.assertRaisesRegex(OSError, 'skill disk full'):
                    self.install(skill_dir, resident_path)

            self.assertEqual(old_resident, read_text(resident_path))
            self.assertFalse(os.path.exists(skill_dir))
            for path in INSTALL._skill_transaction_paths(skill_dir)[1:]:
                self.assertFalse(os.path.lexists(path))

    def test_resident_failure_rolls_back_package_and_preserves_safe_extras(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            extra_path = os.path.join(skill_dir, 'notes', 'keep.txt')
            write_text(extra_path, 'keep me\n')
            self.add_retired_references(skill_dir)
            original_files = {
                os.path.relpath(os.path.join(root, name), skill_dir):
                read_text(os.path.join(root, name))
                for root, _dirs, names in os.walk(skill_dir)
                for name in names
            }
            original_inode = os.stat(skill_dir).st_ino
            original_resident = read_text(resident_path)

            with mock.patch.object(
                INSTALL, 'atomic_write_text', side_effect=OSError('resident full')
            ):
                with self.assertRaisesRegex(OSError, 'resident full'):
                    self.install(skill_dir, resident_path)

            self.assertEqual(original_inode, os.stat(skill_dir).st_ino)
            self.assertEqual(original_files, {
                os.path.relpath(os.path.join(root, name), skill_dir):
                read_text(os.path.join(root, name))
                for root, _dirs, names in os.walk(skill_dir)
                for name in names
            })
            self.assertEqual(original_resident, read_text(resident_path))
            for path in INSTALL._skill_transaction_paths(skill_dir)[1:]:
                self.assertFalse(os.path.lexists(path))

    def test_successful_refresh_preserves_safe_extra_regular_files(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            extra_path = os.path.join(skill_dir, 'notes', 'keep.txt')
            write_text(extra_path, 'keep me\n')
            retired = self.add_retired_references(skill_dir)

            self.install(skill_dir, resident_path)

            self.assert_skill_package_installed(skill_dir)
            self.assertEqual('keep me\n', read_text(extra_path))
            for relative_path in retired:
                self.assertFalse(os.path.lexists(
                    os.path.join(skill_dir, relative_path)
                ))

            # User text and binary files can reuse retired filenames, including
            # a quoted managed fragment surrounded by the user's own text.
            user_files = {
                relative_path: b'user file\n' if index else b'\xffuser file\n'
                for index, relative_path in enumerate(retired)
            }
            quoted_path = INSTALL.RETIRED_SKILL_REFERENCE_PATHS[-1]
            user_files[quoted_path] = (
                'User text before the quote\n'
                + retired[quoted_path]
                + 'User text after the quote\n'
            ).encode('utf-8')
            for relative_path, content in user_files.items():
                with open(os.path.join(skill_dir, relative_path), 'wb') as output:
                    output.write(content)
            self.install(skill_dir, resident_path)
            self.assertEqual('keep me\n', read_text(extra_path))
            for relative_path, content in user_files.items():
                with open(os.path.join(skill_dir, relative_path), 'rb') as source:
                    self.assertEqual(content, source.read())

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_resident_symlink_is_preserved_while_target_is_refreshed(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            target_path = os.path.join(temp_dir, 'dotfiles', 'AGENTS.md')
            resident_path = os.path.join(temp_dir, 'project', 'AGENTS.md')
            old_resident = (
                f'{INSTALL.CLAUDE_MD_MARKER}\nold workflow\n'
                f'{INSTALL.CLAUDE_MD_END_MARKER}\n'
            )
            write_text(target_path, old_resident)
            os.makedirs(os.path.dirname(resident_path))
            os.symlink(target_path, resident_path)

            self.install(skill_dir, resident_path)

            self.assertTrue(os.path.islink(resident_path))
            self.assertEqual(target_path, os.readlink(resident_path))
            self.assertEqual(self.bundle['codex_stub'], read_text(target_path))

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_skill_directory_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            target = os.path.join(temp_dir, 'real-skill')
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            os.makedirs(os.path.dirname(skill_dir))
            os.makedirs(target)
            os.symlink(target, skill_dir)

            with self.assertRaisesRegex(RuntimeError, 'is a symlink'):
                self.install(skill_dir, resident_path)

            self.assertEqual([], os.listdir(target))
            self.assertFalse(os.path.exists(resident_path))

    @unittest.skipUnless(hasattr(os, 'symlink'), 'requires symlink support')
    def test_nested_skill_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            os.symlink(
                os.path.join(skill_dir, 'SKILL.md'),
                os.path.join(skill_dir, INSTALL.RETIRED_SKILL_REFERENCE_PATHS[0]),
            )
            original_resident = read_text(resident_path)

            with self.assertRaisesRegex(RuntimeError, 'is a symlink'):
                self.install(skill_dir, resident_path)

            self.assertTrue(os.path.islink(os.path.join(
                skill_dir, INSTALL.RETIRED_SKILL_REFERENCE_PATHS[0]
            )))
            self.assertEqual(original_resident, read_text(resident_path))

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'requires FIFO support')
    def test_nonregular_nested_skill_path_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            fifo_path = os.path.join(skill_dir, 'unsafe.fifo')
            os.mkfifo(fifo_path)

            with self.assertRaisesRegex(RuntimeError, 'not a regular file'):
                self.install(skill_dir, resident_path)

    def test_retry_recovers_owned_interrupted_swap_before_refresh(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            old_extra = os.path.join(skill_dir, 'old.txt')
            write_text(old_extra, 'old package\n')
            normalized, staging, backup, transaction = (
                INSTALL._skill_transaction_paths(skill_dir)
            )
            resident_content = read_text(resident_path)
            resident_digest = hashlib.sha256(
                resident_content.encode('utf-8')
            ).hexdigest()
            INSTALL._write_skill_transaction(
                transaction,
                normalized,
                True,
                resident_path,
                resident_digest,
                hashlib.sha256(b'new resident').hexdigest(),
            )
            os.replace(skill_dir, backup)
            shutil.copytree(backup, staging)
            os.replace(staging, skill_dir)
            write_text(os.path.join(skill_dir, 'old.txt'), 'interrupted package\n')

            self.install(skill_dir, resident_path)

            self.assertEqual('old package\n', read_text(old_extra))
            for path in (staging, backup, transaction):
                self.assertFalse(os.path.lexists(path))

    def test_retry_finalizes_package_after_crash_following_resident_write(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            write_text(os.path.join(skill_dir, 'generation.txt'), 'old\n')
            new_bundle = dict(self.bundle)
            # Use a safe extra file to distinguish package generations without
            # violating the release-bound hashes of managed assets.
            normalized, staging, backup, transaction_path = (
                INSTALL._skill_transaction_paths(skill_dir)
            )
            resident_target = INSTALL._config_write_target(resident_path)
            existing, signature = INSTALL._read_text_snapshot(resident_target)
            resident_after = existing + '\n# crash committed resident\n'
            INSTALL._recover_skill_transaction(skill_dir)
            had_existing = INSTALL._validate_owned_skill(skill_dir)
            INSTALL._write_skill_transaction(
                transaction_path,
                normalized,
                had_existing,
                resident_target,
                INSTALL._resident_state_digest(existing, signature),
                hashlib.sha256(resident_after.encode('utf-8')).hexdigest(),
            )
            INSTALL._stage_skill_package(skill_dir, staging, new_bundle)
            write_text(os.path.join(staging, 'generation.txt'), 'new\n')
            INSTALL._swap_staged_skill(
                normalized, staging, backup, had_existing
            )
            INSTALL.atomic_write_text(
                resident_path,
                resident_after,
                existing,
                resident_target,
                signature,
            )

            # Simulate retry entry: the after-resident digest must finalize the
            # new package instead of rolling it back to the backup.
            INSTALL._recover_skill_transaction(skill_dir)

            self.assertEqual(
                'new\n', read_text(os.path.join(skill_dir, 'generation.txt'))
            )
            self.assertEqual(resident_after, read_text(resident_path))
            for path in (staging, backup, transaction_path):
                self.assertFalse(os.path.lexists(path))

    def test_crash_recovery_uses_signature_when_resident_content_is_unchanged(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            write_text(os.path.join(skill_dir, 'generation.txt'), 'old\n')
            normalized, staging, backup, transaction_path = (
                INSTALL._skill_transaction_paths(skill_dir)
            )
            resident_target = INSTALL._config_write_target(resident_path)
            resident, signature = INSTALL._read_text_snapshot(resident_target)
            digest = hashlib.sha256(resident.encode('utf-8')).hexdigest()
            INSTALL._write_skill_transaction(
                transaction_path,
                normalized,
                True,
                resident_target,
                digest,
                digest,
                signature,
            )
            INSTALL._stage_skill_package(skill_dir, staging, self.bundle)
            write_text(os.path.join(staging, 'generation.txt'), 'new\n')
            INSTALL._swap_staged_skill(normalized, staging, backup, True)
            INSTALL.atomic_write_text(
                resident_path,
                resident,
                resident,
                resident_target,
                signature,
            )

            INSTALL._recover_skill_transaction(skill_dir)

            self.assertEqual(
                'new\n', read_text(os.path.join(skill_dir, 'generation.txt'))
            )
            for path in (staging, backup, transaction_path):
                self.assertFalse(os.path.lexists(path))

    def test_recovery_refuses_resident_state_matching_neither_journal_hash(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')
            self.install(skill_dir, resident_path)
            normalized, staging, backup, transaction_path = (
                INSTALL._skill_transaction_paths(skill_dir)
            )
            resident_target = INSTALL._config_write_target(resident_path)
            existing, signature = INSTALL._read_text_snapshot(resident_target)
            INSTALL._write_skill_transaction(
                transaction_path,
                normalized,
                True,
                resident_target,
                INSTALL._resident_state_digest(existing, signature),
                hashlib.sha256(b'expected after').hexdigest(),
            )
            INSTALL._stage_skill_package(skill_dir, staging, self.bundle)
            INSTALL._swap_staged_skill(normalized, staging, backup, True)
            write_text(resident_path, 'user changed this concurrently\n')

            with self.assertRaisesRegex(RuntimeError, 'either resident state'):
                INSTALL._recover_skill_transaction(skill_dir)

            self.assertTrue(os.path.isdir(skill_dir))
            self.assertTrue(os.path.isdir(backup))
            self.assertTrue(os.path.isfile(transaction_path))


class SingleSkillRoleTests(unittest.TestCase):
    """One Uclusion skill whose helpers load their role by name."""

    ROLE_NAME = re.compile(r'\| `([a-z-]+)`(?: for [^|]*)? \|$', re.MULTILINE)

    def setUp(self):
        self.bundle = source_bundle()
        self.fetch_bundle = mock.Mock(return_value=self.bundle)

    def install(self, skill_dir, resident_path, client):
        return INSTALL.install_skill_and_stub(
            self.fetch_bundle, skill_dir, resident_path, client, client.title(),
            assume_yes=True,
        )

    def routed_roles(self):
        roles = set(self.ROLE_NAME.findall(read_text(SKILL_SOURCE_PATH)))
        routing = read_text(os.path.join(SKILL_SOURCE_DIR, 'references', 'discovery-routing.md'))
        roles.update(re.findall(r'(?:fresh|Retain one) `([a-z-]+)` helper', routing))
        # Roles that another role starts itself, such as export search.
        roles_dir = os.path.join(SKILL_SOURCE_DIR, 'roles')
        for name in os.listdir(roles_dir):
            if name.endswith('.md') and not name.endswith('-tools.md'):
                linked = re.findall(r'\[roles/([a-z-]+)\.md\]', read_text(os.path.join(roles_dir, name)))
                roles.update(role for role in linked if not role.endswith('-tools'))
        return roles

    def test_bundle_ships_one_skill_and_no_design_package(self):
        self.assertNotIn('design_skill', INSTALL.WORKFLOW_ASSET_PATHS)
        self.assertFalse(any(
            path.startswith(f'skills/{INSTALL.RETIRED_DESIGN_SKILL_NAME}/')
            for path in INSTALL.WORKFLOW_ASSET_PATHS.values()
        ))
        self.assertFalse(os.path.exists(os.path.join(SCRIPT_DIR, 'skills', INSTALL.RETIRED_DESIGN_SKILL_NAME)))
        with self.assertRaises(ValueError):
            INSTALL._skill_package_definition(INSTALL.RETIRED_DESIGN_SKILL_NAME)

    def test_every_routed_role_is_found_by_its_name(self):
        roles = self.routed_roles()
        self.assertEqual({'implementation', 'operation', 'standalone',
                          'export-search', 'backlog-maintenance', 'design'}, roles)
        packaged = {relative.replace(os.sep, '/') for _key, relative in INSTALL.SKILL_PACKAGE_ASSETS}
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, '.claude', 'skills', 'uclusion')
            self.install(skill_dir, os.path.join(temp_dir, 'CLAUDE.md'), 'claude')
            # Consolidated responsibilities leave no separate roles for these duties.
            for relative in ('roles/question.md', 'roles/question-tools.md',
                             'roles/investigation.md', 'roles/investigation-tools.md',
                             'roles/discovery.md', 'roles/discovery-tools.md'):
                self.assertNotIn(relative, packaged)
                self.assertFalse(os.path.exists(os.path.join(skill_dir, *relative.split('/'))))
            installed = {name[:-len('.md')] for name in os.listdir(os.path.join(skill_dir, 'roles'))
                         if name.endswith('.md') and not name.endswith('-tools.md')}
            self.assertEqual(roles, installed)
            for role in sorted(roles):
                with self.subTest(role=role):
                    relative = f'roles/{role}.md'
                    self.assertIn(relative, packaged)
                    body = read_text(os.path.join(skill_dir, 'roles', f'{role}.md'))
                    self.assertTrue(body.startswith(INSTALL.SKILL_REFERENCE_MARKER))
                    self.assertTrue(body.rstrip().endswith(INSTALL.SKILL_REFERENCE_END_MARKER))
                    tools = re.findall(r'^Tools: (.+)$', body, re.MULTILINE)
                    if tools:
                        # Whole-list clients read the role's generated tool file.
                        self.assertIn(f'roles/{role}-tools.md', packaged)
                        self.assertIn(f'[roles/{role}-tools.md]({role}-tools.md)', body)
                        listed = read_text(os.path.join(skill_dir, 'roles', f'{role}-tools.md'))
                        for name in re.findall(r'`([a-z_]+)`', tools[0]):
                            self.assertIn(f'## `{name}`', listed)

    def test_install_retires_the_moved_files(self):
        packaged = {path.replace(os.sep, '/') for _key, path in INSTALL.SKILL_PACKAGE_ASSETS}
        for path in ('references/history-search.md', 'references/job-assistance.md',
                     'references/approval.md', 'references/review.md',
                     'references/completion-actions.md', 'references/single-comment.md', 'roles/discovery.md',
                     'roles/discovery-tools.md'):
            with self.subTest(path=path), tempfile.TemporaryDirectory() as temp_dir:
                relative = os.path.join(*path.split('/'))
                self.assertIn(relative, INSTALL.RETIRED_SKILL_REFERENCE_PATHS)
                self.assertNotIn(path, packaged)
                skill_dir = os.path.join(temp_dir, '.claude', 'skills', 'uclusion')
                resident_path = os.path.join(temp_dir, 'CLAUDE.md')
                self.install(skill_dir, resident_path, 'claude')
                retired_path = os.path.join(skill_dir, relative)
                write_text(retired_path, f'{INSTALL.SKILL_REFERENCE_MARKER}\nOld {path}\n'
                                         f'{INSTALL.SKILL_REFERENCE_END_MARKER}\n')
                self.install(skill_dir, resident_path, 'claude')
                self.assertFalse(os.path.exists(retired_path))
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, '.claude', 'skills', 'uclusion')
            self.install(skill_dir, os.path.join(temp_dir, 'CLAUDE.md'), 'claude')
            # The export-search role now prepares the export itself.
            self.assertIn('`uclusion -e <environment> export`',
                          read_text(os.path.join(skill_dir, 'roles', 'export-search.md')))

    def test_install_removes_a_marked_design_skill_for_every_client(self):
        cases = (
            ('claude', os.path.join('.claude', 'skills'), 'CLAUDE.md'),
            ('cursor', os.path.join('.cursor', 'skills'), os.path.join('.cursor', 'rules', 'uclusion.mdc')),
            ('codex', os.path.join('.agents', 'skills'), 'AGENTS.md'),
        )
        for client, skills_root, resident in cases:
            with self.subTest(client=client), tempfile.TemporaryDirectory() as temp_dir:
                skills = os.path.join(temp_dir, skills_root)
                design_dir = os.path.join(skills, INSTALL.RETIRED_DESIGN_SKILL_NAME)
                write_text(os.path.join(design_dir, 'SKILL.md'),
                           f'---\nname: uclusion-design\n---\n{INSTALL.RETIRED_DESIGN_SKILL_MARKER}\n'
                           f'Old design role\n{INSTALL.RETIRED_DESIGN_SKILL_END_MARKER}\n')
                write_text(os.path.join(design_dir, 'agents', 'openai.yaml'), 'interface: {}\n')
                skill_dir = os.path.join(skills, 'uclusion')
                self.assertTrue(self.install(skill_dir, os.path.join(temp_dir, resident), client))
                self.assertFalse(os.path.lexists(design_dir))
                self.assertTrue(os.path.isfile(os.path.join(skill_dir, 'roles', 'design.md')))

    def test_install_leaves_an_unmarked_design_folder_untouched(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skills = os.path.join(temp_dir, '.claude', 'skills')
            design_dir = os.path.join(skills, INSTALL.RETIRED_DESIGN_SKILL_NAME)
            mine = '---\nname: uclusion-design\n---\nSomeone else\'s skill of the same name.\n'
            write_text(os.path.join(design_dir, 'SKILL.md'), mine)
            self.assertTrue(self.install(os.path.join(skills, 'uclusion'),
                                         os.path.join(temp_dir, 'CLAUDE.md'), 'claude'))
            self.assertEqual(mine, read_text(os.path.join(design_dir, 'SKILL.md')))
            self.assertEqual(('kept', design_dir),
                             INSTALL.remove_retired_design_skill(os.path.join(skills, 'uclusion')))

    def test_interrupted_design_install_leftovers_go_with_it(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skills = os.path.join(temp_dir, '.codex-skills')
            design_dir = os.path.join(skills, INSTALL.RETIRED_DESIGN_SKILL_NAME)
            marked = f'{INSTALL.RETIRED_DESIGN_SKILL_MARKER}\nx\n{INSTALL.RETIRED_DESIGN_SKILL_END_MARKER}\n'
            write_text(os.path.join(design_dir, 'SKILL.md'), marked)
            write_text(os.path.join(design_dir + INSTALL.WORKFLOW_STAGING_SUFFIX, 'SKILL.md'), marked)
            write_text(design_dir + INSTALL.WORKFLOW_TRANSACTION_SUFFIX, INSTALL.json.dumps(
                {'owner': INSTALL.WORKFLOW_TRANSACTION_OWNER, 'skillDir': design_dir}))
            self.assertEqual(('removed', design_dir),
                             INSTALL.remove_retired_design_skill(os.path.join(skills, 'uclusion'), report=False))
            for path in (design_dir, design_dir + INSTALL.WORKFLOW_STAGING_SUFFIX,
                         design_dir + INSTALL.WORKFLOW_TRANSACTION_SUFFIX):
                self.assertFalse(os.path.lexists(path), path)

    def test_each_client_registration_declares_its_description_type(self):
        self.assertEqual({'claude': 'on-demand', 'codex': 'whole-list', 'cursor': 'whole-list'},
                         INSTALL.TOOL_DESCRIPTION_TYPES)
        with tempfile.TemporaryDirectory() as temp_dir:
            for client, label, audit_client in (('claude', 'Claude Code', 'claude'),
                                                ('cursor', 'Cursor', None)):
                with self.subTest(client=client):
                    path = os.path.join(temp_dir, client + '.json')
                    INSTALL.register_mcp_json(path, label, 'workspace-1', 'stage', require_existing=False,
                                              token_audit_client=audit_client)
                    args = INSTALL.json.loads(read_text(path))['mcpServers']['uclusion']['args']
                    index = args.index('--tool-descriptions')
                    self.assertEqual(INSTALL.TOOL_DESCRIPTION_TYPES[client], args[index + 1])
            block = INSTALL.build_codex_mcp_block('workspace-1', 'stage')
            self.assertIn('"--tool-descriptions",', block)
            self.assertIn('"whole-list",', block)
        with self.assertRaises(ValueError):
            INSTALL.runtime_mcp_descriptor('workspace-1', 'stage', tool_descriptions='everything')


class NativeSkillRoutingTests(unittest.TestCase):
    def setUp(self):
        handoff = mock.patch.object(INSTALL, 'configure_codex_handoff')
        self.handoff = handoff.start()
        self.addCleanup(handoff.stop)

    def common_install_patches(self, work_claims=False):
        return (
            mock.patch.object(INSTALL, 'write_uclusion_config', return_value=({
                'enabled': False,
                'port': 23456,
            }, work_claims)),
            mock.patch.object(INSTALL, 'register_mcp_json'),
            mock.patch.object(INSTALL, 'update_codex_integration_config'),
            mock.patch.object(INSTALL, 'remove_legacy_codex_hooks_config'),
            mock.patch.object(INSTALL, 'add_claude_permissions'),
            mock.patch.object(
                INSTALL,
                'configure_claude_token_audit',
                return_value={'source': None, 'managedEnv': {}},
            ),
            mock.patch.object(INSTALL, 'remove_cursor_poke_drain_hook'),
            mock.patch.object(INSTALL, 'install_skill_and_stub'),
            mock.patch.object(INSTALL, 'persist_workflow_install_state'),
            mock.patch.object(INSTALL, 'update_token_audit_client_config'),
            mock.patch.object(
                INSTALL,
                'effective_codex_instruction_path',
                side_effect=lambda scope, include_fallbacks=False: os.path.join(
                    scope, 'AGENTS.md'
                ),
            ),
        )

    def test_global_install_routes_each_client_to_its_native_skill_path(self):
        patches = self.common_install_patches()
        with patches[0], patches[1], patches[2], patches[3], patches[4], \
                patches[5], patches[6], patches[7] as install, patches[8], \
                patches[9], patches[10]:
            fetch_bundle = mock.Mock()
            INSTALL.install_global(
                'workspace', 'view', 'stage', fetch_bundle,
                clients={'claude', 'cursor', 'codex'},
            )

        home = os.path.expanduser('~')
        self.handoff.assert_called_once_with()
        routed = {
            call.args[3]: (call.args[1], call.args[2])
            for call in install.call_args_list
        }
        self.assertEqual(
            {
                'claude': (
                    os.path.join(home, '.claude', 'skills', 'uclusion'),
                    os.path.join(home, '.claude', 'CLAUDE.md'),
                ),
                'cursor': (
                    os.path.join(home, '.cursor', 'skills', 'uclusion'),
                    os.path.join(home, '.cursor', 'rules', 'uclusion.mdc'),
                ),
                'codex': (
                    os.path.join(home, '.agents', 'skills', 'uclusion'),
                    os.path.join(home, '.codex', 'AGENTS.md'),
                ),
            },
            routed,
        )

    def test_saved_claim_setting_reaches_every_global_and_project_client(self):
        from contextlib import ExitStack

        for project in (False, True):
            for enabled in (False, True):
                with self.subTest(project=project, claims=enabled), \
                        tempfile.TemporaryDirectory() as directory, ExitStack() as stack:
                    patches = [stack.enter_context(patch)
                               for patch in self.common_install_patches(enabled)]
                    arguments = ('workspace', 'view', 'stage', mock.Mock())
                    if project:
                        INSTALL.install_project_level(
                            *arguments, directory, clients={'claude', 'cursor', 'codex'},
                        )
                    else:
                        INSTALL.install_global(
                            *arguments, clients={'claude', 'cursor', 'codex'},
                        )
                    self.assertEqual({'claude', 'cursor', 'codex'},
                                     {call.args[3] for call in patches[7].call_args_list})
                    for call in patches[7].call_args_list:
                        self.assertIs(enabled, call.kwargs['work_claims'])

    def test_project_install_routes_each_client_to_its_native_skill_path(self):
        patches = self.common_install_patches()
        with tempfile.TemporaryDirectory() as project_dir:
            with patches[0], patches[1], patches[2], patches[3], patches[4], \
                    patches[5], patches[6], patches[7] as install, patches[8], \
                    patches[9], patches[10]:
                fetch_bundle = mock.Mock()
                INSTALL.install_project_level(
                    'workspace', 'view', 'stage', fetch_bundle, project_dir,
                    clients={'claude', 'cursor', 'codex'},
                )

            routed = {
                call.args[3]: (call.args[1], call.args[2])
                for call in install.call_args_list
            }
            self.assertEqual(
                {
                    'claude': (
                        os.path.join(
                            project_dir, '.claude', 'skills', 'uclusion'
                        ),
                        os.path.join(project_dir, 'CLAUDE.md'),
                    ),
                    'cursor': (
                        os.path.join(
                            project_dir, '.cursor', 'skills', 'uclusion'
                        ),
                        os.path.join(
                            project_dir, '.cursor', 'rules', 'uclusion.mdc'
                        ),
                    ),
                    'codex': (
                        os.path.join(
                            project_dir, '.agents', 'skills', 'uclusion'
                        ),
                        os.path.join(project_dir, 'AGENTS.md'),
                    ),
                },
                routed,
            )


class WorkClaimsReferenceTests(unittest.TestCase):
    def test_demo_installers_render_the_selected_claim_state(self):
        bundle = source_bundle()
        with tempfile.TemporaryDirectory() as directory, mock.patch.multiple(
            INSTALL, UCLUSION_HOME=os.path.join(directory, '.uclusion'),
        ), mock.patch.object(INSTALL, 'uclusion_home_root', return_value=directory):
            for enabled in (False, True):
                INSTALL.install_demo_plugin(lambda: bundle, work_claims=enabled)
                self.assert_claim_state(
                    os.path.join(INSTALL.demo_plugin_path(), 'skills', 'uclusion'), enabled,
                )
                INSTALL.install_demo_codex_workflow(lambda: bundle, work_claims=enabled)
                self.assert_claim_state(
                    os.path.join(directory, '.agents', 'skills', 'uclusion'), enabled,
                )

    def test_install_and_feature_changes_keep_each_scope_current_without_downloads(self):
        bundle = source_bundle()
        for project in (False, True):
            with self.subTest(project=project), tempfile.TemporaryDirectory() as directory:
                skill_dirs = {
                    client: os.path.join(directory, folder, 'skills', 'uclusion')
                    for client, folder in (
                        ('claude', '.claude'), ('cursor', '.cursor'), ('codex', '.agents')
                    )
                }
                config_path = os.path.join(directory, 'stage_uclusion.json')
                with mock.patch.multiple(
                    INSTALL,
                    UCLUSION_HOME=os.path.join(directory, '.uclusion'),
                    CLAUDE_SKILL_DIR=skill_dirs['claude'],
                    CURSOR_SKILL_DIR=skill_dirs['cursor'],
                    CODEX_SKILL_DIR=skill_dirs['codex'],
                    CLAUDE_JSON_PATH=os.path.join(directory, '.claude.json'),
                    CODEX_CONFIG_PATH=os.path.join(directory, '.codex', 'config.toml'),
                ), mock.patch.object(INSTALL, 'register_mcp_json'), \
                        mock.patch.object(INSTALL.urllib.request, 'urlopen') as download:
                    for enabled in (False, True):
                        for client, skill_dir in skill_dirs.items():
                            INSTALL.install_skill_and_stub(
                                lambda: bundle, skill_dir,
                                os.path.join(directory, client + '.md'), client, client,
                                assume_yes=True, work_claims=enabled,
                            )
                            self.assert_claim_state(skill_dir, enabled)
                    for enabled in (False, True, False):
                        write_text(config_path, INSTALL.json.dumps({
                            'workspaceId': 'workspace', 'workClaims': enabled,
                        }))
                        INSTALL.reapply_saved_feature_surfaces(
                            'stage', config_path, set(skill_dirs),
                            project_dir=directory if project else None,
                        )
                        for skill_dir in skill_dirs.values():
                            self.assert_claim_state(skill_dir, enabled)
                    download.assert_not_called()
        # Rendering one client's choice must not alter the shared release bundle.
        self.assertEqual(source_bundle(), bundle)

    def assert_claim_state(self, skill_dir, enabled):
        content = read_text(os.path.join(skill_dir, 'references', 'claims.md'))
        self.assertNotIn(INSTALL.WORKFLOW_CLAIMS_PLACEHOLDER, content)
        self.assertIn('Claims are enabled.' if enabled else 'Claims are not enabled.', content)
        self.assertEqual(enabled, 'claims-enabled.md' in content)
        if enabled:
            self.assertTrue(os.path.isfile(os.path.join(
                skill_dir, 'references', 'claims-enabled.md',
            )))


class InstallerWorkflowStateTests(unittest.TestCase):
    def test_codex_handoff_failure_keeps_install_pending(self):
        with tempfile.TemporaryDirectory() as project:
            config_path = os.path.join(project, 'stage_uclusion.json')
            write_text(config_path, '{"workspaceId":"workspace",'
                       '"workflowReinstallVersion":"release-old"}\n')
            with mock.patch.object(INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(project, 'locks')), \
                    mock.patch.object(INSTALL, 'install_skill_and_stub', return_value=True), \
                    mock.patch.object(INSTALL, 'update_codex_integration_config'), \
                    mock.patch.object(INSTALL, 'remove_legacy_codex_hooks_config'), \
                    mock.patch.object(INSTALL, 'configure_codex_handoff',
                                      side_effect=RuntimeError('hook trust unavailable')):
                with self.assertRaisesRegex(RuntimeError, 'hook trust unavailable'):
                    INSTALL.install_project_level('workspace', 'view', 'stage', mock.Mock(),
                                                  project, clients={'codex'}, script_version='release-new')
            config = INSTALL.json.loads(read_text(config_path))
            self.assertEqual('release-old', config['workflowReinstallVersion'])
            self.assertEqual(['codex'], config['workflowInstallPending'])

    def installer_patches(self):
        return (
            mock.patch.object(INSTALL, 'register_mcp_json'),
            mock.patch.object(INSTALL, 'add_claude_permissions'),
            mock.patch.object(
                INSTALL,
                'configure_claude_token_audit',
                return_value={'source': None, 'managedEnv': {}},
            ),
        )

    def test_project_failure_keeps_prior_stamp_and_pending_client(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            config_path = os.path.join(project_dir, 'stage_uclusion.json')
            write_text(
                config_path,
                '{"workspaceId":"workspace","workflowReinstallVersion":'
                '"release-old","workflowClients":["cursor"]}\n',
            )
            patches = self.installer_patches()
            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(temp_dir, 'locks')
            ), patches[0], patches[1], patches[2], mock.patch.object(
                INSTALL,
                'install_skill_and_stub',
                side_effect=OSError('skill disk full'),
            ), mock.patch.object(
                INSTALL, 'remove_legacy_codex_hooks_config'
            ) as cleanup:
                with self.assertRaisesRegex(RuntimeError, 'skill disk full'):
                    INSTALL.install_project_level(
                        'workspace', 'view', 'stage', mock.Mock(), project_dir,
                        clients={'codex'}, script_version='release-new',
                    )

            with open(config_path, encoding='utf-8') as source:
                config = INSTALL.json.load(source)
            self.assertEqual('release-old', config['workflowReinstallVersion'])
            self.assertEqual(['codex', 'cursor'], config['workflowClients'])
            self.assertEqual(['codex'], config['workflowInstallPending'])
            cleanup.assert_not_called()

    def test_pending_state_precedes_first_selected_client_mutation(self):
        observed = []
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            config_path = os.path.join(project_dir, 'stage_uclusion.json')

            def inspect_pending(*_args, **_kwargs):
                with open(config_path, encoding='utf-8') as source:
                    config = INSTALL.json.load(source)
                observed.append(config.get('workflowInstallPending'))
                return True

            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(temp_dir, 'locks')
            ), mock.patch.object(
                INSTALL, 'register_mcp_json', side_effect=inspect_pending
            ), mock.patch.object(
                INSTALL, 'install_skill_and_stub', return_value=False
            ), mock.patch.object(
                INSTALL, 'remove_cursor_poke_drain_hook'
            ) as hook:
                with self.assertRaisesRegex(
                    RuntimeError,
                    'cursor: selected workflow did not install',
                ):
                    INSTALL.install_project_level(
                        'workspace', 'view', 'stage', mock.Mock(), project_dir,
                        clients={'cursor'}, script_version='release-new',
                    )

        self.assertEqual([['cursor']], observed)
        hook.assert_not_called()

    def test_project_aggregate_success_stamps_and_clears_pending(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            patches = self.installer_patches()
            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(temp_dir, 'locks')
            ), patches[0], patches[1], patches[2], mock.patch.object(
                INSTALL, 'install_skill_and_stub', return_value=True
            ), mock.patch.object(INSTALL, 'remove_cursor_poke_drain_hook'), \
                    mock.patch.object(
                        INSTALL, 'remove_legacy_codex_hooks_config'
                    ), mock.patch.object(
                        INSTALL, 'configure_codex_handoff'
                    ):
                INSTALL.install_project_level(
                    'workspace', 'view', 'stage', mock.Mock(), project_dir,
                    clients={'codex', 'cursor'}, script_version='release-new',
                )

            config_path = os.path.join(project_dir, 'stage_uclusion.json')
            with open(config_path, encoding='utf-8') as source:
                config = INSTALL.json.load(source)
            self.assertEqual('release-new', config['workflowReinstallVersion'])
            self.assertEqual(['codex', 'cursor'], config['workflowClients'])
            self.assertNotIn('workflowInstallPending', config)

    def test_cursor_hook_cleanup_runs_only_after_workflow_success(self):
        events = []
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            patches = self.installer_patches()
            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(temp_dir, 'locks')
            ), patches[0], patches[1], patches[2], mock.patch.object(
                INSTALL,
                'install_skill_and_stub',
                side_effect=lambda *_args, **_kwargs: events.append('workflow') or True,
            ), mock.patch.object(
                INSTALL,
                'remove_cursor_poke_drain_hook',
                side_effect=lambda *_args, **_kwargs: events.append('cleanup') or True,
            ):
                INSTALL.install_project_level(
                    'workspace', 'view', 'stage', mock.Mock(), project_dir,
                    clients={'cursor'}, script_version='release-new',
                )
        self.assertEqual(['workflow', 'cleanup'], events)

    def test_user_decline_is_a_skip_not_an_operational_failure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion.json')
            INSTALL.write_uclusion_config('workspace', None, config_path)
            results = INSTALL.finish_workflow_installs(
                config_path, {'codex': False}, [], 'release-new'
            )
            with open(config_path, encoding='utf-8') as source:
                config = INSTALL.json.load(source)
        self.assertEqual({'codex': False}, results)
        self.assertNotIn('workflowReinstallVersion', config)
        self.assertEqual(['codex'], config['workflowInstallPending'])

    def test_partial_skip_does_not_stamp_successful_client_as_current(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            config_path = os.path.join(temp_dir, 'uclusion.json')
            write_text(
                config_path,
                '{"workspaceId":"workspace","workflowReinstallVersion":'
                '"release-old","workflowClients":["codex"]}\n',
            )

            results = INSTALL.finish_workflow_installs(
                config_path,
                {'codex': True, 'cursor': False},
                [],
                'release-new',
            )

            with open(config_path, encoding='utf-8') as source:
                config = INSTALL.json.load(source)
        self.assertEqual({'codex': True, 'cursor': False}, results)
        self.assertEqual('release-old', config['workflowReinstallVersion'])
        self.assertEqual(['codex'], config['workflowClients'])
        self.assertEqual(['cursor'], config['workflowInstallPending'])

    def test_noninteractive_false_result_is_an_operational_failure(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            project_dir = os.path.join(temp_dir, 'project')
            os.makedirs(project_dir)
            config_path = os.path.join(project_dir, 'stage_uclusion.json')
            with mock.patch.object(
                INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(temp_dir, 'locks')
            ), mock.patch.object(
                INSTALL, 'register_mcp_json'
            ), mock.patch.object(
                INSTALL, 'install_skill_and_stub', return_value=False
            ), mock.patch.object(
                INSTALL, 'remove_cursor_poke_drain_hook'
            ) as hook:
                with self.assertRaisesRegex(
                    RuntimeError,
                    'cursor: selected workflow did not install',
                ):
                    INSTALL.install_project_level(
                        'workspace', 'view', 'stage', mock.Mock(), project_dir,
                        clients={'cursor'}, script_version='release-new',
                    )

            with open(config_path, encoding='utf-8') as source:
                config = INSTALL.json.load(source)
        self.assertEqual(['cursor'], config['workflowClients'])
        self.assertEqual(['cursor'], config['workflowInstallPending'])
        self.assertNotIn('workflowReinstallVersion', config)
        hook.assert_not_called()


class CodexInstructionSelectionTests(unittest.TestCase):
    def test_first_nonempty_override_precedes_agents(self):
        with tempfile.TemporaryDirectory() as scope:
            override = os.path.join(scope, 'AGENTS.override.md')
            agents = os.path.join(scope, 'AGENTS.md')
            write_text(override, '# Override\n')
            write_text(agents, '# Agents\n')
            self.assertEqual(
                override,
                INSTALL.effective_codex_instruction_path(scope),
            )

    def test_empty_override_falls_through_to_agents(self):
        with tempfile.TemporaryDirectory() as scope:
            override = os.path.join(scope, 'AGENTS.override.md')
            agents = os.path.join(scope, 'AGENTS.md')
            write_text(override, '  \n')
            write_text(agents, '# Agents\n')
            self.assertEqual(
                agents,
                INSTALL.effective_codex_instruction_path(scope),
            )

    def test_project_uses_configured_nonempty_fallback(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            scope = os.path.join(temp_dir, 'project')
            config_path = os.path.join(temp_dir, 'codex', 'config.toml')
            fallback = os.path.join(scope, 'TEAM_GUIDE.md')
            write_text(
                config_path,
                'project_doc_fallback_filenames = ["TEAM_GUIDE.md"]\n',
            )
            write_text(fallback, '# Team guide\n')
            with mock.patch.object(INSTALL, 'CODEX_CONFIG_PATH', config_path):
                self.assertEqual(
                    fallback,
                    INSTALL.effective_codex_instruction_path(
                        scope, include_fallbacks=True
                    ),
                )

    def test_global_and_project_installs_route_to_effective_files(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            codex_home = os.path.join(temp_dir, 'codex')
            global_override = os.path.join(codex_home, 'AGENTS.override.md')
            project_dir = os.path.join(temp_dir, 'project')
            project_override = os.path.join(project_dir, 'AGENTS.override.md')
            write_text(global_override, '# Global override\n')
            write_text(project_override, '# Project override\n')
            routed = []

            def install(_fetch, _skill, resident, client, *_args, **_kwargs):
                routed.append((client, resident))
                return True

            with mock.patch.object(INSTALL, 'UCLUSION_HOME', os.path.join(
                temp_dir, 'uclusion'
            )), mock.patch.object(INSTALL, 'CODEX_HOME', codex_home), \
                    mock.patch.object(
                        INSTALL, 'CODEX_SKILL_DIR', os.path.join(
                            temp_dir, '.agents', 'skills', 'uclusion'
                        )
                    ), mock.patch.object(
                        INSTALL, 'CODEX_CONFIG_PATH', os.path.join(
                            codex_home, 'config.toml'
                        )
                    ), mock.patch.object(
                        INSTALL, 'SCRIPT_INSTALL_PREFIX', os.path.join(
                            temp_dir, 'locks'
                        )
                    ), mock.patch.object(
                        INSTALL, 'install_skill_and_stub', side_effect=install
                    ), mock.patch.object(
                        INSTALL, 'update_codex_integration_config'
                    ), mock.patch.object(
                        INSTALL, 'remove_legacy_codex_hooks_config'
                    ), mock.patch.object(
                        INSTALL, 'configure_codex_handoff'
                    ):
                INSTALL.install_global(
                    'workspace', 'view', 'stage', mock.Mock(),
                    clients={'codex'}, script_version='release-new',
                )
                INSTALL.install_project_level(
                    'workspace', 'view', 'stage', mock.Mock(), project_dir,
                    clients={'codex'}, script_version='release-new',
                )

        self.assertEqual(
            [('codex', global_override), ('codex', project_override)],
            routed,
        )


class InstallerEnvironmentRootTests(unittest.TestCase):
    def test_import_honors_codex_and_claude_config_roots(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            home = os.path.join(temp_dir, 'home')
            codex_home = os.path.join(temp_dir, 'codex-profile')
            claude_home = os.path.join(temp_dir, 'claude-profile')
            with mock.patch.dict(
                os.environ,
                {
                    'HOME': home,
                    'CODEX_HOME': codex_home,
                    'CLAUDE_CONFIG_DIR': claude_home,
                },
            ):
                module = load_module(
                    'uclusion_install_custom_roots_under_test', INSTALL_PATH
                )
        self.assertEqual(codex_home, module.CODEX_HOME)
        self.assertEqual(
            os.path.join(codex_home, 'AGENTS.md'), module.CODEX_AGENTS_MD_PATH
        )
        self.assertEqual(
            os.path.join(claude_home, 'CLAUDE.md'), module.CLAUDE_MD_PATH
        )
        self.assertEqual(
            os.path.join(claude_home, 'skills', 'uclusion'),
            module.CLAUDE_SKILL_DIR,
        )


class InstallerPrefetchTests(unittest.TestCase):
    def test_noninteractive_bundle_failure_precedes_script_and_config_mutation(self):
        failing_fetch = mock.Mock(side_effect=RuntimeError('mixed release'))
        with mock.patch.object(
            INSTALL.sys,
            'argv',
            [
                'uclusionInstall', 'stage', 'workspace', 'view',
                '--clients', 'codex',
            ],
        ), mock.patch.object(
            INSTALL, 'make_workflow_bundle_fetcher', return_value=failing_fetch
        ), mock.patch.object(INSTALL, 'install_scripts') as scripts, \
                mock.patch.object(INSTALL, 'install_global') as configure, \
                mock.patch.object(
                    INSTALL, 'fetch_script_reinstall_version'
                ) as release:
            result = INSTALL.main()

        self.assertEqual(1, result)
        failing_fetch.assert_called_once_with()
        scripts.assert_not_called()
        configure.assert_not_called()
        release.assert_not_called()


class ManagedSkillDetectionTests(unittest.TestCase):
    def test_global_detection_recognizes_each_managed_native_skill(self):
        managed_skill = read_text(SKILL_SOURCE_PATH)
        with tempfile.TemporaryDirectory() as home:
            write_text(
                os.path.join(home, '.claude', 'skills', 'uclusion', 'SKILL.md'),
                managed_skill,
            )
            write_text(
                os.path.join(home, '.cursor', 'skills', 'uclusion', 'SKILL.md'),
                managed_skill,
            )
            write_text(
                os.path.join(home, '.agents', 'skills', 'uclusion', 'SKILL.md'),
                managed_skill,
            )
            with mock.patch.dict(os.environ, {'HOME': home}):
                self.assertEqual(
                    {'claude', 'cursor', 'codex'},
                    CLI.detect_global_clients(),
                )

    def test_project_detection_recognizes_each_managed_native_skill(self):
        managed_skill = read_text(SKILL_SOURCE_PATH)
        with tempfile.TemporaryDirectory() as project_dir:
            write_text(os.path.join(
                project_dir, '.claude', 'skills', 'uclusion', 'SKILL.md'
            ), managed_skill)
            write_text(os.path.join(
                project_dir, '.cursor', 'skills', 'uclusion', 'SKILL.md'
            ), managed_skill)
            write_text(os.path.join(
                project_dir, '.agents', 'skills', 'uclusion', 'SKILL.md'
            ), managed_skill)

            self.assertEqual(
                {'claude', 'cursor', 'codex'},
                CLI.detect_project_clients(project_dir),
            )

    def test_unmarked_lookalike_skill_does_not_count_as_managed(self):
        lookalike = '---\nname: uclusion\ndescription: unrelated\n---\n'
        with tempfile.TemporaryDirectory() as project_dir:
            for client_dir in ('.claude', '.cursor', '.agents'):
                write_text(os.path.join(
                    project_dir, client_dir, 'skills', 'uclusion', 'SKILL.md'
                ), lookalike)

            self.assertEqual(set(), CLI.detect_project_clients(project_dir))


if __name__ == '__main__':
    unittest.main()
