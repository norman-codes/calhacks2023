import React, { useEffect, useState } from 'react';
import { render } from 'react-dom';
import { STYLES } from '../shared/constants';
import './popup.css';
import AuthenticatedMenu from './components/authenticated-menu';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { HumeLogoLink } from '../shared/components';
import UnauthenticatedMenu from './components/unauthenticated-menu';
import Button from '@mui/material/Button'; // Import Button from MUI

const Popup: React.FC<{}> = () => {
  useEffect(() => {
    chrome.runtime.connect({ name: 'popup' });
    chrome.storage.sync.get(['apiKey'], ({ apiKey }) => {
      setAuthenticated(!!apiKey);
    });
  }, []);

  const [authenticated, setAuthenticated] = useState(false);
  const [isRecording, setIsRecording] = useState(false); // State to track recording status

  const toggleRecording = () => {
    // Updated message structure
    chrome.runtime.sendMessage({
      target: 'service-worker',
      type: isRecording ? 'stop-recording' : 'start-recording'
    });
    setIsRecording(!isRecording); // Toggle the recording state
};


  return (
    <Card sx={STYLES.cardStyles}>
      <CardContent sx={STYLES.cardContentStyles}>
        <HumeLogoLink />
        <Divider sx={{ marginTop: '12px' }} />
        {!authenticated ? (
          <UnauthenticatedMenu />
        ) : (
          <AuthenticatedMenu />
        )}
        {/* Add recording button */}
        <Button
          variant="contained"
          color="primary"
          onClick={toggleRecording}
          sx={{ marginTop: '12px' }}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
      </CardContent>
    </Card>
  );
};

const root = document.createElement('div');
root.setAttribute('class', 'popup-container');
document.body.appendChild(root);
render(<Popup />, root);
