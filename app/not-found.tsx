import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
      <p className="font-display text-6xl text-wood">404</p>
      <h1 className="font-display text-3xl">This room is empty</h1>
      <p className="text-sm leading-relaxed text-muted">
        The page you&apos;re looking for wandered off — probably chasing a sunbeam.
      </p>
      <Link href="/" className="mt-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg">
        Back to the study room
      </Link>
    </div>
  );
}
