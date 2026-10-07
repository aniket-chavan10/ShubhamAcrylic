import { FC, ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_URL } from "../utils/apiUtils";
import BrandLogo from "./BrandLogo";
import { Spinner } from "./ui";

const ProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                // Verify session with the backend
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setIsAuthenticated(true);
                } else {
                    sessionStorage.removeItem("token");
                    setIsAuthenticated(false);
                }
            } catch (error) {
                sessionStorage.removeItem("token");
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    if (isAuthenticated === null) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-paper">
                <BrandLogo className="h-16 w-16 rounded-2xl ring-1 ring-line" />
                <Spinner />
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
