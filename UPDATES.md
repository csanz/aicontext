# AIContext Updates

This file contains a history of important updates and changes to the AIContext tool.

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