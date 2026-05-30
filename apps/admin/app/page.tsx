import { redirect } from "next/navigation";

// Entry → dashboard. The (admin) shell guard redirects to /login when the
// session is missing.
export default function Home() {
  redirect("/dashboard");
}
