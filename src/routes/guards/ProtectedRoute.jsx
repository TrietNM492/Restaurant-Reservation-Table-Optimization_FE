import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/useAuthStore';
import { ROUTES } from '../routeConstants';

function ProtectedRoute({ children }) {
  const { isAuthenticated, accessToken } = useAuthStore();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return children;
}

export default ProtectedRoute;