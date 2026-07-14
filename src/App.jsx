import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import UploadAvatar from './pages/UploadAvatar';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route element={<PrivateRoute />}>
              <Route path="/" element={
                 <>
                   <Navbar />
                   <div className="container mt-4">
                     <Feed />
                   </div>
                 </>
              } />
              <Route path="/posts/:id" element={
                 <>
                   <Navbar />
                   <div className="container mt-4">
                     <PostDetail />
                   </div>
                 </>
              } />
              <Route path="/users/:username" element={
                 <>
                   <Navbar />
                   <div className="container mt-4">
                      <Profile />
                   </div>
                 </>
              } />
              <Route path="/upload-avatar" element={
                 <>
                   <Navbar />
                   <div className="container mt-4">
                      <UploadAvatar />
                   </div>
                 </>
              } />
            </Route>
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
