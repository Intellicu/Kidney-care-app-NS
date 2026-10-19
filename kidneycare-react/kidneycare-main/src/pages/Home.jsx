import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/Dashboard', { replace: true });
  }, [navigate]);

  return <Dashboard />;
}