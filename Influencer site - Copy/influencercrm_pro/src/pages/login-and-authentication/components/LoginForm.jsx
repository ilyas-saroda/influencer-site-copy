import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const LoginForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const validateEmail = (email) => {
    if (!email || email.trim() === '') {
      return 'Email is required';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex?.test(email)) {
      return 'Please enter a valid email address';
    }
    
    return null;
  };

  const validatePassword = (password) => {
    if (!password || password.trim() === '') {
      return 'Password is required';
    }
    
    if (password?.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    return null;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear validation error when user types
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    console.log('🔵 Form submitted:', { email: formData?.email, hasPassword: !!formData?.password });
    
    // Clear previous validation errors
    setValidationError(null);
    
    // Basic validation
    const emailError = validateEmail(formData?.email);
    const passwordError = validatePassword(formData?.password);
    
    if (emailError || passwordError) {
      const errorMsg = emailError || passwordError;
      console.error('❌ Validation error:', errorMsg);
      setValidationError(errorMsg);
      return;
    }
    
    console.log('✅ Validation passed, calling onSubmit');
    onSubmit(formData);
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic here
    console.log('Forgot password clicked');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(error || validationError) && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Icon name="AlertCircle" size={20} color="var(--color-destructive)" className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive mb-1">Authentication Error</p>
              <p className="text-xs text-destructive/90 whitespace-pre-line">{error || validationError}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <Input
          label="Email Address"
          type="email"
          name="email"
          id="email"
          placeholder="your.email@example.com"
          value={formData?.email}
          onChange={handleChange}
          required
          disabled={isLoading}
          className="mb-4"
          autoComplete="email"
        />
      </div>
      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          id="password"
          placeholder="Enter your password"
          value={formData?.password}
          onChange={handleChange}
          required
          disabled={isLoading}
          className="mb-2"
          autoComplete="current-password"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors duration-200"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          disabled={isLoading}
        >
          <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={18} />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <Checkbox
          label="Remember me"
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleChange}
          disabled={isLoading}
        />
        
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-primary hover:underline transition-colors duration-200"
          disabled={isLoading}
        >
          Forgot password?
        </button>
      </div>
      <Button
        type="submit"
        variant="default"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        iconName="LogIn"
        iconPosition="right"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Authorized team members only. Contact your administrator for access.
        </p>
      </div>
    </form>
  );
};

export default LoginForm;