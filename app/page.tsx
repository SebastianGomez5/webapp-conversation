import React from 'react'

import Main from '@/app/components'

const App = async (props: {
  params: Promise<any>
}) => {
  const params = await props.params
  return (
    <Main params={params} />
  )
}

export default App
