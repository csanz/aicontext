# AIContext Updates

This file contains a history of important updates and changes to the AIContext tool.

## Version 1.6.1 (February 2026)

### Bug Fixes
- **Fixed**: Help text now shows correct default max file size (10MB, not 1MB)
- **Fixed**: Consistent error message format across all commands

### Improvements
- **Improved**: Token counting now uses word/punctuation-based estimation instead of simple char/4
- **Improved**: Simplified success output (removed redundant "All Done!" message)
- **Improved**: Clipboard error now clarifies that file was saved successfully
- **Added**: Glob pattern validation before saving (catches invalid patterns early)
- **Added**: Warning when no files match include/ignore criteria
- **Added**: Glob pattern syntax help in `cx ignore add` and `cx include add`
- **Added**: Symlink loop detection to prevent infinite recursion
- **Added**: Graceful handling of files deleted during scan
- **Added**: Clear precedence documentation for include/ignore patterns in COMMANDS.md
- **Fixed**: Test buffer size to handle large output tests

## Version 1.6.0 (February 2026)

### New Features

#### Output Formats (`-f` / `--format`)
- **Added**: Multiple output format support
  - `cx -f text` - Plain text (default)
  - `cx -f md` - Markdown with tables and fenced code blocks
  - `cx -f json` - Structured JSON for programmatic use
  - `cx -f xml` - XML with CDATA sections
- Output files automatically use correct extensions (.txt, .md, .json, .xml)

#### Incremental Mode
- **Added**: Time-based filtering with `--since`
  - `cx --since 2h` - Files changed in last 2 hours
  - `cx --since 1d` - Files changed in last day
  - `cx --since 2024-01-15` - Files changed since specific date
- **Added**: Git-based filtering with `--git-diff`
  - `cx --git-diff main` - Files changed vs main branch
  - `cx --git-diff HEAD~5` - Files changed in last 5 commits
- **Added**: Change tracking with `--changed`
  - `cx --changed` - Only files changed since last `cx` run

#### Include Patterns (Whitelist Filtering)
- **Added**: Include pattern commands for whitelist-based filtering
  - `cx include "*.ts"` - Only process TypeScript files
  - `cx include "src/**"` - Only process files in src/
  - `cx include show` - Display current include patterns
  - `cx include rm "*.ts"` - Remove an include pattern
  - `cx include clear` - Remove all include patterns
- Include patterns work alongside ignore patterns for precise file selection

### Documentation
- **Added**: COMMANDS.md - Comprehensive CLI reference with all options, examples, and patterns
- **Updated**: README.md streamlined to show core commands with link to full documentation

### Testing Improvements
- **Expanded**: Test suite from 33 to 44 comprehensive tests
- **Added**: Tests for output formats (markdown, JSON, XML)
- **Added**: Tests for incremental mode (--since, --git-diff, --changed)
- **Added**: Tests for include patterns (add, show, clear, filtering)
- **Improved**: Test documentation with JSDoc-style comments and section headers
- **Added**: Test categories for better organization

## Version 1.4.0 (May 2024)

### Bug Fixes
- **Fixed**: Directory patterns with trailing slashes
  - Fixed issue where directory patterns with trailing slashes (e.g., "docs/") weren't properly excluded
  - Enhanced path matching for different pattern formats including "docs", "./docs", "docs/", "docs/*", and "docs/**"
  - Improved directory exclusion logic to check parent directory exclusion
  - Added robust path normalization for cross-platform compatibility
  
### UI Improvements
- **Changed**: Console output styling
  - Updated success and completion messages to use more subtle gray coloring
  - Standardized checkmark symbols throughout the application
  - Improved visual consistency in terminal output

## Version 1.3.9 (May 2024)

