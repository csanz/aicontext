# AICTX (AI Context Generator)

![AICTX Brain](static/brain.jpg)

**Enhance AI Code Assistance with Comprehensive Codebase Context.**

`cx` is a command-line tool designed to generate detailed context files from your codebase, significantly improving the accuracy and effectiveness of AI tools like Cursor, ChatGPT, and Claude. By providing a complete view of your project, `cx` eliminates common AI errors such as duplicate functions, missing variables, and incorrect code implementations.

Simply run `cx ./` to generate a context file that you can paste into your preferred AI tool, ensuring it has the necessary understanding to provide precise and helpful assistance.

## Features

- 📁 Scans directories for JavaScript and JSON files
- 🌳 Includes full directory structure
- 📝 Creates comprehensive context files
- 🗜️ Optional text compression to reduce context size
- 🔄 Automatic sequence numbering for multiple scans
- 📋 Maintains code readability for AI tools
- ✨ Automatic .gitignore management

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

```bash
cx ./src
```
![AICTX Brain](static/example.png)

This will:
1. Scan the `./src` directory for JS and JSON files
2. Create a `context/code` directory (if it doesn't exist)
3. Generate a context file with the directory structure and file contents
4. Create both regular and compressed versions (unless --no-compress is used)
5. Automatically add `context/` to .gitignore

## Output

The tool generates two files (when compression is enabled):
- `context/code/<directory>-context-<n>.txt`: Full context file
- `context/code/<directory>-context-<n>.txt.min`: Compressed version

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

