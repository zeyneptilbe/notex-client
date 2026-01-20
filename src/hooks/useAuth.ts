import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import type { AuthContextType } from "../contexts/AuthContext";

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  // Debug için
  console.log("Auth Context:", {
    user: context.user,
    isSuperAdmin: context.isSuperAdmin,
    role: context.user?.role,
  });

  return context;
}
