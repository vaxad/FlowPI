import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import Link from "next/link";

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
        <div className="flex w-full justify-between items-center p-2">
            <div className="flex items-center gap-2">
                <div className="size-6 rounded-full bg-zinc-950"></div>
                <h1 className="text-lg font-black">FlowPI</h1>
            </div>
            <nav className="flex sticky top-0 placeholder mt-2 rounded-full shadow-md p-0.5">
                {navLinks.map((link, index) => (
                    <Link key={index} href={link.href} className="px-4 py-2 rounded-full hover:bg-foreground hover:text-background transition-all">{link.name}</Link>
                ))}
            </nav>
            <div className="flex items-center gap-1 hover:border-b border-foreground">
                Repo
                <ArrowTopRightIcon />
            </div>
        </div>
    )
}
