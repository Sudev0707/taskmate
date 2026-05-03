import ShareMenu from 'react-native-share-menu';
import { DeviceEventEmitter } from 'react-native';
import { ShareIntentData } from '../domain/models/ShareData';
import { TaskCreationUseCase } from '../domain/usecases/TaskCreationUseCase';
import { TaskRepository } from '../data/repositories/TaskRepository';

export class ShareIntentService {
  private useCase: TaskCreationUseCase;

  constructor() {
    this.useCase = new TaskCreationUseCase(new TaskRepository());
  }

  private extractYouTubeData(text: string): ShareIntentData {
    let title = 'YouTube Video';
    let url = text;

    // Find URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      url = urls[0];
      const possibleTitle = text.replace(url, '').trim();
      if (possibleTitle) {
        title = possibleTitle;
      }
    }
    return { title, url, sourceApp: 'YouTube' };
  }

  public async handleShare(
    share: any,
    isColdStart: boolean = false,
  ): Promise<void> {
    if (
      !share ||
      !share.data ||
      (typeof share.data === 'string' ? share.data.length === 0 : false)
    )
      return;

    const rawData = Array.isArray(share.data) ? share.data[0].data : share.data;

    let shareData: ShareIntentData = { text: rawData };

    if (
      typeof rawData === 'string' &&
      (rawData.includes('youtube.com') || rawData.includes('youtu.be'))
    ) {
      shareData = this.extractYouTubeData(rawData);
    } else {
      shareData = { title: 'Shared Link', url: rawData, sourceApp: 'External' };
    }

    // Emit event to open the bottom sheet modal with pre-filled data
    DeviceEventEmitter.emit('onShareIntentReceived', {
      ...shareData,
      isColdStart,
    });
  }

  public setupListeners() {
    ShareMenu.getInitialShare(share => this.handleShare(share, true));
    const listener = ShareMenu.addNewShareListener(share =>
      this.handleShare(share, false),
    );
    return listener;
  }
}

export const shareIntentService = new ShareIntentService();
