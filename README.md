# AICTX (AI Context Generator)

![AICTX Brain](static/brain.jpg)

**Enhance AI Code Assistance with Comprehensive Codebase Context.**

`cx` is a command-line tool designed to generate detailed context files from your codebase, significantly improving the accuracy and effectiveness of AI tools like Cursor, ChatGPT, and Claude. By providing a complete view of your project, `cx` eliminates common AI errors such as duplicate functions, missing variables, and incorrect code implementations.

Simply run `cx ./` to generate a context file that you can paste into your preferred AI tool, ensuring it has the necessary understanding to provide precise and helpful assistance.

## Features

- 📁 Scans directories for JavaScript, TypeScript, JSON, ENV files and more
- 🌳 Includes full directory structure
- 📝 Creates comprehensive context files
- 🗜️ Optional text compression to reduce context size
- 🔄 Automatic sequence numbering for multiple scans
- 📋 Maintains code readability for AI tools
- ✨ Automatic .gitignore management
- 🔍 Perfect for studying other projects' architecture and patterns
- 🎯 Helps AI understand similar projects for better code suggestions
- 🔐 Includes configuration files and environment templates

## Installation

```bash
npm install -g aictx
```

## Usage

```bash
cx <directory> [options]
```

## Options

- `-h, --help`: Show help
- `--no-minimize`: Override config to generate uncompressed output
- `--min`: Force generate a minimized version (in addition to current output)
- `-s, --snap`: Create a snapshot in context/snap (not affected by --clear)
- `--configure`: Set up configuration
- `--show`: Show current configuration
- `--clear`: Remove all generated context files

## Example

Generate a context file for the current directory:
```bash
cx ./
```
Generate a snapshot:
```bash
cx ./ --snap
```
Generate a minimized version:
```bash
cx ./ --min
```
Clear all generated context files:
```bash
cx ./ --clear
```
Configure the tool:
```bash
cx ./ --configure
```
Show current configuration:
```bash
cx ./ --show
```

![AICTX Brain](static/example.png)

### How it works

This will:
1. Scan the source directory for relevant files (JS, JSON, TS, etc.)
2. Create a `context/code` directory for regular output or `context/snap` for snapshots
3. Generate a context file with the directory structure and file contents
4. Minimize the output by default (can be disabled via config or --no-minimize)
5. Prompt to add `context/` to .gitignore if not present

### Output Locations

- Regular output: `context/code/<directory>-context-<n>.txt`
- Snapshots: `context/snap/<directory>-<timestamp>-context-<n>.txt`
- Minimized versions will have `.min` suffix

The sequence number `<n>` automatically increments for each new scan.

## Why Use AICTX?

- **AI Context**: Provides AI tools with complete codebase understanding
- **Time Saving**: Quickly generates comprehensive context files
- **Space Efficient**: Optimized compression while maintaining readability
- **Version Control Friendly**: Automatic .gitignore management
- **Sequential Tracking**: Maintains history of context generations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

