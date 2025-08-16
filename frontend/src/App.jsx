// src/App.jsx
import React, { useEffect, useState, createContext } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import api from "./api";
import "./style.css";

// components
import Navbar from "./components/Navbar";

// pages
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import OnboardingWizard from "./pages/OnboardingWizard";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Dashboard from "./pages/Dashboard";
import Feed from "./pages/Feed";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import PostJob from "./pages/PostJob";
import Connections from "./pages/Connections";
import Suggestions from "./pages/Suggestions";
import UserProfileView from "./pages/UserProfileView";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import ChatWindow from "./pages/ChatWindow";
import CreatePost from "./pages/CreatePost";

export const AuthContext = createContext(null);

const Protected = ({ children, user }) => {
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// New component to handle authentication state and navigation
function AuthWrapper() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const loadMe = async () => {
    try {
      const { data } = await api.get("/api/profile");
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refresh: loadMe }}>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/onboarding"
            element={<Protected user={user}><OnboardingWizard /></Protected>}
          />
          <Route
            path="/profile"
            element={<Protected user={user}><Profile /></Protected>}
          />
          <Route
            path="/edit-profile"
            element={<Protected user={user}><EditProfile /></Protected>}
          />
          <Route
            path="/dashboard"
            element={<Protected user={user}><Dashboard /></Protected>}
          />
          <Route
            path="/feed"
            element={<Protected user={user}><Feed /></Protected>}
          />
          <Route
            path="/create-post"
            element={<Protected user={user}><CreatePost /></Protected>}
          />
          <Route
            path="/jobs"
            element={<Protected user={user}><Jobs /></Protected>}
          />
          <Route
            path="/jobs/:id"
            element={<Protected user={user}><JobDetails /></Protected>}
          />
          <Route
            path="/post-job"
            element={<Protected user={user}><PostJob /></Protected>}
          />
          <Route
            path="/connections"
            element={<Protected user={user}><Connections /></Protected>}
          />
          <Route
            path="/suggestions"
            element={<Protected user={user}><Suggestions /></Protected>}
          />
          <Route
            path="/users/:id"
            element={<Protected user={user}><UserProfileView /></Protected>}
          />
          <Route
            path="/notifications"
            element={<Protected user={user}><Notifications /></Protected>}
          />
          <Route
            path="/settings"
            element={<Protected user={user}><Settings /></Protected>}
          />
          <Route
            path="/chat"
            element={<Protected user={user}><ChatWindow /></Protected>}
          />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <Router>
      <AuthWrapper />
    </Router>
  );
}