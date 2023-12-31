import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MapEditor from './MapEditor';
import MapPlayer from './MapPlayer';
import TestComponent from './TestComponent';
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<MapPlayer />} />
          <Route path="/editor" element={<MapEditor />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Play</Link></li>
        <li><Link to="/editor">Edit</Link></li>
        <li><Link to="/test">Test</Link></li>
      </ul>
    </nav>
  );
}

function TestPage() {
  return <TestComponent />
}

function NotFound() {
  return <div>404: Page Not Found</div>;
}

export default App;
