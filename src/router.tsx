import { createHashRouter } from 'react-router'
import { Layout } from './components/Layout.tsx'
import { About } from './pages/About.tsx'
import { Home } from './pages/Home.tsx'
import { Letter } from './pages/Letter.tsx'
import { NotFound } from './pages/NotFound.tsx'
import { VerbPage } from './pages/VerbPage.tsx'
import { loadVerb } from './verbs.ts'

export const router = createHashRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        { path: 'letters/:letter', element: <Letter /> },
        {
          path: 'verbs/:slug',
          element: <VerbPage />,
          loader: ({ params }) => loadVerb(params.slug ?? ''),
          errorElement: <NotFound />,
        },
        { path: 'about', element: <About /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
)
