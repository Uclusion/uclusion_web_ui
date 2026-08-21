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
OPENAI_METADATA_PATH = os.path.join(
    SKILL_SOURCE_DIR, 'agents', 'openai.yaml'
)


def load_module(module_name, path):
    spec = importlib.util.spec_from_file_location(module_name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


INSTALL = load_module('uclusion_install_skills_under_test', INSTALL_PATH)
CLI = load_module('uclusion_cli_skill_detection_under_test', CLI_PATH)


def read_text(path):
    with open(path, encoding='utf-8') as source:
        return source.read()


def write_text(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as target:
        target.write(content)


def parse_skill_frontmatter(content):
    """Parse the deliberately tiny, scalar-only SKILL.md frontmatter."""
    if not content.startswith('---\n'):
        raise AssertionError('SKILL.md must begin with YAML frontmatter')
    try:
        closing = content.index('\n---\n', 4)
    except ValueError as error:
        raise AssertionError('SKILL.md frontmatter is not closed') from error

    result = {}
    for line in content[4:closing].splitlines():
        match = re.fullmatch(r'([a-z_]+):\s*(.+)', line)
        if match is None:
            raise AssertionError(
                f'SKILL.md frontmatter must use scalar key/value lines: {line!r}'
            )
        key, value = match.groups()
        if key in result:
            raise AssertionError(f'duplicate SKILL.md frontmatter key: {key}')
        result[key] = value.strip().strip('"\'')
    return result, content[closing + len('\n---\n'):]


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
            result[normalized[len(prefix):]] = bundle[key]
    return result


class SkillPackageContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.skill = read_text(SKILL_SOURCE_PATH)
        cls.frontmatter, cls.body = parse_skill_frontmatter(cls.skill)

    def test_skill_has_minimal_valid_frontmatter_and_trigger_description(self):
        self.assertEqual({'name', 'description'}, set(self.frontmatter))
        self.assertEqual('uclusion', self.frontmatter['name'])

        description = self.frontmatter['description']
        self.assertLessEqual(len(description), 1024)
        self.assertIn('Uclusion', description)
        self.assertRegex(description, r'Poke AI|Poke events?')
        self.assertRegex(description, r'short codes?|J-\*')
        self.assertNotRegex(self.skill, r'(?i)\bTODO\b|\[TODO')

    def test_skill_entrypoint_is_small_and_routes_to_one_level_references(self):
        # Codex skill-authoring guidance keeps SKILL.md below 500 lines and
        # roughly 5,000 words.  The complete protocol belongs in references so
        # it is loaded only after the skill has triggered.
        self.assertLessEqual(len(self.skill.splitlines()), 500)
        self.assertLessEqual(len(re.findall(r'\S+', self.skill)), 5000)
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
        for relative_path in references:
            self.assertNotIn('..', relative_path.split('/'))
            self.assertEqual(2, len(relative_path.split('/')))
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

    def test_skill_package_does_not_capture_workspace_specific_short_codes(self):
        # Product docs use wildcard forms (for example J-*).  A concrete code
        # would accidentally couple every installation to the workspace where
        # the package was authored.
        concrete_code = re.compile(
            r'\b(?:J|T|B|Q|S|O|I|R|C)-[A-Za-z0-9][A-Za-z0-9_-]*-\d+\b'
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

    def test_openai_metadata_explicitly_invokes_the_skill(self):
        metadata = read_text(OPENAI_METADATA_PATH)
        self.assertIn('display_name: "Uclusion"', metadata)
        self.assertRegex(
            metadata,
            r'(?m)^\s*short_description:\s*"[^"\n]{25,64}"\s*$',
        )
        self.assertRegex(
            metadata,
            r'(?m)^\s*default_prompt:\s*"[^"]*\$uclusion[^"]*"\s*$',
        )
        self.assertRegex(
            metadata,
            r'(?m)^\s*allow_implicit_invocation:\s*true\s*$',
        )
        self.assertNotRegex(metadata, r'(?i)\bTODO\b|\[TODO')


class ResidentStubContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bundle = source_bundle()

    def test_each_client_stub_is_small_and_activates_the_workflow_skill(self):
        expected_stub_keys = {
            'claude_stub',
            'codex_stub',
            'cursor_stub',
        }
        self.assertTrue(expected_stub_keys.issubset(self.bundle))

        for key in sorted(expected_stub_keys):
            with self.subTest(client=key):
                stub = self.bundle[key]
                self.assertLessEqual(len(stub.encode('utf-8')), 4096)
                self.assertEqual(1, stub.count(INSTALL.CLAUDE_MD_MARKER))
                self.assertEqual(1, stub.count(INSTALL.CLAUDE_MD_END_MARKER))
                self.assertIn('uclusion', stub.casefold())
                self.assertRegex(stub, r'\$uclusion|/uclusion')
                self.assertIn('Poke', stub)
                for verb in ('Start', 'Added', 'Updated', 'Responded'):
                    self.assertIn(verb, stub)
                for prefix in ('J-', 'T-', 'B-', 'Q-', 'S-', 'O-', 'I-', 'R-', 'C-'):
                    self.assertIn(prefix, stub)
                self.assertIn('find_work', stub)
                self.assertIn(
                    INSTALL.WORKFLOW_ENV_PLACEHOLDER + ' update', stub
                )

    def test_codex_stub_distinguishes_bridge_delivery_from_bare_drain(self):
        stub = self.bundle['codex_stub']
        self.assertIn('UCLUSION_CODEX_BRIDGE_ACTIVE', stub)
        self.assertIn('wait --timeout 0', stub)
        self.assertRegex(stub, r'(?i)never[^\n]*(?:wait|listen)')


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
        bundle['claude_stub'] = bundle['claude_stub'].replace(
            'Uclusion bootstrap', 'Uclusion  bootstrap', 1
        )
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

    def test_real_fetcher_renders_exact_environment_only_in_resident_stub(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            skill_dir = os.path.join(temp_dir, 'skills', 'uclusion')
            resident_path = os.path.join(temp_dir, 'AGENTS.md')

            def fetch_bundle():
                return self.bundle

            fetch_bundle.workflow_environment = 'stage'
            result = INSTALL.install_skill_and_stub(
                fetch_bundle,
                skill_dir,
                resident_path,
                'codex',
                'Codex',
                assume_yes=True,
            )

            self.assertTrue(result)
            resident = read_text(resident_path)
            self.assertNotIn(INSTALL.WORKFLOW_ENV_PLACEHOLDER, resident)
            self.assertIn('uclusion -e stage wait --timeout 0', resident)
            self.assertIn('uclusion -e stage update', resident)
            self.assertEqual(
                self.bundle['skill'],
                read_text(os.path.join(skill_dir, 'SKILL.md')),
            )

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
            original_inode = os.stat(skill_dir).st_ino
            original_resident = read_text(resident_path)

            with mock.patch.object(
                INSTALL, 'atomic_write_text', side_effect=OSError('resident full')
            ):
                with self.assertRaisesRegex(OSError, 'resident full'):
                    self.install(skill_dir, resident_path)

            self.assertEqual(original_inode, os.stat(skill_dir).st_ino)
            self.assertEqual('keep me\n', read_text(extra_path))
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

            self.install(skill_dir, resident_path)

            self.assertEqual('keep me\n', read_text(extra_path))

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
                os.path.join(skill_dir, 'linked.md'),
            )
            original_resident = read_text(resident_path)

            with self.assertRaisesRegex(RuntimeError, 'is a symlink'):
                self.install(skill_dir, resident_path)

            self.assertTrue(os.path.islink(os.path.join(skill_dir, 'linked.md')))
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
            resident_target = INSTALL._codex_config_write_target(resident_path)
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
            resident_target = INSTALL._codex_config_write_target(resident_path)
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
            resident_target = INSTALL._codex_config_write_target(resident_path)
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


class NativeSkillRoutingTests(unittest.TestCase):
    def common_install_patches(self):
        return (
            mock.patch.object(INSTALL, 'write_uclusion_config', return_value=({
                'enabled': False,
                'port': 23456,
            }, False)),
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


class InstallerWorkflowStateTests(unittest.TestCase):
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
