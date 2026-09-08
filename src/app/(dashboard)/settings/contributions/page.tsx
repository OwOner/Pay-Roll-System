import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, ExternalLink, Building2, Heart, Home, AlertTriangle } from "lucide-react"

// ─── Helpers ────────────────────────────────────────────────
function fmtDate(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Published: "bg-emerald-100 text-emerald-800",
    Draft: "bg-yellow-100 text-yellow-800",
    Superseded: "bg-slate-100 text-slate-600",
  }
  return <Badge className={styles[status] ?? "bg-slate-100 text-slate-600"}>{status}</Badge>
}

function TypeBadge({ type }: { type: string }) {
  return type === "government"
    ? <Badge className="bg-blue-100 text-blue-800 gap-1"><Shield className="w-3 h-3" /> Government</Badge>
    : <Badge className="bg-violet-100 text-violet-800">Custom</Badge>
}

// ─── Page ───────────────────────────────────────────────────
export default async function ContributionsSettingsPage() {
  const supabase = await createClient()

  const { data: sssConfig } = await supabase
    .from("government_contribution_tables")
    .select("*, government_contribution_brackets(*)")
    .eq("contribution_type", "SSS")
    .order("effective_from", { ascending: false })
    .limit(5)

  const { data: phConfigs } = await supabase
    .from("philhealth_configs")
    .select("*")
    .order("effective_from", { ascending: false })
    .limit(5)

  const { data: pagibigConfigs } = await supabase
    .from("pagibig_configs")
    .select("*")
    .order("effective_from", { ascending: false })
    .limit(5)

  const activeSss = sssConfig?.find(t => t.is_active)
  const activePh = phConfigs?.find(t => t.is_active)
  const activePagibig = pagibigConfigs?.find(t => t.is_active)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Government Contributions</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Authoritative statutory configurations loaded from official government issuances. 
          Published configurations are read-only and cannot be edited in place.
        </p>
      </div>

      {/* ── SSS ───────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Social Security System (SSS)</CardTitle>
                <CardDescription>Monthly Salary Credit (MSC)-based contribution schedule</CardDescription>
              </div>
            </div>
            {activeSss ? (
              <StatusBadge status={activeSss.status ?? "Published"} />
            ) : (
              <Badge variant="secondary">No Active Config</Badge>
            )}
          </div>
        </CardHeader>
        {activeSss && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/40 rounded-lg p-4">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Issuance Reference</p>
                <p className="font-medium">{activeSss.issuance_reference ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Statutory Effective Date</p>
                <p className="font-medium">{fmtDate(activeSss.statutory_effective_from)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Contribution Basis</p>
                <p className="font-medium">Monthly Salary Credit (MSC)</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Type</p>
                <TypeBadge type={activeSss.table_type ?? "government"} />
              </div>
              {activeSss.source_url && (
                <div className="col-span-2">
                  <a href={activeSss.source_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                    <ExternalLink className="w-3 h-3" /> Official Source
                  </a>
                </div>
              )}
            </div>

            {/* MSC Bracket Preview (first 8 + last 1) */}
            <div>
              <p className="text-sm font-medium mb-2">Contribution Schedule Preview</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comp. Range</TableHead>
                    <TableHead>MSC</TableHead>
                    <TableHead>SS Employee</TableHead>
                    <TableHead>SS Employer</TableHead>
                    <TableHead>MPF Employee</TableHead>
                    <TableHead>MPF Employer</TableHead>
                    <TableHead>EC (Employer)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSss.government_contribution_brackets
                    ?.sort((a: any, b: any) => a.salary_min - b.salary_min)
                    .slice(0, 5)
                    .map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs">
                          ₱{Number(b.salary_min).toLocaleString()}
                          {b.salary_max ? ` – ₱${Number(b.salary_max).toLocaleString()}` : " and above"}
                        </TableCell>
                        <TableCell>₱{Number(b.monthly_salary_credit).toLocaleString()}</TableCell>
                        <TableCell>₱{Number(b.regular_ss_employee).toLocaleString()}</TableCell>
                        <TableCell>₱{Number(b.regular_ss_employer).toLocaleString()}</TableCell>
                        <TableCell>₱{Number(b.mpf_employee ?? 0).toLocaleString()}</TableCell>
                        <TableCell>₱{Number(b.mpf_employer ?? 0).toLocaleString()}</TableCell>
                        <TableCell>₱{Number(b.ec_employer ?? 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  <TableRow className="text-muted-foreground italic">
                    <TableCell colSpan={7} className="text-center text-xs py-2">
                      … {activeSss.government_contribution_brackets?.length - 5} more brackets (61 total)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-md p-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>This is a Published government configuration. To apply updated rates, create a superseding configuration — do not edit in place.</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── PhilHealth ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Heart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Philippine Health Insurance Corporation (PhilHealth)</CardTitle>
                <CardDescription>Monthly Basic Salary-based premium contribution</CardDescription>
              </div>
            </div>
            {activePh ? (
              <StatusBadge status={activePh.status ?? "Published"} />
            ) : (
              <Badge variant="secondary">No Active Config</Badge>
            )}
          </div>
        </CardHeader>
        {activePh && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/40 rounded-lg p-4">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Issuance Reference</p>
                <p className="font-medium">{activePh.issuance_reference ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Statutory Effective Date</p>
                <p className="font-medium">{fmtDate(activePh.statutory_effective_from)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Contribution Basis</p>
                <p className="font-medium">Monthly Basic Salary</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Premium Rate</p>
                <p className="font-semibold text-emerald-700">{(Number(activePh.premium_rate) * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">MBS Floor</p>
                <p className="font-medium">₱{Number(activePh.floor_mbs).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">MBS Ceiling</p>
                <p className="font-medium">₱{Number(activePh.ceiling_mbs).toLocaleString()}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground bg-slate-50 rounded p-3">
              <strong>Basis Note:</strong> Monthly Basic Salary excludes overtime pay, allowances, 13th-month pay, bonuses, and other non-regular compensation per PhilHealth rules.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-md p-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Published configuration. Rate changes require a new superseding configuration record.</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── Pag-IBIG ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Home className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-base">Home Development Mutual Fund (Pag-IBIG / HDMF)</CardTitle>
                <CardDescription>Rate-based contribution with Monthly Fund Salary ceiling</CardDescription>
              </div>
            </div>
            {activePagibig ? (
              <StatusBadge status={activePagibig.status ?? "Published"} />
            ) : (
              <Badge variant="secondary">No Active Config</Badge>
            )}
          </div>
        </CardHeader>
        {activePagibig && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm bg-muted/40 rounded-lg p-4">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Issuance Reference</p>
                <p className="font-medium">{activePagibig.issuance_reference ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Statutory Effective Date</p>
                <p className="font-medium">{fmtDate(activePagibig.statutory_effective_from)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Contribution Basis</p>
                <p className="font-medium">Gross Compensation (capped to MFS ceiling)</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">
                  Employee Rate (≤ ₱{Number(activePagibig.salary_threshold).toLocaleString()})
                </p>
                <p className="font-semibold">{(Number(activePagibig.employee_rate_low) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">
                  Employee Rate (&gt; ₱{Number(activePagibig.salary_threshold).toLocaleString()})
                </p>
                <p className="font-semibold">{(Number(activePagibig.employee_rate_high) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Employer Rate</p>
                <p className="font-semibold">{(Number(activePagibig.employer_rate) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Max Fund Salary (MFS)</p>
                <p className="font-medium">₱{Number(activePagibig.max_compensation).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wide font-medium mb-1">Max Employee Contribution</p>
                <p className="font-medium">₱{(Number(activePagibig.max_compensation) * Number(activePagibig.employee_rate_high)).toLocaleString()}/month</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-md p-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Published configuration. Rate changes require a new superseding configuration record.</span>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
