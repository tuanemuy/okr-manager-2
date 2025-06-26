import { Filter, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { CreateObjectiveDialog } from "@/components/okr/CreateObjectiveDialog";
import { ObjectivesListing } from "@/components/okr/ObjectivesListing";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default async function OKRsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OKR管理</h1>
          <p className="text-gray-600 mt-2">目標と主要な結果を管理</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            フィルター
          </Button>
          <CreateObjectiveDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新しいOKR
            </Button>
          </CreateObjectiveDialog>
        </div>
      </div>

      <ObjectivesListing />
    </div>
  );
}
