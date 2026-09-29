import { FoundationDemo } from "@/components/sections/foundation-demo"

export default function Page() {
  return (
    <main>
      <section className="grid h-screen place-items-center bg-ink font-serif text-5xl text-mist">
        Stillwater
      </section>
      <FoundationDemo />
      <section className="grid h-screen place-items-center bg-ink font-sans text-mist">
        End of Phase 1 demo
      </section>
    </main>
  )
}