### Bug Fixes
- **Fixed**: Directory patterns with trailing slashes
  - Fixed issue where directory patterns with trailing slashes (e.g., "docs/") weren't properly excluded
  - Enhanced path matching for different pattern formats including "docs", "./docs", "docs/", "docs/*", and "docs/**"
  - Improved directory exclusion logic to check parent directory exclusion
  - Added robust path normalization for cross-platform compatibility
  
### UI Improvements
- **Changed**: Console output styling
  - Updated success and completion messages to use more subtle gray coloring
  - Standardized checkmark symbols throughout the application
  - Improved visual consistency in terminal output

## Version 1.3.8 (May 2024)

### Bug Fixes
- **Fixed**: Critical bug with missing config files
  - Application now properly handles missing configuration files
  - Added graceful fallback to default settings when files cannot be accessed
  - Fixed incorrect file paths in configuration migration
  - Improved error handling in configuration functions

## Version 1.3.7 (May 2024)

### Bug Fixes
- **Fixed**: Static files visibility in tree command
  - Media files in the static directory now properly appear in tree output
  - Added purpose-aware filtering in ExclusionManager
  - Fixed inconsistency between actual filesystem and tree display
  - Improved caching mechanism to prevent cross-contamination of exclusion decisions

### Testing Improvements
- **Added**: New test script for static files handling
  - Created comprehensive test to verify static directory files appear correctly
  - Added validation for both tree visualization and content extraction
  - Ensured proper distinction between file inclusion/exclusion for different purposes

### Documentation
- **Added**: Detailed documentation of the static files bug and solution

## Version 1.3.6 (April 2024)

### Bug Fixes
- **Fixed**: Verbose logging in tree command
  - Debug output now only shows when `--verbose` flag is passed
  - Removed unconditional debug logging in tree generation
- **Fixed**: Directory tree generation issues
  - Fixed cases where directory tree output would fail to generate
  - Improved path handling and validation in tree command
  - Enhanced error handling for edge cases

### Testing Improvements
- **Enhanced**: Binary file exclusion testing
  - Added comprehensive test coverage for all binary extensions
  - Created dedicated binary test files directory
  - Added automated test file generation for all supported formats
  - Improved test verification for both tree output and context generation
  - Added validation for text file inclusion and binary file exclusion

## Version 1.3.4 (April 2024)

### Bug Fixes
- **Fixed**: Binary file handling in directory tree output
  - Added BINARY_EXTENSIONS check to tree generation
  - Properly excludes binary files from tree view
  - Improved file extension detection

## Version 1.3.2 (April 2024)

### Bug Fixes
- **Fixed**: Binary file handling in directory tree output
  - Added BINARY_EXTENSIONS check to tree generation
  - Properly excludes binary files from tree view
  - Improved file extension detection
- **Fixed**: Verbose logging in tree command
  - Debug output now only shows when `--verbose` flag is passed
  - Removed unconditional debug logging in tree generation

### Testing Improvements
- **Enhanced**: Binary file exclusion testing
  - Added comprehensive test coverage for all binary extensions
  - Created dedicated binary test files directory
  - Added automated test file generation for all supported formats
  - Improved test verification for both tree output and context generation
  - Added validation for text file inclusion and binary file exclusion

## Version 1.3.0 (April 2024)

### Directory Structure Changes
- **Changed**: Standardized directory structure to use `.aicontext/` instead of `.aictx/`
- **Added**: New `.aicontext/` subdirectories for better organization:
  - `.aicontext/code/`: Contains generated code context files
  - `.aicontext/snapshot/`: Stores snapshot-based context files
  - `.aicontext/config.json`: Project configuration (version controlled)
  - `.aicontext/ignore.json`: Ignore patterns (version controlled)
- **Removed**: Legacy `.aictx/` directory support
- **Enhanced**: Automatic `.gitignore` management:
  - Selectively ignores only context-related directories
  - Preserves configuration and ignore files for version control
  - Automatically adds/updates patterns in existing .gitignore files
  - Creates new .gitignore if none exists
  ```bash
  # AI context files (excluding config and ignore files)
  .aicontext/code/
  .aicontext/snapshot/
  ```

