import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protects a screen so only users with the allowed roles can view it.
 * Navigates back with an alert if the role check fails.
 */
export function useRoleGuard(allowedRoles: string[]): { isAllowed: boolean } {
  const { user, isAuthenticated } = useAuth();
  const navigation = useNavigation();

  const isAllowed = isAuthenticated && !!user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigation.goBack();
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      navigation.goBack();
    }
  }, [isAuthenticated, user?.role]);

  return { isAllowed };
}
