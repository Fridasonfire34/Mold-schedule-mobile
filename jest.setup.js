/* eslint-env jest */
// The camera is a native view; the test only needs something to render.
jest.mock('react-native-camera-kit', () => ({
  Camera: () => null,
  CameraType: { Back: 'back', Front: 'front' },
}));

jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(async () => ({ didCancel: true })),
}));

// AsyncStorage v3 has no bundled Jest mock; an in-memory store is enough here.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const AsyncStorage = {
    getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      store.delete(key);
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
  return { __esModule: true, default: AsyncStorage };
});
