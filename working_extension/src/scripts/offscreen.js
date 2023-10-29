chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target === 'offscreen') {
      switch (message.type) {
        case 'start-recording':
          startRecording(message.data);
          break;
        case 'stop-recording':
          stopRecording();
          break;
        default:
          throw new Error('Unrecognized message:', message.type);
      }
    }
  });
  
  let audioRecorder;
  let audioData = [];
  let originalMediaStream; // Variable to keep a reference to the original media stream
  let audioContext; // Variable to keep a reference to the AudioContext
  
  async function startRecording(streamId) {
    console.log('STARTING AUDIO RECORDING - OFFSCREEN.JS')
    if (audioRecorder?.state === 'recording') {
      throw new Error('Called startRecording while recording is in progress.');
    }
  
    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
  
    originalMediaStream = media; // Store the original media stream
  
    // Create a MediaStreamAudioDestinationNode to capture the audio stream.
    const output = new AudioContext();
    audioContext = output; // Store the AudioContext
  
    const source = output.createMediaStreamSource(media);
    const audioDestination = output.createMediaStreamDestination();
    source.connect(audioDestination);
    source.connect(output.destination);  // Play audio to the user.
  
    // Start recording audio.
    audioRecorder = new MediaRecorder(audioDestination.stream, { mimeType: 'audio/webm' });
    audioRecorder.ondataavailable = (event) => audioData.push(event.data);
  
    audioRecorder.onstop = () => {
      // Create the blob for audio stream
      const audioBlob = new Blob(audioData, { type: 'audio/webm' });
  
      // Clear state ready for next recording
      audioRecorder = undefined;
      audioData = [];
  
      // Store the audio blob in a variable for later use
      audioVariable = audioBlob;
  
      // Send message to service worker to update recording state
      chrome.runtime.sendMessage({type: 'stopped-recording', target: 'service-worker'});
    };
  
    audioRecorder.start();
  
    // Record the current state in the URL.
    window.location.hash = 'recording';
  }
  
  async function stopRecording() {
    console.log('Stopping audio recording OFFSCREEN.JS.')
    audioRecorder.stop();
  
    // Stopping the tracks of the original media stream
    originalMediaStream.getTracks().forEach((t) => t.stop());
  
    // Close the AudioContext
    audioContext.close();
  
    // Update current state in URL
    window.location.hash = '';
  }
  