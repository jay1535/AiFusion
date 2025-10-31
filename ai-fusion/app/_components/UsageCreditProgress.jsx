import { Progress } from '@/components/ui/progress'
import React from 'react'

function UsageCreditProgress({remainingToken}) {
  return (
    <div className='border rounded-2xl mb-5 p-3 flex flex-col gap-2'>
      <h2 className='font-bold text-xl '>Free Plan</h2>
      <p className='text-gray-500'> {10 - remainingToken}/10 message used</p>
      <Progress value={((10-remainingToken)/10)*100}/>
    </div>
  )
}

export default UsageCreditProgress
