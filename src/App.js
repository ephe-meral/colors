import React, { useState } from 'react';
import './App.css';
import { Page } from 'react-onsenui';
import { EyeDropper } from './components/EyeDropper';

const App = () => {
  const [tab, setTab] = useState();

  return (
    <Page>
      <EyeDropper />
    </Page>
  );
};

export default App;
