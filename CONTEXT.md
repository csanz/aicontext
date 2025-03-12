# AICTX - AI Context Generator

## Project Overview

AICTX is a CLI tool designed to generate context files from source code, primarily for AI-assisted development. It scans a directory, collects all relevant files, and creates a comprehensive context file that can be used with AI tools.

## Core Functionality

- **Context Generation**: Scans directories and creates context files with code content
- **Snapshots**: Creates point-in-time snapshots of the codebase
- **Templates**: Saves reusable templates for common code patterns
- **Configuration**: Customizable settings for output format and behavior
- **Latest Context**: Automatically maintains a `latest-context.txt` file with the most recent context
- **Template Loading**: Provides templates like cursor rules that can be imported into projects
- **Binary File Exclusion**: Automatically excludes binary files and build artifacts from context generation

## Directory Structure

- **bin/**: Contains the main executable (aictx.js)
- **lib/**: Core functionality modules
- **context/**: Generated context files (organized in code/, snap/, and template/ subdirectories)
  - **context/latest-context.txt**: Always contains the most recently generated context
- **static/**: Static assets like images
- **templates/**: Template files for rules and tests
- **test/**: Test files

## Key Components

### Main Executable
- `bin/aictx.js`: Entry point for the CLI tool, handles command-line arguments and orchestrates the context generation process

### Core Libraries
- `lib/contextGenerator.js`: Main logic for generating context files
- `lib/configHandler.js`: Manages user configuration
- `lib/constants.js`: Defines constants like ignored directories and included file extensions
- `lib/fileUtils.js`: Utilities for file operations
- `lib/pathUtils.js`: Path manipulation utilities
- `lib/compressionHandler.js`: Handles file compression for minimized output
- `lib/gitignoreHandler.js`: Ensures context directory is added to .gitignore
- `lib/cleanupUtils.js`: Utilities for cleaning up context files
- `lib/templateHandler.js`: Manages template creation and usage
- `lib/templateLoader.js`: Handles loading and importing templates into user projects
- `lib/menuHandler.js`: Interactive menu system
- `lib/helpHandler.js`: Help documentation system

### Configuration
- Global configuration stored in `~/.aictx/config.json`
- Default settings:
  - `autoClipboard`: Whether to automatically copy context to clipboard (default: false)
  - `minimize`: Whether to minimize output by default (default: true)
  - `createLatestFile`: Whether to create the latest context file (default: true)

## Command Line Interface

The tool is invoked using the `cx` command with various options:
- Basic usage: `cx ./`
- With message: `cx ./ -m "message"`
- Create snapshot: `cx ./ -s`
- Create template: `cx ./ -t "template-name"`
- Configure settings: `cx --configure`
- Show help: `cx -h` or `cx --help`
- Load templates: `cx --load`

## Latest Context Feature

Every time a new context file is generated (except for templates), the tool automatically:
1. Creates a copy of the context file at `./context/latest-context.txt`
2. This provides a consistent location to access the most recent context
3. Useful for integrations with AI tools that expect a fixed file path

## Template Loading Feature

The `--load` command allows users to import templates into their projects:
1. Shows a menu of available template categories (e.g., cursor rules)
2. Allows selection of specific templates within the category
3. Imports the selected template into the appropriate location (e.g., `.cursor/rules` directory)
4. For Cursor rules, files are imported with the `.mdc` extension (required for Cursor IDE)
5. Currently supports cursor rules templates for AI-assisted development

### Available Templates
- **General Rules**: Comprehensive coding best practices including:
  - Documentation standards
  - Detailed README documentation guidelines
  - Configuration management
  - Code quality practices
  - Version control recommendations

### File Existence Handling
When importing templates, the system checks if a file with the same name already exists:
1. If a file exists, the user is presented with options:
   - Override the existing file
   - Create a new file with a numbered suffix
   - Cancel the import operation
2. This prevents accidental overwrites and gives users control over their template imports
3. The numbered suffix approach (e.g., `general-2.mdc`) allows multiple versions of the same template

## Binary File Handling and Exclusion

AICTX automatically excludes binary files and build artifacts from context generation to ensure clean, relevant context files:

### Automatic Exclusions

- **Binary File Extensions**: Files with extensions like `.o`, `.obj`, `.exe`, `.dll`, `.so`, `.dylib`, `.class`, `.jar`, etc. are automatically excluded
- **Build Directories**: Common build directories like `target/`, `bin/`, `obj/`, `dist/`, `build/` are excluded
- **Rust-specific Artifacts**: Special handling for Rust build artifacts with patterns like `.rcgu.o` and `.d` files
- **Directory Structure Filtering**: The directory tree output is post-processed to remove any remaining references to binary files or build directories

### Custom Exclusion Patterns

Users can add custom exclusion patterns using the `-i/--ignore` flag:

```bash
# Exclude all .o files
cx -i "*.o"

# Exclude Rust target directory
cx -i "target/**"

# Exclude minified JavaScript files
cx -i "**/*.min.js"
```

Exclusion patterns are saved in `~/.aictx/exclude.json` and applied to all future context generation operations.

### Viewing Current Exclusions

To view the current exclusion patterns:

```bash
cx --show-ignore
```

### Implementation Details

The exclusion logic is implemented in multiple layers to ensure comprehensive filtering:

1. **Directory Traversal**: The `findFiles` function in `lib/fileUtils.js` skips ignored directories entirely
2. **File Filtering**: The `shouldProcessFile` function checks each file against multiple exclusion criteria
3. **Tree Command Filtering**: The directory structure output is filtered using both command-line arguments and post-processing
4. **Custom Pattern Matching**: User-defined patterns are applied using the `minimatch` library for glob pattern matching

### Testing Binary Exclusions

The test suite includes specific tests to verify that binary files and build directories are properly excluded:

- Creates mock binary files and build directories
- Verifies that they are excluded from the generated context
- Ensures that legitimate source files are still included

## Development Status

The project is functional and includes comprehensive test coverage. Future enhancements may include:
- Additional output formats
- Integration with more AI tools
- Enhanced template management
- Performance optimizations for large codebases

## Dependencies

- Node.js (>=14.0.0)
- clipboardy: For clipboard operations

## Maintenance Notes

When making changes to the codebase:
1. Ensure all new configuration options are added to the config.json structure
2. Update help documentation when adding new features
3. Maintain backward compatibility with existing context files
4. Add appropriate tests for new functionality
5. When modifying exclusion logic, ensure both the file filtering and directory structure output are updated
6. Test with projects containing binary files (especially Rust projects with target/ directories) 