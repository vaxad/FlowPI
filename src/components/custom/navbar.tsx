import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import React from "react";

type NavLivk = {
    name: string;
    href: string;
}
export default function navbar() {
    const navLinks: NavLivk[] = [
        {
            name: "Home",
            href: "/"
        },
        {
            name: "Generate",
            href: "/generate"
        },
        {
            name: "Contact",
            href: "/contact"
        }
    ]
    return (
        <>
            <div className="flex w-full justify-between items-center p-2 min-h-14">
                <div className="flex items-center gap-2 min-w-32">
                    <div className="size-6 rounded-full bg-zinc-950"></div>
                    <h1 className="text-lg font-black">FlowPI</h1>
                </div>
                <div className="min-w-32 flex justify-end">
                    <div className="flex w-fit items-center gap-1 hover:border-b border-foreground cursor-pointer">
                        Repo
                        <ArrowTopRightIcon />
                    </div>
                </div>
            </div>
            <nav className="flex fixed top-2 rounded-full shadow-md p-0.5 w-fit left-1/2 -translate-x-1/2 bg-background">
                {navLinks.map((link, index) => (
                    <Link key={index} href={link.href} className="px-4 py-2 rounded-full hover:bg-foreground hover:text-background transition-all">{link.name}</Link>
                ))}
            </nav>
        </>
    )
}
