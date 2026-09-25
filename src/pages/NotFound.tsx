import { Link } from 'react-router-dom'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import PaperCrumple from '@/components/backgrounds/PaperCrumple'

const NOTE_IMAGE = '/illustrations/404-note.svg'

export default function NotFound() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      {reducedMotion ? (
        <img src={NOTE_IMAGE} alt="404 — Page not found" className="h-64 w-auto rounded-lg shadow-lg" />
      ) : (
        <>
          <PaperCrumple
            src={NOTE_IMAGE}
            alt="A note that says 404, page not found"
            width={260}
            height={325}
            sceneHeight={340}
            className="max-w-sm"
            releaseBehavior="restore"
          />
          <p className="-mt-2 text-xs text-slate-400 dark:text-slate-500">Hold and drag the note above</p>
        </>
      )}
      <Link to="/" className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300">
        Go home
      </Link>
    </div>
  )
}
