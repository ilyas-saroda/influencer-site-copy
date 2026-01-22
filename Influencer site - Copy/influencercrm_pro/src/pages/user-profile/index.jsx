import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/ui/Sidebar';
import Header from '../../components/ui/Header';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userProfile?.full_name || user?.email?.split('@')[0] || 'User',
    email: user?.email || '',
    role: userProfile?.role || 'Super Admin',
    phone: userProfile?.phone || '',
    joinDate: userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
    lastUpdated: new Date().toLocaleDateString()
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // API call would go here
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <Header isCollapsed={isSidebarCollapsed} />
      
      <main className={`main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Profile</h1>
              <p className="text-muted-foreground">Manage your account information and preferences</p>
            </div>
            <Button
              variant={isEditing ? 'outline' : 'default'}
              iconName={isEditing ? 'X' : 'Edit2'}
              iconPosition="left"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Icon name="User" size={40} color="var(--color-primary)" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-foreground">{formData.fullName}</h2>
                  <p className="text-muted-foreground mt-1">{formData.email}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {formData.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Full Name */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isEditing 
                        ? 'border-input bg-background focus:ring-2 focus:ring-ring' 
                        : 'border-border bg-muted text-muted-foreground'
                    } transition-colors`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="+1 (555) 000-0000"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isEditing 
                        ? 'border-input bg-background focus:ring-2 focus:ring-ring' 
                        : 'border-border bg-muted text-muted-foreground'
                    } transition-colors`}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Role
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={formData.role}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
                  />
                </div>

                {/* Join Date */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Member Since
                  </label>
                  <input
                    type="text"
                    value={formData.joinDate}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
                  />
                </div>

                {/* Last Updated */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Last Updated
                  </label>
                  <input
                    type="text"
                    value={formData.lastUpdated}
                    disabled
                    className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center justify-between pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Changes will be saved to your account
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      iconName="Save"
                      iconPosition="left"
                      onClick={handleSave}
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 bg-destructive/5 border border-destructive/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Icon name="AlertTriangle" size={24} color="var(--color-destructive)" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">Danger Zone</h3>
                <p className="text-muted-foreground mb-4">
                  These actions cannot be undone. Please proceed with caution.
                </p>
                <Button
                  variant="outline"
                  className="border-destructive text-destructive hover:bg-destructive/5"
                  iconName="Lock"
                  iconPosition="left"
                >
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
