import { Progress } from '@/components/ui/progress'
import React from 'react'

function UsageCreditProgress() {
  return (
    <div className='border rounded-2xl mb-5 p-3 flex flex-col gap-2'>
      <h2 className='font-bold text-xl '>Free Plan</h2>
      <p className='text-gray-500'> 1/5 message used</p>
      <Progress value={20}/>
    </div>
  )
}

export default UsageCreditProgress
