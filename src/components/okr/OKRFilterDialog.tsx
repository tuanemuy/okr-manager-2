"use client";

// Using native Date formatting instead of date-fns
import { CalendarIcon, Filter, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type OKRFilters = {
  status?: "draft" | "active" | "completed" | "cancelled";
  type?: "personal" | "team" | "organization";
  startDate?: Date;
  endDate?: Date;
  progressMin?: number;
  progressMax?: number;
};

interface OKRFilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OKRFilters;
  onFiltersChange: (filters: OKRFilters) => void;
  onClearFilters: () => void;
}

export function OKRFilterDialog({
  isOpen,
  onOpenChange,
  filters,
  onFiltersChange,
  onClearFilters,
}: OKRFilterDialogProps) {
  const [localFilters, setLocalFilters] = useState<OKRFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onOpenChange(false);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
    onOpenChange(false);
  };

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null,
  ).length;

  return (
    <>
      <Button variant="outline" onClick={() => onOpenChange(true)}>
        <Filter className="mr-2 h-4 w-4" />
        フィルター
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-2 px-2 py-0.5 text-xs">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>OKRフィルター</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label>ステータス</Label>
              <Select
                value={localFilters.status || ""}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    status: value
                      ? (value as
                          | "draft"
                          | "active"
                          | "completed"
                          | "cancelled")
                      : undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべてのステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべてのステータス</SelectItem>
                  <SelectItem value="draft">下書き</SelectItem>
                  <SelectItem value="active">進行中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                  <SelectItem value="cancelled">キャンセル</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <Label>種類</Label>
              <Select
                value={localFilters.type || ""}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    type: value
                      ? (value as "personal" | "team" | "organization")
                      : undefined,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべての種類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべての種類</SelectItem>
                  <SelectItem value="personal">個人</SelectItem>
                  <SelectItem value="team">チーム</SelectItem>
                  <SelectItem value="organization">組織</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Progress Filter */}
            <div className="space-y-2">
              <Label>進捗率</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={localFilters.progressMin?.toString() || ""}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      progressMin: value ? Number(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="最小" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">最小</SelectItem>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={localFilters.progressMax?.toString() || ""}
                  onValueChange={(value) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      progressMax: value ? Number(value) : undefined,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="最大" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">最大</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>期間</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">開始日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.startDate
                          ? localFilters.startDate.toLocaleDateString("ja-JP")
                          : "選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.startDate}
                        onSelect={(date) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            startDate: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">終了日</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.endDate
                          ? localFilters.endDate.toLocaleDateString("ja-JP")
                          : "選択"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.endDate}
                        onSelect={(date) =>
                          setLocalFilters((prev) => ({
                            ...prev,
                            endDate: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              クリア
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1">
              適用
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
