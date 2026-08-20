import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const passwordStrong = password.length >= 8 && /\d/.test(password) && /[A-Za-z]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!passwordStrong) {
      setError("Password must be at least 8 characters with a letter and a number");
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-5 bg-gradient-main">
      <div className="card w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">Create Account</h2>
        <p className="text-center text-gray-600 mb-8 text-sm">Join our platform</p>

        {error && <div className="error-alert mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-gray-900 font-semibold mb-2">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-900 font-semibold mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="At least 8 characters, 1 letter, 1 number"
              className="input-field"
            />
            {password.length > 0 && (
              <p className={`text-xs mt-1 ${passwordStrong ? "text-green-600" : "text-gray-500"}`}>
                {passwordStrong ? "✓ Strong enough" : "Needs 8+ chars, a letter, and a number"}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-gray-900 font-semibold mb-2">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirm your password"
              className="input-field"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-secondary transition">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
