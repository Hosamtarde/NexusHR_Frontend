import { RouterProvider } from 'react-router/dom'
import { ToastProvider } from '@/components/ui'
import { ViewerProvider } from '@/app/ViewerProvider'
import { router } from '@/app/router'

export function App() {
  return (
    <ViewerProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ViewerProvider>
  )
}
