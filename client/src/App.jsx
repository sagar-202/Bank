import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CheckBalance from "./pages/CheckBalance";
import Transfer from "./pages/Transfer";
import Accounts from "./pages/Accounts";
import Statements from "./pages/Statements";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import MainLayout from "./components/MainLayout";

// Single layout shell — Sidebar & Header only mount once
function ProtectedLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes — single layout shell */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transfers" element={<Transfer />} />
          <Route path="/statements" element={<Statements />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/security" element={<Security />} />
          <Route path="/check-balance" element={<CheckBalance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
