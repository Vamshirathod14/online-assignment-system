import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedRole = localStorage.getItem('role');

    if (token && savedUser && savedRole) {
      try {
        setUser(JSON.parse(savedUser));
        setRole(savedRole);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, userType) => {
    const endpoint = userType === 'admin' ? '/admin/login' : '/students/login';
    const { data } = await api.post(endpoint, { email, password });

    const userData = data.data.user || data.data.admin || data.data.student;
    const token = data.data.token;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userType);

    setUser(userData);
    setRole(userType);
    return data;
  };

  const register = async (formData, userType) => {
    const endpoint = userType === 'admin' ? '/admin/register' : '/students/register';
    const { data } = await api.post(endpoint, formData);

    const userData = data.data.user || data.data.admin || data.data.student;
    const token = data.data.token;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userType);

    setUser(userData);
    setRole(userType);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
