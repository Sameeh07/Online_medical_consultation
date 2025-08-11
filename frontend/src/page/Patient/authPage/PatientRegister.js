// frontend/src/page/Patient/authPage/PatientLogin.js

import React, { useState } from 'react';
import LogoPic from '../../../img/Medical_research.svg';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { useFetchUser } from '../../../context/userContext';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const PatientLogin = () => {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState(null);
  const history               = useHistory();
  const { refetch }           = useFetchUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/patient/login`, {
        email,
        password
      });
      // backend responds { user, token }
      const { token } = res.data;
      localStorage.setItem('token', token);
      await refetch();
      history.push('/patient/dashboard');  // adjust to your patient landing page
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      console.error(err);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center font-fontPro bg-plightBlue">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <img src={LogoPic} alt="logo" className="mx-auto w-32" />
          <h2 className="mt-4 text-2xl font-semibold">Patient Login</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-4 p-2 border rounded-lg"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 p-2 border rounded-lg"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default PatientLogin;
