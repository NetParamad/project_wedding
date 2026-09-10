'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Props {
  data: { name: string; count: number }[]
}

export function BookingChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-sm font-semibold">สินค้าที่จองมากที่สุด</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
            ยังไม่มีการจอง
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-semibold">สินค้าที่จองมากที่สุด</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} className="text-muted-foreground" />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                width={130}
                tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '...' : v}
              />
              <Tooltip
                formatter={(value) => [`${value} ครั้ง`, 'จำนวนการจอง']}
                labelFormatter={(label) => String(label)}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
