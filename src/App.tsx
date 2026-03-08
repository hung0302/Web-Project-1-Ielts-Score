import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Write from './pages/Write';
import Result from './pages/Result';
import { useState, useEffect } from 'react';

export default function App() {
  const [user, setUser] = useState<{ user_id: string; username: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: { user_id: string; username: string }) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        {user && (
          <nav className="bg-white shadow-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-indigo-600">IELTS Scorer</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-500">Welcome, {user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route
              path="/login"
              element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/register"
              element={!user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />}
            />
            <Route
              path="/"
              element={user ? <Home /> : <Navigate to="/login" />}
            />
            <Route
              path="/write/:promptId"
              element={user ? <Write user={user} /> : <Navigate to="/login" />}
            />
            <Route
              path="/result/:writingId"
              element={user ? <Result /> : <Navigate to="/login" />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
