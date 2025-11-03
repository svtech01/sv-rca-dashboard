"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "Trends", href: "/trends" },
  { name: "Admin", href: "/admin" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-blue shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gray-800">Kixie RCA Dashboard</h1>
        <nav className="flex space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "text-sm font-medium hover:text-blue-600 transition-colors",
                pathname === item.href ? "text-blue-600" : "text-gray-600"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
