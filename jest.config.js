module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // React Navigation and friends ship untranspiled ESM; let Babel handle them.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-vector-icons)/)',
  ],
};
