# Project Rules for Claude

## README.md Structure

**IMPORTANT: Do NOT add duplicate badge sections to README.md**

The README has ONE badge section at the top (after the logo). Never add:
- A "Test Status" section with badges
- Duplicate badge rows
- Any additional badge sections

The badge structure is:
```
<logo>
<badges - single row>
## What is AIContext?
```

When updating badges, only modify the existing badge values in place. Do not add new sections.

## File Exclusions

Media extensions are defined in `lib/constants.js` as `MEDIA_EXTENSIONS`. Do not define them elsewhere.

## Test Updates

The test script (`tests/test-commands.js`) updates:
- `TESTS.md` - full test results
- `README.md` - only updates existing badge values (test count, version)

It should NEVER add new sections to README.md.
