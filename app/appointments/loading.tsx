import { PageTitleSkeleton, ListSkeleton } from '@/components/loading'

export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <PageTitleSkeleton />
      <ListSkeleton rows={4} />
    </div>
  )
}