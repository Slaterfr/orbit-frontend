import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import UploadAvatar from './pages/UploadAvatar';
import CreatePost from './pages/CreatePost';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/landing" element={<Landing />} />
              
              <Route element={<PrivateRoute />}>
                <Route path="/" element={
                   <>
                     <Navbar />
                     <div className="container mt-4">
                       <Feed />
                     </div>
                     <BottomNav />
                   </>
                } />
                <Route path="/create" element={
                   <>
                     <Navbar />
                     <div className="container mt-4">
                       <CreatePost />
                     </div>
                     <BottomNav />
                   </>
                } />
                <Route path="/posts/:id" element={
                   <>
                     <Navbar />
                     <div className="container mt-4">
                       <PostDetail />
                     </div>
                     <BottomNav />
                   </>
                } />
                <Route path="/users/:username" element={
                   <>
                     <Navbar />
                     <div className="container mt-4">
                        <Profile />
                     </div>
                     <BottomNav />
                   </>
                } />
                <Route path="/upload-avatar" element={
                   <>
                     <Navbar />
                     <div className="container mt-4">
                        <UploadAvatar />
                     </div>
                     <BottomNav />
                   </>
                } />
              </Route>
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
