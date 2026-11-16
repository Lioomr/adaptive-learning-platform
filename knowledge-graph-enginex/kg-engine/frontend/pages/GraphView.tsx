import { useEffect, useState } from 'react'
import { useListBundles, useGetVersions, useGetGraph } from '../hooks/backend/read'
import { StatusBadge, ConfidenceBar, EDGE_TYPE_LABELS } from '../components/ui-bits'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/shadcn/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../lib/shadcn/tabs'
import type { BundleListItem, GraphData, GraphNode, VersionRow } from '../types'

export default function GraphView() {
  const bundles = useListBundles({ cachePolicy: 'stale-while-revalidate' })
  const versions = useGetVersions()
  const graph = useGetGraph({ cachePolicy: 'stale-while-revalidate' })
  const [bundleId, setBundleId] = useState<string>('')
  const [versionId, setVersionId] = useState<string>('live')
  const [selected, setSelected] = useState<GraphNode | null>(null)

  useEffect(() => {
    bundles.trigger()
  }, [])

  useEffect(() => {
    if (!bundleId && bundles.data) {
      const list = bundles.data as BundleListItem[]
      const withGraph = list.find((b) => b.live_version)
      if (withGraph) setBundleId(withGraph.bundle_id)
    }
  }, [bundles.data, bundleId])

  useEffect(() => {
    if (bundleId) versions.trigger({ bundleId })
  }, [bundleId])

  useEffect(() => {
    if (bundleId) {
      setSelected(null)
      graph.trigger(bundleId && versionId !== 'live' ? { bundleId, versionId } : { bundleId })
    }
  }, [bundleId, versionId])

  const g = graph.data as GraphData | null
  const vlist = (versions.data as { versions: VersionRow[] } | null)?.versions || []
  const nameOf = (id: string): string => g?.nodes.find((n) => n.id === id)?.name_en || id

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-foreground">Graph</h1>
        <div className="ml-auto flex items-center gap-2">
          <Select value={bundleId} onValueChange={setBundleId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Bundle" /></SelectTrigger>
            <SelectContent>
              {(bundles.data as BundleListItem[] | null)?.map((b) => (
                <SelectItem key={b.id} value={b.bundle_id}>
                  {b.bundle_id} ({b.course_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={versionId} onValueChange={setVersionId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Version" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="live">Live version</SelectItem>
              {vlist.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  v{v.version_no} · {new Date(v.committed_at).toLocaleDateString()} {v.is_live ? '(live)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {g?.version ? (
        <p className="text-sm text-muted-foreground">
          {g.version.id.slice(0, 14)}… · committed {new Date(g.version.committed_at).toLocaleString()} by {g.version.approver} — “{g.version.commit_reason}”
          {g.version.parent_version_id ? ` · parent ${g.version.parent_version_id.slice(0, 14)}…` : ' · initial version'}
        </p>
      ) : null}

      {!g ? (
        <div className="text-sm text-muted-foreground">{graph.loading ? 'Loading graph…' : 'No committed graph for this bundle yet.'}</div>
      ) : (
        <Tabs defaultValue="nodes">
          <TabsList>
            <TabsTrigger value="nodes">Nodes ({g.nodes.length})</TabsTrigger>
            <TabsTrigger value="edges">Edges ({g.edges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="nodes">
            <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
              <Card>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Scope</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Review</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.nodes.map((n) => (
                        <TableRow key={n.id} className="cursor-pointer" onClick={() => setSelected(n)}>
                          <TableCell>
                            <div className="font-medium text-foreground">{n.name_en}</div>
                            {n.name_ar ? <div className="text-xs text-muted-foreground" dir="rtl">{n.name_ar}</div> : null}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{n.node_class.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{n.scope}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{n.difficulty_tier}</TableCell>
                          <TableCell><ConfidenceBar value={n.confidence} /></TableCell>
                          <TableCell><StatusBadge status={n.review_status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-base">{selected ? selected.name_en : 'Node details'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {!selected ? (
                    <p className="text-muted-foreground">Select a node to see its definition, aliases, provenance, and supporting segments.</p>
                  ) : (
                    <>
                      {selected.name_ar ? <p className="text-muted-foreground" dir="rtl">{selected.name_ar}</p> : null}
                      <p className="text-foreground">{selected.definition}</p>
                      {selected.aliases.length ? (
                        <div className="flex flex-wrap gap-1">
                          {selected.aliases.map((a) => (
                            <span key={a} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{a}</span>
                          ))}
                        </div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        id <span className="font-mono">{selected.id}</span> · layer {selected.layer_hint} · scope {selected.scope} · {selected.node_class.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        provenance: stage <span className="font-mono">{String(selected.provenance['stage'] || '—')}</span>, model{' '}
                        <span className="font-mono">{String(selected.provenance['model'] || '—')}</span>, run{' '}
                        <span className="font-mono">{String(selected.provenance['run_id'] || '—').slice(0, 20)}</span>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-medium text-muted-foreground">Supporting segments</div>
                        <div className="space-y-2">
                          {selected.source_segments.map((s) => (
                            <div key={s.id} className="rounded-md border p-2">
                              <div className="text-[10px] text-muted-foreground">{s.file} · page {s.page} · <span className="font-mono">{s.id}</span></div>
                              <p className="mt-1 line-clamp-4 text-xs text-foreground" dir="auto">{s.snippet}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="edges">
            <Card>
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Depends on</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Review</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.edges.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <span className="font-medium">{nameOf(e.source_node_id)}</span>
                          <span className="mx-1 text-muted-foreground">requires</span>
                          <span className="font-medium">{nameOf(e.target_node_id)}</span>
                          {e.cross_graph ? (
                            <span className="ml-2 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">cross-graph</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{EDGE_TYPE_LABELS[e.edge_type] || e.edge_type}</TableCell>
                        <TableCell className="max-w-sm text-xs text-muted-foreground">{e.evidence}</TableCell>
                        <TableCell><ConfidenceBar value={e.confidence} /></TableCell>
                        <TableCell><StatusBadge status={e.review_status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
