import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '@/context/ProfileContext';
import { toast } from 'sonner';

export const useLocationGuard = () => {
  const { profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;
    
    // Don't redirect if already on the relevant pages
    if (location.pathname === '/dashboard/update-profile') return;
    if (location.pathname === '/profile-form') return;

    // 1. If no profile exists, redirect to profile creation
    if (!profile) {
      toast.info("Please set up your profile to continue", {
        description: "You need to complete your profile before accessing the dashboard.",
        id: "profile-guard", // Prevent duplicate toasts
      });
      navigate('/profile-form', { replace: true });
      return;
    }

    // 2. If profile exists but missing location, force update
    if (!profile.location?.city || !profile.location?.country) {
      toast.info("Location Required", {
        description: "Please update your profile with your current location to continue.",
        id: "location-guard", // Prevent duplicate toasts
      });
      navigate('/dashboard/update-profile', { replace: true });
    }
  }, [profile, isLoading, navigate, location.pathname]);
};
