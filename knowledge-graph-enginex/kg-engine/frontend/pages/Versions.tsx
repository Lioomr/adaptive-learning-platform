import { useEffect, useState } from 'react'
import { useGetVersions, useGetAuditLog, useListBundles } from '../hooks/backend/read'
import { StatusBadge } from '../components/ui-bits'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/shadcn/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../lib/shadcn/tabs'
import type { BundleListItem, VersionRow, AuditEntry } from '../types'

export default function Versions() {
  const bundles = useListBundles({ cachePolicy: 'stale-while-revalidate' })
  const versions = useGetVersions()
  const audit = useGetAuditLog({ cachePolicy: 'stale-while-revalidate' })
  const [bundleId, setBundleId] = useState('')

  useEffect(() => {
    bundles.trigger()
    audit.trigger({})
  }, [])

  useEffect(() => {
    if (!bundleId && bundles.data) {
      const list = bundles.data as BundleListItem[]
      if (list[0]) setBundleId(list[0].bundle_id)
    }
  }, [bundles.data, bundleId])

  useEffect(() => {
    if (bundleId) versions.trigger({ bundleId })
  }, [bundleId])

  const vlist = (versions.data as { versions?: VersionRow[] } | null)?.versions || []
  const entries = (audit.data as { entries?: AuditEntry[] } | null)?.entries || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Versions & audit</h1>
        <select
          value={bundleId}
          onChange={(e) => setBundleId(e.target.value)}
          className="ml-auto h-9 rounded-md border bg-background px-3 text-sm text-foreground"
        >
          {(bundles.data as BundleListItem[] | null)?.map((b) => (
            <option key={b.id} value={b.bundle_id}>
              {b.bundle_id}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">Graph versions ({vlist.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit log ({entries.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="versions">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Committed</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Nodes / edges</TableHead>
                    <TableHead>Parent</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vlist.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-mono text-xs">
                        v{v.version_no} · {v.id.slice(3, 15)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(v.committed_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{v.approver}</TableCell>
                      <TableCell className="max-w-xs text-xs text-muted-foreground">{v.commit_reason}</TableCell>
                      <TableCell className="tabular-nums">{v.node_count} / {v.edge_count}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{v.parent_version_id ? v.parent_version_id.slice(3, 15) : '—'}</TableCell>
                      <TableCell>{v.is_live ? <StatusBadge status="committed" /> : <span className="text-xs text-muted-foreground">archived</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{new Date(e.ts).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{e.actor}</TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{e.action}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {e.entity_type}:{String(e.entity_id).slice(0, 22)}
                      </TableCell>
                      <TableCell className="max-w-md truncate text-xs text-muted-foreground">{JSON.stringify(e.details)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
