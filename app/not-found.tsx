import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-bold text-gray-900 dark:text-white">404</p>
      <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">
        Page not found
      </h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      >
        Go home
      </Link>
    </div>
  )
}
