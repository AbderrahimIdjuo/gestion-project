import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 w-full">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="self-center text-xl font-semibold whitespace-nowrap">Gestion</span>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}

