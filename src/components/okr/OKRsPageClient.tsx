"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateObjectiveDialog } from "@/components/okr/CreateObjectiveDialog";
import { FilterableObjectivesListing } from "@/components/okr/FilterableObjectivesListing";
import {
  OKRFilterDialog,
  type OKRFilters,
} from "@/components/okr/OKRFilterDialog";
import { Button } from "@/components/ui/button";

import type { User } from "@/core/domain/user/types";

interface OKRsPageProps {
  user: User;
}

export function OKRsPageClient({ user }: OKRsPageProps) {
  const [filters, setFilters] = useState<OKRFilters>({});
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleFiltersChange = (newFilters: OKRFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OKR管理</h1>
          <p className="text-gray-600 mt-2">目標と主要な結果を管理</p>
        </div>
        <div className="flex space-x-2">
          <OKRFilterDialog
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <CreateObjectiveDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新しいOKR
            </Button>
          </CreateObjectiveDialog>
        </div>
      </div>

      <FilterableObjectivesListing filters={filters} user={user} />
    </div>
  );
}
