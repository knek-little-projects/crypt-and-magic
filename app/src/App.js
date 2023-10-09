import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MapEditor from './MapEditor';
import MapPlayer from './MapPlayer';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<MapPlayer />} />
        <Route path="/editor" element={<MapEditor />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Play</Link></li>
        <li><Link to="/editor">Edit</Link></li>
      </ul>
    </nav>
  );
}

function HomePage() {
  return <div>Welcome to the Home Page!</div>;
}

function AboutPage() {
  return <div>About Us</div>;
}

function ContactPage() {
  return <div>Contact Us</div>;
}

function NotFound() {
  return <div>404: Page Not Found</div>;
}

export default App;
