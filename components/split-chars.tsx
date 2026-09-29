import { cn } from "@/lib/utils"

type SplitCharsProps = {
  text: string
  className?: string
  charClassName?: string
}

export function SplitChars({ text, className, charClassName }: SplitCharsProps) {
  const words = text.split(" ")

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, w) => (
          <span key={w} data-word={word} className={cn("inline-block whitespace-nowrap", className)}>
            {[...(w < words.length - 1 ? `${word} ` : word)].map((ch, c) => (
              <span key={c} className={cn("char inline-block whitespace-pre", charClassName)}>
                {ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </>
  )
}
