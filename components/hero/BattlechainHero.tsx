import Image from 'next/image'

export function BattlechainHero() {
  return (
    <div className="w-full py-4 md:py-6">
      <Image
        src="/images/other/docs_hero.png"
        alt="BattleChain documentation hero"
        width={1024}
        height={256}
        priority
        className="w-full h-auto"
      />
    </div>
  )
}
