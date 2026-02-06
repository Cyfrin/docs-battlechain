import Image from 'next/image'

export function HeroSection() {

  return (
    <div className="hero-container">
      <div className="hero-background">
        <div className="hero-grid"></div>
        <div className="hero-glow-1"></div>
        <div className="hero-glow-2"></div>
        <div className="hero-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>
      </div>
      <div className="hero-content">
        <div className="hero-logo">
          <Image
            src="/logo/light.svg"
            alt="Cyfrin"
            width={400}
            height={100}
            priority
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        <p className="hero-tagline">
          Powering the future of smart contract security
        </p>
      </div>
    </div>
  )
}
