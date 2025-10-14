"use client";
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { UserButton, useUser } from '@clerk/clerk-react'
import React from 'react'

function AppHeader() {
  const user = useUser();
  return (
    <div className='p-3 w-full shadow-md flex justify-between items-center'>
      <SidebarTrigger />
      {!user ? <Button>
        SignIn
      </Button>:<UserButton/> }
    </div>
  )
}

export default AppHeader
