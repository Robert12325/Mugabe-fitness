// Expo's defaults, plus the repository's shared packages/ folder so the app
// can bundle the exercise catalogue it shares with the website. The import
// alias itself comes from tsconfig.json ("@mugabe/fitness-content").
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../../packages")];

// Files in packages/ have no node_modules of their own; the helpers Babel
// adds to them (such as @babel/runtime) come from the app's.
config.resolver.nodeModulesPaths = [
  ...(config.resolver.nodeModulesPaths ?? []),
  path.resolve(__dirname, "node_modules"),
];

module.exports = config;
