import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [role, setRole] = useState(() => sessionStorage.getItem('role'));
  const [userid, setUserid] = useState(() => sessionStorage.getItem('userid'));

  const isExpired = (jwt) => {
    try {
      const [, payload] = jwt.split('.');
      const data = JSON.parse(atob(payload));
      if (!data.exp) return false;
      const nowSec = Math.floor(Date.now() / 1000);
      return data.exp <= nowSec;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    if (token) sessionStorage.setItem('token', token); else sessionStorage.removeItem('token');
    if (role) sessionStorage.setItem('role', role); else sessionStorage.removeItem('role');
    if (userid) sessionStorage.setItem('userid', userid); else sessionStorage.removeItem('userid');
  }, [token, role, userid]);

  const login = async (userid, password) => {
    const res = await api.post('/auth/login', { userid, password });
    // Write immediately to avoid race before first render
    sessionStorage.setItem('token', res.data.token);
    sessionStorage.setItem('role', res.data.role);
    sessionStorage.setItem('userid', userid);
    setToken(res.data.token);
    setRole(res.data.role);
    setUserid(userid);
    return res.data;
  };

  const signup = async (userid, password, courseId) => {
    const payload = { userid, password };
    if (courseId) payload.courseId = courseId;
    const res = await api.post('/auth/signup', payload);
    return res.data;
  };

  const logout = () => { setToken(null); setRole(null); setUserid(null); };

  // On first mount, clear expired/invalid tokens and install 401 interceptor
  useEffect(() => {
    if (token && isExpired(token)) {
      logout();
    }
    const respInterceptor = api.interceptors.response.use(
      r => r,
      err => {
        if (err?.response?.status === 401) {
          logout();
        }
        return Promise.reject(err);
      }
    );
    return () => api.interceptors.response.eject(respInterceptor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ token, role, userid, login, signup, logout }), [token, role, userid]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
