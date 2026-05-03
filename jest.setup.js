jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@notifee/react-native', () =>
  require('@notifee/react-native/jest-mock'),
);

jest.mock('react-native-share-menu', () => ({
  getInitialShare: jest.fn(() => Promise.resolve(null)),
  addNewShareListener: jest.fn(),
  clearSharedText: jest.fn(),
}));
