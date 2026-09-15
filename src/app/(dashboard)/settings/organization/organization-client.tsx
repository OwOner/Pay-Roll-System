"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Edit2, Trash2, Building2, Briefcase } from "lucide-react"
import DepartmentDrawer from "./department-drawer"
import PositionDrawer from "./position-drawer"
import { deleteDepartment, deletePosition } from "./organization-actions"

export default function OrganizationClient({ 
  initialDepartments, 
  initialPositions,
  workPolicies
}: { 
  initialDepartments: any[], 
  initialPositions: any[],
  workPolicies: any[]
}) {
  const [activeTab, setActiveTab] = useState("departments")
  
  // Drawer states
  const [deptDrawerOpen, setDeptDrawerOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<any>(null)
  
  const [posDrawerOpen, setPosDrawerOpen] = useState(false)
  const [selectedPos, setSelectedPos] = useState<any>(null)

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return
    const res = await deleteDepartment(id)
    if (res.error) alert(res.error)
  }

  const handleDeletePos = async (id: string) => {
    if (!confirm("Are you sure you want to delete this position?")) return
    const res = await deletePosition(id)
    if (res.error) alert(res.error)
  }

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="departments"><Building2 className="w-4 h-4 mr-2"/> Departments</TabsTrigger>
          <TabsTrigger value="positions"><Briefcase className="w-4 h-4 mr-2"/> Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="departments" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing {initialDepartments.length} departments
              </div>
              <Button onClick={() => { setSelectedDept(null); setDeptDrawerOpen(true); }} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Department
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Department Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialDepartments.map(dept => (
                    <TableRow key={dept.id}>
                      <TableCell className="font-medium">{dept.name}</TableCell>
                      <TableCell className="text-muted-foreground truncate max-w-[300px]">{dept.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedDept(dept); setDeptDrawerOpen(true); }}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteDept(dept.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {initialDepartments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No departments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                Showing {initialPositions.length} positions
              </div>
              <Button onClick={() => { setSelectedPos(null); setPosDrawerOpen(true); }} size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Position
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Default Work Policy</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialPositions.map(pos => (
                    <TableRow key={pos.id}>
                      <TableCell className="font-medium">{pos.title}</TableCell>
                      <TableCell>{pos.departments?.name || <span className="text-muted-foreground italic">Unassigned</span>}</TableCell>
                      <TableCell>{pos.work_policies?.name || <span className="text-muted-foreground italic">None</span>}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedPos(pos); setPosDrawerOpen(true); }}>
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePos(pos.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {initialPositions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No positions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {deptDrawerOpen && (
        <DepartmentDrawer 
          open={deptDrawerOpen} 
          onOpenChange={setDeptDrawerOpen} 
          department={selectedDept}
          onSaved={() => {}}
        />
      )}

      {posDrawerOpen && (
        <PositionDrawer 
          open={posDrawerOpen} 
          onOpenChange={setPosDrawerOpen} 
          position={selectedPos}
          departments={initialDepartments}
          workPolicies={workPolicies}
          onSaved={() => {}}
        />
      )}
    </div>
  )
}
