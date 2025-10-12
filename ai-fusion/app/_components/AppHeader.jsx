import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import React from 'react'

function AppHeader() {
  return (
    <div className='p-3 w-full shadow-md flex justify-between items-center'>
      <SidebarTrigger />
      <Button>
        SignIn
      </Button>
    </div>
  )
}

export default AppHeader
