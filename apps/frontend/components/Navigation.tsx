import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FC } from "react";

const steps = [
  "Welcome",
  "Deploy",
  "Initialise",
  "Fund",
  "Trigger",
  "Automate",
];

type Status = "done" | "doing" | "not-done";

export const Navigation: FC = () => {
  const pathname = usePathname();

  return (
    <div className="px-4 py-12 sm:px-6 lg:px-8">
      <nav className="flex justify-center" aria-label="Progress">
        <ol role="list" className="space-y-6">
          {steps.map((step, index) => {
            const currentStepIndex = steps.findIndex((x) => {
              if (pathname === "/") {
                return x === "Welcome";
              }

              return pathname?.includes(x.toLowerCase());
            });

            const status: Status =
              currentStepIndex === index
                ? "doing"
                : currentStepIndex < index
                ? "not-done"
                : "done";
            return (
              <li key={step}>
                {status === "done" ? (
                  <Link
                    href={`/${step.toLowerCase()}`}
                    className="flex items-start"
                    aria-current="step"
                  >
                    <span className="flex items-start">
                      <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center">
                        <CheckCircleIcon
                          className="h-full w-full text-indigo-600 group-hover:text-indigo-800"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                        {step}
                      </span>
                    </span>
                  </Link>
                ) : status === "doing" ? (
                  <Link
                    href={`/${step.toLowerCase()}`}
                    className="flex items-start"
                    aria-current="step"
                  >
                    <span
                      className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                      aria-hidden="true"
                    >
                      <span className="absolute h-4 w-4 rounded-full bg-indigo-200" />
                      <span className="relative block h-2 w-2 rounded-full bg-indigo-600" />
                    </span>
                    <span className="ml-3 text-sm font-medium text-indigo-600">
                      {step}
                    </span>
                  </Link>
                ) : (
                  <Link
                    href={`/${step.toLowerCase()}`}
                    className="flex items-start"
                    aria-current="step"
                  >
                    <div className="flex items-start">
                      <div
                        className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center"
                        aria-hidden="true"
                      >
                        <div className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400" />
                      </div>
                      <p className="ml-3 text-sm font-medium text-gray-500 group-hover:text-gray-900">
                        {step}
                      </p>
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
