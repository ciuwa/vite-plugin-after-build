# vite-plugin-after-build

## Overview

`vite-plugin-after-build` is a Vite plugin designed to automate version management for your projects. During the build process, this plugin automatically reads and updates the version number in the `package.json` file. If the build fails, the version number remains unchanged, ensuring consistency between the version number and the build status.

## Installation

You can install this plugin using npm or yarn:

```bash
npm install vite-plugin-after-build -D
```

Or

```bash
yarn add vite-plugin-after-build -D
```

## Usage

### Basic Usage

Introduce and use the plugin in your Vite configuration file (`vite.config.js` or `vite.config.ts`):

```javascript
// vite.config.js or vite.config.ts
import { defineConfig } from 'vite';
import afterBuild from 'vite-plugin-after-build';

export default defineConfig({
  plugins: [
    afterBuild()
  ],
  // ... other configuration options
});
```
After running the `vite build` command
you'll notice that the version number in the `package.json` file has been automatically incremented (default is `patch` type).
- `0.0.1` => `0.0.2`
- `0.0.100` => `0.1.0`

### Configuration Options

Custom configurations
- `updateVersion`: The threshold option, defaulting to 100, specifies the limit for the patch version. When the patch number exceeds this threshold, the minor version is incremented, and the patch number resets to 0. For example, from version 1.0.100, the next version would be 1.1.0
- `gitCommit`: git commit

### Build Process

1. When you run the Vite build command (e.g., `vite build`), the `vite-plugin-after-build` plugin is automatically loaded and executed.
2. The plugin reads and parses the current version number from the `package.json` file.
3. Based on the configuration (default is `patch` type), the plugin calculates and generates a new version number.
4. Before the build succeeds, the plugin updates the version number in the `package.json` file and saves it back to the file.
5. If the build fails, the version number remains unchanged.
