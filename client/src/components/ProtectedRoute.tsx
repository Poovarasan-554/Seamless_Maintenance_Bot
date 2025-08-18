import { useEffect } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      setLocation("/login");
    }
  }, [setLocation]);

  const isLoggedIn = localStorage.getItem("isLoggedIn");
  
  if (!isLoggedIn) {
    return null; // Don't render anything while redirecting
  }

  return <>{children}</>;
}