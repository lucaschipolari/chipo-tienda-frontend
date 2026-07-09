import { createContext, useContext, useState } from 'react'
import { cn } from '@/utils/helpers/cn'

// ─── Context ─────────────────────────────────────────────────────────────────

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue>({
  activeTab: '',
  setActiveTab: () => undefined,
})

// ─── Root ─────────────────────────────────────────────────────────────────────

export interface TabsProps {
  defaultTab: string
  children: React.ReactNode
  className?: string
  onChange?: (tab: string) => void
}

export function Tabs({ defaultTab, children, className, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onChange?.(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

// ─── Tab List ─────────────────────────────────────────────────────────────────

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-1 p-1 rounded-xl',
        'bg-obsidian-900 border border-neutral-800',
        className,
      )}
    >
      {children}
    </div>
  )
}

// ─── Tab Trigger ──────────────────────────────────────────────────────────────

export interface TabTriggerProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function TabTrigger({ value, children, disabled, className }: TabTriggerProps) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  return (
    <button
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(
        'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
        'transition-all duration-200 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isActive
          ? 'bg-gold-500 text-black shadow-sm'
          : 'text-neutral-400 hover:text-white hover:bg-obsidian-800',
        className,
      )}
    >
      {children}
    </button>
  )
}

// ─── Tab Panel ────────────────────────────────────────────────────────────────

export interface TabPanelProps {
  value: string
  children: React.ReactNode
  className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { activeTab } = useContext(TabsContext)

  if (activeTab !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  )
}
