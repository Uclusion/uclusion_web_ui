#!/usr/bin/python3
"""Legacy Cursor stop-hook compatibility shim.

Cursor GUI no longer consumes Uclusion Pokes. The installer removes managed
hook entries it can discover, while this shared no-op keeps older project hooks
safe until their local configuration is refreshed.
"""
import sys


def main():
    """Emit a valid empty Cursor hook response without touching the inbox."""
    sys.stdout.write('{}\n')


if __name__ == '__main__':
    main()
