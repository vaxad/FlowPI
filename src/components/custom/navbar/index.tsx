import { NavLinkProps } from "@/lib/types/common";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import React from "react";
import NavLink from "./nav-link";
import { ModeToggle } from "@/components/ui/theme-toggler";
import Link from "next/link";

export default function navbar() {
    const navLinks: NavLinkProps[] = [
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
            href: "https://www.varad.xyz/contact"
        }
    ]
    return (
        <>
            <div className="flex w-full justify-between items-center p- min-h-14">
                <div className="flex items-center gap-2 min-w-32">
                    <div className="size-6 rounded-full bg-foreground"></div>
                    <h1 className="text-lg font-black">FlowPI</h1>
                </div>
                <div className="min-w-32 flex items-center gap-2 justify-end">
                    <ModeToggle />
                    <Link href={"https://github.com/vaxad/FlowPI/"} className="flex w-fit items-center gap-1 hover:border-b border-foreground cursor-pointer">
                        Repo
                        <ArrowTopRightIcon />
                    </Link>
                </div>
            </div>
            <nav className="flex fixed top-2 rounded-full border border-foreground p-0.5 w-fit left-1/2 -translate-x-1/2 bg-background">
                {navLinks.map((link, index) => (
                    <NavLink key={index} href={link.href} name={link.name} />
                ))}
            </nav>
        </>
    )
}
