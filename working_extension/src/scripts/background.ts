import { ACTIONS } from '../shared/constants';

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'popup') return;
  port.onDisconnect.addListener(() => {
    const options = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(options, ([tab]) => {
      const msg = { action: ACTIONS.DISCONNECT, removeOverlay: true };
      chrome.tabs.sendMessage(tab.id, msg);
    });
  });
});

let recording = false;

chrome.runtime.onMessage.addListener((message) => {
  if (message.target === 'service-worker' && message.type === 'stopped-recording') {
    console.log('Stopped recording.')
    recording = false;
    chrome.action.setIcon({ path: 'icons/not-recording.png' });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  const existingContexts = (chrome.runtime as any).getContexts({});  // Type assertion here

  const offscreenDocument = existingContexts.find(
    (c: any) => c.contextType === 'OFFSCREEN_DOCUMENT'  // Type assertion here
  );

  if (!offscreenDocument) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA' as any],  // Type assertion here
      justification: 'Recording from chrome.tabCapture API'
    });
  } else {
    recording = offscreenDocument.documentUrl.endsWith('#recording');
  }

  if (recording) {
    console.log('Stopping recording.')
    chrome.runtime.sendMessage({
      type: 'stop-recording',
      target: 'offscreen'
    });
    chrome.action.setIcon({ path: 'icons/not-recording.png' });
    return;
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Check if the message is intended for the service worker
    if (message.target === 'service-worker') {
      if (message.type === 'start-recording') {
        // Logic to start recording
        console.log('Start recording received');
        // ... your start recording logic here ...
      } else if (message.type === 'stop-recording') {
        // Logic to stop recording
        console.log('Stop recording received');
        // ... your stop recording logic here ...
      }
    }
  });
  

  // Fix for the third issue
  chrome.tabCapture.getMediaStreamId({
    targetTabId: tab.id
  }, (streamId) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
      return;
    }

    chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: streamId
    });
  
    console.log('Starting recording.');
    chrome.action.setIcon({ path: '/icons/recording.png' });
    recording = true;
  });
});
