import io
import sys
import unittest
import urllib.error
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

SCRIPTS_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS_DIR))

import uclusionCLI as cli


CREDENTIALS = {'api_url': 'stage.example.com', 'api_token': 'token'}
EMPTY_LIST_RESPONSE = {'market_investibles': [], 'comments': []}


class ExportListRetryTestCase(unittest.TestCase):
    """S-all-174: the opening export_list call retries transient failures."""

    def setUp(self):
        patcher = mock.patch.object(cli.time, 'sleep')
        self.sleep = patcher.start()
        self.addCleanup(patcher.stop)

    def test_transient_failure_retries_and_succeeds(self):
        send = mock.patch.object(
            cli, 'send', side_effect=[None, EMPTY_LIST_RESPONSE]
        ).start()
        self.addCleanup(mock.patch.stopall)
        with redirect_stdout(io.StringIO()):
            content = cli.fetch_workspace_export(CREDENTIALS)
        self.assertIsNotNone(content)
        self.assertEqual(2, send.call_count)

    def test_gives_up_after_three_attempts(self):
        send = mock.patch.object(cli, 'send', return_value=None).start()
        self.addCleanup(mock.patch.stopall)
        with redirect_stdout(io.StringIO()):
            content = cli.fetch_workspace_export(CREDENTIALS)
        self.assertIsNone(content)
        self.assertEqual(3, send.call_count)


class LastSendErrorTestCase(unittest.TestCase):
    """S-all-174: send() records why it failed so failure lines can show it."""

    def test_http_error_records_status_and_reason(self):
        error = urllib.error.HTTPError(
            'https://summaries.stage.example.com/export_list', 504,
            'Gateway Timeout', {}, None
        )
        with mock.patch.object(cli.urllib.request, 'urlopen', side_effect=error):
            with redirect_stdout(io.StringIO()):
                result = cli.send(None, 'GET', 'https://x.example.com')
        self.assertIsNone(result)
        self.assertEqual('HTTP 504 Gateway Timeout', cli.last_send_error)

    def test_success_clears_previous_error(self):
        response = mock.MagicMock()
        response.status = 200
        response.read.return_value = b'{"ok": true}'
        response.__enter__ = mock.Mock(return_value=response)
        response.__exit__ = mock.Mock(return_value=False)
        cli.last_send_error = 'HTTP 504 Gateway Timeout'
        with mock.patch.object(cli.urllib.request, 'urlopen', return_value=response):
            result = cli.send(None, 'GET', 'https://x.example.com')
        self.assertEqual({'ok': True}, result)
        self.assertIsNone(cli.last_send_error)

    def test_fetch_failed_line_names_the_cause(self):
        config = {'uclusionMDFileType': 'export',
                  'uclusionMDFolderPath': '/tmp/does-not-matter'}
        credentials = dict(CREDENTIALS, workspace_id='w1')
        with mock.patch.object(cli, 'fetch_workspace_export', return_value=None):
            cli.last_send_error = 'HTTP 504 Gateway Timeout'
            output = io.StringIO()
            with redirect_stdout(output):
                cli.write_uclusion_md(config, credentials, None, None)
        self.assertIn('Fetch failed (HTTP 504 Gateway Timeout)', output.getvalue())


if __name__ == '__main__':
    unittest.main()


class ExportFormatVersionTestCase(unittest.TestCase):
    """J-all-376: a renderer format change discards cached sections via the format marker."""

    def _write(self, content):
        import tempfile, os
        handle, path = tempfile.mkstemp(suffix='.md')
        with os.fdopen(handle, 'w', encoding='utf-8') as export_file:
            export_file.write(content)
        self.addCleanup(os.remove, path)
        return path

    def test_current_format_marker_parses_sections(self):
        content = (cli.EXPORT_FORMAT_MARKER
                   + cli.make_export_marker('comment', 'c1', 'stamp1')
                   + 'section text\n')
        sections = cli.parse_export_sections(self._write(content))
        self.assertEqual({('comment', 'c1'): ('stamp1', 'section text\n')}, sections)

    def test_missing_format_marker_forces_full_rebuild(self):
        content = (cli.make_export_marker('comment', 'c1', 'stamp1')
                   + 'section rendered the old way\n')
        self.assertIsNone(cli.parse_export_sections(self._write(content)))

    def test_older_format_version_forces_full_rebuild(self):
        content = ('<!-- uclusion:format:1 -->\n'
                   + cli.make_export_marker('comment', 'c1', 'stamp1')
                   + 'section rendered the old way\n')
        self.assertIsNone(cli.parse_export_sections(self._write(content)))

    def test_incremental_build_output_carries_format_marker_and_legend(self):
        with mock.patch.object(cli, 'send', return_value=EMPTY_LIST_RESPONSE):
            content = cli.fetch_workspace_export(CREDENTIALS)
        self.assertTrue(content.startswith(cli.EXPORT_FORMAT_MARKER + cli.EXPORT_LEGEND))
        self.assertIn('(updated YYYY-MM-DD)', cli.EXPORT_LEGEND)
        self.assertIn('UTC', cli.EXPORT_LEGEND)
