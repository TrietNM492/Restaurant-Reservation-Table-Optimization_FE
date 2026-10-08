import { Navigate } from "react-router-dom";

import { ROUTES } from "../routeConstants";

function ProtectedRoute({ children }) {

    const accessToken =
        localStorage.getItem("accessToken");

    if (!accessToken) {
        return (
            <Navigate
                to={ROUTES.LOGIN}
                replace
            />
        );
    }

    return children;
}

export default ProtectedRoute;