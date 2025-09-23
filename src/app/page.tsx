'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 sm:space-y-8 max-w-2xl mx-auto"
      >
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
            Receipt Splitter
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto">
            Split bills effortlessly with your friends. Scan receipts, assign items, and track who owes what.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="px-8">
              <Link href="/signup">
                Get Started
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="px-8">
              <Link href="/signin">
                Sign In
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="text-primary text-3xl mb-3">📱</div>
              <h3 className="font-semibold text-lg mb-2">Scan Receipts</h3>
              <p className="text-muted-foreground text-sm">
                Use your phone camera to capture receipts instantly
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="text-primary text-3xl mb-3">↔️</div>
              <h3 className="font-semibold text-lg mb-2">Swipe to Assign</h3>
              <p className="text-muted-foreground text-sm">
                Swipe left for yourself, right for others, up for custom splits
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="text-primary text-3xl mb-3">💰</div>
              <h3 className="font-semibold text-lg mb-2">Track Balances</h3>
              <p className="text-muted-foreground text-sm">
                See who owes what across multiple receipts and groups
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
