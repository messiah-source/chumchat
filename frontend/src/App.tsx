import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Chat = lazy(() => import('./pages/Chat'));
const Search = lazy(() => import('./pages/Search'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Shop = lazy(() => import('./pages/Shop'));
const ContestsList = lazy(() => import('./pages/Contests'));
const ContestDetail = lazy(() => import('./pages/Contests').then((m) => ({ default: m.ContestDetail })));

function Spinner() {
  return (
    <div className="min-h-screen dark:bg-cyber-bg-outer bg-[#3a5580] flex items-center justify-center">
      <span className="font-mono text-cyber-cyan text-xl animate-blink">CHUM_</span>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/contests" element={<ContestsList />} />
        <Route path="/contests/:id" element={<ContestDetail />} />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
