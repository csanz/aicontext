# AIContext Updates

This file contains a history of important updates and changes to the AIContext tool.

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