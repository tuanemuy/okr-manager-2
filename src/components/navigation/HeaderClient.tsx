"use client";

import { Home, Menu, Target, User as UserIcon, Users, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { logoutAction } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { User } from "@/core/domain/user/types";

interface HeaderClientProps {
  user: User;
}

export function HeaderClient({ user }: HeaderClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: "/", label: "ダッシュボード", icon: Home },
    { href: "/teams", label: "チーム", icon: Users },
    { href: "/okrs", label: "OKR", icon: Target },
  ];

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              OKR Manager
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              {navigationLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="メニューを開く"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h2 className="text-lg font-semibold">メニュー</h2>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-label="メニューを閉じる"
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col space-y-2 mt-6">
                    {navigationLinks.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{label}</span>
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile User Section */}
                  <div className="mt-auto pt-6 border-t">
                    <div className="flex items-center space-x-3 px-4 py-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600 truncate max-w-[200px]">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 mt-4">
                      <Link
                        href="/profile"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                      >
                        <UserIcon className="h-5 w-5" />
                        <span>プロフィール</span>
                      </Link>

                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors w-full text-left"
                        >
                          <span>ログアウト</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full hidden md:flex"
                  aria-label="ユーザーメニューを開く"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <form action={logoutAction}>
                    <button type="submit" className="flex w-full items-center">
                      <span>ログアウト</span>
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
