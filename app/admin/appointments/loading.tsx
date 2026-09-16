import { PageTitleSkeleton, TableSkeleton } from '@/components/loading'

export default function Loading() {
  return (
    <div className="space-y-6">
      <PageTitleSkeleton />
      <TableSkeleton rows={8} />
    </div>
  )
}