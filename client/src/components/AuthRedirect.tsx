import { useEffect } from "react";
import { useLocation } from "wouter";

export default function AuthRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (isLoggedIn) {
      setLocation("/issues");
    } else {
      setLocation("/login");
    }
  }, [setLocation]);

  return null;
}