"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, Save, Loader2 } from "lucide-react"
import { saveTaxBrackets } from "../../actions"

export default function EditTaxTablePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taxTable, setTaxTable] = useState<any>(null)
  const [brackets, setBrackets] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('tax_tables')
        .select('*, tax_brackets(*)')
        .eq('id', resolvedParams.id)
        .single()
      
      if (data) {
        setTaxTable(data)
        // Sort brackets by frequency, then minimum income
        const sorted = (data.tax_brackets || []).sort((a: any, b: any) => {
          if (a.pay_frequency !== b.pay_frequency) {
            return a.pay_frequency.localeCompare(b.pay_frequency)
          }
          return a.minimum_income - b.minimum_income
        })
        setBrackets(sorted)
      }
      setLoading(false)
    }
    loadData()
  }, [resolvedParams.id, supabase])

  const addBracket = () => {
    setBrackets([
      ...brackets,
      {
        id: `temp-${Date.now()}`,
        tax_table_id: resolvedParams.id,
        pay_frequency: 'Semi-Monthly',
        minimum_income: 0,
        maximum_income: null,
        base_tax: 0,
        excess_rate: 0
      }
    ])
  }

  const removeBracket = (index: number) => {
    setBrackets(brackets.filter((_, i) => i !== index))
  }

  const updateBracket = (index: number, field: string, value: any) => {
    const newBrackets = [...brackets]
    newBrackets[index] = { ...newBrackets[index], [field]: value }
    setBrackets(newBrackets)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const cleanBrackets = brackets.map(b => ({
        tax_table_id: resolvedParams.id,
        pay_frequency: b.pay_frequency,
        minimum_income: parseFloat(b.minimum_income) || 0,
        maximum_income: b.maximum_income ? parseFloat(b.maximum_income) : null,
        base_tax: parseFloat(b.base_tax) || 0,
        excess_rate: parseFloat(b.excess_rate) || 0
      }))

      await saveTaxBrackets(resolvedParams.id, cleanBrackets)
      router.push('/settings/tax')
      router.refresh()
    } catch (error) {
      console.error(error)
      alert('Failed to save tax brackets')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!taxTable) return <div>Tax table not found</div>

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h3 className="text-lg font-medium">Edit Tax Brackets</h3>
          <p className="text-sm text-muted-foreground">{taxTable.name}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brackets Configuration</CardTitle>
          <CardDescription>
            Define the minimum and maximum income thresholds for each pay frequency. Leave Maximum Income blank for the highest bracket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {brackets.map((bracket, index) => (
            <div key={bracket.id || index} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border">
              <div className="w-40">
                <label className="text-xs font-medium mb-1 block">Frequency</label>
                <Select
                  value={bracket.pay_frequency}
                  onValueChange={(val) => updateBracket(index, 'pay_frequency', val)}
                >
                  <SelectTrigger className="bg-background h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Semi-Monthly">Semi-Monthly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Min Income (₱)</label>
                <Input 
                  type="number" 
                  className="bg-background h-9"
                  value={bracket.minimum_income} 
                  onChange={(e) => updateBracket(index, 'minimum_income', e.target.value)}
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Max Income (₱)</label>
                <Input 
                  type="number" 
                  className="bg-background h-9"
                  placeholder="No Limit"
                  value={bracket.maximum_income === null ? '' : bracket.maximum_income} 
                  onChange={(e) => updateBracket(index, 'maximum_income', e.target.value === '' ? null : e.target.value)}
                />
              </div>

              <div className="flex-1">
                <label className="text-xs font-medium mb-1 block">Base Tax (₱)</label>
                <Input 
                  type="number" 
                  className="bg-background h-9"
                  value={bracket.base_tax} 
                  onChange={(e) => updateBracket(index, 'base_tax', e.target.value)}
                />
              </div>

              <div className="w-24">
                <label className="text-xs font-medium mb-1 block">Excess Rate</label>
                <Input 
                  type="number" 
                  step="0.01"
                  className="bg-background h-9"
                  value={bracket.excess_rate} 
                  onChange={(e) => updateBracket(index, 'excess_rate', e.target.value)}
                />
              </div>

              <div className="pt-5">
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9" onClick={() => removeBracket(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full border-dashed" onClick={addBracket}>
            <Plus className="w-4 h-4 mr-2" />
            Add Bracket
          </Button>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t pt-6">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
