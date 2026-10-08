import { lazy } from "react";

import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";

import { ROUTES } from "./routeConstants";
import ProtectedRoute from "./guards/ProtectedRoute";

const LoginPage = lazy(() =>
    import("../pages/LoginPage")
);

const DashboardPage = lazy(() =>
    import("../pages/AdminDashboardPage")
);

const NotFoundPage = lazy(() =>
    import("../pages/error/NotFound")
);

export const routeConfig = [
    {
        element: <AuthLayout />,
        children: [
            {
                path: ROUTES.LOGIN,
                element: <LoginPage />,
            },
        ],
    },

    {
        element: (
            <ProtectedRoute>
                <AdminLayout />
            </ProtectedRoute>
        ),

        children: [
            {
                path: ROUTES.DASHBOARD,
                element: <DashboardPage />
            }
        ]
    },

    {
        path: ROUTES.NOT_FOUND,
        element: <NotFoundPage />,
    },
];