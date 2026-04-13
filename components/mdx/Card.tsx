import Link from 'next/link'
import { ReactNode } from 'react'
import {
  Shield,
  GraduationCap,
  Search,
  Link2,
  User,
  Flag,
  Bug,
  Award,
  Plane,
  TrendingUp,
  ShieldCheck,
  LifeBuoy,
  BookOpen,
  Book,
  Share2,
  FileText,
  Code,
  Sparkles,
  Trophy,
  Target,
  Zap,
  Bird,
  BookOpenText,
  HelpCircle,
  Clock,
  Copy,
  FlagTriangleRight,
  Settings,
  Github,
  DollarSign,
  Key,
  Leaf,
  StickyNote,
  Palette,
  Edit,
  Plug,
  Plus,
  Medal,
  Terminal,
  Rocket,
  Sliders,
  Braces,
  Star,
  Tags,
  UserPlus,
  Wallet,
  Wrench,
  Users,
  RefreshCw,
  WandSparkles,
  Bot,
  Sword,
  Wand,
  ArrowRight,
  Coins,
  Crosshair,
  Play,
  MessageCircle,
  LucideIcon
} from 'lucide-react'

interface CardProps {
  title: string
  icon?: string
  href?: string
  color?: string
  compact?: boolean
  children: ReactNode
}

export function Card({ title, icon, href, color, compact, children }: CardProps) {
  const isExternal = href?.startsWith('http')

  // Icon mapping from FontAwesome names to Lucide components
  const iconMap: Record<string, LucideIcon> = {
    'shield-halved': Shield,
    'shield': Shield,
    'graduation-cap': GraduationCap,
    'diploma': GraduationCap,
    'magnifying-glass': Search,
    'magnifying-glass-chart': TrendingUp,
    'link': Link2,
    'user': User,
    'user-plus': UserPlus,
    'flag': Flag,
    'flag-checkered': FlagTriangleRight,
    'bug': Bug,
    'certificate': Award,
    'award': Award,
    'plane-departure': Plane,
    'shield-check': ShieldCheck,
    'life-ring': LifeBuoy,
    'book-open': BookOpen,
    'book-open-reader': BookOpenText,
    'book': Book,
    'share-nodes': Share2,
    'file-text': FileText,
    'code': Code,
    'square-code': Braces,
    'sparkles': Sparkles,
    'trophy': Trophy,
    'target': Target,
    'zap': Zap,
    'bird': Bird,
    'circle-question': HelpCircle,
    'clock': Clock,
    'copy': Copy,
    'gear': Settings,
    'github': Github,
    'hand-holding-dollar': DollarSign,
    'key': Key,
    'leaf': Leaf,
    'note-sticky': StickyNote,
    'palette': Palette,
    'pen-to-square': Edit,
    'plug': Plug,
    'plus': Plus,
    'ranking-star': Medal,
    'star': Star,
    'rectangle-terminal': Terminal,
    'rocket': Rocket,
    'sliders': Sliders,
    'tags': Tags,
    'wallet': Wallet,
    'wrench': Wrench,
    'users': Users,
    'arrows-spin': RefreshCw,
    'arrows-rotate': RefreshCw,
    'wand-magic-sparkles': WandSparkles,
    'robot': Bot,
    'sword': Sword,
    'wand': Wand,
    'arrow-right': ArrowRight,
    'coins': Coins,
    'crosshairs': Crosshair,
    'play': Play,
    'discord': MessageCircle,
  }

  const isImageIcon = icon?.startsWith('/')
  const IconComponent = icon && !isImageIcon ? iconMap[icon] : null

  const iconSize = compact ? 'w-4 h-4' : 'w-5 h-5'

  const iconElement = isImageIcon ? (
    <img src={icon} alt="" className={iconSize} />
  ) : IconComponent ? (
    <IconComponent className={`${iconSize} text-current`} strokeWidth={1.5} />
  ) : null

  const cardContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        {iconElement && (
          <span className="shrink-0 text-gray-700 dark:text-gray-300">
            {iconElement}
          </span>
        )}
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </p>
      </div>
      <div className="text-sm leading-relaxed text-gray-500 dark:text-gray-300">
        {children}
      </div>
    </>
  )

  // Convert hex color to RGB for use in rgba()
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '0, 77, 255' // default to Cyfrin blue
  }

  const cardStyle = color
    ? {
        '--card-rgb': hexToRgb(color),
        '--card-color': color,
      } as React.CSSProperties
    : undefined

  // Detect Battlechain (white) cards
  const isBattlechain = color?.toUpperCase() === '#FFFFFF' || color?.toUpperCase() === '#FFF'

  const cardClasses = `card ${compact ? 'p-3' : 'p-4'} block no-underline group`

  // If no href, render as a div
  if (!href) {
    return (
      <div
        className={cardClasses}
        style={cardStyle}
        data-battlechain={isBattlechain ? 'true' : undefined}
      >
        {cardContent}
      </div>
    )
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cardClasses}
        style={cardStyle}
        data-battlechain={isBattlechain ? 'true' : undefined}
      >
        {cardContent}
      </a>
    )
  }

  return (
    <Link
      href={href}
      className={cardClasses}
      style={cardStyle}
      data-battlechain={isBattlechain ? 'true' : undefined}
    >
      {cardContent}
    </Link>
  )
}
