import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import MapEditor from './MapEditor';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<MapEditor />} />
        <Route path="/player" element={<ContactPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/editor">Map Editor</Link></li>
        <li><Link to="/contact">Contact</Link></li>
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
