import { createApiClient } from "@the-wings/api-client";
import type { AuthSession, UserRole } from "@the-wings/types";

export interface GoogleAuthOptions {
  credential: string;
  role?: UserRole;
  apiUrl?: string;
}

export async function loginWithGoogle({ credential, role = "CUSTOMER", apiUrl }: GoogleAuthOptions): Promise<AuthSession> {
  const api = createApiClient(apiUrl ? { baseUrl: apiUrl } : undefined);
  const response = await api.loginWithGoogle({
    credential,
    role
  });
  return response.data;
}

export async function loginWorkerWithGoogle(credential: string, apiUrl?: string): Promise<AuthSession> {
  return loginWithGoogle({
    credential,
    role: "STAFF",
    apiUrl
  });
}

export async function loginCustomerWithGoogle(credential: string, apiUrl?: string): Promise<AuthSession> {
  return loginWithGoogle({
    credential,
    role: "CUSTOMER",
    apiUrl
  });
}
