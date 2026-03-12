'use client'

import dynamic from 'next/dynamic'

const BattlechainHero = dynamic(
  () => import('./BattlechainHero').then((module) => module.BattlechainHero),
  { ssr: false }
)

export function BattlechainHeroClient() {
  return <BattlechainHero />
}
