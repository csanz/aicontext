# AIContext Test Commands

This document lists all the test cases implemented in `test-commands.js` and identifies additional test cases that should be implemented.

> Note: Test fixtures are created dynamically during test execution in the `tests/setup` directory.

## Currently Implemented Tests

1. **Basic context generation**
   - Command: `node bin/cx.js ./lib`
   - Tests basic file processing and context generation
   - Verifies output format and file creation

2. **Message flag**
   - Command: `node bin/cx.js ./lib -m "test message"`
   - Tests context generation with a custom message
   - Verifies message is included in filename

3. **Snapshot with message**
   - Command: `node bin/cx.js ./lib -sm "test snapshot"`
   - Tests snapshot creation with a custom message
   - Verifies snapshot file creation and naming

4. **Snapshot with separate flags**
   - Command: `node bin/cx.js ./lib -s -m "test snapshot separate"`
   - Tests snapshot creation using separate flags
   - Verifies snapshot file creation with separate flag handling

5. **Clear context only**
   - Command: `node bin/cx.js --clear`
   - Tests clearing only context files
   - Verifies snapshots are preserved

6. **Clear with snapshots**
   - Command: `node bin/cx.js --clear -s`
   - Tests clearing both context and snapshot files
   - Verifies complete cleanup

7. **Help system**
   - Command: `node bin/cx.js -h`
   - Tests help output and available commands
   - Verifies all sections and basic options are present

8. **Detailed help format**
   - Command: `node bin/cx.js -h --more`
   - Tests detailed help output
   - Verifies comprehensive documentation and examples

9. **Version flag**
   - Command: `node bin/cx.js --version`
   - Tests version information display
   - Verifies version matches package.json

10. **Latest context file functionality**
    - Command: `node bin/cx.js ./lib`
    - Tests creation and updating of latest-context.txt
    - Verifies file updates with new content

11. **Clear all command**
    - Command: `node bin/cx.js --clear-all`
    - Tests interactive clearing of all context files
    - Verifies user confirmation and complete cleanup

12. **Ignore add pattern**
    - Command: `node bin/cx.js ignore add "*.o"`
    - Tests adding ignore patterns
    - Verifies pattern is saved to ignore.json

13. **Ignore show command**
    - Command: `node bin/cx.js ignore show`
    - Tests displaying ignore patterns
    - Verifies correct pattern listing

14. **Ignore test command**
    - Command: `node bin/cx.js ignore test`
    - Tests ignore pattern application
    - Verifies directory structure display with exclusions

15. **Ignore clear command**
    - Command: `node bin/cx.js ignore clear`
    - Tests clearing ignore patterns
    - Verifies all patterns are removed

16. **Empty exclusions help message**
    - Command: `node bin/cx.js ignore show`
    - Tests help message when no patterns exist
    - Verifies correct command format suggestions

17. **No parameters behavior**
    - Command: `node bin/cx.js`
    - Tests default directory processing
    - Verifies current directory handling

18. **Invalid switch detection**
    - Command: `node bin/cx.js --invalid-switch`
    - Tests error handling for invalid switches
    - Verifies appropriate error message and exit code

19. **Tree command output**
    - Command: `node bin/cx.js ./lib -t`
    - Tests directory tree generation and formatting
    - Verifies proper indentation and tree characters

20. **Multiple directory inputs**
    - Command: `node bin/cx.js ./lib ./bin`
    - Tests processing multiple input paths
    - Verifies all directories are processed

21. **Mixed directory and file inputs**
    - Command: `node bin/cx.js ./lib ./bin tests/fixtures/mixed-test.js`
    - Tests processing both directories and individual files
    - Verifies correct handling of mixed inputs

22. **Configure command**
    - Command: `node bin/cx.js configure`
    - Tests configuration setup
    - Verifies interactive configuration process

23. **Show configuration**
    - Command: `node bin/cx.js show`
    - Tests displaying current configuration
    - Verifies configuration display format

24. **Error handling - Invalid paths**
    - Command: `node bin/cx.js ./nonexistent/path`
    - Tests error handling for invalid paths
    - Verifies appropriate error messages

25. **Output to screen with pipe**
    - Command: `node bin/cx.js ./lib -o | head`
    - Tests output piping functionality
    - Verifies proper handling of piped output

26. **Output command with file content**
    - Command: `node bin/cx.js ./lib -o`
    - Tests direct output to screen
    - Verifies content formatting and sections

27. **Gitignore patterns management**
    - Tests automatic .gitignore file management
    - Verifies creation of new .gitignore with correct pattern
    - Verifies updating existing .gitignore while preserving content
    - Ensures `.aicontext/` directory is properly ignored

## Running Tests

To run all tests:
```bash
node tests/test-commands.js
```

The test results will be displayed in the console and automatically update the TESTS.md file with the latest results.

## Test Coverage Summary

- Total implemented tests: 27
- Test categories:
  - Basic operations
  - File handling
  - Command flags
  - Configuration
  - Error handling
  - Legacy support
  - Output formatting
  - Directory tree visualization
  - Mixed input processing
  - Version control integration 