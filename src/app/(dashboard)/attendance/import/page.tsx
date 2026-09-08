"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RawImportTab } from "./RawImportTab"
import { ExcelImportTab } from "./ExcelImportTab"

export default function ImportAttendancePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Import Attendance</h2>
        <p className="text-muted-foreground">Upload attendance data from external sources or Excel templates.</p>
      </div>

      <Tabs defaultValue="excel" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="excel">Excel Templates</TabsTrigger>
          <TabsTrigger value="raw">Raw Data Mapping</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="excel">
            <ExcelImportTab />
          </TabsContent>
          <TabsContent value="raw">
            <RawImportTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
