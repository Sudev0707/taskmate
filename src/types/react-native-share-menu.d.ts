declare module 'react-native-share-menu' {
  export interface ShareData {
    mimeType: string;
    data: string | string[];
    extraData?: any;
  }

  export interface ShareMenuType {
    getInitialShare(callback: (share: ShareData | undefined) => void): void;
    addNewShareListener(callback: (share: ShareData) => void): {
      remove: () => void;
    };
  }

  const ShareMenu: ShareMenuType;
  export default ShareMenu;
}
