import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'dygraphs/dist/dygraph.min.css';
import './index.css';
import App from './App';
import ErrorWrapper from './Error';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
    <ErrorWrapper>
      <App/>
    </ErrorWrapper>,
    document.getElementById('root')
);
registerServiceWorker();
