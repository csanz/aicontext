# Technical Design Document: AIContext Ignore Feature Issue

## Problem Statement

When executing `node bin/cx.js ignore show`, the command correctly displays that `.md` files are being excluded by the current ignore patterns. However, when running `node bin/cx.js -t` to visualize the directory tree, `.md` files are still included in the output. This inconsistency creates confusion for users and reduces the effectiveness of the ignore functionality.

## Root Cause Analysis

After examining the codebase, we've identified the following issues:

1. **Purpose-aware Processing**: The `dirTree` function and the `ExclusionManager` both support a `purpose` parameter that distinguishes between operations intended for visualization (`tree`) and content extraction (`content`). However, some ignore-related functions do not properly utilize this parameter.

2. **Inconsistent Parameter Passing**: When the `testExclusions` function in `configHandler.js` calls `dirTree`, it does not specify a purpose parameter. Since the default is 'tree', it ignores patterns are not being correctly applied for visualization.

3. **Ignore Pattern Handling in ExclusionManager**: The `ExclusionManager` has special handling in the `matchesUserDefinedPatterns` method but it's not consistently applied across different visualizations.

4. **Missing Purpose Parameter in Test Functions**: The `testExclusions` function doesn't specify a purpose when calling `dirTree`, so it's using the default 'tree' purpose, which may not accurately show what will be excluded in content generation.

## Proposed Solution

### 1. Update `handleTree` Function in `bin/cx.js`

The `handleTree` function needs to respect the user-defined ignore patterns more strictly when generating the tree visualization:

```javascript
// Generate the tree
const tree = dirTree(absolutePath, 10, isVerbose, false, null, 'ignore-aware-tree');
```

By introducing a new purpose type 'ignore-aware-tree', we can make the tree command respects all ignore patterns, including those specified via the ignore command.

### 2. Enhance `ExclusionManager.shouldExcludeFile` Method

Update the `shouldExcludeFile` method in `lib/exclusionManager.js` to handle the new purpose type:

```javascript
if (purpose === 'ignore-aware-tree') {
  // For ignore-aware tree visualization, respect ALL ignore patterns 
  // including user-defined, gitignore and system patterns
  if (this.matchesUserDefinedPatterns(filepath)) {
    this.log(`Excluding file by user-defined pattern: ${filepath}`);
    this.cache.set(cacheKey, true);
    return true;
  }
}
```

### 3. Update `testExclusions` Function

Enhance the `testExclusions` function in `lib/configHandler.js` to use the new purpose parameter:

```javascript
function testExclusions() {
    // Get the current directory
    const currentDir = process.cwd();
    const displayName = path.basename(currentDir);
    
    console.log('\nTesting exclusion patterns...');
    console.log('Current directory:', currentDir);
    console.log('\nDirectory Structure with Current Exclusions:');
    console.log('```');
    console.log(dirTree(currentDir, 10, false, false, null, 'ignore-aware-tree'));
    console.log('```');
    
    return true;
}
```

### 4. Add Purpose-Aware Logic to `matchesUserDefinedPatterns`

Enhance the `matchesUserDefinedPatterns` method in `ExclusionManager` to be more purpose-aware:

```javascript
matchesUserDefinedPatterns(filePath, purpose = 'content') {
    // Existing logic...
    
    // For 'ignore-aware-tree' purpose, apply all exclusion patterns strictly
    if (purpose === 'ignore-aware-tree') {
        // Apply more strict matching logic for tree visualization
        // ...
    }
    
    // Rest of the existing logic...
}
```

## Implementation Steps

1. **Add New Purpose Type**:
   - Add 'ignore-aware-tree' as a new purpose type in relevant documentation
   - Update function signatures to include this purpose type

2. **Update ExclusionManager**:
   - Modify `shouldExcludeFile` method to handle the new purpose type
   - Enhance `matchesUserDefinedPatterns` to be purpose-aware
   - Ensure cache keys are properly generated for the new purpose

3. **Update Command Handlers**:
   - Modify `handleTree` in `bin/cx.js` to use the new purpose type
   - Update `testExclusions` in `configHandler.js` to use the same purpose

4. **Add Tests**:
   - Create tests to verify that ignore patterns are correctly applied in tree visualizations
   - Ensure backward compatibility with existing behavior

## Expected Results

After these changes, the following should be true:

1. When a file or pattern is ignored using `node bin/cx.js ignore add "*.md"`, it should be excluded from both content generation AND tree visualization.

2. Running `node bin/cx.js -t` should show a tree view that respects ALL user-defined ignore patterns.

3. The `testExclusions` function should accurately represent what will be excluded in both content generation and tree visualization.

These changes maintain backward compatibility while ensuring that user-defined ignore patterns are consistently applied across all features of the AIContext tool.

## Future Considerations

1. Consider adding command-line flags to toggle between strict and lenient ignore pattern application for visualization.

2. Improve documentation to clarify the behavior of ignore patterns for different operations.

3. Consider a unified approach to pattern matching that ensures consistent behavior across all features. 