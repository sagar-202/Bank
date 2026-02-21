import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes (Wrapped in MainLayout) */}
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/accounts" element={<MainLayout><Accounts /></MainLayout>} />
        <Route path="/transfers" element={<MainLayout><Transfer /></MainLayout>} />
        <Route path="/statements" element={<MainLayout><Statements /></MainLayout>} />
        <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
        <Route path="/security" element={<MainLayout><Security /></MainLayout>} />
        <Route path="/check-balance" element={<MainLayout><CheckBalance /></MainLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
