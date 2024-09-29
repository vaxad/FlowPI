import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Landing() {

  return (
    <main className=" flex flex-col justify-center px-6 md:px-20 flex-grow">
      <h1 className=" text-6xl font-black pb-4">FlowPI</h1>
      <p className=" text-2xl font-medium pb-12">Automate the creation of fully functional REST APIs for your database models, including CRUD operations, optional authentication, and Prisma ORM integration.</p>
      <Link href="/generate" className={cn(buttonVariants({
        variant: "outline"
      }), " text-2xl py-8 px-6 font-semibold bg-transparent hover:bg-foreground hover:text-background")}>Try it out!</Link>
    </main>
  )
}