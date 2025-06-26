import { redirect } from "next/navigation";
import { OKRsPageClient } from "@/components/okr/OKRsPageClient";
import { getCurrentUser } from "@/lib/auth";

export default async function OKRsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <OKRsPageClient user={user} />;
}
