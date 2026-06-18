// frontend/src/App.tsx
import Admin from './pages/Admin';
import Workspace from './pages/Workspace';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Shifts from './pages/Shifts';
import Tasks from './pages/Tasks';
import Profile from './pages/Profile'; 
import Layout from './components/Layout';
import KnowledgeBase from './pages/KnowledgeBase';
import RestaurantMenu from './pages/RestaurantMenu';
import SafetyRules from './pages/SafetyRules';
import Accounting from './pages/Accounting'; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/news" element={<News />} /> 
          <Route path="/shifts" element={<Shifts />} /> 
          <Route path="/tasks" element={<Tasks />} /> 
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/profile" element={<Profile />} /> 
          
          {/* Новые маршруты */}
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/menu" element={<RestaurantMenu />} />
          <Route path="/safety" element={<SafetyRules />} />
          
          {/* ДОБАВИЛИ: Маршрут для модуля учета и зарплат */}
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}