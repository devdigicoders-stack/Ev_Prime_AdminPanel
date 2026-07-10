import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Save token and user details to localStorage
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify(data));
      
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error) {
      setErrorMsg(error.message);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-gray-50">
      
      {/* Image Area - Top on Mobile, Left on Desktop */}
      <div className="w-full h-[35vh] min-h-[250px] md:min-h-full md:h-full md:w-1/2 bg-[#E6F3E6] relative">
         <img 
           src="/onboarding_bg.png" 
           alt="e-Bharat EV Background" 
           className="w-full h-full object-cover object-top md:object-center"
         />
         {/* Subtle gradient overlay at the bottom for mobile */}
         <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/20 to-transparent md:hidden"></div>
      </div>

      {/* Form Area - Bottom on Mobile, Right on Desktop */}
      <div className="flex-1 md:flex-none md:w-1/2 w-full h-[65vh] md:h-full flex flex-col relative bg-white px-6 sm:px-12 lg:px-20 pt-8 pb-6 overflow-y-auto rounded-t-[2.5rem] md:rounded-none -mt-10 md:mt-0 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] md:shadow-none">
        
        <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-8 md:mb-10 mt-2 md:mt-0">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 md:mb-3">Welcome Back! 👋</h2>
            <p className="text-gray-500 text-xs md:text-sm">Sign in to continue to E-Bharat Admin Panel</p>
          </div>

          {/* Form */}
          <form className="space-y-5 md:space-y-6" onSubmit={handleLogin}>
            
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                {errorMsg}
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-xs md:text-sm font-semibold text-gray-700" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 md:py-3.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] outline-none transition-all text-sm md:text-base"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 md:space-y-2">
              <label className="block text-xs md:text-sm font-semibold text-gray-700" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 md:py-3.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8CC63F] focus:border-[#8CC63F] outline-none transition-all pr-12 text-sm md:text-base"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} className="md:w-5 md:h-5" /> : <Eye size={18} className="md:w-5 md:h-5" />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center justify-between text-xs md:text-sm mt-1">
              <label className="flex items-center text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  className="mr-1.5 md:mr-2 w-3.5 h-3.5 md:w-4 md:h-4 rounded border-gray-300 text-[#8CC63F] focus:ring-[#8CC63F]"
                />
                <span className="font-medium">Remember me</span>
              </label>
              <a href="#" className="font-semibold text-[#8CC63F] hover:text-[#8CC63F] transition-colors">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#8CC63F] hover:bg-[#116631] text-white font-semibold py-3 md:py-3.5 rounded-lg transition-colors duration-200 mt-4 md:mt-6 shadow-md hover:shadow-lg active:scale-[0.99] flex justify-center items-center text-sm md:text-[15px] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 md:mt-8 text-center flex flex-col items-center justify-center space-y-1.5 md:space-y-2 pb-2">
          <p className="text-[10px] md:text-xs text-gray-400 font-medium">
            © E-Bharat EV. All rights reserved. crafted with ❤️ by <span><a href="https://digicoders.in" target="_blank" className='text-green-800 font-bold underline'>Team Digicoders</a></span>
          </p>
          <div className="flex items-center justify-center text-[10px] md:text-xs font-semibold text-[#8CC63F] space-x-1.5">
            <Lock size={10} className="md:w-3 md:h-3" strokeWidth={3} />
            <span>Secure</span>
            <span className="text-gray-300 px-0.5 md:px-1">•</span>
            <span>Reliable</span>
            <span className="text-gray-300 px-0.5 md:px-1">•</span>
            <span>Sustainable</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginView;
