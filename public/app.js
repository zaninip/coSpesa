import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.43.0/+esm";

const supabaseUrl = "https://rwfloolnybguuswbrwre.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Zmxvb2xueWJndXVzd2Jyd3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2Nzg4NDQsImV4cCI6MjA3MzI1NDg0NH0.fDqj7LeAPMEP9FjemFA_LE-K4xP6JkTw0rQsQ6OU-X8";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth guard
export async function requireAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  return session.user;
}
