# Technical Design Document: Testing Ignore and Tree Commands

## Problem Statement

The recent fixes for the ignore functionality in AIContext need to be properly tested to ensure they work correctly and consistently. Currently, there's inconsistency between what files are shown in the tree visualization and what files are actually excluded based on ignore patterns. We need a comprehensive testing strategy to validate that:

1. The tree command (`cx -t`) correctly respects user-defined ignore patterns
2. The ignore test command (`cx ignore test`) properly visualizes what will be excluded
3. The core functionality works consistently across all use cases

## Test Approach

We'll create or update tests to cover these specific aspects of functionality:

1. **Unit Tests**: Test individual components like the ExclusionManager and dirTree functions
2. **Integration Tests**: Test the commands together to ensure they work correctly
3. **Acceptance Tests**: Test real-world scenarios that users might encounter

## Test Plan

### 1. Unit Tests for ExclusionManager

Create a new test file `tests/exclusionManager.test.js` to test the ExclusionManager class with the following test cases:

```javascript
describe('ExclusionManager', () => {
  describe('matchesUserDefinedPatterns', () => {
    test('Should match files with user-defined patterns', () => {
      // Test with purpose = 'content'
    });
    
    test('Should match files with user-defined patterns in tree mode', () => {
      // Test with purpose = 'tree'
    });
    
    test('Should strictly match files with user-defined patterns in ignore-aware-tree mode', () => {
      // Test with purpose = 'ignore-aware-tree'
    });
  });
  
  describe('shouldExcludeFile', () => {
    test('Should exclude files based on user-defined patterns for content purpose', () => {
      // Setup with *.md pattern
      // Verify .md files are excluded
    });
    
    test('Should include media files for tree purpose', () => {
      // Setup with image files
      // Verify they're included for 'tree' purpose
    });
    
    test('Should exclude ignored files for ignore-aware-tree purpose', () => {
      // Setup with *.md pattern
      // Verify .md files are excluded for 'ignore-aware-tree' purpose
    });
  });
  
  describe('shouldExcludeDirectory', () => {
    // Similar tests for directories
  });
});
```

### 2. Integration Tests for Tree Command

Create or update `tests/test-commands.js` to include tests for the tree command:

```javascript
describe('Tree Command Tests', () => {
  beforeEach(() => {
    // Setup test environment with known files and ignore patterns
    // Create test files including .md files
    // Add *.md to ignore patterns
  });
  
  test('Tree command should respect ignore patterns', async () => {
    // Run cx -t
    // Parse output to ensure .md files don't appear
  });
  
  test('Ignore test command should match tree command output', async () => {
    // Run cx ignore test
    // Run cx -t
    // Compare outputs - they should exclude the same files
  });
  
  test('Normal content generation should exclude ignored files', async () => {
    // Run cx with normal parameters
    // Check that .md files aren't included in the content
  });
});
```

### 3. Acceptance Tests for Real-World Scenarios

Add test cases in `tests/test-commands.js` for real-world scenarios:

```javascript
describe('Ignore Feature Acceptance Tests', () => {
  test('Adding and testing an ignore pattern', async () => {
    // Run cx ignore add "*.md"
    // Run cx ignore test
    // Verify .md files are excluded
  });
  
  test('Visualizing a tree with ignored files', async () => {
    // Setup with various file types
    // Run cx -t
    // Verify correct visualization
  });
  
  test('Media files appear in tree but not in content', async () => {
    // Setup with media files
    // Run cx -t (should include media)
    // Run cx -m "test" (should exclude media from content)
  });
});
```

### 4. Test for Backward Compatibility

Ensure that our changes don't break existing tests:

```javascript
describe('Backward Compatibility Tests', () => {
  test('Existing test cases should continue to pass', async () => {
    // Run existing test suite
    // Verify all tests pass
  });
  
  test('Special file handling should still work', async () => {
    // Test special cases like Test 27, 29, 30
    // Verify they still behave as expected
  });
});
```

## Test Files and Structure

### New Test Files

1. `tests/exclusionManager.test.js` - Unit tests for ExclusionManager
2. `tests/directoryTree.test.js` - Unit tests for dirTree function

### Update Existing Test Files

1. `tests/test-commands.js` - Add integration tests for tree and ignore commands
2. `tests/fixtures/ignore-test/` - Add test files for ignore pattern testing

## Test Case Implementation Details

### Test Case: Tree Command with Ignore Patterns

```javascript
test('Tree command should respect ignore patterns', async () => {
  // Setup
  const testDir = path.join(__dirname, 'fixtures', 'ignore-test');
  fs.writeFileSync(path.join(testDir, 'test.js'), 'console.log("test");');
  fs.writeFileSync(path.join(testDir, 'test.md'), '# Test');
  
  // Add ignore pattern
  execSync('node bin/cx.js ignore add "*.md"');
  
  // Run tree command
  const result = execSync('node bin/cx.js -t').toString();
  
  // Validate
  expect(result).toContain('test.js');
  expect(result).not.toContain('test.md');
});
```

### Test Case: Media Files in Tree But Not Content

```javascript
test('Media files appear in tree but not in content', async () => {
  // Setup
  const testDir = path.join(__dirname, 'fixtures', 'media-test');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  // Create test files
  fs.writeFileSync(path.join(testDir, 'image.png'), Buffer.from([0])); // Mock image
  fs.writeFileSync(path.join(testDir, 'code.js'), 'console.log("test");');
  
  // Run tree command
  const treeResult = execSync(`node bin/cx.js -t ${testDir}`).toString();
  
  // Run content generation
  const contentResult = execSync(`node bin/cx.js -m "test" ${testDir}`).toString();
  const contentFile = fs.readFileSync(path.join(process.cwd(), 'context', 'context.md'), 'utf8');
  
  // Validate
  expect(treeResult).toContain('image.png'); // Should appear in tree
  expect(treeResult).toContain('code.js');
  expect(contentFile).not.toContain('image.png'); // Should not appear in content
  expect(contentFile).toContain('code.js');
});
```

## Testing Process

1. Install testing dependencies:
   ```bash
   npm install --save-dev jest
   ```

2. Configure test script in package.json:
   ```json
   "scripts": {
     "test": "jest",
     "test:ignore": "jest --testPathPattern=exclusionManager"
   }
   ```

3. Run the tests:
   ```bash
   npm test
   ```

## Expected Test Results

* All tests should pass, indicating that the ignore and tree functionality works correctly
* The tree command should respect user-defined ignore patterns
* The ignore test command should produce the same exclusions as the tree command
* Media files should appear in the tree visualization but be excluded from content

## Edge Cases to Test

1. **Nested directories with ignore patterns**: Test with deeply nested directories to ensure patterns are applied recursively
2. **Different file types**: Test with various file types including text, binary, and media files
3. **Pattern negation**: Test with negation patterns (!pattern) to ensure they work correctly
4. **Custom ignore patterns**: Test with custom, complex ignore patterns
5. **Performance with large directories**: Test with large directory structures to ensure reasonable performance

## Future Test Considerations

1. Add tests for any new features related to ignore patterns
2. Consider automated visual regression testing for tree visualization
3. Implement continuous integration testing to ensure changes don't break ignore functionality 