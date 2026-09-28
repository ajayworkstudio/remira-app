import { redirect } from "next/navigation";

// proxy.ts handles "/" (→ /home or /login); this is a fallback.
export default function Index() {
  redirect("/home");
}
