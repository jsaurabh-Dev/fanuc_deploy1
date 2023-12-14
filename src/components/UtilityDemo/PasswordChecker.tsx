// PasswordChecker.tsx
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';


interface PasswordCheckerProps {
    onPasswordCheck: (passwordExists: boolean) => void;
  }

const PasswordChecker: React.FC<PasswordCheckerProps> = ({ onPasswordCheck }) => {
  const [password, setPassword] = useState<string>('');
  const [passwordExists, setPasswordExists] = useState<boolean | null>(null);

  const handleCheckPassword = async () => {
    try {
      const response = await fetch('http://13.200.129.119:3000/v1/fanucPass/checkPassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const result = await response.json();
        setPasswordExists(result.passwordExists);
        onPasswordCheck(result.passwordExists);
      } else {
        console.error('Error checking password:', response.statusText);
      }
    } catch (error: any) {
      console.error('Error checking password:', error.message);
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center align-items-center" style={{ height: '500px' }}>
      <div className="card" style={{ width: '300px' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Sign In</h2>
          <div className="mb-3">
            <label htmlFor="passwordInput" className="form-label">
              Enter Password:
            </label>
            <input
              type="password"
              id="passwordInput"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="d-grid">
            <button
              className="btn btn-primary"
              onClick={handleCheckPassword}
            >
              Login
            </button>
          </div>
          {passwordExists !== null && (
            <div className="mt-3">
              {passwordExists ? (
                <p className="text-success">Logged In</p>
              ) : (
                <p className="text-danger">Invalid Credential</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordChecker;
