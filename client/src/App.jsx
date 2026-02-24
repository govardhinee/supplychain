import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TrackProduct from './pages/TrackProduct';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import { BlockchainContext } from './context/BlockchainContext';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useContext(BlockchainContext);
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/track" element={<TrackProduct />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
