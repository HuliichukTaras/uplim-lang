import { Grid3X3, Film, Lock, Info } from 'lucide-react'

interface ProfileTabsProps {
  activeTab: "posts" | "reels" | "locked" | "about"
  onTabChange: (tab: "posts" | "reels" | "locked" | "about") => void
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { id: "posts" as const, label: "Posts", icon: Grid3X3 },
    { id: "reels" as const, label: "Reels", icon: Film },
    { id: "locked" as const, label: "Locked", icon: Lock },
    { id: "about" as const, label: "About", icon: Info },
  ]

  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
