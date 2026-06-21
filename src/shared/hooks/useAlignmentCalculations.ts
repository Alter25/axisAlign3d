import { useState, useCallback } from 'react'
import type { ReadingData, AlignmentCorrection } from '../types/alignment'
import { calculateCorrections } from '../lib/alignment-calc'

export function useAlignmentCalculations() {
  const [corrections, setCorrections] = useState<AlignmentCorrection[]>([])
  const [lastReading, setLastReading] = useState<ReadingData | null>(null)

  const compute = useCallback((reading: ReadingData) => {
    setLastReading(reading)
    setCorrections(calculateCorrections(reading))
  }, [])

  const reset = useCallback(() => {
    setLastReading(null)
    setCorrections([])
  }, [])

  return { corrections, lastReading, compute, reset }
}
