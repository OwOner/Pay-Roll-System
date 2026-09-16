"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button 
      onClick={() => typeof window !== 'undefined' && window.print()} 
      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
    >
      <Printer className="w-4 h-4 mr-2" />
      Print Sheet
    </Button>
  )
}
