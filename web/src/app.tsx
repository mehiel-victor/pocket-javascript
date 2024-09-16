import { useEffect, useState } from 'react'
import { Dialog } from './components/ui/dialog'
import { CreateGoal } from './components/create-goal'
import { Summary } from './components/summary'
import { EmptyGoals } from './components/empty-goals'

export function App() {
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    fetch('http://localhost:3333/summary')
      .then(response => {
        return response.json()
      })
      .then(data => {
        setSummary(data)
      })
  }, [])

  return (
    <Dialog>

      {summary.total > 0 ? <Summary /> : <EmptyGoals />}
     
      {/* <EmptyGoals /> */}

      {/* */}
      <CreateGoal />
    </Dialog>
  )
}

export default App
