import io
import os
import re
import sys
import tempfile
import unittest
import urllib.error
import urllib.parse
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


# Sections produced by the current server renderer: md_utils.report_jobs and
# report_comments called with stamps=True and include_dates=True, as the export
# handler calls them. The renderer is not imported here; this is its output for
# fictional work. J-example-1 is Doable with an open issue, a resolved issue and
# a question whose option has an open and a resolved issue. J-example-2 is
# Reviewable with an open issue, J-example-3 is Skippable and J-example-4 is in
# Requires Input. B-example-1 is a critical bug whose first body line is longer
# than 80 characters, B-example-2 a resolved bug, R-example-1 a view note,
# B-example-3 a minor bug whose body starts after a blank paragraph, and
# B-example-4 a bug with an empty body.
RENDERED_SECTIONS = {
    'marketInvestible': [
        ('job-1', '1111111111',
            '#### From authoritative human:\n'
            '## Job J-example-1<a name="j-example-1"></a> (updated 2026-01-02)\n'
            '### Add the export index\n'
            'Job description.\n'
            '\n'
            '\n'
            'This job is in stage Doable.\n'
            '#### Tasks \n'
            '#### From authoritative human:\n'
            '#### Task T-example-1<a name="t-example-1"></a>  (updated 2026-01-02) \n'
            'Write the parser.\n'
            '\n'
            '#### Assistance \n'
            '#### From authoritative human:\n'
            '#### Issue I-example-1<a name="i-example-1"></a>  (updated 2026-01-02) \n'
            'Waiting on the API key.\n'
            '\n'
            'Second paragraph.\n'
            '\n'
            '#### From authoritative human:\n'
            '#### Question Q-example-1<a name="q-example-1"></a>  (updated 2026-01-02) \n'
            'Which approach should the job take?\n'
            '\n'
            '#### From authoritative human:\n'
            '#### Option Q-example-1_O-1<a name="q-example-1_o-1"></a> (updated '
            '2026-01-02)\n'
            '#### Use the first approach\n'
            'Job description.\n'
            '\n'
            '\n'
            'This option is in stage Proposed.\n'
            '#### From authoritative human:\n'
            '##### Issue Q-example-1_I-1<a name="q-example-1_i-1"></a> (under option '
            'Q-example-1_O-1) (updated 2026-01-02) \n'
            'Option issue does not block the job.\n'
            '\n'
            '#### Resolved \n'
            '#### From authoritative human:\n'
            '#### Resolved Issue Q-example-1_I-2<a name="q-example-1_i-2"></a>  (updated '
            '2026-01-02) \n'
            'Resolved option issue.\n'
            '\n'
            '#### Resolved \n'
            '#### From authoritative human:\n'
            '#### Resolved Issue I-example-2<a name="i-example-2"></a>  (updated '
            '2026-01-02) \n'
            'Resolved blocker.\n'
            '\n'),
        ('job-2', '111',
            '#### From authoritative human:\n'
            '## Job J-example-2<a name="j-example-2"></a> (updated 2026-01-02)\n'
            '### Finished job with a blocker\n'
            'Job description.\n'
            '\n'
            '\n'
            'This job is in stage Reviewable.\n'
            '#### Assistance \n'
            '#### From authoritative human:\n'
            '#### Issue I-example-3<a name="i-example-3"></a>  (updated 2026-01-02) \n'
            'Blocker on a finished job.\n'
            '\n'),
        ('job-3', '11',
            '#### From authoritative human:\n'
            '## Job J-example-3<a name="j-example-3"></a> (updated 2026-01-02)\n'
            '### Skipped job\n'
            'Job description.\n'
            '\n'
            '\n'
            'This job is in stage Skippable.\n'),
        ('job-4', '11',
            '#### From authoritative human:\n'
            '## Job J-example-4<a name="j-example-4"></a> (updated 2026-01-02)\n'
            '### Choose a storage format\n'
            'Job description.\n'
            '\n'
            '\n'
            'This job is in stage Requires Input.\n'
            '\n'
            'This stage locks execution: respond to the open assistance below and do no '
            'implementation work until the job returns to Doable or Reviewable.\n'),
    ],
    'comment': [
        ('bug-1', '11',
            '#### From authoritative human:\n'
            '#### Bug B-example-1<a name="b-example-1"></a>  (updated 2026-01-02) \n'
            'Priority: critical (RED).\n'
            'The export crashes when a view has no jobs and the index builder reads past '
            'the end of the section list. It happens every time.\n'
            '\n'
            'More detail.\n'
            '\n'
            '##### From authoritative human:\n'
            '> ##### Reply C-example-1<a name="c-example-1"></a> to B-example-1 (updated '
            '2026-01-03) \n'
            'A reply.\n'
            '\n'),
        ('bug-2', '1',
            '#### From authoritative human:\n'
            '#### Resolved Bug B-example-2<a name="b-example-2"></a>  (updated '
            '2026-01-02) \n'
            'Priority: normal (YELLOW).\n'
            'Fixed bug.\n'
            '\n'),
        ('note-1', '1',
            '#### From authoritative human:\n'
            '#### Note R-example-1<a name="r-example-1"></a>  (updated 2026-01-02) \n'
            'A view note.\n'
            '\n'),
        ('bug-3', '1',
            '#### From authoritative human:\n'
            '#### Bug B-example-3<a name="b-example-3"></a>  (updated 2026-01-02) \n'
            'Priority: minor (BLUE).\n'
            'Minor bug after a blank line.\n'
            '\n'),
        ('bug-4', '1',
            '#### From authoritative human:\n'
            '#### Bug B-example-4<a name="b-example-4"></a>  (updated 2026-01-02) \n'
            'Priority: normal (YELLOW).\n'
            '\n'),
    ],
}
# B-example-3 rendered again after it was resolved, with its new stamp.
RESOLVED_BUG_3 = (
    'bug-3', '2',
    '#### From authoritative human:\n'
    '#### Resolved Bug B-example-3<a name="b-example-3"></a>  (updated '
    '2026-01-02) \n'
    'Priority: minor (BLUE).\n'
    'Minor bug after a blank line.\n'
    '\n')
