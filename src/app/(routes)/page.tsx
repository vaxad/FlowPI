import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function Landing() {

  return (
    <main className=" flex flex-col justify-center items-center px-6 md:px-20 flex-grow text-center">
      <h1 className=" text-6xl font-black pb-4">FlowPI</h1>
      <p className=" text-xl font-medium pb-12">FlowPI is a low-code platform that allows you to generate a full-stack application with a few clicks. You can generate a backend API, frontend, and database schema based on your requirements.</p>
      <p className="text-2xl font-semibold pb-4 ">Click on the Generate button to get started!</p>
      <Link href="/generate" className={cn(buttonVariants({
        variant: "default"
      }), "rounded-full text-2xl py-8 px-6 font-semibold")}>Generate</Link>
    </main>
  )
}