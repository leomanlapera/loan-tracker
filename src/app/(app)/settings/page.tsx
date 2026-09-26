import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SettingsForm } from './settings-form'
import { DangerZone } from './danger-zone'
import type { InterestMethod, RepaymentType } from '@/lib/engine/types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, default_grace_days, default_interest_method, default_repayment_type')
    .eq('id', user.id)
    .maybeSingle()

  const initial = {
    displayName: profile?.display_name ?? null,
    defaultGraceDays: profile?.default_grace_days ?? 0,
    defaultInterestMethod: (profile?.default_interest_method ?? 'compound') as InterestMethod,
    defaultRepaymentType: (profile?.default_repayment_type ?? 'equal_installments') as RepaymentType,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your profile, defaults, and account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Signed in as {user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initial={initial} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Region</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-foreground text-xs font-medium">Currency</div>
            <div>PHP (Philippine Peso)</div>
          </div>
          <div>
            <div className="text-foreground text-xs font-medium">Timezone</div>
            <div>Asia/Manila</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data export</CardTitle>
          <CardDescription>
            RA 10173 portability — download every row you own as a ZIP of CSVs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/api/export"
            className="border-input bg-background hover:bg-muted inline-flex h-8 items-center rounded-md border px-3 text-sm"
          >
            Download my data (ZIP)
          </a>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <DangerZone />
        </CardContent>
      </Card>
    </div>
  )
}