# J-example-1 rendered with U+2028 inside its name and its issue body. Python's
# str.splitlines() breaks lines there, but grep -n and sed -n do not.
SEPARATOR_JOB_1 = (
    'job-1', '111',
    '#### From authoritative human:\n'
    '## Job J-example-1<a name="j-example-1"></a> (updated 2026-01-02)\n'
    '### Add the export\u2028index\n'
    'Job description.\n'
    '\n'
    '\n'
    'This job is in stage Doable.\n'
    '#### Assistance \n'
    '#### From authoritative human:\n'
    '#### Issue I-example-1<a name="i-example-1"></a>  (updated 2026-01-02) \n'
    'Waiting on\u2028the API key.\n'
    '\n'
    'Second paragraph.\n'
    '\n')


class FakeExportServer:
    """Serves export_list and format=json section fetches from rendered sections."""

    def __init__(self, sections, failing=()):
        self.sections = sections
        self.failing = set(failing)
        self.fetched = []

    def send(self, _data, _method, url, _token=None):
        if url.endswith('/export_list'):
            return {'market_investibles': [{'id': an_id, 'stamp': stamp}
                                           for an_id, stamp, _ in self.sections['marketInvestible']],
                    'comments': [{'id': an_id, 'stamp': stamp}
                                 for an_id, stamp, _ in self.sections['comment']]}
        query = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        id_type = query['idType'][0]
        ids = query['id']
        if any(f'{id_type}:{an_id}' in self.failing for an_id in ids):
            return None
        self.fetched.extend(f'{id_type}:{an_id}' for an_id in ids)
        return [{'id': an_id, 'stamp': stamp, 'markdown': markdown}
                for an_id, stamp, markdown in self.sections[id_type] if an_id in ids]


def replace_section(sections, id_type, replacement):
    changed = {key: list(value) for key, value in sections.items()}
    changed[id_type] = [replacement if section[0] == replacement[0] else section
                        for section in changed[id_type]]
    return changed


INDEX_LINE_RE = re.compile(r'^(?P<kind>job|bug|blocker|unreadable) (?:(?P<code>\S+) )?'
                           r'line=(?P<line>\d+)(?P<rest>.*)$')


