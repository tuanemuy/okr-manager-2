import { getCurrentUser } from "@/lib/auth";
import { HeaderClient } from "./HeaderClient";

export async function Header() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return <HeaderClient user={user} />;
}
