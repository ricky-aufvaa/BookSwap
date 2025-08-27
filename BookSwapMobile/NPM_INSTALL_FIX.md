# NPM Install Fix

## Problem
The `npm install` command was failing with a dependency resolution error:

```
npm error ERESOLVE could not resolve
npm error Could not resolve dependency:
npm error peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from @lottiefiles/dotlottie-react@0.6.5
```

The issue was that the project uses React 19.0.0, but `@lottiefiles/dotlottie-react` only supports React versions 16, 17, or 18.

## Solution
1. **Removed the conflicting package**: Removed `@lottiefiles/dotlottie-react` from package.json since we already use `lottie-react-native` for Lottie animations.

2. **Used legacy peer deps**: If you encounter similar issues in the future, you can use:
   ```bash
   npm install --legacy-peer-deps
   ```

## Current Status
✅ NPM install now works correctly
✅ All dependencies are properly resolved
✅ App can be built and started

## For Future Development
- Use `npm install --legacy-peer-deps` if you encounter peer dependency conflicts
- The project uses `lottie-react-native` for all Lottie animations (not `@lottiefiles/dotlottie-react`)
- React version is 19.0.0 - ensure any new packages are compatible with this version

## Commands that work:
```bash
npm install --legacy-peer-deps
npm start
npm run android
npm run ios
npm run web
