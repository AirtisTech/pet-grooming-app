import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreateOrder from './pages/CreateOrder';
import OrderList from './pages/OrderList';
import GroomerList from './pages/GroomerList';
import GroomerProfile from './pages/GroomerProfile';
import MyProfile from './pages/MyProfile';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
        
        {/* Protected routes */}
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />
        <Route path="/orders/new" element={user ? <CreateOrder /> : <Navigate to="/login" />} />
        <Route path="/orders" element={user ? <OrderList /> : <Navigate to="/login" />} />
        <Route path="/groomers" element={user ? <GroomerList /> : <Navigate to="/login" />} />
        <Route path="/groomers/:id" element={user ? <GroomerProfile /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <MyProfile /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