class ExportIndexTestCase(unittest.TestCase):
    """Every export run writes an index of open jobs, view-level bugs and blockers."""

    def export(self, sections=RENDERED_SECTIONS, failing=(), file_path=None):
        server = FakeExportServer(sections, failing)
        with mock.patch.object(cli, 'send', side_effect=server.send), redirect_stdout(io.StringIO()):
            content = cli.fetch_workspace_export(CREDENTIALS, file_path)
        self.assertIsNotNone(content)
        return content, server

    def write(self, content, file_path=None):
        """Writes the export as cmd_export does and returns its lines split only on \\n."""
        if file_path is None:
            handle, file_path = tempfile.mkstemp(suffix='.md')
            os.close(handle)
            self.addCleanup(os.remove, file_path)
        with open(file_path, 'w', encoding='utf-8') as export_file:
            export_file.write(content)
        return Path(file_path).read_bytes().decode('utf-8').split('\n')

    def index_lines(self, content):
        start = content.index(cli.EXPORT_INDEX_START) + len(cli.EXPORT_INDEX_START)
        end = content.index(cli.EXPORT_INDEX_END, start)
        return content[start:end].split('\n')[:-1]

    def without_numbers(self, content):
        return [re.sub(r' line=\d+', ' line=N', line) for line in self.index_lines(content)]

    def assert_lines_land_on_headings(self, content):
        file_lines = self.write(content)
        checked = 0
        for index_line in self.index_lines(content):
            match = INDEX_LINE_RE.match(index_line)
            if index_line.startswith('failed '):
                continue
            self.assertIsNotNone(match, index_line)
            target = file_lines[int(match.group('line')) - 1]
            if match.group('kind') == 'unreadable':
                section = re.search(r' section=(\S+) ', index_line).group(1)
                expected = f'<!-- uclusion:{section}:'
            else:
                heading = {'job': '## Job', 'bug': '#### Bug', 'blocker': '#### Issue'}[match.group('kind')]
                expected = f'{heading} {match.group("code")}<a name="'
            self.assertTrue(target.startswith(expected), f'{index_line!r} points at {target!r}')
            checked += 1
        return checked

    def test_index_lists_open_jobs_bugs_and_blockers(self):
        content, _ = self.export()
        self.assertEqual([
            'job J-example-1 line=N stage=Doable name=Add the export index',
            'job J-example-4 line=N stage=Requires Input name=Choose a storage format',
            'bug B-example-1 line=N severity=critical name=The export crashes when a view has no jobs '
            'and the index builder reads past...',
            'bug B-example-3 line=N severity=minor name=Minor bug after a blank line.',
            'blocker I-example-1 line=N job=J-example-1 name=Waiting on the API key.',
            'blocker I-example-3 line=N job=J-example-2 name=Blocker on a finished job.',
            'unreadable line=N section=comment:bug-4 could not be read: bug name',
        ], self.without_numbers(content))

    def test_comment_name_is_cut_to_eighty_characters(self):
        content, _ = self.export()
        body_line = next(line for line in content.split('\n') if line.startswith('The export crashes'))
        name = next(line for line in self.index_lines(content)
                    if line.startswith('bug B-example-1 ')).split(' name=', 1)[1]
        self.assertGreater(len(body_line), cli.EXPORT_INDEX_NAME_LENGTH)
        self.assertLessEqual(len(name), cli.EXPORT_INDEX_NAME_LENGTH)
        self.assertTrue(body_line.startswith(name[:-len('...')] + ' '))

    def test_finished_and_resolved_counterparts_are_left_out(self):
        content, _ = self.export()
        # Each left-out item is in the file, so its absence from the index is the filter's doing.
        for present in ('This job is in stage Reviewable.', 'This job is in stage Skippable.',
                        '#### Resolved Bug B-example-2<a name=', '#### Resolved Issue I-example-2<a name=',
                        '##### Issue Q-example-1_I-1<a name=', '#### Resolved Issue Q-example-1_I-2<a name=',
                        '#### Note R-example-1<a name='):
            self.assertIn(present, content)
        codes = {(match.group('kind'), match.group('code'))
                 for match in map(INDEX_LINE_RE.match, self.index_lines(content))}
        for left_out in (('job', 'J-example-2'), ('job', 'J-example-3'), ('bug', 'B-example-2'),
                         ('blocker', 'I-example-2'), ('blocker', 'Q-example-1_I-1'),
                         ('blocker', 'Q-example-1_I-2'), ('bug', 'R-example-1')):
            self.assertNotIn(left_out, codes)

    def test_every_line_number_lands_on_its_heading(self):
        content, _ = self.export()
        self.assertEqual(len(self.index_lines(content)), self.assert_lines_land_on_headings(content))

    def test_line_numbers_count_the_warnings_and_failed_lines_above_them(self):
        content, _ = self.export(failing=('comment:bug-1', 'marketInvestible:job-3'))
        self.assertIn('<!-- uclusion-export-warning: 2 objects failed to export', content)
        index = self.index_lines(content)
        self.assertEqual(['failed object=marketInvestible:job-3 is missing from this file',
                          'failed object=comment:bug-1 is missing from this file'], index[-2:])
        self.assertFalse(any(line.startswith('bug B-example-1 ') for line in index))
        self.assertEqual(len(index) - 2, self.assert_lines_land_on_headings(content))

    def test_line_separator_characters_do_not_shift_line_numbers(self):
        sections = replace_section(RENDERED_SECTIONS, 'marketInvestible', SEPARATOR_JOB_1)
        content, _ = self.export(sections)
        self.assertEqual(2, content.count('\u2028'))
        self.assertEqual(content.count('\n') + 2, len(content.splitlines()))
        index = self.index_lines(content)
        self.assertIn('job J-example-1 ', index[0])
        self.assertTrue(index[0].endswith(' name=Add the export index'))
        blocker = next(line for line in index if line.startswith('blocker I-example-1 '))
        self.assertTrue(blocker.endswith(' name=Waiting on the API key.'))
        self.assertEqual(len(index), self.assert_lines_land_on_headings(content))

    def test_unreadable_job_section_points_at_its_marker(self):
        an_id, stamp, markdown = RENDERED_SECTIONS['marketInvestible'][1]
        stage_line = 'This job is in stage Reviewable.\n'
        self.assertEqual(1, markdown.count(stage_line))
        sections = replace_section(RENDERED_SECTIONS, 'marketInvestible',
                                   (an_id, stamp, markdown.replace(stage_line, '')))
        content, _ = self.export(sections)
        index = self.without_numbers(content)
        self.assertIn('unreadable line=N section=marketInvestible:job-2 could not be read: job stage', index)
        # The job's stage is unknown but its blocker is still an open issue on that job.
        self.assertIn('blocker I-example-3 line=N job=J-example-2 name=Blocker on a finished job.', index)
        self.assertEqual(len(index), self.assert_lines_land_on_headings(content))

    def test_index_is_rebuilt_each_run_while_unchanged_sections_are_reused(self):
        handle, file_path = tempfile.mkstemp(suffix='.md')
        os.close(handle)
        self.addCleanup(os.remove, file_path)
        first, first_server = self.export(file_path=file_path)
        self.write(first, file_path)
        sections = replace_section(RENDERED_SECTIONS, 'comment', RESOLVED_BUG_3)
        second, second_server = self.export(sections, file_path=file_path)
        section_count = sum(len(listed) for listed in RENDERED_SECTIONS.values())
        self.assertEqual(section_count, len(first_server.fetched))
        self.assertEqual(['comment:bug-3'], second_server.fetched)
        self.assertTrue(any(line.startswith('bug B-example-3 ') for line in self.index_lines(first)))
        self.assertFalse(any(line.startswith('bug B-example-3 ') for line in self.index_lines(second)))
        self.write(second, file_path)
        reused = cli.parse_export_sections(file_path)
        self.assertEqual({(id_type, an_id): (stamp, markdown)
                          for id_type, listed in sections.items() for an_id, stamp, markdown in listed},
                         reused)

    def test_index_follows_the_opening_notes_and_precedes_the_first_section(self):
        content, _ = self.export(failing=('comment:bug-1',))
        opening = content[:content.index(cli.EXPORT_INDEX_START)]
        self.assertTrue(opening.startswith(cli.EXPORT_FORMAT_MARKER + cli.EXPORT_LEGEND))
        self.assertTrue(opening.endswith(' -->\n'))
        self.assertIn('uclusion-export-warning', opening)
        index_end = content.index(cli.EXPORT_INDEX_END) + len(cli.EXPORT_INDEX_END)
        self.assertEqual(index_end, cli.EXPORT_MARKER_RE.search(content).start())
        for text in ('uclusion-export-index-start', 'uclusion-export-index-end', 'line number of this file'):
            self.assertIn(text, cli.EXPORT_LEGEND)
        written = cli.EXPORT_LEGEND + ''.join(self.index_lines(content))
        self.assertNotIn('\u2014', written)
        self.assertNotIn('\u2013', written)
        self.assertNotIn(' - ', written)

    def test_empty_workspace_writes_an_empty_index(self):
        with mock.patch.object(cli, 'send', return_value=EMPTY_LIST_RESPONSE):
            content = cli.fetch_workspace_export(CREDENTIALS)
        self.assertIn(cli.EXPORT_INDEX_START + cli.EXPORT_INDEX_END, content)
        self.assertEqual([], self.index_lines(content))
