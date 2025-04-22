# Bug: Static Media Files Not Showing in Directory Tree (`-t` Command)

## Issue Summary

The `cx -t` command (tree display) is currently not showing media files in the `static/` directory. This creates an inconsistency between what files actually exist in the filesystem and what's being displayed in the tree output.

## Current Behavior

When running `cx -t` (or `cx --tree`), static media files like images should appear in the directory tree output, but they don't. The static directory appears empty or might not show some files:

```
├── static/
    (No files shown)
```

However, when checking the actual static directory, it contains files like:
```
├── static/
    ├── cx-example.gif
    └── cx-logo.png
```

## Investigation

After analyzing the codebase, I've identified several issues:

### 1. Purpose Parameter Not Being Passed Correctly

In `lib/directoryTree.js`, the `dirTree` function accepts a `purpose` parameter which should determine how files are filtered:

```javascript
function dirTree(filepath, maxDepth, verbose = false, debug = false, exclusionManager, purpose = 'tree') {
  // ...
}
```

This parameter should be passed to the `ExclusionManager` methods, but in some cases it's not being correctly propagated.

### 2. Media File Handling in ExclusionManager

The `ExclusionManager.shouldExcludeFile()` method has special handling for media files but it's not consistently applied between different call contexts:

```javascript
shouldExcludeFile(filepath, purpose = 'content') {
  // ...
  
  // For visualization purposes, include media files that aren't explicitly ignored
  if (purpose === 'tree' && this.isMediaFile(filepath)) {
    this.log(`Including media file for tree visualization: ${filepath}`);
    this.cache.set(cacheKey, false);
    return false;
  }
  
  // ...
}
```

### 3. Inconsistent Call Chain

When `cx -t` is invoked from the command line, it calls:
- `handleTree()` in `bin/cx.js`
- Which calls `dirTree()` in `lib/directoryTree.js`
- Which calls `exclusionManager.shouldExcludeFile()` or `shouldExcludeDirectory()`

But the purpose parameter is not consistently passed through this entire chain.

### 4. Cache Interaction

The `ExclusionManager` caches exclusion decisions based on the `purpose` parameter, but if different parts of the code use different purpose values for the same file, inconsistent results can occur.

## Root Causes

1. The main issue is that when the tree command is executed via `handleTree()`, it creates a new `ExclusionManager` instance but doesn't consistently pass the 'tree' purpose to the file exclusion methods.

2. Even when the proper purpose is specified, the `isMediaFile()` check doesn't properly allow all media files in the static directory to appear in tree views.

## Proposed Solution

### 1. Fix Purpose Parameter in Tree Command

Ensure the 'tree' purpose is properly passed through the entire call chain:

```javascript
// In bin/cx.js, in the handleTree function:
const tree = dirTree(absolutePath, 10, isVerbose, false, null, 'tree');
```

### 2. Improve Media File Handling for Static Directory

In `lib/exclusionManager.js`, modify the `shouldExcludeFile` method to specially handle files in the static directory:

```javascript
// Special case for static directory files in tree display
if (purpose === 'tree' && (filepath.includes('/static/') || filepath.includes('\\static\\'))) {
  this.log(`Including file in static directory for tree visualization: ${filepath}`);
  this.cache.set(cacheKey, false);
  return false;
}
```

### 3. Ensure Consistent Caching

Make sure the cache keys used in the `ExclusionManager` properly incorporate the purpose parameter to prevent cross-contamination of exclusion decisions.

## Implementation Plan

1. Modify `bin/cx.js` to correctly pass the 'tree' purpose to the `dirTree` function call.
2. Update `lib/exclusionManager.js` to properly handle static directory files in tree visualization.
3. Add clear distinction between file inclusion/exclusion for content extraction vs. tree visualization.
4. Add tests to verify that media files in the static directory appear correctly in tree output.

## Testing Steps

After implementing the changes:

1. Run `cx -t` and verify that media files in the static directory appear correctly
2. Run `cx -t static` to specifically check the static directory
3. Ensure that other functionality isn't affected by these changes

## Conclusion

The issue stems from inconsistent handling of media files between different operations. By properly passing and respecting the 'purpose' parameter and adding special handling for files in the static directory, we can ensure that the tree command shows a complete and accurate view of the project structure. 