### Command Structure and Testing
- **Changed**: Migrated ignore commands to subcommand format:
  - `ignore add` replaces `--ignore add`
  - `ignore show` replaces `--ignore show`
  - `ignore clear` replaces `--ignore clear`
  - `ignore test` replaces `--ignore test`
  Examples:
  ```bash
  cx ignore add "*.log"        # Add new ignore pattern
  cx ignore show              # List current patterns
  cx ignore test             # Preview exclusions
  ```

- **Removed**: Legacy ignore command formats (`-i`, `--show-ignore`)
- **Improved**: Tree command output formatting and indentation
- **Added**: Support for processing multiple directories in a single command
  Examples:
  ```bash
  cx ./lib ./src              # Process multiple directories
  cx ./lib ./tests -t        # Show tree for multiple paths
  cx ./src ./bin -o         # Output multiple dirs to screen
  ```

- **Enhanced**: Mixed file and directory input handling
  Examples:
  ```bash
  cx ./lib ./src/main.js     # Mix directories and files
  cx ./config.js ./lib -t    # Tree view of file and directory
  ```

- **Added**: New `-o` switch for direct screen output:
  Examples:
  ```bash
  cx ./lib -o                # Output directly to screen
  cx ./lib -o | head -n 20   # Show first 20 lines
  cx ./src -o | grep "class" # Filter for class definitions
  cx -o > context.txt       # Redirect to custom file
  ```

- **Fixed**: Error handling for invalid switches and paths
  Examples:
  ```bash
  cx --invalid-flag         # Now shows proper error message
  cx ./nonexistent/path    # Clear path validation error
  ```

- **Updated**: Help messages to reflect new command structure
  ```bash
  cx -h                    # Updated basic help
  cx -h --more            # Enhanced detailed help
  cx ignore -h            # Subcommand-specific help
  ```

- **Improved**: Test suite organization and coverage:
  - Expanded from 22 to 26 comprehensive tests
  - Added detailed verification steps for each test
  - Improved test documentation and categorization
  - Added new test categories for output formatting and tree visualization

### Documentation
- **Added**: Detailed test documentation in TEST-COMMANDS.md
- **Updated**: Command format examples in help messages
- **Improved**: Error messages and user feedback
- **Enhanced**: README.md with new command examples and options

## Version 1.2.0 (March 30, 2025)

### Local Ignore Configuration
- **Added**: Local `.aicontext/ignore.json` file for project-specific ignore patterns
- **Changed**: Ignore patterns are now stored relative to the current directory instead of globally
- **Improved**: Directory tree visualization correctly excludes binary files and ignored patterns
- **Fixed**: All critical directories like `node_modules`, `dist`, and `.git` are always excluded
- **Removed**: Global-only ignore pattern storage and `--migrate-ignore` command
- **Added**: New `--ignore` subcommands for easier management:
  - `--ignore add <pattern>`: Add exclusion pattern for files/directories
  - `--ignore show`: Display current exclusion patterns
  - `--ignore clear`: Remove all exclusion patterns
  - `--ignore test`: Show directory tree with current exclusions
- **Fixed**: Help messages now reference the new command format (`--ignore add` instead of `-i`)

### Configuration Updates
- **Changed**: Global configuration directory from `~/.aictx` to `~/.aicontext` for consistency
- **Added**: Automatic migration of existing configurations from old to new location
- **Improved**: Help system now uses inline configuration instead of external JSON
- **Removed**: `switches.json` file to simplify the codebase
- **Added**: This UPDATES.md file to track changes

This update allows different projects to have different ignore patterns. The patterns are stored in a `.aicontext/ignore.json` file in the directory where you run the tool, making it easier to share project-specific exclusion rules via version control.

## Version 1.1.8 (Previous Release)

- Initial documented release